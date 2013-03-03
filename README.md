# TwitterSay

Generates fake tweets, using markov chains on previous tweeted content.

## Components

### An harvester

The harvester supports the Twitter ```statuses/filter``` endpoint options (follow, track, locations) plus 

 - ```country``` will be translated in locations (gps) arguments
 
 - ```lang``` will ignore tweets in other languages
 
```
$ node harvester.js --country Canada --lang french # will harvest tweets in french, from Canada
```

### A command line generator

The generator supports the following options

 - ```block``` generate a predefined block among tweet, paragraph or bible
 - ```minwords``` generate a sentence with at least X words
 - ```maxwords``` generate a sentence with at most X words
 - ```lang``` generate a sentence in this language
 - ```html``` produce an HTML output (links,twitteruids)
 - ```lang``` generate a sentence in this language

```
$ node generate.js --lang french --block tweet --html # will output an HTML tweet-size sentance, beginning with a french word
```

### A webapp
The webapp continuously display random, generated tweets.

```
$ node app.js # or npm start
```

## Requirements
You need a Redis instance to hold harvested data and generate sentances.

## Install
```
$ npm install -d
$ cp config.js.sample config.js
```

## Configuration
Edit the ```config.js``` file.
