(function () {
  'use strict';
  var NAME = 'epor';
  var HOST = 'https://www.eporner.com';

  var Parser = {
    main: function (p, s, e) { this.view({url: HOST}, s, e); },
    view: function (p, s, e) {
      window.AdultPlugin.networkRequest(p.url, function(html) {
        var results = [];
        var doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('.mbvidobj').forEach(el => {
           var a = el.querySelector('a');
           results.push({
             name: a.getAttribute('title'),
             video: HOST + a.getAttribute('href'),
             picture: el.querySelector('img').getAttribute('data-src'),
             source: NAME, json: true
           });
        });
        s({results: results});
      }, e);
    },
    qualities: function (url, success, error) {
      window.AdultPlugin.networkRequest(url, function (html) {
        var match = html.match(/var\s+video_model\s*=\s*({.*?});/);
        if (match) {
          var data = JSON.parse(match[1]);
          var q = {};
          for(var k in data.sources) q[k] = data.sources[k].url;
          success({qualities: q});
        } else error('No video model');
      }, error);
    }
  };
  window.AdultPlugin.registerParser(NAME, Parser);
})();
