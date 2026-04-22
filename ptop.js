// =============================================================
// ptop.js — PornTop Parser для AdultJS (Lampa)
// =============================================================
// Версия  : 2.0.0
// Хост    : https://porntop.com
// Схема   : search=/?q=  category=/category/slug/l/  page=&page=N
// =============================================================

(function () {
  'use strict';

  var VERSION = '2.0.0';
  var NAME    = 'ptop';
  var HOST    = 'https://porntop.com';

  var CATEGORIES = [
    { title: '💎 HD Video', slug: 'hd' },
    { title: '👩 Брюнетки', slug: 'brunette' },
    { title: '🍑 Большая жопа', slug: 'big-butt' },
    { title: '🍒 Сисястые', slug: 'big-tits' },
    { title: '👵 Милфы', slug: 'milf' },
    { title: '👅 Глубокий отсос', slug: 'deep-throat' },
    { title: '🎨 Тату', slug: 'tattoos' },
    { title: '👱 Блондинки', slug: 'blonde' },
    { title: '🌏 Азиатки', slug: 'asian' },
    { title: '🍆 Большой член', slug: 'big-dick' },
  ];

  // ----------------------------------------------------------
  // ТРАНСПОРТ
  // ----------------------------------------------------------
  function httpGet(url, success, error) {
    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, success, error);
    } else {
      fetch(url).then(function (r) { return r.text(); }).then(success).catch(error);
    }
  }

  // ----------------------------------------------------------
  // CLEAN URL (UNIVERSAL_TEMPLATE §4)
  // ----------------------------------------------------------
  function cleanUrl(raw) {
    if (!raw) return '';
    try {
      var u = raw;
      u = u.replace(/\\\//g, '/');
      u = u.replace(/\\/g, '');
      if (u.indexOf('%') !== -1) { try { u = decodeURIComponent(u); } catch (e) {} }
      if (u.indexOf('/') === -1 && u.length > 20 && /^[a-zA-Z0-9+/]+=*$/.test(u)) {
        try { var d = atob(u); if (d.indexOf('http') === 0) u = d; } catch (e) {}
      }
      if (u.indexOf('//') === 0) u = 'https:' + u;
      if (u.charAt(0) === '/' && u.charAt(1) !== '/') u = HOST + u;
      if (u.length > 0 && u.indexOf('http') !== 0 && u.charAt(0) !== '/') u = HOST + '/' + u;
      return u;
    } catch (e) { return raw; }
  }

  function cleanMp4Url(url) {
    return url
      .replace(/[?&]rnd=\d+/g, '').replace(/[?&]br=\d+/g, '')
      .replace(/[?&]_=\d+/g, '').replace(/[?&]+$/g, '').replace(/\/+$/, '') + '/';
  }

  // ----------------------------------------------------------
  // EXTRACT QUALITIES (UNIVERSAL_TEMPLATE §5 + ptop specific)
  // ----------------------------------------------------------
  function extractQualities(html, pageUrl) {
    var q = {};
    var have = function () { return Object.keys(q).length > 0; };
    var add = function (label, url) {
      var u = cleanUrl(url);
      if (!u || u.indexOf('{') !== -1 || u.indexOf('spacer') !== -1) return;
      if (!q[label]) q[label] = u;
    };
    var m;

    // S0. ptop specific — jwplayer / setup() sources JSON
    var jwRe = /(?:sources|playlist)\s*:\s*(\[[\s\S]{1,2000}?\])/;
    var jwM = html.match(jwRe);
    if (jwM) {
      try {
        var jsonStr = jwM[1].replace(/'/g, '"').replace(/(\w+)\s*:/g, '"$1":');
        var sources = JSON.parse(jsonStr);
        sources.forEach(function (s) {
          var file = s.file || s.src || s.url || '';
          var label = s.label || s.quality || 'HD';
          if (file && file.indexOf('{') === -1 && file.indexOf('.mp4') !== -1) {
            add(label, file);
          }
        });
      } catch (e) { console.warn('[ptop] S0 json parse error:', e.message); }
    }

    // S1. VIDEO_RULES
    if (!have()) {
      var VIDEO_RULES = [
        { label: '480p', re: /video_url\s*[:=]\s*['"`]([^'"`]+)['"`]/ },
        { label: '720p', re: /video_alt_url\s*[:=]\s*['"`]([^'"`]+)['"`]/ },
      ];
      VIDEO_RULES.forEach(function (rule) {
        m = html.match(rule.re);
        if (m && m[1]) add(rule.label, m[1]);
      });
    }

    // S2. <source src size>
    if (!have()) {
      var re2a = /<source[^>]+src="([^"]+)"[^>]+size="([^"]+)"/gi;
      while ((m = re2a.exec(html)) !== null) {
        if (m[2] !== 'preview' && m[1].indexOf('.mp4') !== -1) add(m[2] + 'p', m[1]);
      }
    }

    // S3. <source src label>
    if (!have()) {
      var re3a = /<source[^>]+src="([^"]+)"[^>]+label="([^"]+)"/gi;
      while ((m = re3a.exec(html)) !== null) {
        if (m[1].indexOf('.mp4') !== -1) add(m[2], m[1]);
      }
    }

    // S4. <source title> (DOM)
    if (!have()) {
      try {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var sources = doc.querySelectorAll('video source[src]');
        for (var si = 0; si < sources.length; si++) {
          var src = sources[si].getAttribute('src') || '';
          var slbl = sources[si].getAttribute('title') || sources[si].getAttribute('label') || sources[si].getAttribute('size') || 'auto';
          if (!src || src.indexOf('blob:') === 0) continue;
          add(slbl.toLowerCase() === 'auto' ? 'auto' : slbl, src);
        }
      } catch (e) {}
    }

    // S5. dataEncodings
    if (!have()) {
      try {
        var idx = html.indexOf('dataEncodings');
        if (idx !== -1) {
          var arrStart = html.indexOf('[', idx);
          if (arrStart !== -1) {
            var depth = 0, arrEnd = -1;
            for (var ci = arrStart; ci < html.length; ci++) {
              if (html[ci] === '[') depth++;
              else if (html[ci] === ']') { depth--; if (depth === 0) { arrEnd = ci; break; } }
            }
            if (arrEnd !== -1) {
              var dataEnc = JSON.parse(html.substring(arrStart, arrEnd + 1));
              dataEnc.forEach(function (enc) {
                if (!enc.filename) return;
                var dkey = (String(enc.quality).toLowerCase() === 'auto') ? 'auto' : (enc.quality + 'p');
                add(dkey, enc.filename.replace(/\\\//g, '/'));
              });
            }
          }
        }
      } catch (e) {}
    }

    // S6. og:video
    if (!have()) {
      var ogMatches = html.match(/<meta[^>]+property="og:video"[^>]+content="([^"]+\.mp4[^"]*)"/gi)
                   || html.match(/<meta[^>]+content="([^"]+\.mp4[^"]*)"[^>]+property="og:video"/gi);
      if (ogMatches) {
        ogMatches.forEach(function (tag) {
          var cm = tag.match(/content="([^"]+\.mp4[^"]*)"/i);
          if (!cm) return;
          var ogUrl = cleanUrl(cm[1]);
          if (ogUrl.indexOf('/embed/') !== -1) return;
          var qm = ogUrl.match(/_(\d+)\.mp4/);
          add(qm ? qm[1] + 'p' : 'HD', ogUrl);
        });
      }
    }

    // S7. html5player
    if (!have()) {
      var mH = html.match(/html5player\.setVideoUrlHigh\(['"`]([^'"`]+)['"`]\)/);
      var mL = html.match(/html5player\.setVideoUrlLow\(['"`]([^'"`]+)['"`]\)/);
      if (mH) add('720p', mH[1]);
      if (mL) add('480p', mL[1]);
    }

    // S8. HLS
    if (!have()) {
      var mHlsAny = html.match(/['"]?(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*?)['"]?/);
      if (mHlsAny) add('HLS', mHlsAny[1]);
    }

    // S9. get_file
    if (!have()) {
      var getFileRe = /(https?:\/\/[^"'\s]+\/get_file\/[^"'\s]+\.mp4[^"'\s]*)/g;
      var gf, gfCount = 0;
      while ((gf = getFileRe.exec(html)) !== null && gfCount < 5) {
        if (gf[1].indexOf('preview') !== -1) continue;
        var gfQ = gf[1].match(/_(\d+)\.mp4/);
        add(gfQ ? gfQ[1] + 'p' : ('auto' + gfCount), gf[1]);
        gfCount++;
      }
    }

    // S10. Внешний CDN mp4 (не porntop.com, не pttn.m3pd.com)
    if (!have()) {
      var allMp4 = html.match(/https?:\/\/[^"'\s<>]+\.mp4[^"'\s<>]*/gi);
      if (allMp4) {
        allMp4.forEach(function (u, i) {
          if (u.indexOf('{') !== -1) return;
          if (u.indexOf('porntop.com') !== -1 && u.indexOf('pttn.m3pd.com') !== -1) return;
          var qm = u.match(/_(\d+)p?\.mp4/);
          var lbl = qm ? qm[1] + 'p' : 'HD';
          if (!q[lbl]) add(lbl, u);
        });
      }
    }

    // S11. iframe embed
    if (!have()) {
      var iframeM = html.match(/<iframe[^>]+src="(https?:\/\/[^"]+)"/i);
      if (iframeM && iframeM[1].indexOf('porntop.com') === -1) {
        add('embed', iframeM[1]);
      }
    }

    Object.keys(q).forEach(function (k) {
      if (q[k].indexOf('.mp4') !== -1 && q[k].indexOf('?') !== -1) q[k] = cleanMp4Url(q[k]);
    });

    return q;
  }

  // ----------------------------------------------------------
  // ПАРСИНГ КАРТОЧЕК
  // ----------------------------------------------------------
  function parsePlaylist(html) {
    var results = [];
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var items = doc.querySelectorAll('.item');
    console.log('[ptop] parsePlaylist → .item:', items.length);

    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      var linkEl = el.querySelector('a[href]');
      if (!linkEl) continue;

      var href = cleanUrl(linkEl.getAttribute('href') || '');
      if (!href) continue;

      var imgEl = el.querySelector('img');
      var pic = '';
      if (imgEl) {
        pic = cleanUrl(
          imgEl.getAttribute('data-original') ||
          imgEl.getAttribute('data-src') ||
          imgEl.getAttribute('src') || ''
        );
      }

      var titleEl = el.querySelector('.title, strong');
      var name = (titleEl ? titleEl.textContent : (linkEl.getAttribute('title') || linkEl.textContent))
        .replace(/[\t\n\r]+/g, ' ').replace(/\s{2,}/g, ' ').trim() || 'Video';

      var durEl = el.querySelector('.duration, .time');
      var time = durEl ? durEl.textContent.trim() : '';

      results.push({
        name: name, video: href,
        picture: pic, img: pic, poster: pic, background_image: pic,
        preview: null, time: time || '', quality: 'HD',
        json: true, source: NAME,
      });
    }

    console.log('[ptop] parsePlaylist → карточек:', results.length);
    return results;
  }

  // ----------------------------------------------------------
  // URL BUILDER
  // ----------------------------------------------------------
  function buildUrl(type, value, page) {
    var url = HOST;
    page = parseInt(page, 10) || 1;
    if (type === 'search') {
      url += '/?q=' + encodeURIComponent(value);
      if (page > 1) url += '&page=' + page;
    } else if (type === 'cat') {
      url += '/category/' + value + '/l/';
      if (page > 1) url += '?page=' + page;
    } else {
      if (page > 1) url += '/?page=' + page;
    }
    return url;
  }

  function buildMenu() {
    return [
      { title: '🔍 Поиск', search_on: true, playlist_url: NAME + '/search/' },
      { title: '🔥 Популярное', playlist_url: NAME + '/popular' },
      { title: '📂 Категории', playlist_url: 'submenu',
        submenu: CATEGORIES.map(function (c) {
          return { title: c.title, playlist_url: NAME + '/cat/' + c.slug };
        }),
      },
    ];
  }

  // ----------------------------------------------------------
  // РОУТИНГ
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

    console.log('[ptop] routeView →', fetchUrl);
    httpGet(fetchUrl, function (html) {
      console.log('[ptop] html длина:', html.length);
      var results = parsePlaylist(html);
      if (!results.length) { error('Контент не найден'); return; }
      success({ results: results, collection: true, total_pages: page + 1, menu: buildMenu() });
    }, error);
  }

  // ----------------------------------------------------------
  // API
  // ----------------------------------------------------------
  var PtopParser = {
    main: function (p, s, e) { routeView(NAME + '/popular', 1, s, e); },
    view: function (p, s, e) { routeView(p.url || NAME, p.page || 1, s, e); },
    search: function (p, s, e) {
      var query = (p.query || '').trim();
      httpGet(buildUrl('search', query, 1), function (html) {
        s({ title: 'PornTop: ' + query, results: parsePlaylist(html), collection: true, total_pages: 2 });
      }, e);
    },

    qualities: function (videoPageUrl, success, error) {
      console.log('[ptop] qualities() →', videoPageUrl);
      httpGet(videoPageUrl, function (html) {
        console.log('[ptop] qualities html длина:', html.length);
        if (!html || html.length < 500) { error('html < 500'); return; }

        var found = extractQualities(html, videoPageUrl);
        var keys = Object.keys(found);
        console.log('[ptop] qualities найдено:', keys.length, JSON.stringify(keys));

        if (keys.length > 0 && !(keys.length === 1 && found['embed'])) {
          success({ qualities: found });
          return;
        }

        // Если только embed iframe — пробуем загрузить
        if (keys.length === 1 && found['embed']) {
          var embedUrl = found['embed'];
          console.log('[ptop] пробуем embed →', embedUrl);
          httpGet(embedUrl, function (embedHtml) {
            var embedQ = extractQualities(embedHtml, embedUrl);
            var embedKeys = Object.keys(embedQ);
            if (embedKeys.length > 0 && !(embedKeys.length === 1 && embedQ['embed'])) {
              success({ qualities: embedQ });
            } else {
              success({ qualities: { 'embed': embedUrl } });
            }
          }, function () {
            success({ qualities: { 'embed': embedUrl } });
          });
          return;
        }

        error('Видео не найдено');
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
      return true;
    }
    return false;
  }
  if (!tryRegister()) {
    var poll = setInterval(function () { if (tryRegister()) clearInterval(poll); }, 200);
    setTimeout(function () { clearInterval(poll); }, 5000);
  }

})();
