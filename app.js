#!/usr/bin/env node

/**
 * Module dependencies.
 */
var conf    = require('./config'),
    routes  = require('./routes'),
    express = require('express.io'),
    http    = require('http'),
    path    = require('path'),
    async   = require('async'),
    ts      = require('twittersay-core'),
    tsgen   = ts.generator(conf),
    tsdb    = ts.db(conf);

// quick & dirty modules
var html = require('htmlify');


var app = express();

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser(conf.webapp.secret));

  app.use(express.session({
    secret: conf.webapp.secret,
    maxAge: new Date(Date.now() + 7200000) // 2h Session lifetime
  }));

  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.http().io();

var rooms = { };

/**
 * Our spammy cron delivers 1 message in each room (=options) every 2 seconds
 */
var cron = function(){
  for (roomName in rooms) {
    // get a random sentance, with room's options
    tsgen.randomSentance(rooms[roomName], function(err, message){
      // and broadcast !
      app.io.room(rooms[roomName].room).broadcast('message', { message: html.parse(message) })
    })
  }
  // send wordcount with broadcast
  tsdb.get('twittersay-core-word-count', function(err, count){
    if (err) return console.log(err);
    app.io.broadcast('wordcount', {wordcount: count})
  });
  
  // run cron every 2s
  setTimeout(cron, 2000);
};

// launch cron now
cron();

// io routes
app.io.route('ready', function(req) {
  // subscribe user to channel
  req.io.join(req.data.room);

  // register the room options
  if (!rooms[req.data.room]) {
    rooms[req.data.room] = req.data;
    console.log('new room:', rooms[req.data.room]);
  }
})

// web routes
app.get('/', routes.index);
app.get('/lang/:lang', routes.index);
app.get('/hashtag/:hashtag', routes.index);
app.get('/country/:country', routes.index);

// to listen and serve
var server = app.listen(conf.webapp.port, function(){
  console.log("Express server listening on " + server.address().address + ":" + server.address().port);
});
