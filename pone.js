// =============================================================
// pone.js — PornOne Parser для AdultJS (Lampa)
// =============================================================
// Версия  : 2.0.0
// Хост    : https://pornone.com
// Схема   : search=/?q=  category=/?c=  page=&page=N
// =============================================================

(function () {
  'use strict';

  var VERSION = '2.0.0';
  var NAME    = 'pone';
  var HOST    = 'https://pornone.com';

  var CATEGORIES = [
    { title: 'Amateur', slug: 'amateur' },
    { title: 'Artistic', slug: 'artistic' },
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
  // EXTRACT QUALITIES (UNIVERSAL_TEMPLATE §5 + pone specific)
  // ----------------------------------------------------------
  function extractQualities(html) {
    var q = {};
    var have = function () { return Object.keys(q).length > 0; };
    var add = function (label, url) {
      var u = cleanUrl(url);
      if (!u || u.indexOf('{') !== -1 || u.indexOf('spacer') !== -1) return;
      if (!q[label]) q[label] = u;
    };
    var m;

    // S0. pone specific — <source> теги с label (videojs)
    var srcRegex = /<source[^>]+src=["']([^"']+)["'][^>]*/gi;
    var srcMatch;
    while ((srcMatch = srcRegex.exec(html)) !== null) {
      var srcUrl = srcMatch[1].trim();
      var fullTag = srcMatch[0];
      if (fullTag.indexOf('audio') !== -1) continue;
      if (srcUrl.indexOf('http') !== 0 && srcUrl.indexOf('/') === 0) srcUrl = HOST + srcUrl;

      var labelMatch = fullTag.match(/label=["']([^"']+)["']/);
      var sizeMatch  = fullTag.match(/size=["']([^"']+)["']/);
      var resMatch   = fullTag.match(/res=["']([^"']+)["']/);
      var label = '';
      if (labelMatch) label = labelMatch[1];
      else if (sizeMatch) label = sizeMatch[1] + 'p';
      else if (resMatch) label = resMatch[1] + 'p';
      else {
        if (srcUrl.indexOf('1920x1080') !== -1 || srcUrl.indexOf('4000k') !== -1) label = '1080p';
        else if (srcUrl.indexOf('1280x720') !== -1 || srcUrl.indexOf('2000k') !== -1) label = '720p';
        else if (srcUrl.indexOf('720x406') !== -1 || srcUrl.indexOf('500k') !== -1) label = '480p';
        else if (srcUrl.indexOf('480x270') !== -1) label = '360p';
        else label = 'Default';
      }
      if (srcUrl.indexOf('http') === 0) add(label, srcUrl);
    }

    // S1. VIDEO_RULES
    if (!have()) {
      var VIDEO_RULES = [
        { label: '480p', re: /video_url\s*[:=]\s*['"`]([^'"`]+)['"`]/ },
        { label: '720p', re: /video_alt_url\s*[:=]\s*['"`]([^'"`]+)['"`]/ },
        { label: '1080p', re: /video_alt_url2\s*[:=]\s*['"`]([^'"`]+)['"`]/ },
      ];
      VIDEO_RULES.forEach(function (rule) {
        m = html.match(rule.re);
        if (m && m[1] && m[1].indexOf('http') === 0) add(rule.label, m[1]);
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

    // S10. PlayerJS file:'...'
    if (!have()) {
      var fileMatch = html.match(/file\s*[:=]\s*["']([^"']+)["']/);
      if (fileMatch && fileMatch[1]) {
        var fc = fileMatch[1];
        if (fc.indexOf('[') !== -1) {
          var parts = fc.split(',');
          for (var pi = 0; pi < parts.length; pi++) {
            var qm = parts[pi].match(/\[([^\]]+)\]/);
            var link = parts[pi].replace(/\[[^\]]+\]/, '').trim();
            if (qm && link && link.indexOf('http') === 0) add(qm[1], link);
          }
        } else if (fc.indexOf('http') === 0) {
          add('Default', fc);
        }
      }
    }

    // S11. Любой mp4
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

    Object.keys(q).forEach(function (k) {
      if (q[k].indexOf('.mp4') !== -1 && q[k].indexOf('?') !== -1) q[k] = cleanMp4Url(q[k]);
    });

    return q;
  }

  // ----------------------------------------------------------
  // ПАРСИНГ КАРТОЧЕК
  // ----------------------------------------------------------
  function parseCards(html) {
    if (!html) return [];
    var doc = new DOMParser().parseFromString(html, 'text/html');

    var items = doc.querySelectorAll('.video-item');
    if (!items.length) items = doc.querySelectorAll('.item');
    if (!items.length) items = doc.querySelectorAll('.thumb');
    if (!items.length) items = doc.querySelectorAll('.card');

    console.log('[pone] parseCards элементов:', items.length);
    var results = [];

    if (items.length) {
      for (var i = 0; i < items.length; i++) {
        var card = parseCardElement(items[i]);
        if (card) results.push(card);
      }
    }

    if (!results.length) results = parseCardsFallback(doc);
    console.log('[pone] parseCards карточек:', results.length);
    return results;
  }

  function parseCardElement(el) {
    var a = el.querySelector('a[href]');
    if (!a) return null;

    var href = a.getAttribute('href') || '';
    if (!href.match(/\/\d+\/?$/)) return null;
    if (href.indexOf('http') !== 0) href = HOST + href;

    var img = el.querySelector('img');
    var pic = '';
    if (img) {
      pic = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('src') || '';
    }
    pic = cleanUrl(pic);

    var name = '';
    var titleEl = el.querySelector('.title') || el.querySelector('.video-title') || el.querySelector('strong') || el.querySelector('span');
    if (titleEl) name = (titleEl.textContent || '').trim();
    if (!name) name = (a.getAttribute('title') || '').trim();
    if (!name && img) name = (img.getAttribute('alt') || '').trim();
    name = name.replace(/\s+/g, ' ').trim();
    if (!name || name.length < 3) return null;

    var durEl = el.querySelector('.duration') || el.querySelector('.time') || el.querySelector('.length');
    var time = durEl ? durEl.textContent.trim() : '';

    return makeCard(name, href, pic, time);
  }

  function parseCardsFallback(doc) {
    var results = [];
    var links = doc.querySelectorAll('a[href]');
    var seen = {};

    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var href = a.getAttribute('href') || '';
      if (!href.match(/^\/[^\/]+\/[^\/]+\/\d+\/?$/)) continue;
      if (seen[href]) continue;
      seen[href] = true;

      var fullHref = HOST + href;
      var img = a.querySelector('img');
      var pic = '';
      if (img) {
        pic = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('src') || '';
      }
      pic = cleanUrl(pic);

      var name = (a.getAttribute('title') || '').trim();
      if (!name && img) name = (img.getAttribute('alt') || '').trim();
      if (!name) name = (a.textContent || '').trim().substring(0, 100);
      name = name.replace(/\s+/g, ' ').trim();
      if (!name || name.length < 3) continue;

      results.push(makeCard(name, fullHref, pic, ''));
    }
    return results;
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
  function buildUrl(cat, page, query) {
    page = parseInt(page, 10) || 1;
    if (query) {
      var url = HOST + '/?q=' + encodeURIComponent(query);
      if (page > 1) url += '&page=' + page;
      return url;
    }
    if (cat) {
      var url = HOST + '/?c=' + encodeURIComponent(cat);
      if (page > 1) url += '&page=' + page;
      return url;
    }
    if (page > 1) return HOST + '/?page=' + page;
    return HOST + '/';
  }

  function buildMenu() {
    return [
      { title: '🔍 Поиск', search_on: true, playlist_url: NAME + '/search/' },
      { title: '🔥 Главная', playlist_url: NAME + '/main' },
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
    var cat = null, query = null;
    var searchMatch = url.match(/[?&]search=([^&]*)/);
    if (searchMatch) {
      query = decodeURIComponent(searchMatch[1]);
    } else if (url.indexOf(NAME + '/cat/') !== -1) {
      cat = url.replace(/.*pone\/cat\//, '').split('?')[0].split('/')[0];
    }

    var fetchUrl = buildUrl(cat, page, query);
    console.log('[pone] routeView →', fetchUrl);

    httpGet(fetchUrl, function (html) {
      console.log('[pone] html длина:', (html || '').length);
      var cards = parseCards(html);
      success({
        results: cards, collection: true,
        total_pages: cards.length >= 20 ? page + 1 : page,
        menu: buildMenu(),
      });
    }, error);
  }

  // ----------------------------------------------------------
  // API
  // ----------------------------------------------------------
  var PoneParser = {
    main: function (params, success, error) {
      routeView(NAME, 1, success, error);
    },
    view: function (params, success, error) {
      routeView(params.url || NAME, params.page || 1, success, error);
    },
    search: function (params, success, error) {
      var query = (params.query || '').trim();
      var page = params.page || 1;
      var fetchUrl = buildUrl(null, page, query);
      httpGet(fetchUrl, function (html) {
        var cards = parseCards(html);
        success({
          title: 'PornOne: ' + query, results: cards,
          collection: true, total_pages: cards.length >= 20 ? page + 1 : 1,
        });
      }, error);
    },
    qualities: function (videoPageUrl, success, error) {
      console.log('[pone] qualities() →', videoPageUrl);
      httpGet(videoPageUrl, function (html) {
        console.log('[pone] qualities html длина:', (html || '').length);
        if (!html || html.length < 500) { error('Страница недоступна'); return; }
        var found = extractQualities(html);
        var keys = Object.keys(found);
        console.log('[pone] qualities найдено:', keys.length, JSON.stringify(found));
        if (keys.length > 0) success({ qualities: found });
        else {
          console.warn('[pone] <source>:', (html.match(/<source/gi) || []).length);
          console.warn('[pone] video/mp4:', (html.match(/video\/mp4/gi) || []).length);
          error('PornOne: видео не найдено');
        }
      }, error);
    },
  };

  // ----------------------------------------------------------
  // РЕГИСТРАЦИЯ
  // ----------------------------------------------------------
  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, PoneParser);
      console.log('[pone] v' + VERSION + ' зарегистрирован');
      return true;
    }
    return false;
  }
  if (!tryRegister()) {
    var poll = setInterval(function () { if (tryRegister()) clearInterval(poll); }, 200);
    setTimeout(function () { clearInterval(poll); }, 5000);
  }

})();
