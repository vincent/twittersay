// modules dependencies
var util = require('util'),
    Common = require('./common');


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
Generator.prototype.randomWord = function(callback, options) {
  var self = this;
  
  // if options.lang is specified
  if (options && options.lang) {
    if (options.debug) {
      console.log('oh. you asked a sentence in ' + options.lang);
    }
    // pick random word from this lang set
    // sad there's not zrandmember ...
    this._redis.zcard('lang-' + options.lang, function(result, count) {
      var randIndex = Math.floor(Math.random() * count);
      // get that word
      self._redis.zrange('lang-' + options.lang, randIndex, randIndex, function(result, word) {
        if (word) {
          callback(word);
        } else {
          // damm, no words in %language :/
          // basic random key
          self._redis.randomkey(function(result, word) {
            console.log('fallback randomWord !', word);
            callback(word);
          });
        }
      });
    });

  // basic random key
  } else {
    this._redis.randomkey(function(result, word) {
      //console.log('randomWord', result, word);
      callback(word);
    });
  }
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
  
  options = options || {};
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
  }, options);
};

module.exports = Generator;
