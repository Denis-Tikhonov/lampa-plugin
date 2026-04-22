(function () {
  'use strict';

  var NAME    = 'trahkino';
  var VERSION = '2.1.0';
  var TAG     = '[TRH v' + VERSION + ']';
  var HOST    = 'https://trahkino.me';
  var PROXY   = 'https://zonaproxy.777b737.workers.dev/?url=';

  /* ── утилиты ───────────────────────────────────────────────── */

  function encode(url) { return PROXY + encodeURIComponent(url); }

  function req(url, ok, fail, opts) {
    opts = opts || {};
    var xhr = new XMLHttpRequest();
    xhr.open(opts.method || 'GET', url, true);
    xhr.responseType = opts.type || 'text';
    xhr.timeout = opts.timeout || 15000;
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 400) ok(xhr.response);
      else fail('HTTP ' + xhr.status + ' → ' + url);
    };
    xhr.onerror   = function () { fail('network error: ' + url); };
    xhr.ontimeout = function () { fail('timeout: ' + url); };
    xhr.send();
  }

  /* ── парсинг карточек ──────────────────────────────────────── */

  var CARD_SEL = [
    '.item',
    '.video-item',
    '.thumb',
    'article',
    '.item-video'
  ];

  function parseCards(html) {
    var doc = (new DOMParser()).parseFromString(html, 'text/html');
    var items = [];

    for (var s = 0; s < CARD_SEL.length; s++) {
      var nodes = doc.querySelectorAll(CARD_SEL[s]);
      if (!nodes.length) continue;

      nodes.forEach(function (node) {
        var a    = node.querySelector('a[href*="/video/"]') || node.closest('a') || node.querySelector('a');
        var img  = node.querySelector('img');
        var span = node.querySelector('.title, .item-title, h3, h2');
        if (!a) return;

        var href = a.getAttribute('href') || '';
        if (!href.match(/\/video\/\d+/)) return;
        var url = href.startsWith('http') ? href : HOST + href;

        items.push({
          url   : url,
          title : (span ? span.textContent.trim() : (a.getAttribute('title') || a.textContent.trim())) || 'Video',
          poster: img ? (img.getAttribute('data-src') || img.getAttribute('src') || '') : '',
          type  : 'video'
        });
      });

      if (items.length) break;
    }
    return items;
  }

  /* ── извлечение качеств ────────────────────────────────────── */

  /**
   * Со страницы видео получаем свежие get_file URLs из kt_player,
   * затем следуем 302 → получаем финальный CDN URL (tkvids.com).
   *
   * kt_player в HTML выглядит так:
   *   video_url: '/get_file/36/{hash}/{block}/{id}/{id}.mp4/'
   *   video_url_2: '/get_file/36/{hash2}/{block}/{id}/{id}_360p.mp4/'
   * или через license_code (base64).
   */

  // Regex для прямых video_url полей
  var RE_VURL  = /video_url\s*[:=]\s*['"]([^'"]+get_file[^'"]+)['"]/gi;
  // Regex для license_code (base64 → decode → get_file)
  var RE_LC    = /license_code\s*[:=]\s*['"]([A-Za-z0-9+/=]{20,})['"]/gi;
  // Regex для get_file внутри function/0/ обёртки
  var RE_FN0   = /function\/0\/(https?:\/\/[^'"&\s]+get_file[^'"&\s]+)/gi;

  function decodeB64Safe(str) {
    try { return atob(str); } catch (e) { return ''; }
  }

  function extractGetFileUrls(html) {
    var urls = [];
    var seen = {};
    var m;

    // 1. прямые video_url
    RE_VURL.lastIndex = 0;
    while ((m = RE_VURL.exec(html)) !== null) {
      var u = m[1].trim();
      if (!u.startsWith('http')) u = HOST + u;
      if (!seen[u]) { seen[u] = 1; urls.push(u); }
    }

    // 2. function/0/ обёртка
    RE_FN0.lastIndex = 0;
    while ((m = RE_FN0.exec(html)) !== null) {
      var u2 = m[1].trim();
      if (!seen[u2]) { seen[u2] = 1; urls.push(u2); }
    }

    // 3. license_code → base64 decode → ищем get_file
    RE_LC.lastIndex = 0;
    while ((m = RE_LC.exec(html)) !== null) {
      var decoded = decodeB64Safe(m[1]);
      if (!decoded) continue;
      var inner = decoded.match(/\/get_file\/[^\s'"]+/g);
      if (!inner) continue;
      inner.forEach(function (path) {
        var u3 = HOST + path;
        if (!seen[u3]) { seen[u3] = 1; urls.push(u3); }
      });
    }

    return urls;
  }

  /**
   * Определяем качество из URL по суффиксу файла
   */
  function qualityFromUrl(url) {
    var m = url.match(/_(\d{3,4})p\.mp4/);
    if (m) return m[1] + 'p';
    if (url.match(/\.mp4/) && !url.match(/_\d+p/)) return '240p'; // базовый
    return 'auto';
  }

  /**
   * Для каждого get_file URL делаем HEAD-запрос через прокси,
   * чтобы проследить 302 и получить Location (CDN URL).
   * Прокси zonaproxy должен делать redirect follow и
   * возвращать X-Final-Url или просто финальный URL.
   *
   * Если прокси не раскрывает финальный URL через заголовок,
   * используем get_file напрямую как source — он сам выдаст видео
   * через 302 браузеру (Lampa умеет следовать редиректам при воспроизведении).
   */
  function resolveGetFile(getFileUrl, cb) {
    // Пробуем получить финальный CDN через прокси с follow
    var proxyUrl = encode(getFileUrl);

    var xhr = new XMLHttpRequest();
    xhr.open('HEAD', proxyUrl, true);
    xhr.timeout = 10000;
    xhr.onload = function () {
      // Смотрим заголовки на предмет финального URL
      var finalUrl =
        xhr.getResponseHeader('x-final-url') ||
        xhr.getResponseHeader('x-resolved-url') ||
        xhr.getResponseHeader('location') ||
        null;

      if (finalUrl && finalUrl.indexOf('tkvids.com') !== -1) {
        cb(finalUrl);
      } else if (xhr.status === 206 || xhr.status === 200) {
        // Прокси уже стримит — значит он разрезолвил, отдаём proxyUrl
        cb(proxyUrl);
      } else {
        // Отдаём get_file напрямую — Lampa/плеер сам пройдёт 302
        cb(getFileUrl);
      }
    };
    xhr.onerror = xhr.ontimeout = function () { cb(getFileUrl); };
    xhr.send();
  }

  function extractQualities(videoPageUrl, success, error) {
    console.log(TAG, 'qualities for', videoPageUrl);

    req(encode(videoPageUrl), function (html) {
      var getFileUrls = extractGetFileUrls(html);
      console.log(TAG, 'found get_file URLs:', getFileUrls.length, getFileUrls);

      if (!getFileUrls.length) {
        return error(TAG + ' не найдены video_url на странице ' + videoPageUrl);
      }

      // Резолвим все URL параллельно
      var results = [];
      var done    = 0;

      getFileUrls.forEach(function (gfUrl, idx) {
        resolveGetFile(gfUrl, function (finalUrl) {
          var quality = qualityFromUrl(gfUrl);
          results[idx] = { quality: quality, url: finalUrl };
          done++;
          if (done === getFileUrls.length) {
            // Убираем дубли по url
            var seen  = {};
            var quals = [];
            results.forEach(function (r) {
              if (r && !seen[r.url]) {
                seen[r.url] = 1;
                quals.push(r);
              }
            });
            // Сортируем по убыванию качества
            quals.sort(function (a, b) {
              return (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0);
            });
            console.log(TAG, 'resolved qualities:', quals);
            success(quals);
          }
        });
      });
    }, error);
  }

  /* ── главная и поиск ───────────────────────────────────────── */

  function buildUrl(type, query, page) {
    page = page || 1;
    if (type === 'main')   return encode(HOST + '/latest-updates/');
    if (type === 'search') return encode(HOST + '/?s=' + encodeURIComponent(query) + '&from_videos=' + ((page - 1) * 24));
    return encode(HOST + '/latest-updates/');
  }

  /* ── регистрация ───────────────────────────────────────────── */

  var TrhParser = {
    home: function (params, success, error) {
      req(buildUrl('main'), function (html) {
        success({ title: 'TrahKino', results: parseCards(html), collection: true });
      }, error);
    },

    search: function (params, success, error) {
      var query = (params.query || '').trim();
      if (!query) return error('Пустой запрос');
      req(buildUrl('search', query, 1), function (html) {
        success({ title: 'TrahKino: ' + query, results: parseCards(html), collection: true, total_pages: 3 });
      }, error);
    },

    qualities: function (videoPageUrl, success, error) {
      extractQualities(videoPageUrl, success, error);
    }
  };

  function register() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, TrhParser);
      console.log(TAG, 'v' + VERSION + ' зарегистрирован');
      return true;
    }
    return false;
  }

  if (!register()) {
    var iv = setInterval(function () { if (register()) clearInterval(iv); }, 350);
    setTimeout(function () { clearInterval(iv); }, 10000);
  }
})();
