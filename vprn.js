// =============================================================
// winpo.js — парсер AdultJS
// Версия  : 1.0.0
// =============================================================
// ИНСТРУКЦИЯ ПО УСТАНОВКЕ
// =============================================================
// 1. ДОБАВЬТЕ В menu.json (GitHub):
//    { "title": "winporn.com", "playlist_url": "winpo" }
// 2. ДОБАВЬТЕ В DOMAIN_MAP в AdultJS.js:
//    'winporn.com': 'winpo'
// 3. ДОБАВЬТЕ ДОМЕН В active_worker ALLOWED_TARGETS
// =============================================================

(function () {
  'use strict';

  // ============================================================
  // §0. AI GENERATOR MARKER — для отслеживания источника
  // ============================================================
  var AI_GENERATOR = {
    name:            'MiniMax Agent',
    generator:      'MiniMax',
    version:         '1.0.0',
    template:        'UNIVERSAL_TEMPLATE',
    template_version:'1.4.0',
    generated:       '2026-04-29',
    purpose:         'adultjs_parser',
  };

  // ============================================================
  // §0.1. МИНИМАЛЬНАЯ ВЕРСИЯ ЯДРА
  // ============================================================
  var MIN_CORE_VERSION = '1.6.0';

  function checkCoreVersion() {
    if (window.AdultPlugin && window.AdultPlugin.coreVersion) {
      var coreVer = window.AdultPlugin.coreVersion;
      if (coreVer < MIN_CORE_VERSION) {
        console.warn('[UNIVERSAL_TEMPLATE] AdultJS ' + coreVer + ' устарел. Рекомендуется обновить до ' + MIN_CORE_VERSION);
        return false;
      }
    }
    return true;
  }

  // ============================================================
  // §0.2. DEBUG НАСТРОЙКИ
  // ============================================================
  var DEBUG_MODE    = true;   // ← false чтобы отключить весь debug
  var DEBUG_COLORS   = true;   // ← false чтобы отключить цвета
  var DEBUG_ROADMAP  = true;   // ← false чтобы отключить roadmap
  var DEBUG_URL_LEN  = 100;    // ← макс. длина URL в логах

  // ============================================================
  // §0.3. Цветные логи
  // ============================================================
  function log() {
    if (!DEBUG_MODE) return;
    var args = Array.prototype.slice.call(arguments);
    console.log.apply(console, args);
  }

  function logError(tag, msg) {
    if (!DEBUG_MODE) return;
    if (DEBUG_COLORS) {
      console.log('%c[' + tag + ' ERROR]%c ' + msg, 'color:#ff4444;font-weight:bold', 'color:#ff6666');
    } else {
      console.log('[' + tag + ' ERROR] ' + msg);
    }
  }

  function logWarn(tag, msg) {
    if (!DEBUG_MODE) return;
    if (DEBUG_COLORS) {
      console.log('%c[' + tag + ' WARN]%c ' + msg, 'color:#ffaa00;font-weight:bold', 'color:#ffdd44');
    } else {
      console.log('[' + tag + ' WARN] ' + msg);
    }
  }

  function logSuccess(tag, msg) {
    if (!DEBUG_MODE) return;
    if (DEBUG_COLORS) {
      console.log('%c[' + tag + ' OK]%c ' + msg, 'color:#44ff44;font-weight:bold', 'color:#88ff88');
    } else {
      console.log('[' + tag + ' OK] ' + msg);
    }
  }

  function logInfo(tag, msg) {
    if (!DEBUG_MODE) return;
    if (DEBUG_COLORS) {
      console.log('%c[' + tag + ']%c ' + msg, 'color:#44aaff;font-weight:bold', 'color:#88ccff');
    } else {
      console.log('[' + tag + '] ' + msg);
    }
  }

  // ----------------------------------------------------------
  // truncate — обрезает длинные URL для логов
  // ----------------------------------------------------------
  function truncate(str, len) {
    len = len || DEBUG_URL_LEN;
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  }

  // ----------------------------------------------------------
  // debugReport — table-like вывод паттернов
  // ----------------------------------------------------------
  function debugReport(html, url, tag) {
    if (!DEBUG_MODE) return;
    tag = tag || TAG;
    var htmlSize = html ? html.length : 0;

    var patterns = [
      ['source_tag',     (html || '').match(/<source/gi)          || []],
      ['og_video',       (html || '').match(/og:video/gi)             || []],
      ['mp4',           (html || '').match(/\.mp4/gi)             || []],
      ['m3u8',          (html || '').match(/\.m3u8/gi)            || []],
      ['video_url',     (html || '').match(/video_url/gi)             || []],
      ['flowplayer',    (html || '').match(/flowplayer/gi)            || []],
      ['html5player',   (html || '').match(/html5player/gi)           || []],
      ['dataEncodings', (html || '').match(/dataEncod/gi)            || []],
      ['get_file',      (html || '').match(/get_file/gi)              || []],
      ['kt_player',     (html || '').match(/kt_player/gi)            || []],
      ['function/0',    (html || '').match(/function\/0/gi)           || []],
      ['Plyr',          (html || '').match(/Plyr\.js|new\s+Plyr/gi)  || []],
      ['Flashvars',     (html || '').match(/flashvars/gi)              || []],
      ['JSON-LD',       (html || '').match(/application\/ld\+json/gi)  || []],
    ];

    console.log('─'.repeat(60));
    logInfo(tag, '=== DEBUG REPORT ===');
    logInfo(tag, 'URL: ' + truncate(url, DEBUG_URL_LEN));
    logInfo(tag, 'HTML size: ' + htmlSize + ' bytes');
    console.log('─'.repeat(60));

    console.log('%c' + padRight('PATTERN', 22) + padRight('COUNT', 8) + 'STATUS',
      'color:#888;font-weight:bold');
    console.log('─'.repeat(40));

    patterns.forEach(function(p) {
      var name = p[0];
      var cnt  = p[1].length;
      var status = cnt > 0 ? 'FOUND' : 'none';
      var color  = cnt > 0 ? 'color:#44ff44' : 'color:#666';
      console.log('%c' + padRight(name, 22) + padRight(cnt, 8) + status, color);
    });

    console.log('─'.repeat(60));
  }

  function padRight(str, len) {
    str = String(str);
    while (str.length < len) str += ' ';
    return str.substring(0, len);
  }

  // ============================================================
  // §1. КОНФИГ — ЗАПОЛНИТЕ ДЛЯ СВОЕГО САЙТА
  // ============================================================

  var SITE_NAME = 'winporn.com';              // ← Название сайта (латиница, для меню)
  var HOST      = 'https://www.winporn.com';   // ← Полный URL сайта

  // ----------------------------------------------------------
  // §1.1. NAME GENERATOR — автогенерация из HOST
  //
  // Правило: NAME = первая_буква + 4 символа из оставшейся части
  //
  // Примеры:
  //   https://zbporn.com      → z + bpor = zbpor
  //   https://mylust.com      → m + ylus = mylus
  //   https://winporn.club    → w + inpo = winpo
  //   https://pornobriz.com   → p + orno = porno
  //   https://anysex.com      → a + nyse = anyse
  // ----------------------------------------------------------
  function generateNameFromHost(host) {
    // Извлекаем домен
    var domain = host.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');

    // Убираем TLD (.com, .xxx, .net, .win, .me, .club, .top и т.д.)
    domain = domain.replace(/\.(com|xxx|net|win|me|club|top|ru|org|info|adult|porn|sex|tube|online|site)\s*$/i, '');

    // Если < 5 букв — берём всё, если >= 5 — [0] + [1:5]
    var name = domain.length <= 5
      ? domain
      : domain[0] + domain.substring(1, 5);

    return name;
  }

  // Генерируем NAME автоматически
  var NAME    = generateNameFromHost(HOST);
  var VERSION = '1.0.0';   // ← Версия парсера (меняйте при обновлениях)
  var TAG     = '[' + NAME + ']';

  // ============================================================
  // §1.2. ПРОВЕРКА СОВМЕСТИМОСТИ С ЯДРОМ
  // ============================================================
  if (window.AdultPlugin) {
    window.AdultPlugin.coreVersion = window.AdultPlugin.coreVersion || '1.0.0';
  }

  // Проверяем версию ядра при загрузке
  (function initCheck() {
    var checkDone = false;
    function doCheck() {
      if (checkDone) return;
      if (!window.AdultPlugin) return;
      checkDone = true;
      if (!checkCoreVersion()) {
        logWarn(TAG, 'Core version check: MIN=' + MIN_CORE_VERSION);
      } else {
        logInfo(TAG, 'Core version check: OK (' + MIN_CORE_VERSION + '+');
      }
    }
    // Проверяем сразу и через 500ms (на случай асинхронной загрузки)
    setTimeout(doCheck, 100);
    setTimeout(doCheck, 500);
  })();

  // Правила извлечения видео — порядок = приоритет
  var VIDEO_RULES = [
  ];

  // ============================================================
  // §2. КАТЕГОРИИ — ЗАМЕНИТЕ СВОИМИ
  // ============================================================

  var CATEGORIES = // [RESERVED FOR MANUAL EDIT];

  // ============================================================
  // §2.1. КАНАЛЫ — необязательно, пример
  // ============================================================

  var CHANNELS = [
    { title: 'Channels',  slug: 'channels' },
    { title: 'Brazzers',  slug: 'brazzers' },
  ];

  // ============================================================
  // §3. ТРАНСПОРТ — не трогать
  // ============================================================

  function httpGet(url, success, error) {
    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, success, error);
    } else {
      fetch(url)
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.text();
        })
        .then(success)
        .catch(error);
    }
  }

  function httpGetJson(url, success, error) {
    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, function (text) {
        try { success(JSON.parse(text)); } catch (e) { error('JSON parse: ' + e.message); }
      }, error);
    } else {
      fetch(url).then(function (r) { return r.json(); }).then(success).catch(error);
    }
  }

  function getWorkerBase() {
    var base = 'https://zonaproxy.777b737.workers.dev';
    if (window.AdultPlugin && window.AdultPlugin.workerUrl) {
      base = window.AdultPlugin.workerUrl;
    }
    return base.replace(/[/?&]url=?$/, '').replace(/\/+$/, '');
  }

  // ============================================================
  // §4. cleanUrl — УНИВЕРСАЛЬНАЯ ОЧИСТКА URL
  // ============================================================

  function cleanUrl(raw) {
    if (!raw) return '';

    try {
      var u = raw;

      // 1. Убираем экранированные слеши (\/) — встречается в JS-конфигах
      u = u.replace(/\\\//g, '/');

      // 2. Убираем обычные backslash — xv-ru, p365
      u = u.replace(/\\/g, '');

      // 3. URL-decode если есть %-последовательности — xv-ru, ptop
      if (u.indexOf('%') !== -1) {
        try { u = decodeURIComponent(u); } catch (e) {}
      }

      // 4. Проверка на Base64 (короткие закодированные ссылки)
      if (u.indexOf('/') === -1 && u.length > 20 && /^[a-zA-Z0-9+/]+=*$/.test(u)) {
        try {
          var decoded = atob(u);
          if (decoded.indexOf('http') === 0) u = decoded;
        } catch (e) {}
      }

      // 5. Protocol-relative → добавляем https:
      if (u.indexOf('//') === 0) u = 'https:' + u;

      // 6. function/N/URL паттерн (hdtub, trh)
      var funcMatch = u.match(/^https?:\/\/[^/]+\/function\/\d+\/(https?:\/\/.+)$/);
      if (funcMatch) { u = funcMatch[1]; }
      var funcRel = u.match(/^\/??function\/\d+\/(https?:\/\/.+)$/);
      if (funcRel) { u = funcRel[1]; }

      // 7. Root-relative → добавляем HOST
      if (u.charAt(0) === '/' && u.charAt(1) !== '/') u = HOST + u;

      // 8. Просто относительный → добавляем HOST/
      if (u.length > 0 && u.indexOf('http') !== 0 && u.charAt(0) !== '/') {
        u = HOST + '/' + u;
      }

      return u;
    } catch (e) {
      return raw;
    }
  }

  function cleanMp4Url(url) {
    return url
      .replace(/[?&]rnd=\d+/g, '')
      .replace(/[?&]br=\d+/g, '')
      .replace(/[?&]_=\d+/g, '')
      .replace(/[?&]+$/g, '')
      .replace(/\/+$/, '')
      + '/';
  }

  function normalizeLabel(label, url) {
    if (!url) return label;
    if (url.indexOf('_1080p') !== -1) return '1080p';
    if (url.indexOf('_720p')  !== -1) return '720p';
    if (url.indexOf('_480p')  !== -1) return '480p';
    if (url.indexOf('_360p')  !== -1) return '360p';
    if (url.indexOf('_240p')  !== -1) return '240p';
    return label;
  }

  // ============================================================
  // §5. extractQualities — ПОЛНЫЙ ПЕРЕБОР СТРАТЕГИЙ
  //
  // 4-tier система (от простого к сложному):
  // Block 1 (⭐ Simple):      S1-S7
  // Block 2 (⭐⭐ Medium):    S8-S17
  // Block 3 (⭐⭐⭐ Complex): S18-S25
  // Block 4 (⭐⭐⭐⭐ Heavy): S26-S28
  // ============================================================

  function extractQualities(html) {
    var q    = {};
    var have = function () { return Object.keys(q).length > 0; };
    var add  = function (label, url) {
      var u = cleanUrl(url);
      if (!u || u.indexOf('{') !== -1 || u.indexOf('spacer') !== -1) return;
      var normLabel = normalizeLabel(label, u);
      if (!q[normLabel]) q[normLabel] = u;
    };

    var m, checked = [];

    // ================================================================
    // BLOCK 1 (⭐ Simple): S1-S7
    // ================================================================

    // S1. VIDEO_RULES
    var s1count = 0;
    VIDEO_RULES.forEach(function (rule) {
      m = html.match(rule.re);
      if (m && m[1]) { add(rule.label, m[1]); s1count++; }
    });
    checked.push({ s: 1, name: 'VIDEO_RULES', found: s1count > 0, detail: s1count + ' matches' });

    // S2. Прямые mp4 без шаблонов
    var s2count = 0;
    if (!have()) {
      var allMp4 = html.match(/https?:\/\/[^"'\s<>]+\.mp4[^"'\s<>]*/gi);
      if (allMp4) {
        allMp4.forEach(function (u, i) {
          if (u.indexOf('{') !== -1) return;
          var qm2 = u.match(/_(\d+)\.mp4/);
          add(qm2 ? qm2[1] + 'p' : ('HD' + (i || '')), u);
          s2count++;
        });
      }
    }
    checked.push({ s: 2, name: 'direct mp4', found: have(), detail: s2count + ' found' });

    // S3. og:video meta mp4
    var s3count = 0;
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
          s3count++;
        });
      }
    }
    checked.push({ s: 3, name: 'og:video', found: have(), detail: s3count + ' found' });

    // S4. HLS m3u8
    var s4found = false;
    if (!have()) {
      var mHls77 = html.match(/"(https?:\/\/hls[^"]+\.m3u8[^"]*)"/);
      if (mHls77) { add('HLS', mHls77[1]); s4found = true; }

      if (!have()) {
        var mHlsYj = html.match(/((?:https?:)?\/\/abre-videos\.[^"'\s]+\.m3u8[^"'\s]*)/);
        if (mHlsYj) { add('HLS', mHlsYj[1]); s4found = true; }
      }

      if (!have()) {
        var mHlsAny = html.match(/['"]?(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*?)['"]?/);
        if (mHlsAny) { add('HLS', mHlsAny[1]); s4found = true; }
      }
    }
    checked.push({ s: 4, name: 'HLS m3u8', found: have(), detail: s4found ? 'found' : 'none' });

    // S5. get_file URL fallback
    var s5count = 0;
    if (!have()) {
      var getFileRe = /(https?:\/\/[^"'\s]+\/get_file\/[^"'\s]+\.mp4[^"'\s]*)/g;
      var gf, gfCount = 0;
      while ((gf = getFileRe.exec(html)) !== null && gfCount < 5) {
        if (gf[1].indexOf('preview') !== -1) continue;
        var gfQ = gf[1].match(/_(\d+)\.mp4/);
        add(gfQ ? gfQ[1] + 'p' : ('auto' + gfCount), gf[1]);
        s5count++;
        gfCount++;
      }
    }
    checked.push({ s: 5, name: 'get_file', found: have(), detail: s5count + ' found' });

    // S6. <source src="..." size="480">
    var s6count = 0;
    if (!have()) {
      var re2a = /<source[^>]+src="([^"]+)"[^>]+size="([^"]+)"/gi;
      var re2b = /<source[^>]+size="([^"]+)"[^>]+src="([^"]+)"/gi;
      while ((m = re2a.exec(html)) !== null) {
        if (m[2] !== 'preview' && m[1].indexOf('.mp4') !== -1) { add(m[2] + 'p', m[1]); s6count++; }
      }
      if (!have()) {
        while ((m = re2b.exec(html)) !== null) {
          if (m[1] !== 'preview' && m[2].indexOf('.mp4') !== -1) { add(m[1] + 'p', m[2]); s6count++; }
        }
      }
    }
    checked.push({ s: 6, name: '<source size>', found: have(), detail: s6count + ' found' });

    // S7. <source src="..." label="480p">
    var s7count = 0;
    if (!have()) {
      var re3a = /<source[^>]+src="([^"]+)"[^>]+label="([^"]+)"/gi;
      var re3b = /<source[^>]+label="([^"]+)"[^>]+src="([^"]+)"/gi;
      while ((m = re3a.exec(html)) !== null) {
        if (m[1].indexOf('.mp4') !== -1) { add(m[2], m[1]); s7count++; }
      }
      if (!have()) {
        while ((m = re3b.exec(html)) !== null) {
          if (m[2].indexOf('.mp4') !== -1) { add(m[1], m[2]); s7count++; }
        }
      }
    }
    checked.push({ s: 7, name: '<source label>', found: have(), detail: s7count + ' found' });

    // ================================================================
    // BLOCK 2 (⭐⭐ Medium): S8-S17
    // ================================================================

    // S8. DOMParser source[title/label/size]
    var s8count = 0;
    if (!have()) {
      try {
        var doc     = new DOMParser().parseFromString(html, 'text/html');
        var sources = doc.querySelectorAll('video source[src]');
        for (var si = 0; si < sources.length; si++) {
          var src   = sources[si].getAttribute('src')   || '';
          var slbl  = sources[si].getAttribute('title') ||
                      sources[si].getAttribute('label') ||
                      sources[si].getAttribute('size')  || 'auto';
          if (!src || src.indexOf('blob:') === 0) continue;
          var skey = (slbl.toLowerCase() === 'auto') ? 'auto' : slbl;
          add(skey, src);
          s8count++;
        }
      } catch (e) { logWarn(TAG, 'S8 DOMParser: ' + e.message); }
    }
    checked.push({ s: 8, name: 'DOMParser', found: have(), detail: s8count + ' sources' });

    // S9. dataEncodings JSON
    var s9count = 0;
    if (!have()) {
      try {
        var idx = html.indexOf('dataEncodings');
        if (idx !== -1) {
          var arrStart = html.indexOf('[', idx);
          if (arrStart !== -1) {
            var depth = 0, arrEnd = -1;
            for (var ci = arrStart; ci < html.length; ci++) {
              if      (html[ci] === '[') depth++;
              else if (html[ci] === ']') { depth--; if (depth === 0) { arrEnd = ci; break; } }
            }
            if (arrEnd !== -1) {
              var dataEnc = JSON.parse(html.substring(arrStart, arrEnd + 1));
              dataEnc.forEach(function (enc) {
                if (!enc.filename) return;
                var dkey = (String(enc.quality).toLowerCase() === 'auto') ? 'auto' : (enc.quality + 'p');
                add(dkey, enc.filename.replace(/\\\//g, '/'));
                s9count++;
              });
            }
          }
        }
      } catch (e) { logWarn(TAG, 'S9 dataEncodings: ' + e.message); }
    }
    checked.push({ s: 9, name: 'dataEncodings', found: have(), detail: s9count + ' entries' });

    // S10. html5player.setVideoUrl*
    if (!have()) {
      var mH = html.match(/html5player\.setVideoUrlHigh\(['"]([^'"]+)['"]\)/);
      var mL = html.match(/html5player\.setVideoUrlLow\(['"]([^'"]+)['"]\)/);
      if (mH) add('720p', mH[1]);
      if (mL) add('480p', mL[1]);
    }
    checked.push({ s: 10, name: 'html5player', found: have(), detail: have() ? 'found' : 'none' });

    // S11. flowplayer playlist/conf/clip
    var s11found = false;
    if (!have()) {
      try {
        var fpRe1 = /playlist\s*:\s*\[(\{[\s\S]+?\})\]/i;
        var fp1   = html.match(fpRe1);
        if (fp1) {
          var plRaw = '[' + fp1[1] + ']';
          var pl    = JSON.parse(plRaw.replace(/\\\//g, '/'));
          pl.forEach(function (clip) {
            (clip.sources || []).forEach(function (s) {
              var u = cleanUrl(s.src || s.file || s.url || '');
              if (!u || u.indexOf('http') !== 0) return;
              var lbl = String(s.label || s.quality || 'HD');
              if (/^\d+$/.test(lbl)) lbl = lbl + 'p';
              if (!q[lbl]) q[lbl] = u;
            });
            if (clip.url && !have()) {
              var u = cleanUrl(clip.url);
              if (u && u.indexOf('http') === 0 && !q['HD']) q['HD'] = u;
            }
          });
          s11found = true;
        }
      } catch (e) {}

      if (!have()) {
        try {
          var clipRe = /clip\s*:\s*\{[^}]*url\s*:\s*['"]([^'"]+)['"]/i;
          var cm     = html.match(clipRe);
          if (cm && cm[1]) {
            var u = cleanUrl(cm[1]);
            if (u && u.indexOf('http') === 0 && !q['HD']) q['HD'] = u;
            s11found = true;
          }
        } catch (e) {}
      }

      if (!have()) {
        try {
          var confRe = /flowplayer\s*\(\s*[^,]+,\s*(\{[\s\S]+?\})\s*\)/;
          var confM  = html.match(confRe);
          if (confM) {
            var cfg = JSON.parse(confM[1].replace(/\\\//g, '/'));
            var clips = (cfg.playlist || [cfg.clip] || []);
            clips.forEach(function (clip) {
              if (!clip) return;
              (clip.sources || []).forEach(function (s) {
                var u = cleanUrl(s.src || s.file || '');
                if (!u || u.indexOf('http') !== 0) return;
                var lbl = String(s.label || 'HD');
                if (/^\d+$/.test(lbl)) lbl = lbl + 'p';
                if (!q[lbl]) q[lbl] = u;
              });
              if (clip.url && !have()) {
                var u = cleanUrl(clip.url);
                if (u && u.indexOf('http') === 0) q['HD'] = u;
              }
            });
            s11found = true;
          }
        } catch (e) {}
      }
    }
    checked.push({ s: 11, name: 'flowplayer', found: have(), detail: s11found ? 'found' : 'none' });

    // S12. KVS multi-url video_url_*
    var s12count = 0;
    if (!have()) {
      try {
        var patterns = [
          /video_url\s*[:=]\s*['"]([^'"]+)['"]/i,
          /video_url_text\s*[:=]\s*['"]([^'"]+)['"]/i,
          /"video_url"\s*:\s*"([^"]+)"/i,
        ];
        for (var pi = 0; pi < patterns.length; pi++) {
          var pm = html.match(patterns[pi]);
          if (pm && pm[1]) {
            var u = cleanUrl(pm[1]);
            if (u && u.indexOf('http') === 0) {
              if (!q['High Quality']) q['High Quality'] = u;
              var qlm = u.match(/_(\d+p?)\.mp4/i);
              if (qlm && !q[qlm[1]]) q[qlm[1]] = u;
              s12count++;
              break;
            }
          }
        }

        var resRe = /video_url_(\w+)\s*[:=]\s*['"]([^'"]+)['"]/gi;
        var rm;
        while ((rm = resRe.exec(html)) !== null) {
          var url = cleanUrl(rm[2]);
          if (url && url.indexOf('http') === 0 && !q[rm[1]]) { q[rm[1]] = url; s12count++; }
        }
      } catch (e) { logWarn(TAG, 'S12 KVS: ' + e.message); }
    }
    checked.push({ s: 12, name: 'KVS video_url_*', found: have(), detail: s12count + ' fields' });

    // S13. data-config атрибуты
    if (!have()) {
      var dataConfigs = html.match(/data-(?:config|video|sources|player)=['"]([^"']+)['"]/gi);
      if (dataConfigs) {
        dataConfigs.forEach(function(cfg) {
          try {
            var m2 = cfg.match(/['"]([^"']+)['"]/);
            if (m2 && m2[1] && m2[1].match(/https?:\/\/.+\.(mp4|m3u8|webm)/i)) {
              add('auto', cleanUrl(m2[1]));
            }
          } catch(e) {}
        });
      }
    }
    checked.push({ s: 13, name: 'data-config', found: have(), detail: have() ? 'found' : 'none' });

    // S14. video.js data-setup
    if (!have()) {
      var vsMatch = html.match(/data-setup=['"]([^"']+)['"]/i);
      if (vsMatch) {
        try {
          var cfg = JSON.parse(vsMatch[1].replace(/'/g, '"'));
          if (cfg.sources) cfg.sources.forEach(function(s) { add('auto', s.src); });
        } catch(e) {}
      }
    }
    checked.push({ s: 14, name: 'video.js', found: have(), detail: have() ? 'found' : 'none' });

    // S15. Plyr player config
    var s15count = 0;
    if (!have()) {
      var plyrMatch = html.match(/(?:new\s+Plyr|Plyr\.setup)\s*\([^,]+,\s*(\{[\s\S]+?\})\s*\)/i);
      if (plyrMatch) {
        try {
          var plyrCfg = JSON.parse(plyrMatch[1].replace(/\\\//g, '/'));
          var plyrSrc = plyrCfg.sources || (plyrCfg.source ? [plyrCfg.source] : []);
          plyrSrc.forEach(function(s) {
            if (typeof s === 'string') { add('auto', cleanUrl(s)); s15count++; }
            else if (s.src) { add(s.label || 'auto', s.src); s15count++; }
          });
        } catch(e) {}
      }

      if (!have()) {
        var plyrData = html.match(/data-plyr-video-id=['"]([^"']+)['"]/gi);
        if (plyrData) {
          plyrData.forEach(function(d) {
            var m = d.match(/=['"]([^"']+)['"]/);
            if (m && m[1]) { add('auto', cleanUrl(m[1])); s15count++; }
          });
        }
      }
    }
    checked.push({ s: 15, name: 'Plyr player', found: have(), detail: s15count + ' sources' });

    // S16. JW Player setup
    var s16count = 0;
    if (!have()) {
      var jwSetup = html.match(/jwplayer\s*\([^)]*\)\s*\.\s*setup\s*\(\s*(\{[\s\S]+?\})\s*\)/i);
      if (jwSetup) {
        try {
          var jwCfg = JSON.parse(jwSetup[1].replace(/\\\//g, '/'));
          var jwSrc = jwCfg.sources || [];
          jwSrc.forEach(function(s) {
            if (typeof s === 'string') { add('HD', cleanUrl(s)); s16count++; }
            else if (s.file) { add(s.label || 'auto', s.file); s16count++; }
          });
        } catch(e) {}
      }
    }
    checked.push({ s: 16, name: 'JW Player', found: have(), detail: s16count + ' sources' });

    // S17. Flashvars
    var s17count = 0;
    if (!have()) {
      var flashvarsMatch = html.match(/flashvars\s*[:=]\s*\{([^}]+)\}/gi);
      if (flashvarsMatch) {
        flashvarsMatch.forEach(function(fv) {
          try {
            var vu = fv.match(/(?:video_url|file|src)\s*[:=]\s*['"]([^'"]+)['"]/i);
            if (vu && vu[1]) { add('HD', cleanUrl(vu[1])); s17count++; }
          } catch(e) {}
        });
      }

      if (!have()) {
        var flashEmbed = html.match(/<embed[^>]+src="([^"]+\.(?:mp4|flv|swf)[^"]*)"[^>]*>/gi);
        if (flashEmbed) {
          flashEmbed.forEach(function(e) {
            var m = e.match(/src="([^"]+)"/);
            if (m) { add('auto', cleanUrl(m[1])); s17count++; }
          });
        }
      }
    }
    checked.push({ s: 17, name: 'Flashvars', found: have(), detail: s17count + ' found' });

    // ================================================================
    // BLOCK 3 (⭐⭐⭐ Complex): S18-S25
    // ================================================================

    // S18. JSON-LD Schema.org
    if (!have()) {
      var ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
      if (ldMatch) {
        try {
          var ld = JSON.parse(ldMatch[1]);
          if (ld.video && ld.video.contentUrl) add('HD', ld.video.contentUrl);
          if (ld.url && ld.url.match(/\.mp4|\.m3u8/)) add('HD', ld.url);
        } catch(e) {}
      }
    }
    checked.push({ s: 18, name: 'JSON-LD', found: have(), detail: have() ? 'found' : 'none' });

    // S19. DASH .mpd manifest
    if (!have()) {
      var mpdMatch = html.match(/['"]?(https?:\/\/[^"'\s]+\.mpd[^"'\s]*?)['"]?/i);
      if (mpdMatch) add('DASH', mpdMatch[1]);
    }
    checked.push({ s: 19, name: 'DASH mpd', found: have(), detail: have() ? 'found' : 'none' });

    // S20. Cloudflare Stream
    if (!have()) {
      var cfMatch = html.match(/https?:\/\/[^"'\s]*\.cloudflarestream\.com[^"'\s]*/gi);
      if (cfMatch) {
        cfMatch.forEach(function(u) { add('auto', u); });
      }
    }
    checked.push({ s: 20, name: 'CF Stream', found: have(), detail: have() ? 'found' : 'none' });

    // S21. 302 redirect follow
    if (!have()) {
      var redirects = html.match(/window\.location\s*=\s*['"]([^'"]+)['"]/gi);
      if (redirects) {
        redirects.forEach(function(r) {
          var m = r.match(/['"](https?:\/\/[^'"]+)['"]/);
          if (m) add('auto', m[1]);
        });
      }
    }
    checked.push({ s: 21, name: 'redirect', found: have(), detail: have() ? 'found' : 'none' });

    // S22. .ts segments fallback
    if (!have()) {
      var tsMatch = html.match(/https?:\/\/[^"'\s]+\.ts[^"'\s]*/gi);
      if (tsMatch && tsMatch[0]) {
        add('auto', tsMatch[0].replace(/\/[^\/]+\.ts/, '/playlist.m3u8'));
      }
    }
    checked.push({ s: 22, name: '.ts segments', found: have(), detail: have() ? 'found' : 'none' });

    // S23. PostMessage API
    if (!have()) {
      var pmMatch = html.match(/postMessage\s*\(\s*['"]([^'"]+)['"]/gi);
      if (pmMatch) {
        pmMatch.forEach(function(p) {
          var m = p.match(/['"](https?:\/\/[^'"]+)['"]/);
          if (m) add('auto', m[1]);
        });
      }
    }
    checked.push({ s: 23, name: 'PostMessage', found: have(), detail: have() ? 'found' : 'none' });

    // S24. JWT/Base64 decode
    if (!have()) {
      var jwtMatch = html.match(/(?:token|jwt|auth)\s*[:=]\s*['"]([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)['"]/gi);
      if (jwtMatch) {
        jwtMatch.forEach(function(t) {
          var m = t.match(/['"]([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)['"]/);
          if (m) {
            try {
              var payload = m[1].split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
              var decoded = JSON.parse(atob(payload));
              if (decoded.url) add('auto', decoded.url);
            } catch(e) {}
          }
        });
      }
    }
    checked.push({ s: 24, name: 'JWT decode', found: have(), detail: have() ? 'found' : 'none' });

    // S25. JS object video
    if (!have()) {
      var jsVideo = html.match(/var\s+(\w+)\s*=\s*\{[^}]*(?:src|file|url)\s*[:=]\s*['"]([^'"]+)['"][^}]*\}/gi);
      if (jsVideo) {
        jsVideo.forEach(function(v) {
          var m = v.match(/(?:src|file|url)\s*[:=]\s*['"]([^'"]+\.(?:mp4|m3u8)[^'"]*)['"]/i);
          if (m) add('auto', cleanUrl(m[1]));
        });
      }
    }
    checked.push({ s: 25, name: 'JS object', found: have(), detail: have() ? 'found' : 'none' });

    // ================================================================
    // BLOCK 4 (⭐⭐⭐⭐ Heavy): S26-S28
    // ================================================================

    // S26. MediaSource API
    if (!have()) {
      var mediaMatch = html.match(/MediaSource\s*\(/gi);
      if (mediaMatch) {
        logWarn(TAG, 'S26: MediaSource API detected — requires Worker');
      }
    }
    checked.push({ s: 26, name: 'MediaSource', found: false, detail: 'requires Worker' });

    // S27. Lazy video data-src
    var s27count = 0;
    if (!have()) {
      try {
        var doc2 = new DOMParser().parseFromString(html, 'text/html');
        var lazyVid = doc2.querySelectorAll('video[data-src], video[data-lazy-src], video[data-video-src]');
        for (var li = 0; li < lazyVid.length; li++) {
          var ls = lazyVid[li].getAttribute('data-src') ||
                   lazyVid[li].getAttribute('data-lazy-src') ||
                   lazyVid[li].getAttribute('data-video-src');
          if (ls) { add('auto', ls); s27count++; }
        }
      } catch(e) {}
    }
    checked.push({ s: 27, name: 'Lazy video', found: have(), detail: s27count + ' found' });

    // S28. API endpoints
    if (!have()) {
      var apiMatch = html.match(/(?:api|endpoint|video)\s*[:=]\s*['"]([^'"]*\/api\/[^'"]+)['"]/gi);
      if (apiMatch) {
        apiMatch.forEach(function(a) {
          var m = a.match(/['"]([^'"]+)['"]/);
          if (m) {
            httpGetJson(m[1], function(data) {
              if (data && data.url) add('auto', data.url);
              if (data && data.sources) data.sources.forEach(function(s) { add('auto', s); });
            }, function() {});
          }
        });
      }
    }
    checked.push({ s: 28, name: 'API endpoint', found: have(), detail: have() ? 'found' : 'none' });

    return { qualities: q, checked: checked };
  }

  // ============================================================
  // §6. ПАРСИНГ КАРТОЧЕК
  // ============================================================

  var CARD_SELECTORS = [
    '.video-block', '.video-item', 'div.thumb_main', '.thumb',
    '.thumb-item', '.item', 'article.video', '.video-thumb', '.video',
  ];

  function getPicture(imgEl) {
    if (!imgEl) return '';
    var pic = cleanUrl(
      imgEl.getAttribute('data-original') ||
      imgEl.getAttribute('data-src')      ||
      imgEl.getAttribute('data-lazy-src') ||
      imgEl.getAttribute('src')           || ''
    );
    if (pic && (pic.indexOf('spacer') !== -1 ||
                pic.indexOf('blank') !== -1  ||
                pic.indexOf('data:') === 0   ||
                pic.length < 10)) pic = '';
    return pic;
  }

  function slugToTitle(url) {
    if (!url) return '';
    var parts = url.replace(/\?.*/, '').replace(/\/+$/, '').split('/').filter(Boolean);
    var slug = parts[parts.length - 1] || '';
    if (/^\d+$/.test(slug) && parts.length > 1) {
      slug = parts[parts.length - 2] || '';
    }
    return slug.replace(/[-_]/g, ' ')
               .replace(/\b\w/g, function (l) { return l.toUpperCase(); })
               .trim();
  }

  function parsePlaylist(html) {
    var results = [];
    var doc     = new DOMParser().parseFromString(html, 'text/html');
    var items;

    for (var s = 0; s < CARD_SELECTORS.length; s++) {
      items = doc.querySelectorAll(CARD_SELECTORS[s]);
      if (items && items.length > 0) {
        logInfo(TAG, 'parsePlaylist: "' + CARD_SELECTORS[s] + '" found: ' + items.length);
        break;
      }
    }

    if (!items || items.length === 0) {
      logWarn(TAG, 'parsePlaylist: fallback a[href*="/video/"]');
      items = doc.querySelectorAll('a[href*="/video/"], a[href*="/videos/"]');
      for (var j = 0; j < items.length; j++) {
        var aEl  = items[j];
        var href = cleanUrl(aEl.getAttribute('href') || '');
        if (!href) continue;
        var picA = getPicture(aEl.querySelector('img'));
        var nameA = (aEl.getAttribute('title') || aEl.textContent || '').replace(/\s+/g, ' ').trim() || slugToTitle(href);
        results.push(makeCard(nameA, href, picA, ''));
      }
      logInfo(TAG, 'parsePlaylist fallback: ' + results.length + ' cards');
      return results;
    }

    for (var i = 0; i < items.length; i++) {
      var card = parseCard(items[i]);
      if (card) results.push(card);
    }

    logInfo(TAG, 'parsePlaylist: ' + results.length + ' cards');
    return results;
  }

  function parseCard(el) {
    var linkEl = el.querySelector('a[href*="/video/"]') ||
                 el.querySelector('a[href*="/videos/"]') ||
                 el.querySelector('a[href]');
    if (!linkEl) return null;

    var href = cleanUrl(linkEl.getAttribute('href') || '');
    if (!href) return null;

    var imgEl = el.querySelector('img');
    var pic   = getPicture(imgEl);

    var titleEl = el.querySelector('.title, .th-title, .video-title a, .video-title, .itm-tit, a[title]');
    var name    = '';
    if (titleEl) name = (titleEl.getAttribute('title') || titleEl.textContent || '').trim();
    if (!name)   name = (linkEl.getAttribute('title') || '').trim();
    if (!name)   name = slugToTitle(href);
    name = name.replace(/[\t\n\r]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    if (!name) return null;

    var durEl = el.querySelector('.duration, .time, .length, span.time, .itm-dur');
    var time  = durEl ? durEl.textContent.replace(/[^\d:]/g, '').trim() : '';

    var vidEl   = el.querySelector('video[data-preview]') || el.querySelector('a[data-clip]');
    var preview = null;
    if (vidEl) {
      preview = cleanUrl(vidEl.getAttribute('data-preview') || vidEl.getAttribute('data-clip') || '');
    }

    return makeCard(name, href, pic, time, preview);
  }

  function makeCard(name, href, pic, time, preview) {
    return {
      name:             name,
      video:            href,
      picture:          pic,
      img:              pic,
      poster:           pic,
      background_image: pic,
      preview:          preview || null,
      time:             time  || '',
      quality:          'HD',
      json:             true,
      source:           NAME,
    };
  }

  // ============================================================
  // §7. URL BUILDER
  // ============================================================

  function buildUrl(type, value, page) {
    page = parseInt(page, 10) || 1;
    var url = HOST;

    if (type === 'search') {
      url += '/?q=' + encodeURIComponent(value);
      if (page > 1) url += '&page=' + page;
    } else if (type === 'cat') {
      url += '/category/' + value + (page > 1 ? '?page=' + page : '/');
    } else if (type === 'sort') {
      url += '/' + value + '/' + page + '.html';
    } else if (type === 'channel') {
      url += '/channels/' + value + (page > 1 ? '?page=' + page : '/');
    } else {
      if (page > 1) url += '/?page=' + page;
    }

    return url;
  }

  // ============================================================
  // §8. МЕНЮ
  // ============================================================

  function buildMenu() {
    var menu = [
      {
        title:        'Поиск',
        search_on:    true,
        playlist_url: NAME + '/search/',
      },
      {
        title:        'Новинки',
        playlist_url: NAME + '/new',
      },
      {
        title:        'Категории',
        playlist_url: 'submenu',
        submenu:      CATEGORIES.map(function (c) {
          return { title: c.title, playlist_url: NAME + '/cat/' + c.slug };
        }),
      },
    ];

    if (CHANNELS && CHANNELS.length > 0) {
      menu.push({
        title:        'Каналы',
        playlist_url: 'submenu',
        submenu:      CHANNELS.map(function (c) {
          return { title: c.title, playlist_url: NAME + '/channel/' + c.slug };
        }),
      });
    }

    return menu;
  }

  // ============================================================
  // §9. РОУТИНГ
  // ============================================================

  function routeView(url, page, success, error) {
    var fetchUrl;

    var searchMatch = url.match(/[?&]search=([^&]*)/);
    if (searchMatch) {
      fetchUrl = buildUrl('search', decodeURIComponent(searchMatch[1]), page);
      return loadPage(fetchUrl, page, success, error);
    }

    if (url.indexOf(NAME + '/cat/') === 0) {
      var cat = url.replace(NAME + '/cat/', '').split('?')[0];
      fetchUrl = buildUrl('cat', cat, page);
      return loadPage(fetchUrl, page, success, error);
    }

    if (url.indexOf(NAME + '/channel/') === 0) {
      var channel = url.replace(NAME + '/channel/', '').split('?')[0];
      fetchUrl = buildUrl('channel', channel, page);
      return loadPage(fetchUrl, page, success, error);
    }

    if (url.indexOf(NAME + '/sort/') === 0) {
      var sort = url.replace(NAME + '/sort/', '').split('?')[0];
      fetchUrl = buildUrl('sort', sort, page);
      return loadPage(fetchUrl, page, success, error);
    }

    if (url.indexOf(NAME + '/search/') === 0) {
      var rawQ = decodeURIComponent(url.replace(NAME + '/search/', '').split('?')[0]).trim();
      if (rawQ) {
        fetchUrl = buildUrl('search', rawQ, page);
        return loadPage(fetchUrl, page, success, error);
      }
    }

    loadPage(buildUrl('main', null, page), page, success, error);
  }

  function loadPage(fetchUrl, page, success, error) {
    logInfo(TAG, 'loadPage: ' + fetchUrl);
    httpGet(fetchUrl, function (html) {
      var results = parsePlaylist(html);
      if (!results.length) { error('Контент не найден'); return; }
      success({
        results:     results,
        collection:  true,
        total_pages: results.length >= 20 ? page + 1 : page,
        menu:        buildMenu(),
      });
    }, error);
  }

  // ============================================================
  // §10. ПАРСЕР API — публичный интерфейс
  // ============================================================

  var MyParser = {

    main: function (params, success, error) {
      routeView(NAME + '/new', 1, success, error);
    },

    view: function (params, success, error) {
      routeView(params.url || NAME, params.page || 1, success, error);
    },

    search: function (params, success, error) {
      var query = (params.query || '').trim();
      var page  = parseInt(params.page, 10) || 1;
      if (!query) {
        success({ title: '', results: [], collection: true, total_pages: 1 });
        return;
      }
      httpGet(buildUrl('search', query, page), function (html) {
        var results = parsePlaylist(html);
        success({
          title:       NAME.toUpperCase() + ': ' + query,
          results:     results,
          collection:  true,
          total_pages: results.length >= 20 ? page + 1 : page,
        });
      }, error);
    },

    qualities: function (videoPageUrl, success, error) {
      logInfo(TAG, 'qualities: ' + truncate(videoPageUrl, DEBUG_URL_LEN));

      httpGet(videoPageUrl, function (html) {
        logInfo(TAG, 'html size: ' + html.length + ' bytes');

        if (!html || html.length < 500) {
          logError(TAG, 'HTML too short (' + (html ? html.length : 0) + ' bytes)');
          logWarn(TAG, 'Possible causes:');
          logWarn(TAG, '  1. Age Gate - need Cookie: mature=1');
          logWarn(TAG, '  2. Cloudflare - need Worker with JS');
          logWarn(TAG, '  3. IP block - check HOST in config');
          logWarn(TAG, '  4. Redirect - page is not video');
          debugReport(html, videoPageUrl, TAG);
          error('HTML < 500 bytes');
          return;
        }

        var result = extractQualities(html);
        var found  = result.qualities;
        var keys   = Object.keys(found);

        if (DEBUG_ROADMAP) {
          console.log('─'.repeat(60));
          logInfo(TAG, '=== QUALITIES ROADMAP ===');
          result.checked.forEach(function(item) {
            var status = item.found ? 'FOUND' : '-';
            var color  = item.found ? 'color:#44ff44' : 'color:#888';
            console.log('%c S' + item.s + ' ' + padRight(item.name, 18) + status + '  ' + item.detail, color);
          });
          console.log('─'.repeat(60));
        }

        logInfo(TAG, 'Found ' + keys.length + ' quality: ' + JSON.stringify(keys));

        if (keys.length > 0) {
          keys.forEach(function (k) {
            if (found[k].indexOf('.mp4') !== -1 && found[k].indexOf('?') !== -1) {
              found[k] = cleanMp4Url(found[k]);
            }
          });
          success({ qualities: found });
        } else {
          debugReport(html, videoPageUrl, TAG);
          error('Video not found');
        }
      }, error);
    },
  };

  // ============================================================
  // §11. РЕГИСТРАЦИЯ
  // ============================================================

  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, MyParser);
      logSuccess(TAG, 'v' + VERSION + ' registered (AI: ' + AI_GENERATOR.name + ' ' + AI_GENERATOR.version + ')');
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
