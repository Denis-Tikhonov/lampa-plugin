// =============================================================
// z777.js — Парсер Zoo-XVideos для AdultJS / AdultPlugin
// Version  : 1.2.0 (Fix Pagination & Search)
// GLM 5 TURBO
// =============================================================
(function () {
  'use strict';

  var NAME = 'z777';
  var HOST = 'https://zoo-xvideos.com';
  var TAG  = '[' + NAME + ']';

  // ----------------------------------------------------------
  // HTTP ЗАПРОСЫ
  // ----------------------------------------------------------
  function httpGet(url, success, error) {
    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, success, error);
    } else {
      if (typeof fetch === 'undefined') { error('fetch unavailable'); return; }
      fetch(url).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      }).then(success).catch(error);
    }
  }

  // ----------------------------------------------------------
  // ПАРСИНГ КАРТОЧЕК (использованы точные селекторы из config)
  // ----------------------------------------------------------
  function parsePlaylist(html) {
    if (!html) return [];
    var doc   = new DOMParser().parseFromString(html, 'text/html');
    var items = doc.querySelectorAll('.thumb'); // container: ".thumb"
    var cards = [];

    for (var i = 0; i < items.length; i++) {
      var card = _parseCard(items[i]);
      if (card) cards.push(card);
    }
    return cards;
  }

  function _parseCard(el) {
    // link: ".thumb a[href]"
    var aEl = el.querySelector('a[href]');
    if (!aEl) return null;
    var href = aEl.getAttribute('href') || '';
    if (href && href.indexOf('http') !== 0) href = HOST + href;

    // title: ".thumb a[title]"
    var name = (aEl.getAttribute('title') || '').trim();
    if (!name) {
      var imgEl = el.querySelector('img');
      if (imgEl) name = (imgEl.getAttribute('alt') || '').trim();
    }
    if (!name) return null;

    // thumbnailAttr: "src"
    var imgEl = el.querySelector('img');
    var picture = '';
    if (imgEl) {
      picture = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || '';
      if (picture && picture.indexOf('//') === 0) picture = 'https:' + picture;
    }

    // duration: ".thumb span.counter" (из config)
    var time = '';
    var spanEl = el.querySelector('span.counter');
    if (spanEl) {
      var t = spanEl.textContent.trim();
      if (/[\d:]+/.test(t)) time = t;
    }

    return {
      name:             name,
      video:            href,
      picture:          picture,
      img:              picture,
      poster:           picture,
      background_image: picture,
      preview:          null,
      time:             time,
      quality:          '',
      json:             true,
      source:           NAME
    };
  }

  // ----------------------------------------------------------
  // ПОЛУЧЕНИЕ ПРЯМОЙ ССЫЛКИ НА ВИДЕО (оставлено без изменений)
  // ----------------------------------------------------------
  function getVideoLinks(videoPageUrl, success, error) {
    httpGet(videoPageUrl, function (html) {
      // Сначала пробуем вытянуть прямую ссылку с CDN (videos.zoo-xvideos.com)
      var mp4Match = html.match(/https?:\/\/videos\.zoo-xvideos\.com\/[^"'\s]+\.mp4[^"'\s]*/);
      if (mp4Match) {
        success({ 'HD': mp4Match[0] });
        return;
      }

      // Fallback: Парсинг тега <video>
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var vid = doc.querySelector('video');
      
      if (vid && vid.src) {
        var src = vid.src;
        if (src.indexOf('//') === 0) src = 'https:' + src;
        success({ 'auto': src });
      } else {
        var source = doc.querySelector('video source');
        if (source && source.src) {
           var src2 = source.src;
           if (src2.indexOf('//') === 0) src2 = 'https:' + src2;
           success({ 'auto': src2 });
        } else {
          error('Не найден тег <video> или ссылка на CDN');
        }
      }
    }, error);
  }

  // ----------------------------------------------------------
  // МЕНЮ
  // ----------------------------------------------------------
  function buildMenu() {
    return [
      {
        title:        '🔍 Поиск',
        search_on:    true,
        playlist_url: NAME + '/search/'
      },
      {
        title:        '🆕 Последнее',
        playlist_url: NAME + '/new'
      },
      {
        title:        '🎬 Длинные',
        playlist_url: NAME + '/long'
      }
    ];
  }

  // ----------------------------------------------------------
  // РОУТЕР И ПАГИНАЦИЯ
  // ----------------------------------------------------------
  function routeView(url, page, success, error) {
    console.log(TAG, 'routeView → "' + url + '" page=' + page);

    var fetchUrl = '';
    var PREFIX = NAME + '/';

    // 1. Поиск через фильтр Lampa (переход из меню)
    var searchMatch = url.match(/[?&]search=([^&]*)/);
    if (searchMatch) {
      var query = decodeURIComponent(searchMatch[1]).trim();
      fetchUrl = HOST + '/videosearch/' + encodeURIComponent(query) + '/';
      if (page > 1) fetchUrl += page + '/';
      return loadPage(fetchUrl, page, success, error);
    }

    // 2. Внутренний поиск (пагинация внутри поиска)
    if (url.indexOf(PREFIX + 'search/') === 0) {
      var rawQuery = url.replace(PREFIX + 'search/', '').split('?')[0];
      var queryStr = decodeURIComponent(rawQuery).trim();
      if (queryStr) {
        fetchUrl = HOST + '/videosearch/' + encodeURIComponent(queryStr) + '/';
        if (page > 1) fetchUrl += page + '/';
        return loadPage(fetchUrl, page, success, error);
      }
    }

    // 3. Раздел "Последнее" (/newreleases/)
    if (url.indexOf(PREFIX + 'new') === 0) {
      fetchUrl = HOST + '/newreleases/';
      if (page > 1) fetchUrl += page + '/';
      return loadPage(fetchUrl, page, success, error);
    }

    // 4. Раздел "Длинные" (/longplays/)
    if (url.indexOf(PREFIX + 'long') === 0) {
      fetchUrl = HOST + '/longplays/';
      if (page > 1) fetchUrl += page + '/';
      return loadPage(fetchUrl, page, success, error);
    }

    // 5. Главная / Топ (По умолчанию)
    // Страница 1: https://zoo-xvideos.com/
    // Страница 2: https://zoo-xvideos.com/topclips/2/
    if (page === 1) {
      fetchUrl = HOST + '/';
    } else {
      fetchUrl = HOST + '/topclips/' + page + '/';
    }
    
    loadPage(fetchUrl, page, success, error);
  }

  // ----------------------------------------------------------
  // ЗАГРУЗКА СТРАНИЦЫ
  // ----------------------------------------------------------
  function loadPage(loadUrl, page, success, error) {
    console.log(TAG, 'loadPage → ' + loadUrl);
    httpGet(loadUrl, function (html) {
      var results = parsePlaylist(html);

      if (!results.length) {
        console.warn(TAG, 'Нет карточек на странице');
        // Если карточек нет, значит мы дошли до конца (или ошибка). 
        // Возвращаем пустой массив без ошибки, чтобы Lampa просто остановил пагинацию.
        success({
          results:     [],
          collection:  true,
          total_pages: page, 
          menu:        buildMenu()
        });
        return;
      }

      success({
        results:     results,
        collection:  true,
        total_pages: results.length >= 20 ? page + 1 : page, // ИСПРАВЛЕНО: безопасный инкремент
        menu:        buildMenu()
      });
    }, error);
  }

  // ----------------------------------------------------------
  // ПУБЛИЧНЫЙ ИНТЕРФЕЙС ПАРСЕРА
  // ----------------------------------------------------------
  var Z777Parser = {

    main: function (params, success, error) {
      routeView(NAME + '/top', 1, success, error);
    },

    view: function (params, success, error) {
      var page = parseInt(params.page, 10) || 1;
      var url  = params.url || (NAME + '/top');
      routeView(url, page, success, error);
    },

    search: function (params, success, error) {
      var query = (params.query || '').trim();
      var page  = parseInt(params.page, 10) || 1;

      if (!query) {
        success({ title: '', results: [], collection: true, total_pages: 1 });
        return;
      }

      var fetchUrl = HOST + '/videosearch/' + encodeURIComponent(query) + '/';
      if (page > 1) fetchUrl += page + '/';

      httpGet(fetchUrl, function (html) {
        var results = parsePlaylist(html);
        success({
          title:       'ZooXV: ' + query,
          results:     results,
          collection:  true,
          total_pages: results.length >= 20 ? page + 1 : page,
          url:         NAME + '/search/' + encodeURIComponent(query) // Важно для continuation пагинации
        });
      }, error);
    },

    qualities: function (videoUrl, success, error) {
      getVideoLinks(videoUrl, success, error);
    }
  };

  // ----------------------------------------------------------
  // РЕГИСТРАЦИЯ В СИСТЕМЕ
  // ----------------------------------------------------------
  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, Z777Parser);
      console.log(TAG, 'v1.2.0 зарегистрирован');
      return true;
    }
    return false;
  }

  if (!tryRegister()) {
    var _poll = setInterval(function () {
      if (tryRegister()) clearInterval(_poll);
    }, 200);
    setTimeout(function () { clearInterval(_poll); }, 5000);
  }

})();
