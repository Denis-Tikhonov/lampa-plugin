// =============================================================
// xgr.js — Парсер rt.xgroovy.com для AdultJS
// Version  : 1.2.0
// =============================================================
// Изменения:
//   [1.0.0] Начальная версия
//   [1.1.0] BUGFIX: total_pages порог снижен с 48 до 28
//   [1.1.0] BUGFIX: S3 fallback-URL проксируются через Worker
//   [1.1.0] BUGFIX: расширены селекторы постеров
//   [1.2.0] BUGFIX: qualities() — прямой fetch вместо Worker
//           rt.xgroovy.com/videos/* блокирует CF Workers IP
//           (403, ms:5 — мгновенный IP-блок).
//           TV-браузер (Android WebView) ходит напрямую — ок.
//           При ошибке прямого fetch — fallback на Worker.
// =============================================================

(function () {
  'use strict';

  var VERSION = '1.2.0';
  var NAME    = 'xgr';
  var HOST    = 'https://rt.xgroovy.com';
  var TAG     = '[' + NAME + ' v' + VERSION + ']';

  var CATEGORIES = [
    { title: 'Минет',              slug: 'blowjob'            },
    { title: 'Большие Попы',       slug: 'big-ass'            },
    { title: 'Большие Сиськи',     slug: 'big-tits'           },
    { title: 'Подростки (18-25)',   slug: 'teens'              },
    { title: 'Любительское',       slug: 'amateur'            },
    { title: 'ПОВ',                slug: 'pov'                },
    { title: 'Сперма',             slug: 'cumshot'            },
    { title: 'Азиатки',            slug: 'asian'              },
    { title: 'Маленькие Сиськи',   slug: 'small-tits'         },
    { title: 'Межрасовый Секс',    slug: 'interracial'        },
    { title: 'Большие Члены',      slug: 'big-cock'           },
    { title: 'Анал',               slug: 'anal'               },
    { title: 'Милфы',              slug: 'milf'               },
    { title: 'Втроём',             slug: 'threesome'          },
    { title: 'Семейные Фантазии',  slug: 'family'             },
    { title: 'Большой Чёрный Член',slug: 'bbc'                },
    { title: 'Кримпай',            slug: 'creampie'           },
    { title: 'Латинки',            slug: 'latina'             },
    { title: 'Негритянки',         slug: 'ebony'              },
    { title: 'Лесбиянки',         slug: 'lesbians'           },
    { title: 'Сквирт',             slug: 'squirt'             },
    { title: 'Куколд',             slug: 'cuckold'            },
    { title: 'На Публике',         slug: 'public'             },
    { title: 'Чулки',              slug: 'stockings'          },
    { title: 'Игрушки',            slug: 'toys'               },
    { title: 'БДСМ',               slug: 'bdsm'               },
    { title: 'Мамки',              slug: 'mom'                },
    { title: 'Хэнджоб',            slug: 'handjob'            },
    { title: 'На Улице',           slug: 'outdoor'            },
    { title: 'Кастинг',            slug: 'casting'            },
    { title: 'Групповой Секс',     slug: 'groupsex'           },
    { title: 'Подборка',           slug: 'compilation'        },
    { title: 'Зрелые',             slug: 'mature'             },
    { title: 'Русское',            slug: 'russian'            },
    { title: 'Массаж',             slug: 'massage'            },
    { title: 'Гэнгбэнг',          slug: 'gangbang'           },
    { title: 'Вебкамера',          slug: 'webcam'             },
  ];

  // ============================================================
  // §2. ТРАНСПОРТ
  // ============================================================
  function httpGet(url, success, error) {
    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, success, error);
    } else {
      fetch(url)
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(success)
        .catch(error);
    }
  }

  // [1.2.0] Прямой fetch для video-страниц (обход CF IP-блока)
  function httpGetDirect(url, success, error) {
    if (typeof fetch === 'undefined') { httpGet(url, success, error); return; }
    console.log(TAG, 'httpGetDirect →', url);
    fetch(url, {
      method: 'GET',
      headers: {
        'Referer':    HOST + '/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      }
    })
      .then(function (r) {
        if (!r.ok) {
          console.warn(TAG, 'direct HTTP', r.status, '→ fallback Worker');
          httpGet(url, success, error);
          return null;
        }
        return r.text();
      })
      .then(function (text) { if (text) success(text); })
      .catch(function (e) {
        console.warn(TAG, 'direct failed:', e.message, '→ fallback Worker');
        httpGet(url, success, error);
      });
  }

  function proxyUrl(url) {
    if (!url) return url;
    if (window.AdultPlugin && window.AdultPlugin.workerUrl) {
      var w = window.AdultPlugin.workerUrl;
      if (w.charAt(w.length - 1) !== '=') w = w + '=';
      if (url.indexOf(w) === 0) return url;
      if (url.indexOf('http') === 0) return w + encodeURIComponent(url);
    }
    return url;
  }

  function cleanUrl(raw) {
    if (!raw) return '';
    try {
      var u = raw;
      u = u.replace(/\\\//g, '/').replace(/\\/g, '');
      if (u.indexOf('%') !== -1) { try { u = decodeURIComponent(u); } catch (e) {} }
      if (u.indexOf('//') === 0) u = 'https:' + u;
      if (u.charAt(0) === '/' && u.charAt(1) !== '/') u = HOST + u;
      if (u.length > 0 && u.indexOf('http') !== 0 && u.charAt(0) !== '/') u = HOST + '/' + u;
      return u;
    } catch (e) { return raw; }
  }

  // ============================================================
  // §4. extractQualities
  // ============================================================
  function extractQualities(html) {
    var q = {};

    try {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var containers = [doc.querySelector('video#main_video'), doc.querySelector('video'), doc];
      for (var ci = 0; ci < containers.length; ci++) {
        if (!containers[ci]) continue;
        var srcs = containers[ci].querySelectorAll('source[src]');
        for (var si = 0; si < srcs.length; si++) {
          var src = srcs[si].getAttribute('src') || '';
          if (!src || src.indexOf('/get_file/') === -1) continue;
          var label = srcs[si].getAttribute('title') || srcs[si].getAttribute('label') || srcs[si].getAttribute('size') || '';
          if (label && !q[label]) q[label] = cleanUrl(src);
        }
        if (Object.keys(q).length) break;
      }
    } catch (e) { console.warn(TAG, 'S1 error:', e.message || e); }

    if (!Object.keys(q).length) {
      var re1 = /<source[^>]+src="([^"]+)"[^>]+title="([^"]+)"/gi;
      var re2 = /<source[^>]+title="([^"]+)"[^>]+src="([^"]+)"/gi;
      var m;
      while ((m = re1.exec(html)) !== null) {
        if (m[1].indexOf('/get_file/') !== -1 && !q[m[2]]) q[m[2]] = cleanUrl(m[1]);
      }
      if (!Object.keys(q).length) {
        while ((m = re2.exec(html)) !== null) {
          if (m[2].indexOf('/get_file/') !== -1 && !q[m[1]]) q[m[1]] = cleanUrl(m[2]);
        }
      }
    }

    if (!Object.keys(q).length) {
      var gfRe = /(https?:\/\/[^"'\s<>]+\/get_file\/[^"'\s<>]+\.mp4[^"'\s<>]*)/gi;
      var gf, cnt = 0;
      while ((gf = gfRe.exec(html)) !== null && cnt < 10) {
        var u = cleanUrl(gf[1]);
        var qm = u.match(/_(\d+p?)\.mp4/i);
        var key = qm ? (/^\d+$/.test(qm[1]) ? qm[1] + 'p' : qm[1]) : ('HD' + (cnt || ''));
        if (!q[key]) { q[key] = proxyUrl(u); cnt++; }
      }
    }

    return q;
  }

  // ============================================================
  // §5. ПАРСИНГ КАРТОЧЕК
  // ============================================================
  function getPicture(imgEl) {
    if (!imgEl) return '';
    var pic = cleanUrl(
      imgEl.getAttribute('data-src')      ||
      imgEl.getAttribute('data-original') ||
      imgEl.getAttribute('data-lazy-src') ||
      imgEl.getAttribute('data-thumb')    ||
      imgEl.getAttribute('src')           || ''
    );
    if (pic && (pic.indexOf('spacer') !== -1 || pic.indexOf('blank') !== -1 || pic.length < 10)) pic = '';
    return pic;
  }

  function parsePlaylist(html) {
    var results = [], seen = {};
    try {
      var doc   = new DOMParser().parseFromString(html, 'text/html');
      var items = doc.querySelectorAll('.item');
      if (!items || !items.length) {
        var links = doc.querySelectorAll('a[href*="/videos/"]');
        for (var j = 0; j < links.length; j++) {
          var href = cleanUrl(links[j].getAttribute('href') || '');
          if (!href || seen[href]) continue;
          seen[href] = true;
          var nameA = (links[j].getAttribute('title') || links[j].textContent || '').replace(/\s+/g, ' ').trim();
          if (!nameA) nameA = slugToTitle(href);
          if (nameA) results.push(makeCard(nameA, href, getPicture(links[j].querySelector('img')), ''));
        }
        return results;
      }
      for (var i = 0; i < items.length; i++) {
        var card = parseCard(items[i]);
        if (card && !seen[card.video]) { seen[card.video] = true; results.push(card); }
      }
    } catch (e) { console.warn(TAG, 'parsePlaylist error:', e.message || e); }
    console.log(TAG, 'parsePlaylist → карточек:', results.length);
    return results;
  }

  function parseCard(el) {
    var href = '', tagLc = (el.tagName || '').toLowerCase();
    if (tagLc === 'a') { var raw = cleanUrl(el.getAttribute('href') || ''); if (raw && raw.indexOf('/videos/') !== -1) href = raw; }
    if (!href) { var inner = el.querySelector('a[href*="/videos/"]'); if (inner) href = cleanUrl(inner.getAttribute('href') || ''); }
    if (!href || href.indexOf('/videos/') === -1) return null;

    var pic     = getPicture(el.querySelector('img.thumb') || el.querySelector('img'));
    var titleEl = el.querySelector('strong.title') || el.querySelector('.title');
    var name    = titleEl ? (titleEl.textContent || '').replace(/\s+/g, ' ').trim() : '';
    if (!name)   name = (el.getAttribute('title') || '').trim();
    if (!name) { var aEl = el.querySelector('a[title]'); if (aEl) name = (aEl.getAttribute('title') || '').trim(); }
    if (!name)   name = slugToTitle(href);
    if (!name)   return null;

    var durEl = el.querySelector('.time') || el.querySelector('.duration') || el.querySelector('[class*="time"]');
    return makeCard(name, href, pic, durEl ? durEl.textContent.replace(/[^\d:]/g, '').trim() : '');
  }

  function makeCard(name, href, pic, time) {
    return { name: name, video: href, picture: pic, img: pic, poster: pic, background_image: pic, preview: null, time: time || '', quality: 'HD', json: true, source: NAME };
  }

  function slugToTitle(url) {
    if (!url) return '';
    var parts = url.replace(/\?.*/, '').replace(/\/+$/, '').split('/').filter(Boolean);
    var slug = parts[parts.length - 1] || '';
    if (/^\d+$/.test(slug) && parts.length > 1) slug = parts[parts.length - 2] || '';
    return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); }).trim();
  }

  function buildUrl(type, value, page) {
    page = parseInt(page, 10) || 1;
    if (type === 'search') { var u = HOST + '/search/?q=' + encodeURIComponent(value); return page > 1 ? u + '&page=' + page : u; }
    if (type === 'cat')    { var u = HOST + '/categories/' + value + '/'; return page > 1 ? u + '?page=' + page : u; }
    return page > 1 ? HOST + '/?page=' + page : HOST + '/';
  }

  function buildMenu() {
    return [
      { title: '🔍 Поиск',    search_on: true, playlist_url: NAME + '/search/' },
      { title: '📂 Категории', playlist_url: 'submenu', submenu: CATEGORIES.map(function (c) { return { title: c.title, playlist_url: NAME + '/cat/' + c.slug }; }) },
    ];
  }

  function routeView(url, page, success, error) {
    var sm = url.match(/[?&]search=([^&]*)/);
    if (sm) return loadPage(buildUrl('search', decodeURIComponent(sm[1]), page), page, success, error);
    if (url.indexOf(NAME + '/cat/')    === 0) return loadPage(buildUrl('cat',    url.replace(NAME + '/cat/',    '').split('?')[0], page), page, success, error);
    if (url.indexOf(NAME + '/search/') === 0) { var rawQ = decodeURIComponent(url.replace(NAME + '/search/', '').split('?')[0]).trim(); if (rawQ) return loadPage(buildUrl('search', rawQ, page), page, success, error); }
    loadPage(buildUrl('main', null, page), page, success, error);
  }

  function loadPage(fetchUrl, page, success, error) {
    console.log(TAG, 'loadPage →', fetchUrl);
    httpGet(fetchUrl, function (html) {
      var results = parsePlaylist(html);
      if (!results.length) { error('Контент не найден'); return; }
      success({ results: results, collection: true, total_pages: results.length >= 28 ? page + 1 : page, menu: buildMenu() });
    }, error);
  }

  var XgrParser = {
    main:   function (p, s, e) { routeView(NAME, 1, s, e); },
    view:   function (p, s, e) { routeView(p.url || NAME, p.page || 1, s, e); },
    search: function (p, s, e) {
      var q = (p.query || '').trim(), pg = parseInt(p.page, 10) || 1;
      if (!q) { s({ title: '', results: [], collection: true, total_pages: 1 }); return; }
      httpGet(buildUrl('search', q, pg), function (html) {
        var r = parsePlaylist(html);
        s({ title: 'XGroovy: ' + q, results: r, collection: true, total_pages: r.length >= 28 ? pg + 1 : pg });
      }, e);
    },
    // [1.2.0] Прямой fetch — CF IP-блок обходится TV-браузером
    qualities: function (videoPageUrl, success, error) {
      console.log(TAG, 'qualities() →', videoPageUrl);
      httpGetDirect(videoPageUrl, function (html) {
        if (!html || html.length < 500) { error('Страница видео недоступна'); return; }
        var found = extractQualities(html);
        var keys  = Object.keys(found);
        console.log(TAG, 'qualities() найдено:', keys.length, JSON.stringify(keys));
        if (keys.length > 0) success({ qualities: found });
        else {
          console.warn(TAG, 'html.length=', html.length, '<source>=', (html.match(/<source/gi)||[]).length, 'get_file=', (html.match(/get_file/gi)||[]).length);
          error('Видео не найдено');
        }
      }, error);
    },
  };

  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, XgrParser);
      console.log(TAG, 'зарегистрирован');
      return true;
    }
    return false;
  }
  if (!tryRegister()) {
    var poll = setInterval(function () { if (tryRegister()) clearInterval(poll); }, 200);
    setTimeout(function () { clearInterval(poll); }, 5000);
  }
})();
