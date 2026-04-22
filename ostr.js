// =============================================================
// ostr.js — OstroePorno Parser для AdultJS (Lampa)
// =============================================================
// Версия  : 2.0.0
// Хост    : http://ostroeporno.com
// Схема   : search=/search?search=  category=/category/slug  page=?page=N
// =============================================================

(function () {
  'use strict';

  var VERSION = '2.0.0';
  var NAME    = 'ostr';
  var HOST    = 'http://ostroeporno.com';

  var CATEGORIES = [
    { title: '🇷🇺 Русское', slug: 'russkoe' },
    { title: '🏠 Домашнее', slug: 'domashnee' },
    { title: '👧 Молодые', slug: 'molodyee' },
    { title: '👅 Минет', slug: 'minet' },
    { title: '🍑 Брюнетки', slug: 'bryunetki' },
    { title: '👠 Чулки и колготки', slug: 'chulki_i_kolgotki' },
    { title: '👵 Зрелые', slug: 'zrelyee' },
    { title: '💦 Анал', slug: 'anal' },
    { title: '💎 HD видео', slug: 'hd_video' },
    { title: '🍒 Большие сиськи', slug: 'bolqshie_sisqki' },
    { title: '💛 Блондинки', slug: 'blondinki' },
    { title: '🌏 Азиатки', slug: 'aziatki' },
    { title: '💕 Лесбиянки', slug: 'lesbiyanki' },
    { title: '👩 Мамки', slug: 'mamki' },
    { title: '🔥 Жёсткое', slug: 'zhestkoe' },
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
      if (u.indexOf('//') === 0) u = 'http:' + u;
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
  // EXTRACT QUALITIES (UNIVERSAL_TEMPLATE §5 + ostr specific)
  // ----------------------------------------------------------
  function parseVideoJs(jsContent) {
    var q = {};
    var patterns = [
      { key: 'filehd', label: '720p' }, { key: 'file2hd', label: '720p' },
      { key: 'file_hd', label: '720p' }, { key: 'video_alt_url', label: '720p' },
      { key: 'file', label: '480p' }, { key: 'file2', label: '480p' },
      { key: 'video_url', label: '480p' }, { key: 'url', label: 'HD' },
      { key: 'src', label: 'HD' },
    ];
    patterns.forEach(function (p) {
      if (q[p.label]) return;
      var re = new RegExp(p.key + '\\s*[:=]\\s*[\'"`]([^\'"` ]+)[\'"`]', 'i');
      var m = jsContent.match(re);
      if (m && m[1]) {
        var u = cleanUrl(m[1]);
        if (u && u.indexOf('{') === -1 && (u.indexOf('.mp4') !== -1 || u.indexOf('.m3u8') !== -1 || u.indexOf('http') === 0)) {
          q[p.label] = u;
        }
      }
    });
    if (!Object.keys(q).length) {
      var mp4s = jsContent.match(/https?:\/\/[^"'\s,;)\\]+\.mp4[^"'\s,;)\\]*/gi);
      if (mp4s) {
        mp4s.forEach(function (u, i) {
          if (u.indexOf('{') !== -1) return;
          var qm = u.match(/_(\d+)p?\.mp4/);
          var lbl = qm ? qm[1] + 'p' : (i === 0 ? 'HD' : 'HD' + i);
          if (!q[lbl]) q[lbl] = cleanUrl(u);
        });
      }
    }
    return q;
  }

  function extractQualities(html, videoPageUrl) {
    var q = {};
    var have = function () { return Object.keys(q).length > 0; };
    var add = function (label, url) {
      var u = cleanUrl(url);
      if (!u || u.indexOf('{') !== -1 || u.indexOf('spacer') !== -1) return;
      if (!q[label]) q[label] = u;
    };
    var m;

    // S0. ostr specific — /js/video*.js (uppod/kt_player)
    var videoJsMatch = html.match(/<script[^>]+src="(\/js\/video[^"]+\.js)"/i);
    if (videoJsMatch) {
      var jsUrl = HOST + videoJsMatch[1];
      console.log('[ostr] найден video JS:', jsUrl);
      // Синхронно не загрузить — вернёмся к этому через callback ниже
    }

    // S1. VIDEO_RULES
    var VIDEO_RULES = [
      { label: '720p', re: /video_alt_url\s*[:=]\s*['"`]([^'"`]+)['"`]/ },
      { label: '480p', re: /video_url\s*[:=]\s*['"`]([^'"`]+)['"`]/ },
      { label: '720p', re: /filehd\s*[:=]\s*['"`]([^'"`]+)['"`]/ },
      { label: '480p', re: /file\s*[:=]\s*['"`]([^'"`]+)['"`]/ },
    ];
    VIDEO_RULES.forEach(function (rule) {
      if (have()) return;
      m = html.match(rule.re);
      if (m && m[1]) add(rule.label, m[1]);
    });

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

    // S10. Любой mp4
    if (!have()) {
      var allMp4 = html.match(/https?:\/\/[^"'\s<>]+\.mp4[^"'\s<>]*/gi);
      if (allMp4) {
        allMp4.forEach(function (u, i) {
          if (u.indexOf('{') !== -1) return;
          var qm2 = u.match(/_(\d+)\.mp4/);
          add(qm2 ? qm2[1] + 'p' : ('HD' + (i || '')), u);
        });
      }
    }

    return { q: q, videoJsMatch: videoJsMatch };
  }

  // ----------------------------------------------------------
  // ПАРСИНГ КАРТОЧЕК
  // ----------------------------------------------------------
  var CARD_SELECTORS = ['.thumb', '.video-item', '.item', 'article.video', '.video'];

  function parsePlaylist(html) {
    var results = [];
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var items;

    for (var s = 0; s < CARD_SELECTORS.length; s++) {
      items = doc.querySelectorAll(CARD_SELECTORS[s]);
      if (items && items.length > 0) { console.log('[ostr] selector:', CARD_SELECTORS[s], items.length); break; }
    }

    if (!items || items.length === 0) {
      var links = doc.querySelectorAll('a[href*="/video/"]');
      for (var j = 0; j < links.length; j++) {
        var aEl = links[j];
        var href = cleanUrl(aEl.getAttribute('href') || '');
        if (!href) continue;
        var imgA = aEl.querySelector('img');
        var picA = imgA ? cleanUrl(imgA.getAttribute('data-src') || imgA.getAttribute('src') || '') : '';
        var nameA = (aEl.getAttribute('title') || aEl.textContent || '').trim() || 'Video';
        results.push(makeCard(nameA, href, picA, ''));
      }
      return results;
    }

    for (var i = 0; i < items.length; i++) {
      var card = parseCard(items[i]);
      if (card) results.push(card);
    }
    console.log('[ostr] карточек:', results.length);
    return results;
  }

  function parseCard(el) {
    var linkEl = el.querySelector('a[href]');
    if (!linkEl) return null;
    var href = cleanUrl(linkEl.getAttribute('href') || '');
    if (!href) return null;

    var imgEl = el.querySelector('img');
    var pic = imgEl ? cleanUrl(imgEl.getAttribute('data-src') || imgEl.getAttribute('src') || '') : '';

    var titleEl = el.querySelector('a[title], .title, .name');
    var name = (titleEl ? (titleEl.getAttribute('title') || titleEl.textContent) : (linkEl.getAttribute('title') || linkEl.textContent))
      .replace(/\s+/g, ' ').trim() || 'Video';

    var durEl = el.querySelector('.duration, .time, .length');
    var time = durEl ? durEl.textContent.trim() : '';

    return makeCard(name, href, pic, time);
  }

  function makeCard(name, href, pic, time) {
    return {
      name: name, video: href,
      picture: pic, img: pic, poster: pic, background_image: pic,
      preview: null, time: time || '', quality: 'HD',
      json: true, source: NAME,
    };
  }

  // ----------------------------------------------------------
  // URL BUILDER
  // ----------------------------------------------------------
  function buildUrl(type, value, page) {
    var url = HOST;
    page = parseInt(page, 10) || 1;
    if (type === 'search') {
      url += '/search?search=' + encodeURIComponent(value);
      if (page > 1) url += '&page=' + page;
    } else if (type === 'cat') {
      url += '/category/' + value;
      if (page > 1) url += '?page=' + page;
    } else {
      if (page > 1) url += '/?page=' + page;
    }
    return url;
  }

  function buildMenu() {
    return [
      { title: '🔍 Поиск', search_on: true, playlist_url: NAME + '/search/' },
      { title: '🆕 Новинки', playlist_url: NAME + '/new' },
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

    console.log('[ostr] routeView →', fetchUrl);
    httpGet(fetchUrl, function (html) {
      console.log('[ostr] html длина:', html.length);
      var results = parsePlaylist(html);
      if (!results.length) { error('Контент не найден'); return; }
      success({ results: results, collection: true, total_pages: page + 1, menu: buildMenu() });
    }, error);
  }

  // ----------------------------------------------------------
  // API
  // ----------------------------------------------------------
  var OstrParser = {
    main: function (p, s, e) { routeView(NAME + '/new', 1, s, e); },
    view: function (p, s, e) { routeView(p.url || NAME, p.page || 1, s, e); },
    search: function (p, s, e) {
      var query = (p.query || '').trim();
      httpGet(buildUrl('search', query, 1), function (html) {
        s({ title: 'OstroePorno: ' + query, results: parsePlaylist(html), collection: true, total_pages: 2 });
      }, e);
    },

    qualities: function (videoPageUrl, success, error) {
      console.log('[ostr] qualities() →', videoPageUrl);
      httpGet(videoPageUrl, function (html) {
        console.log('[ostr] qualities html длина:', html.length);
        if (!html || html.length < 200) { error('html < 200'); return; }

        var extracted = extractQualities(html, videoPageUrl);
        var q = extracted.q;
        var videoJsMatch = extracted.videoJsMatch;

        // Если найден /js/video*.js — загружаем его и мержим
        if (videoJsMatch && !Object.keys(q).length) {
          var jsUrl = HOST + videoJsMatch[1];
          httpGet(jsUrl, function (jsContent) {
            var jsQ = parseVideoJs(jsContent);
            var keys = Object.keys(jsQ);
            if (keys.length > 0) {
              console.log('[ostr] qualities из video JS:', JSON.stringify(keys));
              success({ qualities: jsQ });
            } else {
              fallbackFromHtml(html, success, error);
            }
          }, function () { fallbackFromHtml(html, success, error); });
          return;
        }

        if (Object.keys(q).length > 0) {
          success({ qualities: q });
        } else {
          fallbackFromHtml(html, success, error);
        }
      }, error);
    },
  };

  function fallbackFromHtml(html, success, error) {
    var q = {};
    var add = function (label, url) {
      var u = cleanUrl(url);
      if (!u || u.indexOf('{') !== -1) return;
      if (!q[label]) q[label] = u;
    };

    var patterns = [
      { re: /video_alt_url\s*[:=]\s*['"`]([^'"`]+\.mp4[^'"`]*)['"` ]/i, label: '720p' },
      { re: /video_url\s*[:=]\s*['"`]([^'"`]+\.mp4[^'"`]*)['"` ]/i, label: '480p' },
      { re: /filehd\s*[:=]\s*['"`]([^'"`]+\.mp4[^'"`]*)['"` ]/i, label: '720p' },
      { re: /file\s*[:=]\s*['"`]([^'"`]+\.mp4[^'"`]*)['"` ]/i, label: '480p' },
    ];
    patterns.forEach(function (p) {
      if (q[p.label]) return;
      var m = html.match(p.re);
      if (m && m[1]) add(p.label, m[1]);
    });

    if (!Object.keys(q).length) {
      var dataRe = /data-(?:src|url|file|video|mp4)\s*=\s*['"]([^'"]+\.mp4[^'"]*)['"]/gi;
      var dm;
      while ((dm = dataRe.exec(html)) !== null) {
        if (dm[1].indexOf('{') === -1) { add('HD', dm[1]); break; }
      }
    }

    if (!Object.keys(q).length) {
      var iframeM = html.match(/<iframe[^>]+src="(https?:\/\/[^"]+)"/i);
      if (iframeM && iframeM[1].indexOf('ostroeporno.com') === -1) {
        add('embed', iframeM[1]);
      }
    }

    if (!Object.keys(q).length) {
      var anyMp4 = html.match(/https?:\/\/[^"'\s<>\\]+\.mp4[^"'\s<>\\]*/gi);
      if (anyMp4) {
        anyMp4.forEach(function (u) {
          if (u.indexOf('{') !== -1) return;
          var qm = u.match(/_(\d+)p?\.mp4/);
          var lbl = qm ? qm[1] + 'p' : 'HD';
          if (!q[lbl]) add(lbl, u);
        });
      }
    }

    var keys = Object.keys(q);
    if (keys.length > 0) success({ qualities: q });
    else error('Видео не найдено');
  }

  // ----------------------------------------------------------
  // РЕГИСТРАЦИЯ
  // ----------------------------------------------------------
  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, OstrParser);
      console.log('[ostr] v' + VERSION + ' зарегистрирован');
      return true;
    }
    return false;
  }
  if (!tryRegister()) {
    var poll = setInterval(function () { if (tryRegister()) clearInterval(poll); }, 200);
    setTimeout(function () { clearInterval(poll); }, 5000);
  }

})();
