// modules dependencies
var util = require('util');

/**
 * @class
 * @memberOf twittersay-core
 * Common properties for harverster and generator
 *
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
  
  var Redis = require('redis');
  this._redis = Redis.createClient(this._conf.redis);
  
  var self = this;
  // stats ticker
  setInterval(function(){ self._statsTick(); }, 1000);
};

/**
 * Stats tick
 * Update stats counters
 */
Common.prototype._statsTick = function() {
  var self = this;
  this._redis.hget(self._statsKey, 'word-last-minute', function(err, cnt){
    self._redis.hset(self._statsKey, 'word-per-minute', cnt);
    self._redis.hset(self._statsKey, 'word-last-minute', 0);
  });
};

/**
 * Stats getter
 *
 * @param {Function} callback(stats)
 */
Common.prototype.stats = function(callback) {
  this._redis.hgetall(this._statsKey, function(err, stats){
    if (err) { return console.log(err); }
    callback(stats);
  });
};


/**
 * @class
 * @memberOf twittersay-core
 *
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
* @class
* @memberOf twittersay-core
*
* The harvester index words from Twitter, with optional filters
*
* @param {Object} conf configuration object with filters
* @return {Object} the harvester
*/
var Harvester = function(conf) {
  Harvester.super_.call(this, conf);
};
util.inherits(Harvester, Common);

/**
* clean Remove mentions and hashtags from text
*
* @param {String} text input text
* @return {String} clean text
*/
Harvester.prototype.clean = function(text) {
  text = text.replace(/[@#][^ ]+/g, '', text);
  return text;
};


/**
* onStream data handler
*
* @param {InputStream} stream input stream
*/
Harvester.prototype.onStream = function(stream, options) {
  var self = this;

  var LanguageDetect = require('languagedetect');
  var lng = new LanguageDetect();
  
  stream.on('data', function(data) {
    if (!data.text) { return; }

    if (options.lang) {
      var detected = lng.detect(self.clean(data.text), 1);
      if (!detected || !detected.length || !detected[0].length || detected[0][0] !== options.lang || detected[0][1] < 0.2) {
        //console.log('discard text, was in ' + detected[0][0], 'not ' + streamOptions.lang);
        return;
      }
      //console.log(detected);
    }

    var words = data.text.split(/\s+/);
    for(var j = 0; j < words.length - 1; j++) {
      self._redis.hincrby(words[j], words[j+1], 1 + Math.sqrt(data.retweet_count));
    }
        
    self._redis.hincrby(self._statsKey, 'word-count', words.length);
    self._redis.hincrby(self._statsKey, 'word-last-minute', words.length);
      
    return options.debug ? console.log(words.length + ' words :', data.text) : process.stdout.write('.');
  });

  stream.on('error', function(data) {
    console.log('onerror: ', data);
  });
};


/**
* @class
*
* The harvester index words from Twitter, with optional filters
*
* @param {Object} conf configuration object with filters
* @return {Object} the harvester
*/
var TwitterHarvester = function(conf) {
  TwitterHarvester.super_.call(this, conf);
  
  // instanciate a twitter client
  var Twitter = require('twitter');
  this.twit = new Twitter(conf.twitter);
  
};
util.inherits(TwitterHarvester, Harvester);


/**
* initTwitterStream start harvesting from Twitter with options
*
* @param {Object} streamOptions options and filters
*/
TwitterHarvester.prototype.start = function(streamOptions) {
  var self = this;
  
  this.twit.verifyCredentials(function(data) {
    if (typeof streamOptions === 'object' && streamOptions.track || streamOptions.follow || streamOptions.locations) {
      self.twit.stream('statuses/filter', streamOptions, function(stream){
        self.onStream(stream, streamOptions);
        console.log("I'm listenning to twitter with filters", util.inspect(streamOptions));
      });
    } else {
      self.twit.stream('statuses/sample',function(stream){
        self.onStream(stream, {});
        console.log("I'm listenning to twitter samples, use parameters to customize");
        console.log("Each dot represents an indexed tweet: ");
      });
    }
    
  });
};


module.exports = {
  Generator: Generator,
  TwitterHarvester: TwitterHarvester
};





