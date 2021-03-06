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
  setInterval(function(){ self._statsTick(); }, 60 * 1000);
};

/**
 * Stats tick
 * Update stats counters
 */
Common.prototype._statsTick = function() {
  var self = this;
  // word counts
  this._redis.hget(self._statsKey, 'word-last-minute', function(err, cnt){
    self._redis.hset(self._statsKey, 'word-per-minute', cnt);
    self._redis.hset(self._statsKey, 'word-last-minute', 0);
  });
  // by lang
  this._redis.zcard('lang-french', function(err, cnt){
    self._redis.hset(self._statsKey, 'words-in-french', cnt);
  });
  this._redis.zcard('lang-english', function(err, cnt){
    self._redis.hset(self._statsKey, 'words-in-english', cnt);
  });
  this._redis.zcard('lang-german', function(err, cnt){
    self._redis.hset(self._statsKey, 'words-in-german', cnt);
  });
  this._redis.zcard('lang-italian', function(err, cnt){
    self._redis.hset(self._statsKey, 'words-in-italianh', cnt);
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

module.exports = Common;





