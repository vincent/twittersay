// modules dependencies
var Redis = require('redis'),
    util = require('util');
    
var LanguageDetect = require('languagedetect'),
    lng = new LanguageDetect();


/**
 * Common properties for harverster and generator
 * @param {Object} conf Configuration object
 *
 # @return {Object} the storage
 */
var Common = function(conf) {
  this._conf = {
    redis: conf.redis || {},
    prefix: conf.prefix || 'twittersay-core'
  }; 
  this._statsKey = this._conf.prefix + '-stats';
  this._redis = Redis.createClient(this._conf.redis);
};

/**
 * Stats tick
 * Update stats counters
 */
Common.prototype._statsTick = function() {
  var self = this;
  this._redis.hget(this.statsKey, 'word-last-minute', function(err, cnt){
    self._redis.hset(this.statsKey, 'word-per-minute', cnt);
    self._redis.set(this.statsKey, 'word-last-minute', 0);
  });
};

/**
 * Stats getter
 *
 * @param {Function} callback(stats)
 */
Common.prototype.stats = function(callback) {
  this.redis.hgetall(this._statsKey, function(err, stats){
    if (err) { return console.log(err); }
    callback(stats);
  });
};


/**
 * The generator creates a sentence with indexed words
 *
 * @param  {Object}   conf  configuration object
 # @return {Object}   the generator
 */
var Generator = function(conf) {
  Generator.super_.call(this, conf);
};
util.inherits(Generator, Common);

// Languages I know
Generator.prototype.knownLanguages = [
  'english','french','german','italian',
  'arabic','bulgarian','czech','danish','dutch',
  'estonian','farsi','finnish','hausa','hawaiian',
  'hindi','hungarian','icelandic','indonesian',
  'kazakh','azeri','bengali'
];

/**
 * randomWord gives a random word
 *
 * @param {Function} callback(word)
 */
Generator.prototype.randomWord = function(callback) {
  this._redis.randomkey(function(result, key) {
    //console.log('randomWord', result, key);
    callback(key);
  });
};

/**
 * nextWord find a follower
 *
 * @param {Function} callback(next)
 */
Generator.prototype.nextWord = function(word, callback) {
  var self = this;
  this._redis.exists(word, function(err, data) {
    if (data == null) { return callback(null); }

    self._redis.hgetall(word, function(result, data) {
      var sum = 0;
      for (var i in data) {
        sum += data[i];
      }
      var rand = Math.floor(Math.random()*sum+1);
      var partial_sum = 0;
      var next = null;
      for (var j in data) {
        partial_sum += data[j];
        if (partial_sum >= rand) { next = j; }
      }
      callback(next);
    });
  });
};

/**
 * randomSentance Generate a whole sentence
 *
 * @param {Function} callback(next)
 * @param {Function} callback(next)
 */
Generator.prototype.randomSentance = function(options, callback, word) {
  var sentance = [];
  var self = this;
  this.randomWord( function(word) {
    function build(next) {
      sentance.push(!next || sentance.length > 15 ? '.' : ' ' + next);
      
      if (sentance.length > 5 && /(\.|!|\?)/.exec(sentance)) {
        callback(null, sentance.join(''));
      } else {
        // TODO: not sure of this
        self.nextWord(next, build);
      }
    }
    build(word);
  });
};



/**
* The harvester index words from Twitter, with optional filters
*
* @param {Object} conf configuration object with filters
# @return {Object} the harvester
*/
var harvester = function(conf) {
  
// the object we'll return
var harv = {};
  
var Twitter = require('twitter');
  
// instanciate a twitter client
harv.twit = new Twitter(conf.twitter);

// instanciate a redis client
harv.redis = Redis.createClient(conf.redis);

harv.clean = function(text) {
  text = text.replace(/[@#][^ ]+/g, '', text);
  return text;
};

// harvest twitter with options
harv.initTwitterStream = function(streamOptions) {
  this.twit.verifyCredentials(function(data) {
    //console.log(util.inspect(data));
  });
    
  var onStream = function(stream) {
    stream.on('data', function(data) {
      if (!data.text) { return; }

      if (streamOptions.lang) {
        var detected = lng.detect(harv.clean(data.text), 1);
        if (!detected || !detected.length || !detected[0].length || detected[0][0] !== streamOptions.lang || detected[0][1] < 0.2) {
          //console.log('discard text, was in ' + detected[0][0], 'not ' + streamOptions.lang);
          return;
        }
        //console.log(detected);
      }

      var words = data.text.split(/\s+/);
      for(var j = 0; j < words.length - 1; j++) {
        harv.redis.hincrby(words[j], words[j+1], 1 + Math.sqrt(data.retweet_count));
        harv.words_in_last_second++;
      }
        
      harv.redis.incrby('twittersay-core-word-count', words.length);
      harv.redis.incrby('twittersay-core-word-last-minute', words.length);
      
      return streamOptions.debug ? console.log(words.length + ' words :', data.text) : process.stdout.write('.');
    });

    stream.on('error', function(data) {
      console.log('onerror: ', data);
    });
  };

  if (typeof streamOptions === 'object' && streamOptions.track || streamOptions.follow || streamOptions.locations) {
    this.twit.stream('statuses/filter', streamOptions, onStream);
    console.log("I'm listenning to twitter with filters", util.inspect(streamOptions));
  } else {
    this.twit.stream('statuses/sample', onStream);
    console.log("I'm listenning to twitter samples, use parameters to customize");
    console.log("Each dot represents an indexed tweet: ");
  }
};
  
harv.get = function(key, callback) {
  harv.redis.get(key, callback);
};
  

return harv;
};


module.exports = {
  Generator: Generator,
  harvester: harvester,
  db: function(conf) {
    return Redis.createClient(conf.redis);
  }
};





