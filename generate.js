#!/usr/bin/env node

// modules dependencies
var conf      = require('./config'),
    ts        = require('twittersay-core'),
    optimist  = require('optimist'),
    phpjs     = require('phpjs'),
    tsgen     = new ts.Generator(conf);
  
// quick & dirty modules
var locations = require('locations');

// TODO: trash this
var redis = require('redis').createClient();

/**
 * Launcher options
 */ 
var argv = optimist
    .describe('lang',    'Generate a sentence in this language')
    .describe('langs',   'List of recognized languages')
    .describe('help',    'This help')
    .describe('debug',   'Debug mode')
    .argv;

if (argv.help) {
  optimist.showHelp();
  process.exit();
}

if (argv.langs) {
  console.log(tsgen.knownLanguages.join("\n"));
  process.exit();
}

/**
* Start generating
*/
tsgen.randomSentance(argv, function(err, message){
  process.stdout.write(phpjs.html_entity_decode(message) + "\n");
  process.exit();
});
