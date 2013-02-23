# TwitterSay

Generates fake tweets, using markov chains on previous tweeted content.

## Components

TwitterSay is composed by two main components

### An harvester

The harvester support the Twitter ```statuses/filter``` endpoint options (follow, track, locations) plus 

 - ```country``` that will be translated in locations
 
 - ```lang``` that will ignore tweets in other languages
 
```
$ harvester --country Canada --lang french # will harvest tweets in french, from Canada
```

### A webapp
The webapp continuously display random, generated tweets.

```
$ ./app.js # or npm start
```

## Requirements
You need a Redis instance to run the harvester and/or the webapp.

## Install
```
$ npm install docserv
$ cp config.js.sample config.js
```

## Configuration
Edit the ```config.js``` file.
