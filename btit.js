// =============================================================
// btit.js — Парсер BigTitsLust для AdultJS (Lampa)
// Version  : 1.3.1 (Script Error Fixed + remote_control priority)
// =============================================================

(function () {
  'use strict';

  var NAME    = 'btit';
  var HOST    = 'https://www.bigtitslust.com';
  var TAG     = '[' + NAME + ']';
  var VERSION = '1.3.1';

  // =============================================================
  // Вспомогательные функции
  // =============================================================
  function cleanUrl(u) {
    if (!u) return '';
    u = String(u).replace(/\\\//g, '/').replace(/\\/g, '').trim();
    if (u.indexOf('//') === 0) u = 'https:' + u;
    if (u.charAt(0) === '/' && u.charAt(1) !== '/') u = HOST + u;
    return u;
  }

  function getWorkerBase() {
    var base = (window.AdultPlugin && window.AdultPlugin.workerUrl) 
      ? window.AdultPlugin.workerUrl 
      : 'https://zonaproxy.777b737.workers.dev/?url=';
    return base.replace(/[/?&]url=?$/, '').replace(/\/+$/, '');
  }

  function httpGet(url, success, error) {
    console.log(TAG, 'httpGet →', url.substring(0, 100));
    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, success, error);
    } else if (typeof fetch === 'function') {
      fetch(url).then(r => r.text()).then(success).catch(error);
    } else {
      error('Network methods not available');
    }
  }

  // =============================================================
  // Парсинг карточек
  // =============================================================
  function parsePlaylist(html) {
    if (!html) return [];
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var items = doc.querySelectorAll('.item, .video-item, .thumb-list__item, .thumb');
    console.log(TAG, 'parsePlaylist → элементов:', items.length);

    var results = [];
    items.forEach(function (el) {
      var a = el.querySelector('a[href*="/videos/"]');
      if (!a) return;

      var href = cleanUrl(a.getAttribute('href'));
      if (!href) return;

      var img = el.querySelector('img');
      var pic = img ? cleanUrl(img.getAttribute('data-original') || img.getAttribute('data-src') || img.getAttribute('src')) : '';

      var titleEl = el.querySelector('.title, strong, [title]');
      var name = (titleEl ? (titleEl.getAttribute('title') || titleEl.textContent || '') : '')
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

    console.log(TAG, 'parsePlaylist → карточек:', results.length);
    return results;
  }

  // =============================================================
  // qualities — главный метод (исправлен)
  // =============================================================
  function extractQualities(html, videoPageUrl, success, error) {
    console.log(TAG, 'extractQualities → HTML length:', html ? html.length : 0);

    if (!html || html.length < 500) {
      error('HTML страницы видео слишком короткий');
      return;
    }

    var q = {};

    // Приоритет 1: ищем remote_control.php (самый надёжный способ)
    var rcPatterns = [
      /remote_control\s*[:=]\s*["']([^"']*remote_control\.php[^"']*)["']/i,
      /["']([^"']*remote_control\.php[^"'\s]*)["']/i,
      /video_url\s*[:=]\s*["']([^"']*remote_control\.php[^"']*)["']/i
    ];

    for (var i = 0; i < rcPatterns.length; i++) {
      var match = html.match(rcPatterns[i]);
      if (match && match[1]) {
        var url = cleanUrl(match[1]).replace(/&amp;/g, '&');
        if (url.indexOf('remote_control.php') !== -1) {
          q['HD'] = url;
          console.log(TAG, '✓ НАЙДЕНА remote_control.php:', url.substring(0, 180));
          success({ qualities: q });
          return;
        }
      }
    }

    console.log(TAG, 'remote_control не найден в HTML → fallback на Worker /resolve-page');

    // Приоритет 2: Worker
    var resolveUrl = getWorkerBase() + '/resolve-page?url=' + encodeURIComponent(videoPageUrl);

    httpGet(resolveUrl, function (text) {
      try {
        var data = JSON.parse(text);
        if (data && data.final) {
          q['HD'] = data.final;
          console.log(TAG, 'Worker вернул final:', data.final.substring(0, 120));
          success({ qualities: q });
        } else {
          error('Worker не вернул валидную ссылку на видео');
        }
      } catch (e) {
        console.error(TAG, 'JSON parse error:', e.message);
        error('Ошибка разбора ответа Worker');
      }
    }, function (err) {
      console.error(TAG, 'resolve-page error:', err);
      error('Не удалось связаться с Worker');
    });
  }

  // =============================================================
  // Роутинг
  // =============================================================
  function buildUrl(type, value, page) {
    page = parseInt(page) || 1;
    var url = HOST;

    if (type === 'search' && value) {
      url += '/search/?q=' + encodeURIComponent(value);
      if (page > 1) url += '&page=' + page;
    } else if (type === 'cat' && value) {
      url += '/' + value + '/';
      if (page > 1) url += '?page=' + page;
    } else if (page > 1) {
      url += '/?page=' + page;
    }
    return url;
  }

  function routeView(urlParam, page, success, error) {
    var fetchUrl;
    var searchMatch = urlParam.match(/[?&]search=([^&]*)/);

    if (searchMatch) {
      fetchUrl = buildUrl('search', decodeURIComponent(searchMatch[1]), page);
    } else if (urlParam.indexOf(NAME + '/cat/') === 0) {
      var cat = urlParam.replace(NAME + '/cat/', '').split('?')[0];
      fetchUrl = buildUrl('cat', cat, page);
    } else {
      fetchUrl = buildUrl('main', null, page);
    }

    console.log(TAG, 'routeView →', fetchUrl);
    httpGet(fetchUrl, function (html) {
      var results = parsePlaylist(html);
      if (results.length === 0) {
        error('Карточки не найдены');
        return;
      }
      success({
        results: results,
        collection: true,
        total_pages: results.length >= 20 ? page + 1 : page
      });
    }, error);
  }

  // =============================================================
  // Публичный интерфейс парсера
  // =============================================================
  var BtitParser = {
    main: function (params, success, error) {
      routeView(NAME, params.page || 1, success, error);
    },

    view: function (params, success, error) {
      routeView(params.url || NAME, params.page || 1, success, error);
    },

    search: function (params, success, error) {
      var q = (params.query || '').trim();
      var page = params.page || 1;
      httpGet(buildUrl('search', q, page), function (html) {
        success({
          title: 'BigTitsLust: ' + q,
          results: parsePlaylist(html),
          collection: true,
          total_pages: 2
        });
      }, error);
    },

    qualities: function (videoPageUrl, success, error) {
      console.log(TAG, 'qualities() v' + VERSION + ' →', videoPageUrl);

      if (!videoPageUrl) {
        error('videoPageUrl пустой');
        return;
      }
      if (videoPageUrl.indexOf('http') !== 0) {
        videoPageUrl = HOST + (videoPageUrl.startsWith('/') ? '' : '/') + videoPageUrl;
      }

      httpGet(videoPageUrl, function (html) {
        extractQualities(html, videoPageUrl, success, error);
      }, error);
    }
  };

  // =============================================================
  // Регистрация
  // =============================================================
  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, BtitParser);
      console.log(TAG, 'v' + VERSION + ' успешно зарегистрирован в AdultJS');
      return true;
    }
    return false;
  }

  if (!tryRegister()) {
    var poll = setInterval(function () {
      if (tryRegister()) clearInterval(poll);
    }, 200);
    setTimeout(function () { clearInterval(poll); }, 8000);
  }

  console.log(TAG, 'Парсер загружен (версия ' + VERSION + ') — готов к работе');
})();
