(function () {
  'use strict';

  var NAME = 'ptop';
  var BASE_URL = 'https://porntop.com';

  var CATEGORIES = [
    { title: '💎 HD Video', slug: 'hd' },
    { title: '👩 Брюнетки', slug: 'brunette' },
    { title: '🍑 Большая жопа', slug: 'big-butt' },
    { title: '🍒 Сисястые', slug: 'big-tits' },
    { title: '👵 Милфы', slug: 'milf' },
    { title: '👅 Глубокий отсос', slug: 'deep-throat' },
    { title: '🎨 Тату', slug: 'tattoos' },
    { title: '👱 Блондинки', slug: 'blonde' },
    { title: '🌏 Азиатки', slug: 'asian' }
  ];

  function getHtml(url, success, error) {
    window.AdultPlugin.networkRequest(url, success, error);
  }

  function parseList(html) {
    var results = [];
    var items = html.match(/<div[^>]*class="item"[^>]*>([\s\S]*?)<\/div><\/div>/g) || [];

    items.forEach(function (content) {
      var linkMatch = content.match(/href="([^"]+)"/);
      var titleMatch = content.match(/class="title">([\s\S]*?)<\/strong>/);
      var imgMatch = content.match(/data-original="([^"]+)"/) || content.match(/src="([^"]+)"/);
      var timeMatch = content.match(/class="duration">([^<]+)</);

      if (linkMatch && titleMatch) {
        var videoUrl = linkMatch[1];
        if (videoUrl.indexOf('http') !== 0) videoUrl = BASE_URL + videoUrl;

        var imgUrl = imgMatch ? imgMatch[1] : '';
        if (imgUrl.indexOf('//') === 0) imgUrl = 'https:' + imgUrl;

        results.push({
          name: titleMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim(),
          video: videoUrl,
          picture: imgUrl,
          time: timeMatch ? timeMatch[1].trim() : '',
          quality: 'HD',
          source: NAME,
          json: true // Указываем, что видео-ссылку нужно парсить отдельно
        });
      }
    });
    return results;
  }

  function buildMenu() {
    return [
      { title: '🔍 Поиск', search_on: true, playlist_url: NAME + '/search/' },
      { title: '🔥 Популярное', playlist_url: NAME + '/popular' },
      {
        title: '🆕 Категории',
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
        fetchUrl = BASE_URL + '/?q=' + query + '&page=' + page;
      } else if (url.indexOf('/category/') !== -1) {
        var slug = url.split('/category/')[1];
        fetchUrl = BASE_URL + '/category/' + slug + '/l/' + (page > 1 ? page + '/' : '');
      } else {
        fetchUrl = BASE_URL + '/' + (page > 1 ? page + '/' : '');
      }

      getHtml(fetchUrl, function (html) {
        success({ results: parseList(html), collection: true, total_pages: 50, menu: buildMenu() });
      }, error);
    },

    search: function (params, success, error) {
      var query = encodeURIComponent(params.query);
      getHtml(BASE_URL + '/?q=' + query, function (html) {
        success({ title: 'PornTop', results: parseList(html), collection: true });
      }, error);
    },

    qualities: function (videoPageUrl, success, error) {
      getHtml(videoPageUrl, function (html) {
        // Ищем URL видео в конфигурации плеера (KT Player/JW)
        var streamMatch = html.match(/video_url:\s*'([^']+)'/);
        if (streamMatch) {
            var streamUrl = streamMatch[1];
            if (streamUrl.indexOf('//') === 0) streamUrl = 'https:' + streamUrl;
            success({ qualities: { '480p': streamUrl } });
        } else {
            // Fallback: ищем source src
            var src = html.match(/<source[^>]*src="([^"]+)"/i);
            if (src) success({ qualities: { 'HD': src[1] } });
            else error('Video not found');
        }
      }, error);
    }
  };

  if (window.AdultPlugin && window.AdultPlugin.registerParser) {
    window.AdultPlugin.registerParser(NAME, Parser);
  }
})();