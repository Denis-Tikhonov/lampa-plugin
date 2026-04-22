// =============================================================
// btit.js — Парсер BigTitsLust для AdultJS (Lampa)
// Version  : 1.3.0 (Final Fix — remote_control.php priority)
// =============================================================

(function () {
  'use strict';

  var NAME = 'btit';
  var HOST = 'https://www.bigtitslust.com';
  var TAG  = '[' + NAME + ']';
  var VERSION = '1.3.0';

  // =============================================================
  // Вспомогательные функции
  // =============================================================
  function cleanUrl(u) {
    if (!u) return '';
    u = u.replace(/\\\//g, '/').replace(/\\/g, '').trim();
    if (u.indexOf('//') === 0) u = 'https:' + u;
    if (u.charAt(0) === '/' && u.charAt(1) !== '/') u = HOST + u;
    return u;
  }

  function getWorkerBase() {
    var base = (window.AdultPlugin && window.AdultPlugin.workerUrl) || 'https://zonaproxy.777b737.workers.dev/?url=';
    return base.replace(/[/?&]url=?$/, '').replace(/\/+$/, '');
  }

  function httpGet(url, success, error) {
    console.log(TAG, 'httpGet →', url.substring(0, 120));
    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, success, error);
    } else {
      fetch(url).then(r => r.text()).then(success).catch(error);
    }
  }

  // =============================================================
  // Парсинг карточек (каталог, поиск, категории)
  // =============================================================
  function parsePlaylist(html) {
    if (!html) return [];
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var items = doc.querySelectorAll('.item, .video-item, .thumb-list__item, .thumb');
    console.log(TAG, 'parsePlaylist → найдено элементов:', items.length);

    var results = [];
    items.forEach(function (el) {
      var a = el.querySelector('a[href*="/videos/"]');
      if (!a) return;

      var href = cleanUrl(a.getAttribute('href'));
      if (!href) return;

      var img = el.querySelector('img');
      var pic = img ? cleanUrl(img.getAttribute('data-original') || img.getAttribute('data-src') || img.getAttribute('src')) : '';

      var titleEl = el.querySelector('.title, strong, [title]');
      var name = (titleEl ? (titleEl.getAttribute('title') || titleEl.textContent) : a.textContent || '')
        .replace(/\s+/g, ' ').trim() || 'Без названия';

      var durEl = el.querySelector('.duration, .time');
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
    });

    console.log(TAG, 'parsePlaylist → карточек готово:', results.length);
    return results;
  }

  // =============================================================
  // Извлечение качества — ГЛАВНЫЙ ФИКС
  // =============================================================
  function extractQualities(html, videoPageUrl, success, error) {
    console.log(TAG, 'extractQualities → длина HTML:', html.length);

    // Диагностика
    console.log(TAG, 'remote_control matches:', (html.match(/remote_control/gi) || []).length);
    console.log(TAG, 'video_url matches:', (html.match(/video_url/gi) || []).length);
    console.log(TAG, 'get_file matches:', (html.match(/get_file/gi) || []).length);

    var q = {};

    // === Приоритет 1: remote_control.php (рабочая ссылка) ===
    var rcPatterns = [
      /remote_control\s*[:=]\s*['"]([^'"]*remote_control\.php[^'"]*)['"]/i,
      /(https?:\/\/[^"'\s]+remote_control\.php[^"'\s]*)/i,
      /video_url\s*[:=]\s*['"]([^'"]*remote_control\.php[^'"]*)['"]/i
    ];

    for (var i = 0; i < rcPatterns.length; i++) {
      var match = html.match(rcPatterns[i]);
      if (match && match[1]) {
        var url = cleanUrl(match[1]).replace(/&amp;/g, '&');
        if (url.indexOf('remote_control.php') !== -1) {
          q['HD'] = url; // или '1080p' — сервер сам отдаёт лучшее
          console.log(TAG, '✓ Найдена рабочая remote_control ссылка:', url.substring(0, 150));
          success({ qualities: q });
          return;
        }
      }
    }

    // === Приоритет 2: Fallback через Worker /resolve-page ===
    console.log(TAG, 'remote_control не найден → используем Worker resolve-page');
    var resolveUrl = getWorkerBase() + '/resolve-page?url=' + encodeURIComponent(videoPageUrl);

    httpGet(resolveUrl, function (text) {
      try {
        var data = JSON.parse(text);
        if (data.final && data.final.indexOf('.mp4') !== -1) {
          // Если Worker всё-таки вернул get_file — он обычно 410, но оставляем как fallback
          q['HD'] = data.final;
          console.log(TAG, 'Worker вернул final:', data.final.substring(0, 100));
          success({ qualities: q });
        } else {
          error('Worker не вернул валидную ссылку');
        }
      } catch (e) {
        error('JSON parse error в resolve-page: ' + e.message);
      }
    }, error);
  }

  // =============================================================
  // Роутинг и меню
  // =============================================================
  function buildUrl(type, value, page) {
    page = parseInt(page) || 1;
    var url = HOST;

    if (" ("

type === 'search' && value) {
      url += '/search/?q=' + encodeURIComponent(value);
      if (page > 1) url += '&page=' + page;
    } else if (type === 'cat' && value) {
" {\n"

      url += '/' + value + '/';
      if (page > 1) url += '?page=' + page;
    } else if (page > 1) {
      url += '/?page=' + page;
    }
    return url;
";\n"

  }

  function routeView(url, page, success, error) {
    var fetchUrl;
    var searchMatch = url.match(/[?&]search=([^&]*)/);

    if (searchMatch) {
      fetchUrl = buildUrl('search"search"

', decodeURIComponent(searchMatch[1]), page);
    } else if (url.indexOf(NAME + '/cat/') === 0) {
      var cat = url.replace(NAME + '/cat/', '').split('?')[0];
      fetchUrl = build" build"

Url('cat', cat, page);
    } else {
      fetchUrl = buildUrl('main', null, page);
    }

    console.log(TAG, 'routeView →', fetchUrl);
    httpGet(fetchUrl, function (html) {
     "     "

 var results = parsePlaylist(html);
      success({
        results: results,
        collection: true,
        total_pages: results.length >= 20 ? page + 1 : page,
        menu: [{ title: '🔍 Поиск', search_on: true" true"

, playlist_url: NAME }]
      });
    }, error);
  }

  // =============================================================
  // Публичный API парсера
  // =============================================================
  var BtitParser = {
    main: function (params, success, error) {
     "     "

 routeView(NAME, params.page || 1, success, error);
    },

    view: function (params, success, error) {
      routeView(params.url || NAME, params.page || 1, success, error);
    },

    search: function" function"

 (params, success, error) {
      var q = (params.query || '').trim();
      var page = params.page || 1;
      httpGet(buildUrl('search', q, page), function (html) {
        success({
          title:":"

 'BigTitsLust: ' + q,
          results: parsePlaylist(html),
          collection: true,
          total_pages: 2
        });
      }, error);
    },

    qualities: function (videoPageUrl, success, error) {
" {\n"

      console.log(TAG, 'qualities() v' + VERSION + ' →', videoPageUrl);
      if (!videoPageUrl || videoPageUrl.indexOf('http') !== 0) {
        videoPageUrl = HOST + (videoPageUrl"Url"

.startsWith('/') ? '' : '/') + videoPageUrl;
      }

      httpGet(videoPageUrl, function (html) {
        extractQualities(html, videoPageUrl, success, error);
      }, error);
    }
  };

  // =============================================================
"\n"

  // Регистрация
  // =============================================================
  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, BtitParser);
      console" console"

.log(TAG, 'v' + VERSION + ' успешно зарегистрирован');
      return true;
    }
    return false;
  }

  if (!tryRegister()) {
    var poll = setInterval(function () {
      if (tryRegister()) clearInterval(poll"oll"

);
    }, 200);
    setTimeout(function () { clearInterval(poll); }, 8000);
  }

  console.log(TAG, 'Парсер загружен (версия ' + VERSION + ')');
})();
