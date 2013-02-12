var fs = require('fs'),
    sys = require('sys'),
    util = require('util'),
    redis = require('redis').createClient(),
    twitter = require('twitter');

var twit = new twitter({
  consumer_key: 'consumer_key',
  consumer_secret: 'consumer_secret',
  access_token_key: 'access_token_key',
  access_token_secret: 'access_token_secret'
});

var init = function() {
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

var initTwitterStream = function(streamOptions) {
  twit.verifyCredentials(function(data) {
    //console.log(util.inspect(data));
  });

  streamOptions = streamOptions || {};

  twit.stream('statuses/filter', streamOptions, function(stream) {
    stream.on('data', function(data) {
      if (!data.text) return;

      var words = data.text.split(/\s+/);
      for(var j = 0; j < words.length - 1; j++) {
        redis.hincrby(words[j], words[j+1], 1 + Math.sqrt(data.retweet_count));
      }
			
			console.log(words.length, 'words');
    });

    stream.on('error', function(data) {
      //console.log('onerror: ', data);
    });

    console.log("I'm listenning to twitter ", util.inspect(streamOptions));
  });
};

if (process.argv[2] == 'init') {
	init();
} else if (process.argv[2] == 'twitter') {
	initTwitterStream();
} else if (process.argv[2] == 'in') {
	initTwitterStream({
		locations: fs.readFileSync(process.argv[3], 'utf8').trim()
	});
} else {
	console.log('You need to provide some parameters');
}

