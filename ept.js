// =============================================================
// ept.js — Парсер EptaPorno для AdultJS (Lampa)
// Version  : 1.1.0
// Architecture: XDS Style (Smart Routing + Submenu)
// =============================================================

(function () {
  'use strict';

  var NAME = 'ept';
  var HOST = 'https://eptaporno.com';

  // ----------------------------------------------------------
  // КАТЕГОРИИ (извлечены из JSON)
  // ----------------------------------------------------------
  var CATEGORIES = [
    { title: '👠 Чулки', slug: 'chulki' },
    { title: '🌲 На природе', slug: 'na-prirode' },
    { title: '💦 Писающие', slug: 'pisayushchie' },
    { title: '📼 Записи приватов', slug: 'zapisi-privatov' },
    { title: '👾 Нестандартное', slug: 'izvrashcheniya' }
  ];

  // ----------------------------------------------------------
  // СЕТЕВОЙ ЗАПРОС
  // ----------------------------------------------------------
  function httpGet(url, success, error) {
    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, success, error);
    } else {
      fetch(url).then(function (r) { return r.text(); }).then(success).catch(error);
    }
  }

  // ----------------------------------------------------------
  // ПАРСИНГ
  // ----------------------------------------------------------
  function extractCards(html) {
    var cards = [];
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var items = doc.querySelectorAll('.item');

    for (var i = 0; i < items.length; i++) {
        var el = items[i];
        var link = el.querySelector('a');
        var img = el.querySelector('img');
        var title = el.querySelector('.title, strong, a[title]');

        if (link && title) {
            var href = link.getAttribute('href');
            if (href && href.indexOf('http') !== 0) href = HOST + href;

            var picture = img ? (img.getAttribute('data-original') || img.getAttribute('src')) : '';
            if (picture && picture.indexOf('http') !== 0) picture = HOST + picture;

            var duration = el.querySelector('.duration') ? el.querySelector('.duration').textContent.trim() : '';

            cards.push({
                name: title.getAttribute('title') || title.textContent.trim(),
                video: href,
                picture: picture,
                img: picture,
                poster: picture,
                background_image: picture,
                time: duration,
                json: true,
                source: NAME
            });
        }
    }
    return cards;
  }

  // ----------------------------------------------------------
  // МЕНЮ (XDS Style)
  // ----------------------------------------------------------
  function buildMenu() {
    return [
      {
        title: '🔍 Поиск',
        search_on: true,
        playlist_url: NAME + '/search/'
      },
      {
        title: '🔥 Новинки',
        playlist_url: NAME + '/latest'
      },
      {
        title: '📂 Категории',
        playlist_url: 'submenu',
        submenu: CATEGORIES.map(function (c) {
          return {
            title: c.title,
            playlist_url: NAME + '/cat/' + c.slug
          };
        })
      }
    ];
  }

  // ----------------------------------------------------------
  // РОУТИНГ
  // ----------------------------------------------------------
  function routeView(params, success, error) {
    var url = params.url || '';
    var page = params.page || 1;
    var fetchUrl = HOST + '/latest-updates/' + (page > 1 ? page + '/' : '');

    // 1. Поиск через фильтр (?search= или ?q=)
    var searchMatch = url.match(/[?&](search|q)=([^&]*)/);
    if (searchMatch) {
        var query = decodeURIComponent(searchMatch[2]);
        fetchUrl = HOST + '/search/' + query + '/' + (page > 1 ? page + '/' : '');
    } 
    // 2. Категории
    else if (url.indexOf(NAME + '/cat/') === 0) {
        var cat = url.split('/cat/')[1].split('?')[0];
        fetchUrl = HOST + '/categories/' + cat + '/' + (page > 1 ? page + '/' : '');
    }
    // 3. Прямой поиск в URL
    else if (url.indexOf(NAME + '/search/') === 0) {
        var rawQ = url.split('/search/')[1].split('?')[0];
        if (rawQ) fetchUrl = HOST + '/search/' + rawQ + '/' + (page > 1 ? page + '/' : '');
    }

    httpGet(fetchUrl, function (html) {
        var results = extractCards(html);
        success({
            results: results,
            collection: true,
            total_pages: results.length > 0 ? page + 1 : page,
            menu: buildMenu()
        });
    }, error);
  }

  // ----------------------------------------------------------
  // ИНТЕРФЕЙС ПАРСЕРА
  // ----------------------------------------------------------
  var EptParser = {
    main: function (params, success, error) {
        routeView(params, success, error);
    },
    view: function (params, success, error) {
        routeView(params, success, error);
    },
    search: function (params, success, error) {
        var query = encodeURIComponent(params.query);
        this.view({ url: NAME + '/search/' + query, page: 1 }, function(data) {
            data.title = 'EPT: ' + params.query;
            success(data);
        }, error);
    },
    qualities: function (videoUrl, success, error) {
        httpGet(videoUrl, function (html) {
            var m = html.match(/<video[^>]*src="([^"]+)"/i) || html.match(/source\s+src="([^"]+)"/i);
            if (m && m[1]) {
                var stream = m[1];
                if (stream.indexOf('http') !== 0) stream = HOST + stream;
                success({ qualities: { '720p': stream } });
            } else {
                error('Video not found');
            }
        }, error);
    }
  };

  function register() {
    if (window.AdultPlugin && window.AdultPlugin.registerParser) {
        window.AdultPlugin.registerParser(NAME, EptParser);
    } else {
        setTimeout(register, 500);
    }
  }
  register();

})();
