// =============================================================
// hdtub.js — HDtube Parser для AdultJS (Lampa)
// =============================================================
// Версия  : 1.7.0
// Изменения:
//   [1.7.0] ФИНАЛЬНЫЙ FIX воспроизведения на основе анализа рабочей ссылки:
//
//   Рабочая ссылка (из Network tab):
//     https://nvms3.cdn.privatehost.com/3000/3913/3913_720p.mp4
//       ?sign=19b966064825ca35fa458548d5c5d709&exp_time=...&tag=hdtube.porn
//
//   Вывод:
//   - function/0/ это серверный REDIRECT RESOLVER на hdtube.porn
//   - Сервер принимает запрос → возвращает 302 → signed CDN URL
//   - Worker (redirect:'follow') проходит 302 → получает видеопоток
//   - decode алгоритм kt_player (v1.6.0) был неверным путём
//
//   Новая логика getProxyUrl():
//   1. video_url = 'function/0/https://host/get_file/...'
//   2. Строим абсолютный URL: HOST + '/function/0/https://...'
//      или берём как есть если уже абсолютный
//   3. Оборачиваем в Worker: WORKER/?url=encodeURIComponent(absoluteUrl)
//   4. Worker → 302 follow → nvms*.cdn.privatehost.com/...?sign=... → видео ✅
//
//   W137 whitelist: добавить cdn.privatehost.com (см. W137.js v1.4.0)
//
//   Сравнение версий:
//   v1.3.0  cleanUrl срезал function/0/ → get_file напрямую → 403
//   v1.4.0  CHAD: decode kt_player → неверный путь, CDN signed URL не получить
//   v1.5.x  Worker проксировал get_file (после decode) → 404 (hash нерасшифрован)
//   v1.6.0  ktDecodeUrl → математически верно, но CDN ссылка другая (nvms CDN)
//   v1.7.0  Worker проксирует function/0/ → redirect:follow → signed CDN URL ✅
// =============================================================

(function () {
  'use strict';

  var VERSION    = '1.7.0';
  var NAME       = 'hdtub';
  var HOST       = 'https://www.hdtube.porn';
  var TAG        = '[hdtub]';

  // Worker URL — тот же что в W137.js (без trailing /)
  // W137 v1.4.0 должен иметь cdn.privatehost.com в whitelist
  var WORKER_URL = 'https://zonaproxy.777b737.workers.dev';

  var CATEGORIES = [
    { title: 'Amateur',            slug: 'amateur'            },
    { title: 'Anal',               slug: 'anal'               },
    { title: 'Asian',              slug: 'asian'              },
    { title: 'Babe',               slug: 'babe'               },
    { title: 'BBW',                slug: 'bbw'                },
    { title: 'BDSM',               slug: 'bdsm'               },
    { title: 'Big Ass',            slug: 'big-ass'            },
    { title: 'Big Cock',           slug: 'big-cock'           },
    { title: 'Big Tits',           slug: 'big-tits'           },
    { title: 'Bisexual',           slug: 'bisexual'           },
    { title: 'Black',              slug: 'black'              },
    { title: 'Blonde',             slug: 'blonde'             },
    { title: 'Blowjob',            slug: 'blowjob'            },
    { title: 'Bondage',            slug: 'bondage'            },
    { title: 'Brunette',           slug: 'brunette'           },
    { title: 'Close Up',           slug: 'close-up'           },
    { title: 'College',            slug: 'college'            },
    { title: 'Creampie',           slug: 'creampie'           },
    { title: 'Cuckold',            slug: 'cuckold'            },
    { title: 'Cumshot',            slug: 'cumshot'            },
    { title: 'Doggystyle',         slug: 'doggystyle'         },
    { title: 'Double Penetration', slug: 'double-penetration' },
    { title: 'Ebony',              slug: 'ebony'              },
    { title: 'Erotic',             slug: 'erotic'             },
    { title: 'Facial',             slug: 'facial'             },
    { title: 'Femdom',             slug: 'femdom'             },
    { title: 'Fetish',             slug: 'fetish'             },
    { title: 'Fingering',          slug: 'fingering'          },
    { title: 'Fisting',            slug: 'fisting'            },
    { title: 'Gangbang',           slug: 'gangbang'           },
    { title: 'Gloryhole',          slug: 'gloryhole'          },
    { title: 'Granny',             slug: 'granny'             },
    { title: 'Group',              slug: 'group'              },
    { title: 'Hairy',              slug: 'hairy'              },
    { title: 'Handjob',            slug: 'handjob'            },
    { title: 'Hardcore',           slug: 'hardcore'           },
    { title: 'Homemade',           slug: 'homemade'           },
    { title: 'Indian',             slug: 'indian'             },
    { title: 'Interracial',        slug: 'interracial'        },
    { title: 'Japanese',           slug: 'japanese'           },
    { title: 'Latina',             slug: 'latina'             },
    { title: 'Lesbian',            slug: 'lesbian'            },
    { title: 'Lingerie',           slug: 'lingerie'           },
    { title: 'Massage',            slug: 'massage'            },
    { title: 'Masturbation',       slug: 'masturbation'       },
    { title: 'Mature',             slug: 'mature'             },
    { title: 'MILF',               slug: 'milf'               },
    { title: 'Natural',            slug: 'natural'            },
    { title: 'Orgy',               slug: 'orgy'               },
    { title: 'Outdoor',            slug: 'outdoor'            },
    { title: 'Party',              slug: 'party'              },
    { title: 'Petite',             slug: 'petite'             },
    { title: 'Pissing',            slug: 'pissing'            },
    { title: 'Pornstar',           slug: 'pornstar'           },
    { title: 'POV',                slug: 'pov'                },
    { title: 'Public',             slug: 'public'             },
    { title: 'Pussy Licking',      slug: 'pussy-licking'      },
    { title: 'Reality',            slug: 'reality'            },
    { title: 'Redhead',            slug: 'redhead'            },
    { title: 'Russian',            slug: 'russian'            },
    { title: 'Schoolgirl',         slug: 'schoolgirl'         },
    { title: 'Shaved',             slug: 'shaved'             },
    { title: 'Shemale',            slug: 'shemale'            },
    { title: 'Small Tits',         slug: 'small-tits'         },
    { title: 'Solo',               slug: 'solo'               },
    { title: 'Spanking',           slug: 'spanking'           },
    { title: 'Squirting',          slug: 'squirting'          },
    { title: 'Stockings',          slug: 'stockings'          },
    { title: 'Striptease',         slug: 'striptease'         },
    { title: 'Teen (18+)',         slug: 'teen'               },
    { title: 'Threesome',          slug: 'threesome'          },
    { title: 'Toys',               slug: 'toys'               },
    { title: 'Uniform',            slug: 'uniform'            },
    { title: 'Vintage',            slug: 'vintage'            },
    { title: 'Webcam',             slug: 'webcam'             },
  ];

  // ----------------------------------------------------------
  // ТРАНСПОРТ — для загрузки HTML страниц (не для видео)
  // ----------------------------------------------------------
  function httpGet(url, success, error) {
    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, success, error);
    } else {
      fetch(url)
        .then(function (r) { return r.text(); })
        .then(success)
        .catch(error);
    }
  }

  // ----------------------------------------------------------
  // getWorkerBase() — Worker URL без trailing /
  // ----------------------------------------------------------
  function getWorkerBase() {
    var base = WORKER_URL;
    if (window.AdultPlugin && window.AdultPlugin.workerUrl) {
      base = window.AdultPlugin.workerUrl;
    }
    // Убираем trailing / и ?url= если уже есть
    return base.replace(/[/?&]url=?$/, '').replace(/\/+$/, '');
  }

  // ----------------------------------------------------------
  // getProxyUrl(rawVideoUrl)
  //
  // ИДЕЯ (из анализа рабочей ссылки + CHAD v1.4.0):
  //   Не расшифровываем hash — передаём function/0/ URL в Worker.
  //   Worker выполняет redirect:follow → hdtube.porn/function/0/...
  //   → 302 → nvms*.cdn.privatehost.com/...?sign=... → видеопоток.
  //
  // Входные форматы video_url из flashvars:
  //   A) относительный: 'function/0/https://host/get_file/...'
  //   B) абсолютный:    'https://host/function/0/https://...'
  //
  // В обоих случаях строим абсолютный function/0/ URL и оборачиваем в Worker.
  // ----------------------------------------------------------
  function getProxyUrl(rawVideoUrl) {
    if (!rawVideoUrl) return '';
    var u = rawVideoUrl.replace(/\\/g, '').trim();

    // Нормализуем до абсолютного function/0/ URL
    var absoluteFunc;

    // Форма A: относительный "function/0/https://..."
    if (u.match(/^function\/\d+\//)) {
      absoluteFunc = HOST + '/' + u;
    }
    // Форма B: уже абсолютный "https://host/function/0/..."
    else if (u.match(/^https?:\/\/[^/]+\/function\/\d+\//)) {
      absoluteFunc = u;
    }
    // Форма C: уже прямой URL (без function/) — без Worker
    else if (u.indexOf('http') === 0) {
      console.log(TAG, 'getProxyUrl: прямой URL, Worker не нужен');
      return u;
    }
    // Форма D: protocol-relative или root-relative
    else {
      if (u.indexOf('//') === 0) u = 'https:' + u;
      if (u.charAt(0) === '/')   u = HOST + u;
      absoluteFunc = u;
    }

    var proxied = getWorkerBase() + '/?url=' + encodeURIComponent(absoluteFunc);
    console.log(TAG, 'getProxyUrl:', absoluteFunc.substring(0, 80), '→ Worker');
    return proxied;
  }

  // ----------------------------------------------------------
  // cleanUrl — только для обычных (не видео) URL: постеры, страницы
  // ----------------------------------------------------------
  function cleanUrl(raw) {
    if (!raw) return '';
    var u = raw.replace(/\\/g, '').trim();
    if (u.indexOf('//') === 0)                      u = 'https:' + u;
    if (u.charAt(0) === '/' && u.charAt(1) !== '/') u = HOST + u;
    return u;
  }

  // ----------------------------------------------------------
  // ПАРСИНГ КАТАЛОГА
  // Архитектура v1.3.0: DOMParser + '.item' selector (JSON подтверждён)
  // ----------------------------------------------------------
  function parsePlaylist(html) {
    var results = [];
    var doc     = new DOMParser().parseFromString(html, 'text/html');
    var items   = doc.querySelectorAll('.item');
    console.log(TAG, 'parsePlaylist → .item:', items.length);

    for (var i = 0; i < items.length; i++) {
      var el     = items[i];
      var linkEl = el.querySelector('a[href]');
      if (!linkEl) continue;

      var href = cleanUrl(linkEl.getAttribute('href') || '');
      if (!href) continue;

      var imgEl = el.querySelector('img');
      var pic   = imgEl
        ? cleanUrl(imgEl.getAttribute('data-src') || imgEl.getAttribute('src') || '')
        : '';

      var titleEl = el.querySelector('a[title]');
      var name    = (titleEl
        ? (titleEl.getAttribute('title') || titleEl.textContent)
        : (linkEl.getAttribute('title')  || linkEl.textContent)
      ).replace(/\s+/g, ' ').trim() || 'Video';

      results.push({
        name: name, video: href,
        picture: pic, img: pic, poster: pic, background_image: pic,
        time: '', quality: 'HD', json: true, source: NAME,
      });
    }

    console.log(TAG, 'parsePlaylist → карточек:', results.length);
    return results;
  }

  // ----------------------------------------------------------
  // ИЗВЛЕЧЕНИЕ КАЧЕСТВ
  //
  // Архитектура: VIDEO_RULES из CHAD v1.4.0 (чистый список правил)
  // + getProxyUrl() из новой идеи вместо cleanUrl/ktDecodeUrl
  //
  // VIDEO_RULES: приоритет — video_alt_url (720p) → video_url (480p)
  // Лейбл уточняется по суффиксу имени файла в raw URL
  // ----------------------------------------------------------
  var VIDEO_RULES = [
    { re: /video_alt_url\s*[:=]\s*['"]([^'"]+)['"]/,  defaultLabel: '720p' },
    { re: /video_url\s*[:=]\s*['"]([^'"]+)['"]/,      defaultLabel: '480p' },
  ];

  function extractQualities(html) {
    var q = {};

    VIDEO_RULES.forEach(function (rule) {
      var m = html.match(rule.re);
      if (!m || !m[1]) return;
      var rawUrl = m[1].trim();

      // Уточняем лейбл по суффиксу файла
      var label = rule.defaultLabel;
      if      (rawUrl.indexOf('_1080p') !== -1) label = '1080p';
      else if (rawUrl.indexOf('_720p')  !== -1) label = '720p';
      else if (rawUrl.indexOf('_480p')  !== -1) label = '480p';
      else if (rawUrl.indexOf('_360p')  !== -1) label = '360p';
      else if (rawUrl.indexOf('_240p')  !== -1) label = '240p';

      console.log(TAG, 'raw ' + label + ':', rawUrl.substring(0, 80));

      // [1.7.0] Ключевое изменение: getProxyUrl() вместо cleanUrl/ktDecodeUrl
      var proxied = getProxyUrl(rawUrl);
      if (proxied) q[label] = proxied;
    });

    // Fallback: <source size> — если VIDEO_RULES ничего не дал
    if (!Object.keys(q).length) {
      console.warn(TAG, 'VIDEO_RULES fallback → <source>');
      var re1 = /<source[^>]+src="([^"]+)"[^>]+size="([^"]+)"/gi;
      var re2 = /<source[^>]+size="([^"]+)"[^>]+src="([^"]+)"/gi;
      var m;
      while ((m = re1.exec(html)) !== null) {
        if (m[2] !== 'preview' && m[1].indexOf('.mp4') !== -1)
          q[m[2] + 'p'] = getProxyUrl(m[1]) || cleanUrl(m[1]);
      }
      if (!Object.keys(q).length) {
        while ((m = re2.exec(html)) !== null) {
          if (m[1] !== 'preview' && m[2].indexOf('.mp4') !== -1)
            q[m[1] + 'p'] = getProxyUrl(m[2]) || cleanUrl(m[2]);
        }
      }
    }

    return q;
  }

  // ----------------------------------------------------------
  // URL BUILDER
  // JSON: search=/?q=, cat=/?c=, main=/?page=N
  // ----------------------------------------------------------
  function buildUrl(type, value, page) {
    var url = HOST;
    page    = parseInt(page, 10) || 1;
    if (type === 'search') {
      url += '/?q=' + encodeURIComponent(value);
      if (page > 1) url += '&page=' + page;
    } else if (type === 'cat') {
      url += '/?c=' + encodeURIComponent(value);
      if (page > 1) url += '&page=' + page;
    } else {
      if (page > 1) url += '/?page=' + page;
    }
    return url;
  }

  function buildMenu() {
    return [
      { title: '🔍 Поиск', search_on: true, playlist_url: NAME + '/search/' },
      { title: '🔥 Новое',  playlist_url: NAME + '/new' },
      {
        title: '📂 Категории', playlist_url: 'submenu',
        submenu: CATEGORIES.map(function (c) {
          return { title: c.title, playlist_url: NAME + '/cat/' + c.slug };
        }),
      },
    ];
  }

  // ----------------------------------------------------------
  // РОУТИНГ — архитектура v1.3.0
  // ----------------------------------------------------------
  function routeView(url, page, success, error) {
    var fetchUrl;
    var sm = url.match(/[?&]search=([^&]*)/);

    if (sm) {
      fetchUrl = buildUrl('search', decodeURIComponent(sm[1]), page);
    } else if (url.indexOf(NAME + '/cat/') === 0) {
      fetchUrl = buildUrl('cat', url.replace(NAME + '/cat/', '').split('?')[0], page);
    } else if (url.indexOf(NAME + '/search/') === 0) {
      var q = decodeURIComponent(url.replace(NAME + '/search/', '').split('?')[0]).trim();
      fetchUrl = buildUrl('search', q, page);
    } else {
      fetchUrl = buildUrl('main', null, page);
    }

    console.log(TAG, 'routeView →', fetchUrl);
    httpGet(fetchUrl, function (html) {
      console.log(TAG, 'html длина:', html.length);
      var results = parsePlaylist(html);
      if (!results.length) { error('Контент не найден'); return; }
      success({ results: results, collection: true, total_pages: page + 1, menu: buildMenu() });
    }, error);
  }

  // ----------------------------------------------------------
  // ПАРСЕР API — интерфейс AdultPlugin (архитектура v1.3.0)
  // ----------------------------------------------------------
  var HdtubParser = {

    main: function (p, s, e) {
      routeView(NAME + '/new', 1, s, e);
    },

    view: function (p, s, e) {
      routeView(p.url || NAME, p.page || 1, s, e);
    },

    search: function (p, s, e) {
      var q = (p.query || '').trim();
      httpGet(buildUrl('search', q, p.page || 1), function (html) {
        s({
          title: 'HDtube: ' + q,
          results: parsePlaylist(html),
          collection: true,
          total_pages: 2,
        });
      }, e);
    },

    qualities: function (videoPageUrl, success, error) {
      console.log(TAG, 'qualities() →', videoPageUrl);

      httpGet(videoPageUrl, function (html) {
        console.log(TAG, 'html длина:', html.length);
        if (!html || html.length < 500) { error('html < 500'); return; }

        // Диагностика
        console.log(TAG, 'video_url cnt:',   (html.match(/video_url/gi)   || []).length);
        console.log(TAG, 'function/0 cnt:',  (html.match(/function\/0/gi) || []).length);
        console.log(TAG, 'get_file cnt:',    (html.match(/get_file/gi)    || []).length);

        var found = extractQualities(html);
        var keys  = Object.keys(found);
        console.log(TAG, 'qualities найдено:', keys.length, JSON.stringify(keys));

        if (keys.length > 0) {
          success({ qualities: found });
        } else {
          console.warn(TAG, 'FAIL');
          console.warn(TAG, 'video_url:',  (html.match(/video_url/gi)  || []).length);
          console.warn(TAG, 'get_file:',   (html.match(/get_file/gi)   || []).length);
          console.warn(TAG, '.mp4:',       (html.match(/\.mp4/gi)      || []).length);
          error('Видео не найдено');
        }
      }, error);
    },
  };

  // ----------------------------------------------------------
  // РЕГИСТРАЦИЯ — архитектура v1.3.0 (AdultPlugin)
  // ----------------------------------------------------------
  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, HdtubParser);
      console.log(TAG, 'v' + VERSION + ' зарегистрирован');
      return true;
    }
    return false;
  }

  if (!tryRegister()) {
    var poll = setInterval(function () {
      if (tryRegister()) clearInterval(poll);
    }, 200);
    setTimeout(function () { clearInterval(poll); }, 5000);
  }

})();
