#!/usr/bin/env node

/**
 * Module dependencies.
 */
var conf      = require('./config'),
    fs        = require('fs'),
    sys       = require('sys'),
    util      = require('util'),
    twitter   = require('twitter'),
    optimist  = require('optimist'),
    ts        = require('twittersay-core'),
    tsharv    = new ts.TwitterHarvester(conf);
  
// quick & dirty modules
var locations = require('locations');

// TODO: trash this
var redis = require('redis').createClient();

/**
 * Launcher options
 */ 
var argv = optimist
    .describe('method',     'Harvesting method (files|twitter)')
    .default('method',      'twitter')
    .describe('locations',  'Specifies a set of bounding boxes to track.')
    .describe('country',    'Specifies a country to track (will be translated to bounding box)')
    .describe('lang',       'Filter tweets in this language (english|french|italian|german)')
    .describe('follow',     'A comma separated list of Twitter user IDs')
    .describe('track',      'Keywords to track. Phrases of keywords are specified by a comma-separated list')
    .describe('countries',  'List of recognized countries')
    .describe('langs',      'List of recognized languages')
    .describe('help',       'This help')
    .describe('debug',      'Debug mode')
    .argv;


// harvest local files
var initLocalFiles = function() {
  var texts = fs.readdirSync(__dirname + '/texts');
    function insertWords(err, data) {
      var words = data.split(/\s+/);
      for (var j = 0; j < words.length - 1; j++) {
        redis.hincrby(words[j], words[j+1], 1);
      }
      redis.incrby('twittersay-core-word-count', words.length);
      redis.quit();
    }
    for (var i = 0; i < 1; i++) {
      var filename = __dirname + '/texts/' + texts[i];
      fs.readFile(filename, 'ascii', insertWords);
    }
};


/**
 * Run the requested harvester: files or twitter (default)
 *
 */
if (argv.method === 'files') {
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
  console.log(locations.countries);
  process.exit();
}

if (argv.country && locations.countries[argv.country]) {
  argv.locations = locations.countries[argv.country].loc;
}
  
var filters = ['debug', 'lang', 'country', 'locations', 'track', 'follow'];
for (var i=0; i < filters.length; i++) {
  if (argv[filters[i]]) {
    streamOptions[filters[i]] = argv[filters[i]];
  }
}
  
tsharv.start(streamOptions);
