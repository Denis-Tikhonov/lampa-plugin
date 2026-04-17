(function () {
  'use strict';

  var NAME = 'ostr';
  var BASE_URL = 'http://ostroeporno.com';

  var CATEGORIES = [
    { title: '🇷🇺 Русское', slug: 'russkoe' },
    { title: '🏠 Домашнее', slug: 'domashnee' },
    { title: '👧 Молодые', slug: 'molodyee' },
    { title: '👅 Минет', slug: 'minet' },
    { title: '🍑 Брюнетки', slug: 'bryunetki' },
    { title: '👠 Чулки', slug: 'chulki_i_kolgotki' },
    { title: '👵 Зрелые', slug: 'zrelyee' },
    { title: '👪 Инцест', slug: 'incesty' }
  ];

  function getHtml(url, success, error) {
    window.AdultPlugin.networkRequest(url, success, error);
  }

  function parseList(html) {
    var results = [];
    // Селектор карточек для ostreoporno (обычно это блоки с классом thumb)
    var items = html.match(/<div[^>]*class="[^"]*thumb[^"]*"[^>]*>([\s\S]*?)<\/div>/g) || [];

    items.forEach(function (content) {
      var linkMatch = content.match(/href="([^"]+)"/);
      var titleMatch = content.match(/title="([^"]+)"/);
      var imgMatch = content.match(/src="([^"]+)"/);
      var timeMatch = content.match(/class="duration">([^<]+)</);

      if (linkMatch && titleMatch) {
        var videoUrl = linkMatch[1];
        if (videoUrl.indexOf('http') !== 0) videoUrl = BASE_URL + videoUrl;

        results.push({
          name: titleMatch[1],
          video: videoUrl,
          picture: imgMatch ? imgMatch[1] : '',
          time: timeMatch ? timeMatch[1] : '',
          quality: 'SD/HD',
          source: NAME,
          json: true
        });
      }
    });
    return results;
  }

  function buildMenu() {
    return [
      { title: '🔍 Поиск', search_on: true, playlist_url: NAME + '/search/' },
      { title: '🆕 Новинки', playlist_url: NAME + '/new' },
      {
        title: '📂 Категории',
        playlist_url: 'submenu',
        submenu: CATEGORIES.map(function (c) {
          return { title: c.title, playlist_url: NAME + '/category/' + c.slug };
        })
      }
    ];
  }

  var Parser = {
    main: function (params, success, error) {
      getHtml(BASE_URL, function (html) {
        success({ results: parseList(html), collection: true, menu: buildMenu() });
      }, error);
    },

    view: function (params, success, error) {
      var page = params.page || 1;
      var url = params.url || '';
      var fetchUrl = BASE_URL;

      if (url.indexOf('search=') !== -1) {
        var query = url.split('search=')[1];
        fetchUrl = BASE_URL + '/?search=' + query + '&page=' + page;
      } else if (url.indexOf('/category/') !== -1) {
        var slug = url.split('/category/')[1];
        fetchUrl = BASE_URL + '/category/' + slug + (page > 1 ? '/page/' + page : '');
      } else {
        fetchUrl = BASE_URL + (page > 1 ? '/page/' + page : '');
      }

      getHtml(fetchUrl, function (html) {
        success({ results: parseList(html), collection: true, total_pages: 20, menu: buildMenu() });
      }, error);
    },

    search: function (params, success, error) {
      var query = encodeURIComponent(params.query);
      getHtml(BASE_URL + '/?search=' + query, function (html) {
        success({ title: 'OstroePorno', results: parseList(html), collection: true });
      }, error);
    },

    qualities: function (videoPageUrl, success, error) {
      getHtml(videoPageUrl, function (html) {
        // Парсинг прямого видео из тегов source
        var sources = {};
        var matches = html.match(/<source[^>]*src="([^"]+)"[^>]*label="([^"]+)"/g);
        
        if (matches) {
          matches.forEach(function(m) {
            var src = m.match(/src="([^"]+)"/)[1];
            var label = m.match(/label="([^"]+)"/)[1];
            sources[label] = src;
          });
        } else {
          // Запасной вариант - просто src
          var single = html.match(/<source[^>]*src="([^"]+)"/i);
          if (single) sources['Default'] = single[1];
        }

        if (Object.keys(sources).length > 0) success({ qualities: sources });
        else error('Video file not found');
      }, error);
    }
  };

  if (window.AdultPlugin && window.AdultPlugin.registerParser) {
    window.AdultPlugin.registerParser(NAME, Parser);
  }
})();