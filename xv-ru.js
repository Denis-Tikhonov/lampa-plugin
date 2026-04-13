// =============================================================
// xv-ru.js — Парсер xv-ru.com для AdultJS / AdultPlugin (Lampa)
// Version  : 2.1.0 (Refined Architecture)
// =============================================================

(function () {
  'use strict';

  var HOST      = 'https://www.xv-ru.com';
  var NAME      = 'xv-ru';
  var TAG       = '[xv-ru]';
  var VERSION   = '2.1.0';
  var NOTY_TIME = 3000;

  var WORKER_DEFAULT = 'https://zonaproxy.777b737.workers.dev/?url=';

  var REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Cookie': 'static_cdn=1',
    'Referer': HOST + '/',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  // ----------------------------------------------------------
  // СЕТЕВОЙ СЛОЙ (Унифицированный)
  // ----------------------------------------------------------
  function httpGet(url, ok, fail) {
    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, ok, fail, { type: 'html', headers: REQUEST_HEADERS });
      return;
    }

    var workerUrl = (window.AdultPlugin && window.AdultPlugin.workerUrl) ? window.AdultPlugin.workerUrl : WORKER_DEFAULT;
    var finalUrl = workerUrl + encodeURIComponent(url);

    if (Lampa.Network && typeof Lampa.Network.native === 'function') {
      Lampa.Network.native(finalUrl, function(r) {
        var t = (typeof r === 'string') ? r : JSON.stringify(r);
        if (t && t.length > 50) ok(t); else fail('empty');
      }, fail, false, { headers: REQUEST_HEADERS });
    } else {
      fetch(finalUrl, { headers: REQUEST_HEADERS })
        .then(function(r) { return r.text(); })
        .then(ok)
        .catch(fail);
    }
  }

  // ----------------------------------------------------------
  // РОУТИНГ И ПАГИНАЦИЯ (JSON + Архитектура XDS)
  // ----------------------------------------------------------
  function getLoadUrl(url, page) {
    var query = (url.match(/[?&]k=([^&]+)/) || [])[1];
    var isCategory = url.indexOf('/c/') !== -1;
    
    if (query) {
        // Поиск: ?k=wife&page=2 (согласно JSON анализу)
        var sort = (url.indexOf('&top') !== -1) ? '&top' : '';
        return HOST + '/?k=' + query + sort + '&page=' + page;
    }
    
    if (isCategory) {
        // Категории: /c/Anal-12/2
        var catSlug = url.match(/\/c\/([^\/\?#]+)/)[1];
        return HOST + '/c/' + catSlug + (page > 1 ? '/' + page : '');
    }

    // Главная / Новинки: /new/2
    return page > 1 ? HOST + '/new/' + page : HOST + '/';
  }

  // ----------------------------------------------------------
  // ПАРСИНГ КАРТОЧЕК (.thumb)
  // ----------------------------------------------------------
  function parseCards(html) {
    var cards = [];
    var doc = new DOMParser().parseFromString(html, 'text/html');
    
    // JSON Thumb Map (из window.xv.conf)
    var thumbMap = {};
    var confMatch = html.match(/window\.xv\.conf\s*=\s*(\{[\s\S]*?\});/);
    if (confMatch) {
        try {
            var conf = JSON.parse(confMatch[1]);
            var videos = (conf.data && conf.data.quickies && conf.data.quickies.videos) || [];
            // Совмещаем H и V массивы если есть
            if (conf.data.quickies.videos.H) videos = conf.data.quickies.videos.H.concat(conf.data.quickies.videos.V || []);
            
            videos.forEach(function(v) {
                thumbMap[HOST + v.url] = v.thumb_url;
            });
        } catch(e) {}
    }

    var items = doc.querySelectorAll('.thumb, .thumb-block, .video-item');
    items.forEach(function(el) {
        var a = el.querySelector('a[href*="/video"]');
        if (!a) return;

        var href = a.getAttribute('href');
        if (href.indexOf('http') !== 0) href = HOST + href;
        href = href.split('/THUMBNUM')[0]; // Чистка

        var title = (a.getAttribute('title') || el.querySelector('.title, p')?.textContent || 'Video').trim();
        
        // Постер (Lampa/AdultJS требования)
        var img = el.querySelector('img');
        var poster = thumbMap[href] || (img ? (img.getAttribute('data-src') || img.getAttribute('src')) : '');
        
        // Регулярка для фиксации cdn ссылок из JSON если атрибуты пусты
        if (!poster || poster.indexOf('blank.gif') !== -1) {
            var m = el.outerHTML.match(/https?:\/\/[a-z0-9-]+\.xvideos-cdn\.com\/[^\s"'<>]+(?:_t|\.jpg)/);
            if (m) poster = m[0];
        }

        cards.push({
            name: title,
            video: href,
            img: poster,             // Для совместимости Lampa
            poster: poster,          // Для совместимости AdultJS
            background_image: poster,// Для плиток
            time: (el.querySelector('.duration')?.textContent || '').trim(),
            quality: 'HD',
            source: NAME
        });
    });

    return cards;
  }

  // ----------------------------------------------------------
  // ГЕНЕРАЦИЯ ССЫЛОК (Поддержка JSON Токенов + HLS)
  // ----------------------------------------------------------
  function getQualities(url, success, error) {
    httpGet(url, function (html) {
      var q = {};
      
      // 1. Поиск в JS переменных (Стандарт)
      var mHLS = html.match(/html5player\.setVideoHLS\(['"]([^'"]+)['"]\)/);
      var mHigh = html.match(/html5player\.setVideoUrlHigh\(['"]([^'"]+)['"]\)/);
      var mLow = html.match(/html5player\.setVideoUrlLow\(['"]([^'"]+)['"]\)/);

      if (mHLS) q['HLS (Adaptive)'] = mHLS[1];
      if (mHigh) q['720p (HD)'] = mHigh[1];
      if (mLow) q['360p (SD)'] = mLow[1];

      // 2. Поиск токенизированных ссылок phncdn/xvideos-cdn (JSON Regex)
      if (Object.keys(q).length === 0) {
          var re = /"url":\s*"(https?:\/\/[^"]+?\.mp4\?secure=[^"]+)"/g;
          var m, i = 1;
          while ((m = re.exec(html)) !== null) {
              var label = m[1].indexOf('720') !== -1 ? '720p' : (m[1].indexOf('360') !== -1 ? '360p' : 'MP4-' + i);
              q[label] = m[1].replace(/\\\//g, '/');
              i++;
          }
      }

      if (Object.keys(q).length > 0) {
        success({ qualities: q });
      } else {
        error('Video links not found');
      }
    }, error);
  }

  // ----------------------------------------------------------
  // ROUTEVIEW (Архитектура XDS)
  // ----------------------------------------------------------
  function routeView(url, page, success, error) {
    var loadUrl = getLoadUrl(url, page);
    
    httpGet(loadUrl, function (html) {
      var results = parseCards(html);
      success({
        results: results,
        collection: true,
        total_pages: results.length >= 20 ? page + 1 : page,
        // Меню можно расширить категориями из JSON в будущем
        menu: [
            { title: 'Новинки', playlist_url: HOST + '/new' },
            { title: 'Лучшее', playlist_url: HOST + '/best-videos' },
            { title: 'Поиск', search_on: true }
        ]
      });
    }, error);
  }

  // ----------------------------------------------------------
  // API ИНТЕРФЕЙС
  // ----------------------------------------------------------
  var Parser = {
    main: function (params, success, error) {
      routeView(HOST, 1, success, error);
    },
    view: function (params, success, error) {
      routeView(params.url || HOST, params.page || 1, success, error);
    },
    search: function (params, success, error) {
      var query = encodeURIComponent(params.query);
      routeView(HOST + '/?k=' + query, params.page || 1, function(data) {
        data.title = 'XV: ' + params.query;
        success(data);
      }, error);
    },
    qualities: function (url, success, error) {
      getQualities(url, success, error);
    }
  };

  // Регистрация
  if (window.AdultPlugin && window.AdultPlugin.registerParser) {
    window.AdultPlugin.registerParser(NAME, Parser);
  } else {
    // Полифилл ожидания загрузки плагина
    var wait = setInterval(function() {
        if (window.AdultPlugin && window.AdultPlugin.registerParser) {
            window.AdultPlugin.registerParser(NAME, Parser);
            clearInterval(wait);
        }
    }, 500);
  }
})();
