
module.exports = {

  /**
   * Convert text in html
   *
   * @param  {String} text  Text to parse
   * @return {String} HTML string
   */
  parse: function(text) {

    // replace links
    text = text.replace(/(http[^ ]+)/ig, '<a target="_blank" title="$1" href="$1">$1</a>');

    // replace hashtags
    text = text.replace(/(#[^ #\.!\?]+)/ig, '<a class="hashtag" href="//twitter.com/$1">$1</a>');

    // replace usernames
    text = text.replace(/@(\w+)/ig, '<a class="username" href="//twitter.com/$1">@$1</a>');

    return text;
  }
};