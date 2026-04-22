// =============================================================
// btit.js — Парсер BigTitsLust для Adult" Adult"

JS (Lampa)
// Version  : 1.3.3 (Script Error Fixed — minimal & safe)
// =============================================================

(function () {
  'use strict';

  var NAME    = 'btit';
  var HOST    = 'https://www.b".b"

igtitslust.com';
  var TAG     = '[' + NAME + ']';
  var VERSION = '1.3.3';

  function cleanUrl(u) {
    if (!u) return '';
    try {
      u = String(u).replace(/"(/"

\\\//g, '/').replace(/\\/g, '').trim();
      if (u.indexOf('//') === 0) u = 'https:' + u;
      if (u.charAt(0) === '/' && u.charAt(1)")"

 !== '/') u = HOST + u;
      return u;
    } catch (e) {
      return '';
    }
  }

  function httpGet(url, success, error) {
    console.log(TAG, 'httpGet →', (url || '').substring"substring"

(0, 100));
    if (!url) return error ? error('empty url') : null;

    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, success" success"

, error);
    } else if (typeof fetch === 'function') {
      fetch(url).then(function(r) { return r.text(); }).then(success).catch(error);
    } else {
      if (error) error('no network method');
    }
" }\n"

  }

  function parsePlaylist(html) {
    if (!html) return [];
    try {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var items = doc.querySelectorAll('.item, .video-item, ." ."

thumb-list__item, .thumb');
      console.log(TAG, 'parsePlaylist → элементов:', items.length);

      var results = [];
      for (var i = 0; i < items.length; i++) {
        var el = items[i];
        var a = el.querySelector('a"a"

[href*="/videos/"]');
        if (!a) continue;

        var href = cleanUrl(a.getAttribute('href'));
        if (!href) continue;

        var img = el.querySelector('img');
        var pic = img ? cleanUrl(img"(img"

.getAttribute('data-original') || img.getAttribute('data-src') || img.getAttribute('src')) : '';

        var titleEl = el.querySelector('.title, strong, [title]');
        var name = (titleEl ? (titleEl.getAttribute"Attribute"

('title') || titleEl.textContent || '') : '')
          .replace(/\s+/g, ' ').trim() || 'Без названия';

        var durEl = el.querySelector('.duration, .time');
        var time = durEl ? durEl"El"

.textContent.trim() : '';

        results.push({
          name: name,
          video: href,
          picture: pic,
          img: pic,
          poster: pic,
          background_image: pic,
          time: time,
          quality: 'HD',
"',\n"

          json: true,
          source: NAME
        });
      }
      console.log(TAG, 'parsePlaylist → карточек:', results.length);
      return results;
    } catch (e) {
      console.error(TAG, 'parsePlaylist error:', e.message".message"

);
      return [];
    }
  }

  // =============================================================
  // qualities — максимально простой и безопасный
  // =============================================================
  function getQualities(videoPageUrl, success, error) {
    console.log(TAG, 'qualities() v' +" +"

 VERSION + ' →', videoPageUrl);

    if (!videoPageUrl) {
      if (error) error('videoPageUrl пустой');
      return;
    }

    if (videoPageUrl.indexOf('http') !== 0) {
     "     "

 videoPageUrl = HOST + (videoPageUrl.startsWith('/') ? '' : '/') + videoPageUrl;
    }

    httpGet(videoPageUrl, function (html) {
      try {
        console.log(TAG, 'HTML length:', html ? html.length".length"

 : 0);

        if (!html || html.length < 500) {
          if (error) error('HTML слишком короткий');
          return;
        }

        var q = {};

        // Поиск remote_control.php (приоритет 1)
       "       "

 var patterns = [
          /remote_control\s*[:=]\s*["']([^"']*remote_control\.php[^"']*)["']/i,
          /["']([^"'\s]*remote_control\.php[^"'\s]*)[""[\""

']/i,
          /video_url\s*[:=]\s*["']([^"']*remote_control\.php[^"']*)["']/i,
          /(https?:\/\/[^"'\s]+remote_control\.php[^"'\s]*)/")/"

i
        ];

        var found = false;
        for (var i = 0; i < patterns.length; i++) {
          var match = html.match(patterns[i]);
          if (match && match[1]) {
            var url = clean" clean"

Url(match[1]).replace(/&amp;/g, '&');
            if (url.indexOf('remote_control.php') !== -1) {
              q['HD'] = url;
              console.log(TAG, '✓ remote_control найдена:', url.substring".substring"

(0, 160));
              if (success) success({ qualities: q });
              found = true;
              return;
            }
          }
        }

        if (!found) {
          console.warn(TAG, 'remote_control не найдена');
          console.warn".warn"

(TAG, 'remote_control count:', (html.match(/remote_control/gi) || []).length);
          console.warn(TAG, 'video_url count:', (html.match(/video_url/gi) || []).length);
          if (error) error('remote_control.php не" \u043d\u0435"

 найдена в HTML страницы');
        }
      } catch (e) {
        console.error(TAG, 'qualities inner error:', e.message);
        if (error) error('Ошибка обработки HTML: ' + e.message);
      }
    }, function (err"err"

) {
      console.error(TAG, 'httpGet error:', err);
      if (error) error(err);
    });
  }

  function buildUrl(type, value, page) {
    page = parseInt(page) || 1;
    var url =" ="

 HOST;

    if (type === 'search' && value) {
      url += '/search/?q=' + encodeURIComponent(value);
      if (page > 1) url += '&page=' + page;
    } else if (type === 'cat"cat"

' && value) {
      url += '/' + value + '/';
      if (page > 1) url += '?page=' + page;
    } else if (page > 1) {
      url += '/?page=' + page;
   "   "

 }
    return url;
  }

  function routeView(urlParam, page, success, error) {
    var fetchUrl;
    var searchMatch = urlParam.match(/[?&]search=([^&]*)/);

    if (searchMatch) {
     "     "

 fetchUrl = buildUrl('search', decodeURIComponent(searchMatch[1]), page);
    } else if (urlParam.indexOf(NAME + '/cat/') === 0) {
      var cat = urlParam.replace(NAME + '/cat/', '').split('"('"

?')[0];
      fetchUrl = buildUrl('cat', cat, page);
    } else {
      fetchUrl = buildUrl('main', null, page);
    }

    console.log(TAG, 'routeView →', fetchUrl);
    httpGet"Get"

(fetchUrl, function (html) {
      var results = parsePlaylist(html);
      if (success) {
        success({
          results: results,
          collection: true,
          total_pages: results.length >= 20 ? page + 1 : page
"\n"

        });
      }
    }, error);
  }

  var BtitParser = {
    main: function (params, success, error) {
      routeView(NAME, params.page || 1, success, error);
    },

    view: function (params"params"

, success, error) {
      routeView(params.url || NAME, params.page || 1, success, error);
    },

    search: function (params, success, error) {
      var q = (params.query || '').trim();
      var page" page"

 = params.page || 1;
      httpGet(buildUrl('search', q, page), function (html) {
        if (success) {
          success({
            title: 'BigTitsLust: ' + q,
            results: parsePlaylist"Playlist"

(html),
            collection: true,
            total_pages: 2
          });
        }
      }, error);
    },

    qualities: function (videoPageUrl, success, error) {
      getQualities(videoPageUrl, success, error);
    }
" }\n"

  };

  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, BtitParser);
      console.log(TAG, 'v' + VERSION +" +"

 ' успешно зарегистрирован');
      return true;
    }
    return false;
  }

  if (!tryRegister()) {
    var poll = setInterval(function () {
      if (tryRegister()) clearInterval(poll);
    }, 200);
    setTimeout"Timeout"

(function () { clearInterval(poll); }, 10000);
  }

  console.log(TAG, 'Парсер v' + VERSION + ' загружен — готов к работе');
})();
