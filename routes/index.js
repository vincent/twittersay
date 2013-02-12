/*
 * GET home page.
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
			en: 'English',
			fr: 'Français',
			de: 'Deusch',
		},
		
		hashtags: {
			'#musa': '#musa'
		}
		
	});
};
