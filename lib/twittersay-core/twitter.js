// modules dependencies
var util = require('util'),
    Harvester = require('./harvester');


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


module.exports = TwitterHarvester;





