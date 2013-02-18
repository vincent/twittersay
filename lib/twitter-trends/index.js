var http = require('http');

var cache = {
//  woeid : {
//    topics: [...],
//    time: timestamp
//  }
};

/**
 * Get Twitter's trending topics
 *
 * @param Integer   place's woeid (see Yahoo...)
 * @param Function  callback(error, topics)
 */
function topics(woeid, callback) {
  // Check if our cache is empty or too old
  if (!cache[woeid] || cache[woeid].time < 5 * 60 * 1000) {
    
    // Fetch Twitter API
    http.get('http://api.twitter.com/1/trends/' + woeid + '.json', function(response) {
      var pageData = '';
      response.setEncoding('utf8');
      response.on('data', function (chunk) {
        pageData += chunk;
      });
      response.on('end', function(){
        try {
          topics[woeid] = JSON.parse(pageData)[0].trends;
          callback(topics[woeid].topics);
        }  catch (e) {}
      });
    }).on('error', function (err) {
      console.error("Cannot fetch Twitter's trending topics, Twitter seems unreachable", err);
      callback(err);
    });

  // Cache is OK
  } else {
    return callback(cache[woeid].topics);
  }
}

module.exports = {
  topics: topics
};