// =============================================================
// p365.js — Парсер Porno365 (Top) для AdultJS / Lampa
// Version  : 1.2.0
// Based on : YouJizz/XDS Architecture
// =============================================================

(function () {
  'use strict';

  var NAME = 'p365';
  var HOST = 'https://top.porno365tube.win';

  // Категории взяты из вашего JSON-анализа
  var CATEGORIES = [
    { title: '🔥 HD порно',    slug: 'hd-porno' },
    { title: '🔞 Анал',       slug: 'anal' },
    { title: '👧 Молодые',    slug: 'molodye' },
    { title: '👱 Блондинки',   slug: 'blondinki' },
    { title: '🍭 Минет',      slug: 'minet' },
    { title: '🍑 Большие жопы', slug: 'bolshie-jopy' },
    { title: '🇷🇺 Русское',    slug: 'russkoe' },
    { title: '👵 Зрелые',     slug: 'zrelye' },
    { title: '🤝 Измена',     slug: 'izmena' },
    { title: '🏠 Домашнее',   slug: 'domashnee' }
  ];

  // ----------------------------------------------------------
  // СЕТЕВОЙ ЗАПРОС (Через ядро AdultJS)
  // ----------------------------------------------------------
  function httpGet(url, success, error) {
    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, success, error);
    } else {
      fetch(url).then(function(r){ return r.text(); }).then(success).catch(error);
    }
  }

  // ----------------------------------------------------------
  // ПОСТРОЕНИЕ URL
  // ----------------------------------------------------------
  function buildUrl(path, page, query) {
    var url = HOST;
    if (query) {
      // Поиск: https://top.porno365tube.win/search/?q=wife
      url += '/search/?q=' + encodeURIComponent(query);
      if (page > 1) url += '&from=' + page; // У 365 обычно пагинация поиска через from
    } else if (path && path !== NAME) {
      // Категория: https://top.porno365tube.win/categories/anal/2
      url += '/categories/' + path + '/' + (page > 1 ? page : '');
    } else {
      // Главная: https://top.porno365tube.win/2
      url += (page > 1 ? '/' + page : '/');
    }
    return url;
  }

  // ----------------------------------------------------------
  // ПАРСИНГ КАРТОЧЕК (На основе .video-block из JSON)
  // ----------------------------------------------------------
  function parsePlaylist(html) {
    var results = [];
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var items = doc.querySelectorAll('.video-block'); // Селектор из JSON

    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      var a = el.querySelector('a[href*="/videos/"]');
      if (!a) continue;

      var href = a.getAttribute('href');
      if (href.indexOf('http') !== 0) href = HOST + href;

      var img = el.querySelector('img');
      var pic = '';
      if (img) {
        // Из JSON: используем data-src, так как на сайте lazy-load
        pic = img.getAttribute('data-src') || img.getAttribute('src') || '';
        if (pic && pic.indexOf('http') !== 0) pic = HOST + pic;
      }

      // Название из селектора .title или alt картинки
      var titleEl = el.querySelector('.title');
      var name = titleEl ? titleEl.textContent.trim() : (img ? img.getAttribute('alt') : 'No Title');

      var durEl = el.querySelector('.duration');
      var time = durEl ? durEl.textContent.trim() : '';

      results.push({
        name: name,
        video: href,
        picture: pic,
        img: pic,
        poster: pic,
        background_image: pic,
        time: time,
        quality: 'HD',
        json: true,
        source: NAME
      });
    }
    return results;
  }

  // ----------------------------------------------------------
  // РОУТИНГ (routeView)
  // ----------------------------------------------------------
  function routeView(url, page, success, error) {
    var searchMatch = url.match(/[?&]search=([^&]*)/);
    if (searchMatch) {
      var query = decodeURIComponent(searchMatch[1]);
      fetchPage(buildUrl(null, page, query), page, success, error);
      return;
    }

    if (url.indexOf(NAME + '/cat/') === 0) {
      var cat = url.replace(NAME + '/cat/', '').split('?')[0];
      fetchPage(buildUrl(cat, page), page, success, error);
      return;
    }

    fetchPage(buildUrl(null, page), page, success, error);
  }

  function fetchPage(fetchUrl, page, success, error) {
    httpGet(fetchUrl, function (html) {
      var results = parsePlaylist(html);
      if (!results.length) {
        error('Ничего не найдено');
        return;
      }
      success({
        results: results,
        collection: true,
        total_pages: page + 1,
        menu: buildMenu()
      });
    }, error);
  }

  function buildMenu() {
    return [
      { title: '🔍 Поиск', search_on: true, playlist_url: NAME + '/search/' },
      { title: '🔥 Новинки', playlist_url: NAME + '/main' },
      {
        title: '📂 Категории',
        playlist_url: 'submenu',
        submenu: CATEGORIES.map(function (c) {
          return { title: c.title, playlist_url: NAME + '/cat/' + c.slug };
        })
      }
    ];
  }

  // ----------------------------------------------------------
  // ИЗВЛЕЧЕНИЕ ВИДЕО (QUALITIES)
  // ----------------------------------------------------------
  function getQualities(videoUrl, success, error) {
    httpGet(videoUrl, function (html) {
      var q = {};
      // Стандартный поиск ссылок в скриптах для 365Tube
      var video_h = html.match(/video_url:\s*['"]([^'"]+)['"]/);
      var video_l = html.match(/video_alt_url:\s*['"]([^'"]+)['"]/);

      if (video_h) q['720p'] = video_h[1];
      if (video_l) q['360p'] = video_l[1];

      // Если в скриптах нет, ищем теги source
      if (Object.keys(q).length === 0) {
        var sources = html.match(/<source[^>]+src="([^"]+)"[^>]+label="([^"]+)"/g);
        if (sources) {
          sources.forEach(function(s) {
            var link = s.match(/src="([^"]+)"/)[1];
            var label = s.match(/label="([^"]+)"/)[1];
            q[label] = link;
          });
        }
      }

      if (Object.keys(q).length > 0) success({ qualities: q });
      else error('Видео не найдено');
    }, error);
  }

  // ----------------------------------------------------------
  // ИНТЕРФЕЙС ПАРСЕРА
  // ----------------------------------------------------------
  var P365Parser = {
    main: function (params, success, error) {
      routeView(NAME + '/main', 1, success, error);
    },
    view: function (params, success, error) {
      routeView(params.url || NAME, params.page || 1, success, error);
    },
    search: function (params, success, error) {
      var query = (params.query || '').trim();
      fetchPage(buildUrl(null, params.page || 1, query), params.page || 1, function (data) {
        data.title = 'P365: ' + query;
        success(data);
      }, error);
    },
    qualities: function (url, success, error) {
      getQualities(url, success, error);
    }
  };

  if (window.AdultPlugin && window.AdultPlugin.registerParser) {
    window.AdultPlugin.registerParser(NAME, P365Parser);
  }
})();
