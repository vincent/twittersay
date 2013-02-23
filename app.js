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

var rooms = [];

var wordcount = 0;

var last = {};

/**
 * Our spammy cron delivers 1 message in each room (=options) every 2 seconds
 */
var cron = function(){
  // compute message for each room, asynchronously
  async.forEach(rooms,
    function(roomSpec, next) {
      // get a random sentance, with room's options
      tsgen.randomSentance(roomSpec, function(err, message){

        // parse it
        message = html.parse(message);

        // and broadcast it !
        app.io.room(roomSpec.name).broadcast('message', {message: message });

        // create last msgs stack if not exist
        if (!last[roomSpec.name]) {
          last[roomSpec.name] = [];
        }

        // keep it in stack
        last[roomSpec.name].unshift({message: message});

        // clean stack
        if (last[roomSpec.name].length > 10) {
          last[roomSpec.name].pop();
        }

        next();
      });
    },
    function(err) {
      //console.log('All rooms broadcasted.');
      
      // send stats with broadcast
      sendStats(app.io);

      // re-schedule
      setTimeout(cron, conf.webapp.wait);
    }
  );
    
};

// launch cron now
cron();

// send stats
function sendStats(ioreq) {
  tsdb.get('twittersay-core-word-count', function(err, wordcount){
    if (err) { return console.log(err); }
    tsdb.get('twittersay-core-word-per-minute', function(err, wordperminute){
      ioreq.emit('stats', {
        wordcount: wordcount || '~',
        wordperminute: wordperminute || '~'
      });
    });
  });
}

// io routes
app.io.route('ready', function(req) {
  if (!req.data.name) { return console.log('No room name provided'); }
  
  // subscribe user to channel
  req.io.join(req.data.name);

  // send him stats
  sendStats(req.io);

  // send him last msgs in this room
  req.io.emit('messages', last[req.data.name]);

  // register room
  if (rooms.indexOf(req.data.name) === -1) {
    rooms.push(req.data);
    console.log('new room:', req.data);
  }
});

// express routes
app.get('/', routes.index);
app.get('/lang/:lang', routes.index);
app.get('/hashtag/:hashtag', routes.index);
app.get('/country/:country', routes.index);

// to listen and serve
var server = app.listen(conf.webapp.port, function(){
  console.log("Express server listening on " + server.address().address + ":" + server.address().port);
});
