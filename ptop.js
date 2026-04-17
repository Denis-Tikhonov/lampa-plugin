// =============================================================
// ptop.js — PornTop Parser для AdultJS (Lampa)
// =============================================================
// Версия  : 1.1.0
// Изменения:
//   [1.1.0] Исправлено по JSON-анализу:
//           - [FIX] URL категорий: /category/{slug}/l/ (JSON: category url-паттерн)
//           - [FIX] Пагинация категорий: /l/?page=N вместо /l/N/
//           - [FIX] Транспорт: прямой → Worker последовательно
//           - [FIX] Cookie mature=1 — age gate (JSON: ageGate.cookieValue=1)
//                   Worker добавляет автоматически через BYPASS_COOKIES
//           - [FIX] parseList: DOMParser вместо regex, title — .item .title
//           - [FIX] thumbnail: data-original (JSON: thumbnail.attribute=data-original)
//           - [FIX] duration: .item .duration (подтверждено JSON)
//           - [FIX] Поиск: /?q={query} (JSON: search.paramName=q)
//           - [FIX] backslash unescape в cleanUrl (JSON: backslashEscaped=true)
//           - [ADD] json:true → qualities() извлекает видео
//   [1.0.0] Базовый парсер (устаревший)
// =============================================================

(function () {
  'use strict';

  var VERSION    = '1.1.0';
  var NAME       = 'ptop';
  var BASE_URL   = 'https://porntop.com';
  // Worker из W137.js — замените на свой URL
  var WORKER_URL = 'https://your-worker.workers.dev';

  // ----------------------------------------------------------
  // КАТЕГОРИИ
  // JSON: url-паттерн = BASE_URL/category/{name}/l/
  // Slug в JSON всегда "l" — реальный идентификатор в пути
  // ----------------------------------------------------------
  var CATEGORIES = [
    { title: '💎 HD Video',         slug: 'hd' },
    { title: '👩 Брюнетки',         slug: 'brunette' },
    { title: '🍑 Большая жопа',     slug: 'big-butt' },
    { title: '🍒 Сисястые',         slug: 'big-tits' },
    { title: '👵 Милфы',            slug: 'milf' },
    { title: '👅 Глубокий отсос',   slug: 'deep-throat' },
    { title: '🎨 Тату',             slug: 'tattoos' },
    { title: '👱 Блондинки',        slug: 'blonde' },
    { title: '🌏 Азиатки',          slug: 'asian' },
    { title: '🍆 Большой член',     slug: 'big-dick' },
  ];

  // ----------------------------------------------------------
  // HTTP-ЗАПРОС — прямой → Worker (fallback)
  // [1.1.0] Worker автоматически добавляет Cookie: mature=1 через BYPASS_COOKIES
  // ----------------------------------------------------------
  function ptopGet(url, onSuccess, onError) {
    var workerUrl = WORKER_URL + '/?url=' + encodeURIComponent(url);

    function tryDirect() {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.timeout = 15000;
      xhr.setRequestHeader('Referer', 'https://denis-tikhonov.github.io/');
      // [1.1.0] age gate: Cookie mature=1
      xhr.setRequestHeader('Cookie', 'mature=1');
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
          onSuccess(xhr.responseText);
        } else {
          console.log('[ptop] direct fail (' + xhr.status + '), trying worker...');
          tryWorker();
        }
      };
      xhr.ontimeout = function () { console.log('[ptop] direct timeout, trying worker...'); tryWorker(); };
      xhr.onerror   = function () { console.log('[ptop] direct error, trying worker...');  tryWorker(); };
      xhr.send();
    }

    function tryWorker() {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', workerUrl, true);
      xhr.timeout = 18000;
      // Worker сам добавляет mature=1 через BYPASS_COOKIES (W137 v1.3.8)
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
          onSuccess(xhr.responseText);
        } else {
          onError('HTTP ' + xhr.status + ' (worker)');
        }
      };
      xhr.ontimeout = function () { onError('Worker timeout'); };
      xhr.onerror   = function () { onError('Worker network error'); };
      xhr.send();
    }

    tryDirect();
  }

  // ----------------------------------------------------------
  // УТИЛИТЫ
  // [1.1.0] FIX: добавлен backslash unescape (JSON: backslashEscaped=true)
  // ----------------------------------------------------------
  function cleanUrl(raw) {
    if (!raw) return '';
    var url = raw.trim();

    // 1. Unescape backslash  [1.1.0 FIX]
    url = url.replace(/\\\//g, '/');

    // 2. Protocol-relative
    if (url.indexOf('//') === 0) return 'https:' + url;

    // 3. Root-relative
    if (url.charAt(0) === '/' && url.charAt(1) !== '/') return BASE_URL + url;

    // 4. Относительный
    if (url.indexOf('http') !== 0) return BASE_URL + '/' + url;

    return url;
  }

  // ----------------------------------------------------------
  // ПАРСИНГ КАРТОЧЕК
  // JSON: cardSelector=".item"
  //   title  → .item .title (strong)
  //   link   → .item a[href]  | pattern /video/{id}/{slug}/
  //   thumb  → .item img[data-original]
  //   time   → .item .duration
  // [1.1.0] DOMParser вместо regex + json:true
  // ----------------------------------------------------------
  function parseList(html) {
    var parser = new DOMParser();
    var doc    = parser.parseFromString(html, 'text/html');
    var items  = doc.querySelectorAll('.item');
    var cards  = [];

    for (var i = 0; i < items.length; i++) {
      var item   = items[i];
      var linkEl = item.querySelector('a[href]');
      if (!linkEl) continue;

      var link = cleanUrl(linkEl.getAttribute('href') || '');
      if (!link) continue;

      // [1.1.0] title: .title strong или textContent
      var titleEl = item.querySelector('.title, strong');
      var title   = titleEl ? titleEl.textContent.trim() : (linkEl.getAttribute('title') || '').trim();
      // Убираем лишние пробелы/табы (JSON example содержит много \t)
      title = title.replace(/[\t\n\r]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

      // [1.1.0] thumbnail: data-original (JSON: thumbnail.attribute=data-original)
      var imgEl = item.querySelector('img');
      var thumb = '';
      if (imgEl) {
        thumb = cleanUrl(
          imgEl.getAttribute('data-original') ||
          imgEl.getAttribute('data-src')      ||
          imgEl.getAttribute('src')           || ''
        );
      }

      // [1.1.0] duration: .duration
      var timeEl = item.querySelector('.duration, .time');
      var time   = timeEl ? timeEl.textContent.trim() : '';

      cards.push({
        name             : title || 'Video',
        video            : link,
        picture          : thumb,
        preview          : thumb,
        background_image : thumb,
        img              : thumb,
        poster           : thumb,
        quality          : 'HD',
        time             : time,
        // [1.1.0] json:true — qualities() извлечёт MP4
        json             : true,
        source           : NAME,
      });
    }

    return cards;
  }

  // ----------------------------------------------------------
  // ПАГИНАЦИЯ
  // JSON: pagination.pattern = "&page={N}"
  // ----------------------------------------------------------
  function addPage(url, page) {
    if (page <= 1) return url;
    var sep = url.indexOf('?') > -1 ? '&' : '?';
    return url + sep + 'page=' + page;
  }

  function detectTotalPages(html) {
    var m = html.match(/[?&]page=(\d+)/g);
    if (!m || !m.length) return 10;
    var max = 1;
    m.forEach(function (s) {
      var n = parseInt(s.replace(/[^0-9]/g, ''), 10);
      if (n > max) max = n;
    });
    return Math.min(max, 50);
  }

  // ----------------------------------------------------------
  // ИЗВЛЕЧЕНИЕ ВИДЕО
  // JSON: jsConfigs kt_player, hint = video_url[:=]['"]...['"]
  // ----------------------------------------------------------
  function extractVideoUrls(html) {
    var sources = {};

    var vm = html.match(/video_url\s*[:=]\s*['"]([^'"]+)['"]/);
    if (vm) sources['480p'] = cleanUrl(vm[1]);

    var vm2 = html.match(/video_alt_url\s*[:=]\s*['"]([^'"]+)['"]/);
    if (vm2) sources['720p'] = cleanUrl(vm2[1]);

    // JW Player fallback
    if (!Object.keys(sources).length) {
      var jw = html.match(/file\s*:\s*['"]([^'"]+\.mp4[^'"]*)['"]/i);
      if (jw) sources['HD'] = cleanUrl(jw[1]);
    }

    // source tag fallback
    if (!Object.keys(sources).length) {
      var src = html.match(/<source[^>]*src="([^"]+)"/i);
      if (src) sources['HD'] = cleanUrl(src[1]);
    }

    return sources;
  }

  // ----------------------------------------------------------
  // МЕНЮ
  // [1.1.0] FIX: URL категорий = BASE_URL/category/{slug}/l/
  // ----------------------------------------------------------
  function buildMenu() {
    return [
      { title: '🔍 Поиск',     search_on: true, playlist_url: NAME + '/search/' },
      { title: '🔥 Популярное', playlist_url: NAME + '/popular' },
      {
        title        : '📂 Категории',
        playlist_url : 'submenu',
        submenu      : CATEGORIES.map(function (c) {
          return { title: c.title, playlist_url: NAME + '/category/' + c.slug };
        }),
      },
    ];
  }

  // ----------------------------------------------------------
  // РОУТИНГ
  // ----------------------------------------------------------
  function routeView(url, page, success, error) {
    var searchPrefix   = NAME + '/search/';
    var categoryPrefix = NAME + '/category/';

    // Поиск через фильтр: ptop/search/?search=query
    var sm = url.match(/[?&]search=([^&]*)/);
    if (sm) {
      var q = decodeURIComponent(sm[1]).trim();
      return fetchPage(addPage(BASE_URL + '/?q=' + encodeURIComponent(q), page), success, error);
    }

    // [1.1.0] FIX: категория → BASE_URL/category/{slug}/l/?page=N
    if (url.indexOf(categoryPrefix) === 0) {
      var slug    = url.replace(categoryPrefix, '').split('?')[0].trim();
      var catBase = BASE_URL + '/category/' + slug + '/l/';
      return fetchPage(addPage(catBase, page), success, error);
    }

    // Поиск через путь: ptop/search/query
    if (url.indexOf(searchPrefix) === 0) {
      var rawQ = decodeURIComponent(url.replace(searchPrefix, '').split('?')[0]).trim();
      if (rawQ) return fetchPage(addPage(BASE_URL + '/?q=' + encodeURIComponent(rawQ), page), success, error);
    }

    // Главная / популярное
    fetchPage(addPage(BASE_URL, page), success, error);
  }

  function fetchPage(fullUrl, success, error) {
    console.log('[ptop ' + VERSION + '] fetch → ' + fullUrl);
    ptopGet(fullUrl, function (html) {
      var cards = parseList(html);
      var total = detectTotalPages(html);
      if (total <= 1 && cards.length > 0) total = 10;
      success({
        results     : cards,
        collection  : true,
        total_pages : total,
        menu        : buildMenu(),
      });
    }, error);
  }

  // ----------------------------------------------------------
  // ПАРСЕР API
  // ----------------------------------------------------------
  var PtopParser = {

    main: function (params, success, error) {
      fetchPage(BASE_URL, success, error);
    },

    view: function (params, success, error) {
      var page = parseInt(params.page, 10) || 1;
      var url  = params.url || (NAME + '/popular');
      routeView(url, page, success, error);
    },

    search: function (params, success, error) {
      var query = (params.query || '').trim();
      if (!query) { success({ title: '', results: [], collection: true }); return; }
      ptopGet(BASE_URL + '/?q=' + encodeURIComponent(query), function (html) {
        success({ title: 'PornTop: ' + query, results: parseList(html), collection: true });
      }, error);
    },

    // [1.1.0] qualities — извлекает MP4 со страницы видео
    qualities: function (videoPageUrl, success, error) {
      ptopGet(videoPageUrl, function (html) {
        var sources = extractVideoUrls(html);
        if (Object.keys(sources).length > 0) {
          success({ qualitys: sources });
        } else {
          error('Video not found');
        }
      }, error);
    },
  };

  // ----------------------------------------------------------
  // РЕГИСТРАЦИЯ
  // ----------------------------------------------------------
  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, PtopParser);
      console.log('[ptop] v' + VERSION + ' зарегистрирован');
      try {
        setTimeout(function () {
          Lampa.Noty.show('PornTop [ptop] v' + VERSION + ' подключён', { time: 2500 });
        }, 600);
      } catch (e) {}
      return true;
    }
    return false;
  }

  if (!tryRegister()) {
    var _elapsed = 0;
    var _poll = setInterval(function () {
      _elapsed += 100;
      if (tryRegister() || _elapsed >= 10000) clearInterval(_poll);
    }, 100);
  }

})();
