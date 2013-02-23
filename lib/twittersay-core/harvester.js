// modules dependencies
var util = require('util'),
    Common = require('./common');


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

module.exports = Harvester;
