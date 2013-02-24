/**
 * Refresh trending topics every 5 minutes
 */
var trends = require('twitter-trends');
var topicsCache = {};

trends.topics(1, function(err, topics){
  topicsCache.general = topics || [];
})


/**
 * Main application route
 */
exports.index = function(req, res){
  res.render('index', {
    title: 'Twitter says',
    roomOptions: JSON.stringify({
      name: JSON.stringify(req.params),

      tag: req.param('tag', false),
      lang: req.param('lang', false),
      country: req.param('country', false),
    }),

    locations: require('locations').countries,

    languages: {
      english: 'English',
      french:  'Français',
      german:  'Deusch',
      italian: 'Italian'
    },

    hashtags: topicsCache.general
  });
};
