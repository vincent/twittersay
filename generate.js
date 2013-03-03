#!/usr/bin/env node

// modules dependencies
var conf      = require('./config'),
    ts        = require('twittersay-core'),
    optimist  = require('optimist'),
    phpjs     = require('phpjs'),
    _         = require('lodash'),
    tsgen     = new ts.Generator(conf);
  
// quick & dirty modules
var locations = require('locations');
var html = require('htmlify');

// TODO: trash this
var redis = require('redis').createClient();

/**
 * Launcher options
 */ 
var argv = optimist
    .describe('block',   'Generate a predefined block (tweet|paragraph|bible)')
    .describe('html',    'Produce an HTML output (links,twitteruids)')
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
* Predefined block types
*/
if (argv.block) {
  _.defaults(argv, {
    'tweet': {
      minwords: 3,
      maxwords: 10
    },
    'paragraph': {
      minwords: 100,
      maxwords: 350
    },
    'bible': {
      minwords: 1000,
      maxwords: 10000
    }
  }[argv.block]);
  if (argv.debug) {
    console.log('Using [' + argv.block + '] options');
  }
}

/**
* Start generating
*/
tsgen.randomSentance(argv, function(err, message){
  process.stdout.write(argv.html ? html.parse(message) : phpjs.html_entity_decode(message) + "\n");
  process.exit();
});
