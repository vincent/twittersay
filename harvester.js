// modules dependencies
var conf = require('./config'),
  fs = require('fs'),
  sys = require('sys'),
  util = require('util'),
  twitter = require('twitter'),
  optimist = require('optimist'),
  tsharv = require('twittersay-core').harvester(conf),
  
  // TODO: trash this
  redis = require('redis').createClient();

// quick & dirty modules
var locations = require('locations');

// launcher options 
var argv = optimist
    .describe('method', 'harvesting method (files|twitter)')
    .default('method', 'twitter')
    .describe('locations', 'spot tweets in this location (gps bounding box)')
    .default('locations', false)
    .describe('tags', 'spot tweets with one of these tags')
    .default('tags', false)
    .argv;


// harvest local files
var initLocalFiles = function() {
  var texts = fs.readdirSync(__dirname + '/texts');
    for(var i = 0; i < 1; i++) {
      var filename = __dirname + '/texts/' + texts[i];
      fs.readFile(filename, 'ascii', function(err, data) {
        var words = data.split(/\s+/);
        for(var j = 0; j < words.length - 1; j++) {
            redis.hincrby(words[j], words[j+1], 1);
        }
        redis.quit();
      });
    }
}


/**
 * Run the requested harvester: files or twitter (default)
 *
 */
if (argv.method == 'files') {
	initLocalFiles();

} else if (argv.method == 'twitter') {
  var streamOptions = {};
  
  if (argv.locations) streamOptions.locations = argv.locations;
  if (argv.tags) streamOptions.tags = argv.tags;
  
	tsharv.initTwitterStream(streamOptions);

} else {
	console.log('You need to provide some parameters, I cannot guess all by myself !');
}

