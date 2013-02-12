var express = require('express.io')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
	, async = require('async')
	, ts = require('twittersay');

var html = require('htmlify');

var app = express();

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
	app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('plop'));

  app.use(express.session({
    secret: process.env.CLIENT_SECRET || 'plop',
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

// our spammy cron
var cron = function(){
	for (roomName in rooms) {
		// get a random sentance, with room's options
    ts.randomSentance(rooms[roomName], function(err, message){
		  // and broadcast !
  	  app.io.room(rooms[roomName].room).broadcast('message', { message: html.parse(message) })
		})
  }
  setTimeout(cron, 2000);
};

// run cron every 2s
setTimeout(cron, 2000); cron();

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
var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log("Express server listening on port " + port);
});
