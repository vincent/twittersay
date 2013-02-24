// modules dependencies
var util = require('util'),
    Common = require('./common');


/**
* @class
* @memberOf twittersay-core
*
* The harvester eats words
*
* @param {Object} options & filters
*/
var Harvester = function(conf) {
  Harvester.super_.call(this, conf);
};
util.inherits(Harvester, Common);

/**
* Remove mentions and hashtags from text
*
* @param {String} text input text
* @return {String} clean text
*/
Harvester.prototype.clean = function(text) {
  text = text.replace(/[@#][^ ]+/g, '', text);
  return text;
};


/**
* Stream handler. Here we cut text in pieces and cook them
*
* @param {InputStream} stream input stream
*/
Harvester.prototype.onStream = function(stream, options) {
  var self = this;

  var LanguageDetect = require('languagedetect');
  var lng = new LanguageDetect();
  
  stream.on('data', function(data) {
    if (!data.text) { return; }

    // oh. you specified a language ?
    var detected = 0;
    if (options.lang) {
      detected = lng.detect(self.clean(data.text), 1);
      if (!detected || !detected.length || !detected[0].length || detected[0][0] !== options.lang || detected[0][1] < 0.2) {
        if (options.debug) {
          console.log('discard text, was in ' + detected[0][0], 'not ' + options.lang);
        }
        return;
      }
      // set detected score
      detected = parseInt(detected[0][1] * 100, 0);
      //console.log(options.lang, ':', detected);
    }

    var words_in_language = [];

    // dissect words from text
    var words = data.text.split(/\s+/);
    for(var j = 0; j < words.length; j++) {
      self._redis.hincrby(words[j], words[j+1], 1 + Math.sqrt(data.retweet_count));

      // it's quite sure text is in `options.lang`
      // let's store that
      // TODO: exceptions ? smileys, punct, etc..
      if (options.lang) {
        words_in_language.push(detected);
        words_in_language.push(words[j]);
      }
    }

    if (words_in_language.length) {
      words_in_language.unshift('lang-' + options.lang);
      self._redis.zadd(words_in_language, function(err){
        if (options.debug) {
          console.log('words_in_language', words_in_language[0], util.inspect(words_in_language));
        }
      });
    }
    
    // for stats
    self._redis.hincrby(self._statsKey, 'word-count', words.length);
    self._redis.hincrby(self._statsKey, 'word-last-minute', words.length);
      
    return options.debug ? console.log(words.length + ' words :', data.text) : process.stdout.write('.');
  });

  stream.on('error', function(data) {
    console.log('onerror: ', data);
  });
};

module.exports = Harvester;
