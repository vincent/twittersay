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
    .describe('method', 'Harvesting method (files|twitter)')
    .default('method', 'twitter')
    .describe('locations', 'Specifies a set of bounding boxes to track.')
    .describe('country', 'Specifies a country to track (will be translated to bounding box)')
    .describe('lang', 'Filter tweets in this language (english|french|italian|german)')
    .describe('follow', 'A comma separated list of Twitter user IDs')
    .describe('track', 'Keywords to track. Phrases of keywords are specified by a comma-separated list')
    .describe('countries', 'List of recognized countries')
    .describe('langs', 'List of recognized languages')
    .describe('help', 'This help')
    .describe('debug', 'Debug mode')
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
        redis.incrby('twittersay-core-word-count', words.length);
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
  process.exit();
}

var streamOptions = {};

if (argv.help) {
  optimist.showHelp();
  process.exit();
}

if (argv.langs) {
  console.log(tsharv.knownLanguages.join("\n"));
  process.exit();
}

if (argv.countries) {
  for (c in locations.countries)
    console.log(c);
  process.exit();
}

if (argv.country && locations.countries[argv.country])
  argv.locations = locations.countries[argv.country].loc;
  
for (opt in { 'debug':1, 'lang':1, 'country':1, 'locations':1, 'track':1, 'follow':1 }) {
  if (argv[opt]) streamOptions[opt] = argv[opt];
}
  
tsharv.initTwitterStream(streamOptions);
