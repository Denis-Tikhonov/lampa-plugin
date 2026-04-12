// =============================================================
// xv-ru.js — Парсер xv-ru.com для AdultJS / AdultPlugin (Lampa)
// Version  : 2.0.0
// Changed  :
//   [1.x.x] Предыдущие версии — XPath, thumbMap, _parseXvJson
//   [2.0.0] УНИФИКАЦИЯ: структура приведена к briz204 как эталону
//           — добавлен var VERSION, var NOTY_TIME
//           — добавлен safeParams() для диагностики
//           — httpGet: _native(), _reguest(), _fetch() — единая
//             трёхуровневая цепочка с форматом идентичным briz204
//           — WORKER_DEFAULT и getWorkerUrl() — единый формат
//           — notyOk/notyErr: формат TAG + иконка
//           — заголовок в едином формате
//           — таймаут native 9с (было 12с в _reguest)
//           — все специфичные алгоритмы xv-ru сохранены без изменений:
//             slugToName, _parseXvJson, _buildThumbMap, parseCategories,
//             getCategories, getStreamLinks, parsePlaylist
//
//   СТРУКТУРА САЙТА:
//     Карточки  : div.thumb (mozaique layout) — XPath → CSS → fallback
//     Постер    : window.xv.conf JSON → img[data-src] → noscript → outerHTML
//     Превью    : нет (null)
//     Название  : p.title → img[alt] → slug
//     Поиск     : HOST + '/?k={query}' (+ &top для сортировки)
//     Категории : динамические — парсятся со страницы /c
//     Сортировки: Новинки / Лучшее / Популярные / Длительные
//     Видео     : html5player.setVideoUrlHigh/Low/HLS → JSON → CDN regex
//
// Сайт     : https://www.xv-ru.com
// GitHub   : https://denis-tikhonov.github.io/plug/
// Worker   : https://zonaproxy.777b737.workers.dev/?url=
// =============================================================

(function () {
  'use strict';

  var HOST      = 'https://www.xv-ru.com';
  var NAME      = 'xv-ru';
  var TAG       = '[xv-ru]';
  var VERSION   = '2.0.0';
  var NOTY_TIME = 3000;

  // ----------------------------------------------------------
  // URL Cloudflare Worker
  // Приоритет: AdultPlugin.workerUrl → константа
  // ----------------------------------------------------------
  var WORKER_DEFAULT = 'https://zonaproxy.777b737.workers.dev/?url=';

  var REQUEST_HEADERS = {
    'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Cookie':          'static_cdn=1',
    'Referer':         HOST + '/',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  function getWorkerUrl() {
    var url = (window.AdultPlugin && window.AdultPlugin.workerUrl)
      ? window.AdultPlugin.workerUrl
      : WORKER_DEFAULT;
    if (url && url.charAt(url.length - 1) !== '=') url = url + '=';
    return url;
  }

  // ----------------------------------------------------------
  // ПОЛИФИЛЛЫ
  // ----------------------------------------------------------
  if (!Array.prototype.find) {
    Array.prototype.find = function (fn) {
      for (var i = 0; i < this.length; i++) {
        if (fn(this[i], i, this)) return this[i];
      }
    };
  }
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (s, p) {
      return this.indexOf(s, p || 0) === (p || 0);
    };
  }

  function forEachNode(list, fn) {
    if (!list) return;
    for (var i = 0; i < list.length; i++) fn(list[i], i);
  }

  function arrayFind(arr, fn) {
    if (!arr) return undefined;
    for (var i = 0; i < arr.length; i++) if (fn(arr[i], i)) return arr[i];
  }

  function safeParams(p) {
    if (!p) return '(null)';
    try { return JSON.stringify({ url: p.url||'', page: p.page||'', query: p.query||'' }); }
    catch(e) { return '(err)'; }
  }

  // ----------------------------------------------------------
  // ЛОГИРОВАНИЕ
  // ----------------------------------------------------------
  function log(m, d)  { console.log(TAG,   m, d !== undefined ? d : ''); }
  function warn(m, d) { console.warn(TAG,  m, d !== undefined ? d : ''); }
  function err(m, d)  { console.error(TAG, m, d !== undefined ? d : ''); }

  function notyErr(msg) {
    try { Lampa.Noty.show(TAG + ' ⛔ ' + msg, { time: NOTY_TIME, style: 'error' }); } catch(e) {}
  }
  function notyOk(msg) {
    try { Lampa.Noty.show(TAG + ' ✅ ' + msg, { time: NOTY_TIME }); } catch(e) {}
  }

  // [2.0.0] Метка времени для детальных логов httpGet
  function _ts() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' +
           ('0' + d.getMinutes()).slice(-2) + ':' +
           ('0' + d.getSeconds()).slice(-2) + '.' +
           ('00' + d.getMilliseconds()).slice(-3);
  }

  // ----------------------------------------------------------
  // СЕТЕВОЙ СЛОЙ
  // Приоритет: AdultPlugin.networkRequest → native+Worker → Reguest → fetch
  // (структура идентична briz204)
  // ----------------------------------------------------------

  function _native(url, ok, fail) {
    if (!Lampa.Network || typeof Lampa.Network.native !== 'function') {
      fail('no_native'); return;
    }
    var workerUrl = getWorkerUrl();
    var path = workerUrl + encodeURIComponent(url);
    var done = false;

    var tid = setTimeout(function () {
      if (done) return; done = true;
      warn('native timeout 9с → fallback Reguest');
      fail('timeout');
    }, 9000);

    try {
      Lampa.Network.native(path,
        function (r) {
          if (done) return; done = true; clearTimeout(tid);
          var t = (typeof r === 'string') ? r : JSON.stringify(r);
          if (t && t.indexOf('"status":403') !== -1) { fail('403'); return; }
          if (t && t.length > 50) ok(t); else fail('empty');
        },
        function (e) {
          if (done) return; done = true; clearTimeout(tid);
          var msg = (e && e.message) ? e.message : String(e||'');
          var st  = (e && e.status)  ? e.status  : 0;
          if (st === 403 || msg.indexOf('403') !== -1) { fail('403'); return; }
          fail(msg || 'native_err');
        },
        false, { headers: REQUEST_HEADERS }
      );
    } catch(ex) {
      if (done) return; done = true; clearTimeout(tid);
      fail(ex.message);
    }
  }

  function _reguest(url, ok, fail) {
    log('[' + _ts() + '] Reguest →', url.substring(0, 80));
    try {
      new Lampa.Reguest().silent(url,
        function (d) {
          var t = (typeof d === 'string') ? d : '';
          if (t.length > 50) ok(t); else fail('empty');
        },
        function (e) { fail(e || 'req_err'); },
        false, { dataType: 'text', timeout: 10000, headers: REQUEST_HEADERS }
      );
    } catch(ex) { fail(ex.message); }
  }

  function _fetch(url, ok, fail) {
    if (typeof fetch === 'undefined') { fail('no_fetch'); return; }
    log('[' + _ts() + '] fetch →', url.substring(0, 80));
    fetch(url, { method: 'GET', headers: REQUEST_HEADERS })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(ok)
      .catch(function (e) { fail(e.message || String(e)); });
  }

  function httpGet(url, ok, fail) {
    log('[' + _ts() + '] httpGet →', url.substring(0, 80));

    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, ok, fail, { type: 'html', headers: REQUEST_HEADERS });
      return;
    }

    _native(url, ok, function (e1) {
      log('native fail:', e1);
      _reguest(url, ok, function (e2) {
        log('reguest fail:', e2);
        _fetch(url, ok, function (e3) {
          err('ALL FAIL | native=' + e1 + ' req=' + e2 + ' fetch=' + e3);
          notyErr('Сайт недоступен');
          fail('all_failed');
        });
      });
    });
  }

  // ----------------------------------------------------------
  // _slugProcess
  // ----------------------------------------------------------
  function _slugProcess(slug) {
    if (!slug || slug.length < 3) return '';
    var words = slug.replace(/[-_]+/g, ' ').replace(/\.\s*$/, '').trim().split(' ');
    var result = [];
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (!w) continue;
      result.push(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    }
    return result.join(' ');
  }

  // ----------------------------------------------------------
  // slugToName — форматы A и B xv-ru
  // Формат A: /video.{hash}/{id}/{num}/{slug}
  // Формат B: /video.{hash}/{slug}  (quickies)
  // ----------------------------------------------------------
  function slugToName(href) {
    if (!href) return '';

    var mFull = href.match(/\/video\.[^\/]+\/\d+\/\d+\/([^\/\?#]+)/);
    if (mFull && mFull[1] && mFull[1].length >= 3) {
      return _slugProcess(mFull[1]);
    }

    var mShort = href.match(/\/video\.([^\/]+)\/([^\/\?#]+)$/);
    if (mShort && mShort[2] && mShort[2].length >= 3 && !/^\d+$/.test(mShort[2])) {
      return _slugProcess(mShort[2]);
    }

    var mThumb = href.match(/\/THUMBNUM\/([^\/\?#]+)/i);
    if (mThumb && mThumb[1] && mThumb[1].length >= 3) {
      return _slugProcess(mThumb[1]);
    }

    var parts = href.replace(/\/+$/, '').split('/');
    for (var i = parts.length - 1; i >= 0; i--) {
      var seg = parts[i];
      if (!seg) continue;
      if (/^\d+$/.test(seg)) continue;
      if (seg.toUpperCase() === 'THUMBNUM') continue;
      if (seg.indexOf('video.') === 0) continue;
      if (seg.length < 3) continue;
      return _slugProcess(seg);
    }

    return '';
  }

  // ----------------------------------------------------------
  // _parseXvJson — данные из window.xv.conf
  // ----------------------------------------------------------
  function _parseXvJson(html) {
    var map = {};

    var confMatch = html.match(/window\.xv\.conf\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (!confMatch || !confMatch[1]) {
      warn('_parseXvJson → window.xv.conf не найден');
      return map;
    }

    var conf;
    try {
      conf = JSON.parse(confMatch[1]);
    } catch (e) {
      warn('_parseXvJson → JSON.parse ошибка: ' + e.message + ', пробую regex...');
      return _parseXvJsonRegex(html, map);
    }

    var videos = [];
    try {
      var q = conf.data && conf.data.quickies && conf.data.quickies.videos;
      if (q) {
        if (q.H && q.H.length) videos = videos.concat(q.H);
        if (q.V && q.V.length) videos = videos.concat(q.V);
      }
    } catch (e) {
      warn('_parseXvJson → ошибка quickies: ' + e.message);
    }

    for (var i = 0; i < videos.length; i++) {
      var v = videos[i];
      if (!v.url || !v.thumb_url) continue;
      var vUrl    = v.url.replace(/^\//, '');
      var fullUrl = HOST + '/' + vUrl;
      map[fullUrl] = { thumb: v.thumb_url, title: v.title || '' };
    }

    log('_parseXvJson → JSON видео в Map:', Object.keys(map).length);
    return map;
  }

  function _parseXvJsonRegex(html, map) {
    var re = /"url"\s*:\s*"(\/video[^"]+)"[^}]*?"thumb_url"\s*:\s*"([^"]+)"/g;
    var m;
    var count = 0;
    while ((m = re.exec(html)) && count < 200) {
      var vUrl  = m[1].replace(/\\\//g, '/');
      var thumb = m[2].replace(/\\\//g, '/');
      map[HOST + vUrl] = { thumb: thumb, title: '' };
      count++;
    }
    log('_parseXvJsonRegex → найдено:', count);
    return map;
  }

  // ----------------------------------------------------------
  // _buildThumbMap — regex по HTML для xvideos-cdn.com
  // ----------------------------------------------------------
  function _buildThumbMap(html) {
    var map = {};
    var reFull = /"url"\s*:\s*"(\/video[^"]{5,})"(?:[^}]{0,500}?)"thumb_url"\s*:\s*"(https:\/\/[^"]+xvideos-cdn\.com[^"]+)"/g;
    var m;
    while ((m = reFull.exec(html))) {
      var url   = HOST + m[1].replace(/\\\//g, '/');
      var thumb = m[2].replace(/\\\//g, '/');
      if (!map[url]) map[url] = thumb;
    }
    log('_buildThumbMap → в Map:', Object.keys(map).length);
    return map;
  }

  // ----------------------------------------------------------
  // Сортировки
  // ----------------------------------------------------------
  var SORTS = [
    { title: 'Новинки',    val: 'new',  urlPath: 'new',          searchParam: ''     },
    { title: 'Лучшее',     val: 'best', urlPath: 'best-videos',  searchParam: '&top' },
    { title: 'Популярные', val: 'top',  urlPath: 'most-viewed',  searchParam: '&top' },
    { title: 'Длительные', val: 'long', urlPath: 'longest',      searchParam: ''     },
  ];

  // ----------------------------------------------------------
  // Кэш категорий — динамический (парсится со страницы /c)
  // ----------------------------------------------------------
  var _categoriesCache     = null;
  var _categoriesLoading   = false;
  var _categoriesCallbacks = [];

  function parseCategories(html) {
    if (!html) return [];
    var doc;
    try { doc = new DOMParser().parseFromString(html, 'text/html'); }
    catch (e) { err('parseCategories →', e.message); return []; }

    var cats = [], seen = {};
    forEachNode(doc.querySelectorAll('a[href*="/c/"]'), function (a) {
      var href  = a.getAttribute('href') || '';
      var match = href.match(/\/c\/([^\/\?#]+)/);
      if (!match || !match[1]) return;
      var slug = match[1];
      if (seen[slug]) return;
      seen[slug] = true;

      var title = (a.textContent || '').trim();
      if (!title || title.length < 2) {
        title = slug.replace(/-\d+$/, '').replace(/[_-]+/g, ' ').trim();
      }
      if (title.length >= 2) {
        cats.push({ title: title, val: slug, urlPath: 'c/' + slug });
      }
    });

    log('parseCategories → категорий:', cats.length);
    return cats;
  }

  function getCategories(callback) {
    if (_categoriesCache) { callback(_categoriesCache); return; }
    _categoriesCallbacks.push(callback);
    if (_categoriesLoading) return;
    _categoriesLoading = true;

    httpGet(HOST + '/c', function (html) {
      _categoriesCache   = parseCategories(html);
      _categoriesLoading = false;
      if (_categoriesCache.length < 5) {
        httpGet(HOST + '/', function (mainHtml) {
          var mainCats = parseCategories(mainHtml);
          var seen = {};
          for (var i = 0; i < _categoriesCache.length; i++) seen[_categoriesCache[i].val] = true;
          for (var j = 0; j < mainCats.length; j++) {
            if (!seen[mainCats[j].val]) _categoriesCache.push(mainCats[j]);
          }
          _flushCatCallbacks();
        }, function () { _flushCatCallbacks(); });
      } else {
        _flushCatCallbacks();
      }
    }, function (e) {
      warn('getCategories → ошибка:', e);
      _categoriesCache = []; _categoriesLoading = false;
      _flushCatCallbacks();
    });
  }

  function _flushCatCallbacks() {
    var cbs = _categoriesCallbacks.slice();
    _categoriesCallbacks = [];
    for (var i = 0; i < cbs.length; i++) try { cbs[i](_categoriesCache); } catch (e) {}
  }

  // ----------------------------------------------------------
  // parseState
  // ----------------------------------------------------------
  function parseState(url) {
    var sort = '', search = '', category = '';
    if (!url) return { sort: sort, search: search, category: category };

    var kMatch = url.match(/[?&]k=([^&]+)/);
    if (kMatch && kMatch[1]) {
      search = decodeURIComponent(kMatch[1].replace(/\+/g, ' '));
      if (url.indexOf('&top')  !== -1) sort = 'top';
      if (url.indexOf('&best') !== -1) sort = 'best';
      if (url.indexOf('&long') !== -1) sort = 'long';
      return { sort: sort, search: search, category: category };
    }

    var searchMatch = url.match(/[?&]search=([^&]+)/);
    if (searchMatch && searchMatch[1]) {
      search = decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
      return { sort: sort, search: search, category: category };
    }

    var cMatch = url.match(/\/c\/([^\/\?#]+)/);
    if (cMatch && cMatch[1]) {
      category = cMatch[1];
      return { sort: sort, search: search, category: category };
    }

    var path = url.replace(HOST, '').replace(/^\//, '').replace(/\/\d+\/?$/, '');
    for (var i = 0; i < SORTS.length; i++) {
      if (path === SORTS[i].urlPath || path.indexOf(SORTS[i].urlPath + '/') === 0) {
        sort = SORTS[i].val; break;
      }
    }

    return { sort: sort, search: search, category: category };
  }

  // ----------------------------------------------------------
  // buildUrl
  // ----------------------------------------------------------
  function buildUrl(sort, search, category, page) {
    page = parseInt(page, 10) || 1;

    if (search) {
      var offset    = page > 1 ? '&p=' + (page - 1) : '';
      var sortParam = (sort === 'top' || sort === 'best') ? '&top' : '';
      return HOST + '/?k=' + encodeURIComponent(search) + sortParam + offset;
    }

    if (category) {
      return HOST + '/c/' + category + (page > 1 ? '/' + page : '');
    }

    if (!sort) {
      return page <= 1 ? HOST + '/' : HOST + '/new/' + page;
    }

    var sortObj = arrayFind(SORTS, function (s) { return s.val === sort; }) || SORTS[0];
    return HOST + '/' + sortObj.urlPath + '/' + page;
  }

  // ----------------------------------------------------------
  // _getImgSrc — цепочка lazy-атрибутов
  // ----------------------------------------------------------
  function _getImgSrc(img) {
    if (!img) return '';
    var candidates = [
      img.getAttribute('data-src'),
      img.getAttribute('data-original'),
      img.getAttribute('data-thumb'),
      img.getAttribute('data-xvideos-src'),
      img.getAttribute('data-poster'),
      img.getAttribute('src'),
    ];
    for (var i = 0; i < candidates.length; i++) {
      var v = candidates[i];
      if (!v || v.length < 10) continue;
      if (v.indexOf('blank.gif')   !== -1) continue;
      if (v.indexOf('data:image')  === 0)  continue;
      if (v.indexOf('spacer.gif')  !== -1) continue;
      if (v.indexOf('placeholder') !== -1) continue;
      return v;
    }
    return '';
  }

  function _getImgFromNoscript(el) {
    var noscripts = el.querySelectorAll('noscript');
    for (var i = 0; i < noscripts.length; i++) {
      var txt = noscripts[i].textContent || noscripts[i].innerHTML || '';
      var m = txt.match(/(?:src|data-src)=["']([^"']+)/);
      if (m && m[1] && m[1].length > 10 &&
          m[1].indexOf('blank.gif')  === -1 &&
          m[1].indexOf('data:image') !== 0  &&
          m[1].indexOf('spacer.gif') === -1) {
        return m[1];
      }
    }
    return '';
  }

  function _getImgFromOuterHtml(el) {
    try {
      var outerHtml = el.outerHTML || '';
      var m = outerHtml.match(/https?:\/\/[a-z0-9-]+\.xvideos-cdn\.com\/[^\s"'<>]+(?:_t|\.jpg|\.jpeg|\.webp)[^\s"'<>]*/);
      if (m && m[0]) return m[0];
    } catch (e) {}
    return '';
  }

  function _hasClass(el, cls) {
    if (!el || !el.className) return false;
    if (el.classList) return el.classList.contains(cls);
    return (' ' + el.className + ' ').indexOf(' ' + cls + ' ') !== -1;
  }

  function _cleanVideoHref(href) {
    if (!href) return href;
    href = href.replace(/\/THUMBNUM\//i, '/');
    href = href.replace(/\/THUMBNUM$/i, '');
    return href;
  }

  // ----------------------------------------------------------
  // _extractCard — принимает thumbMap для fallback картинки
  // ----------------------------------------------------------
  function _extractCard(el, thumbMap) {
    thumbMap = thumbMap || {};

    var aEl = el.querySelector('a[href*="/video"]');
    if (!aEl) aEl = el.querySelector('a[href]');
    if (!aEl) return null;

    var rawHref = aEl.getAttribute('href') || '';
    if (!rawHref) return null;
    if (rawHref.indexOf('http') !== 0) rawHref = HOST + rawHref;
    if (rawHref.indexOf('/video') === -1 && rawHref.indexOf('/video.') === -1) return null;

    var href = _cleanVideoHref(rawHref);

    // Название
    var name = '';
    var titleSelectors = [
      'p.title a', 'p.title', '.title a', '.title',
      '.video-title a', '.video-title', 'a .title',
    ];
    for (var ts = 0; ts < titleSelectors.length; ts++) {
      var titleEl = el.querySelector(titleSelectors[ts]);
      if (titleEl) {
        name = (titleEl.getAttribute('title') || titleEl.textContent || '').trim();
        if (name && name.length >= 3) break;
        name = '';
      }
    }
    if (!name) name = (aEl.getAttribute('title') || '').trim();
    if (!name) {
      var anyTitle = el.querySelector('[title]');
      if (anyTitle) name = (anyTitle.getAttribute('title') || '').trim();
    }
    if ((!name || name.length < 3) && thumbMap[href] && thumbMap[href].title) {
      name = thumbMap[href].title;
    }

    var imgEl = aEl.querySelector('img') || el.querySelector('img');
    if (!name && imgEl) name = (imgEl.getAttribute('alt') || '').trim();
    if (!name || name.length < 3) name = slugToName(rawHref);
    if (!name || name.length < 3) return null;

    // Картинка (4 источника по приоритету)
    var picture = '';
    if (thumbMap[href] && thumbMap[href].thumb) {
      picture = thumbMap[href].thumb;
    }
    if (!picture) picture = _getImgSrc(imgEl);
    if (!picture) picture = _getImgFromNoscript(el);
    if (!picture) picture = _getImgFromOuterHtml(el);

    if (!picture) warn('_extractCard → нет картинки для:', href.substring(0, 60));

    // Длительность
    var durSelectors = ['.duration', 'span.duration', 'time', '.dur', '.video-duration'];
    var time = '';
    for (var ds = 0; ds < durSelectors.length; ds++) {
      var durEl = el.querySelector(durSelectors[ds]);
      if (durEl) { time = (durEl.textContent || '').trim(); if (time) break; }
    }

    // Качество
    var qualityEl = el.querySelector('.video-hd-mark, .hd-mark, .quality');
    var quality   = qualityEl ? (qualityEl.textContent || '').trim() : 'HD';
    if (!quality) quality = 'HD';

    return {
      name:    name,
      video:   href,
      picture: picture,
      preview: null,
      time:    time,
      quality: quality,
      json:    true,
      related: true,
      source:  NAME,
    };
  }

  // ----------------------------------------------------------
  // parsePlaylist — thumbMap строится ПЕРЕД обходом карточек
  // ----------------------------------------------------------
  function parsePlaylist(html) {
    if (!html) { warn('parsePlaylist → html пустой'); return []; }
    log('parsePlaylist → длина HTML:', html.length);

    var doc;
    try { doc = new DOMParser().parseFromString(html, 'text/html'); }
    catch (e) { err('parsePlaylist → DOMParser:', e.message); return []; }

    // thumbMap из JSON — ДО обхода карточек
    var thumbMap = _parseXvJson(html);
    if (Object.keys(thumbMap).length < 5) {
      var regexMap = _buildThumbMap(html);
      for (var rk in regexMap) {
        if (!thumbMap[rk]) thumbMap[rk] = { thumb: regexMap[rk], title: '' };
      }
    }
    log('parsePlaylist → thumbMap итого:', Object.keys(thumbMap).length);

    log('parsePlaylist → div.thumb:', doc.querySelectorAll('div.thumb').length);
    log('parsePlaylist → .mozaique .thumb:', doc.querySelectorAll('.mozaique .thumb').length);
    log('parsePlaylist → a[href*=/video]:', doc.querySelectorAll('a[href*="/video"]').length);

    var cards = [];
    var seen  = {};

    // Стратегия 1: XPath
    try {
      var xp = "//div[contains(concat(' ',normalize-space(@class),' '),' thumb ') " +
               "and not(ancestor::div[contains(concat(' ',normalize-space(@class),' '),' thumb ')]) " +
               "and .//a[contains(@href,'/video')]]";
      var nodes = doc.evaluate(xp, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      log('parsePlaylist → XPath узлов:', nodes.snapshotLength);

      for (var i = 0; i < nodes.snapshotLength; i++) {
        var c = _extractCard(nodes.snapshotItem(i), thumbMap);
        if (c && !seen[c.video]) { seen[c.video] = true; cards.push(c); }
      }
      log('parsePlaylist → XPath карточек:', cards.length);
    } catch (e) {
      warn('parsePlaylist → XPath ошибка:', e.message);
    }

    // Стратегия 2: CSS
    if (!cards.length) {
      var selectors = [
        '.mozaique .thumb-block', '.mozaique .thumb',
        '.thumb-block', '.thumb',
        '.thumbs .thumb', '.video-thumb', '.video-item', '.thumb-inside',
      ];
      for (var s = 0; s < selectors.length; s++) {
        var els = doc.querySelectorAll(selectors[s]);
        if (!els.length) continue;
        log('parsePlaylist → CSS "' + selectors[s] + '" найдено:', els.length);
        forEachNode(els, function (el) {
          var parent = el.parentElement;
          if (parent && _hasClass(parent, 'thumb')) return;
          var c2 = _extractCard(el, thumbMap);
          if (c2 && !seen[c2.video]) { seen[c2.video] = true; cards.push(c2); }
        });
        if (cards.length) break;
      }
    }

    // Стратегия 3: a[href*=video]
    if (!cards.length) {
      log('parsePlaylist → Стратегия 3: a[href*=video]...');
      forEachNode(doc.querySelectorAll('a[href*="/video"]'), function (a) {
        var rawHref = a.getAttribute('href') || '';
        if (!rawHref) return;
        if (rawHref.indexOf('http') !== 0) rawHref = HOST + rawHref;
        if (rawHref.indexOf('/video') === -1) return;

        var href = _cleanVideoHref(rawHref);
        if (seen[href]) return;

        var pic = '';
        if (thumbMap[href]) pic = thumbMap[href].thumb || '';
        if (!pic) {
          var img = a.querySelector('img') || (a.parentElement && a.parentElement.querySelector('img'));
          if (img) pic = _getImgSrc(img);
        }
        if (!pic) pic = _getImgFromNoscript(a.parentElement || a);
        if (!pic) pic = _getImgFromOuterHtml(a.parentElement || a);

        var title = '';
        if (thumbMap[href] && thumbMap[href].title) title = thumbMap[href].title;
        if (!title || title.length < 3) {
          var pEl = a.parentElement;
          if (pEl) {
            var pTitle = pEl.querySelector('p.title, .title');
            if (pTitle) title = (pTitle.getAttribute('title') || pTitle.textContent || '').trim();
          }
        }
        if (!title || title.length < 3) title = (a.getAttribute('title') || '').trim();
        if (!title || title.length < 3) title = slugToName(rawHref);
        if (!title || title.length < 3) return;

        seen[href] = true;
        cards.push({
          name: title, video: href, picture: pic,
          preview: null, time: '', quality: 'HD',
          json: true, related: true, source: NAME,
        });
      });
      log('parsePlaylist → Стратегия 3:', cards.length);
    }

    if (!cards.length) {
      warn('parsePlaylist → ❌ НИЧЕГО НЕ НАЙДЕНО');
      warn('  div[class*=thumb]:', doc.querySelectorAll('div[class*="thumb"]').length);
      warn('  a[href*=video]:', doc.querySelectorAll('a[href*="/video"]').length);
    } else {
      var withPic = 0, noPic = 0;
      for (var ci = 0; ci < cards.length; ci++) {
        if (cards[ci].picture) withPic++; else noPic++;
      }
      log('parsePlaylist → ✅ ИТОГО:', cards.length);
      log('  с картинками:', withPic, '  без:', noPic);
      notyOk('Найдено ' + cards.length + ' видео');
    }

    return cards;
  }

  // ----------------------------------------------------------
  // getStreamLinks
  // ----------------------------------------------------------
  function getStreamLinks(url, success, failure) {
    log('getStreamLinks →', url);
    httpGet(url, function (html) {
      log('getStreamLinks → HTML длина:', html.length);
      var q = {};

      // Метод 1: html5player setVideoUrlLow/High/HLS
      var mLow  = html.match(/html5player\.setVideoUrlLow\(['"]([^'"]+)['"]\)/);
      var mHigh = html.match(/html5player\.setVideoUrlHigh\(['"]([^'"]+)['"]\)/);
      var mHLS  = html.match(/html5player\.setVideoHLS\(['"]([^'"]+)['"]\)/);
      if (mLow  && mLow[1])  { q['480p'] = mLow[1];  log('getStreamLinks → Метод 1: 480p'); }
      if (mHigh && mHigh[1]) { q['720p'] = mHigh[1]; log('getStreamLinks → Метод 1: 720p'); }
      if (mHLS  && mHLS[1])  { q['HLS']  = mHLS[1];  log('getStreamLinks → Метод 1: HLS'); }

      // Метод 2: JSON url_low/url_high/hls
      if (!Object.keys(q).length) {
        var mL2 = html.match(/"url_low"\s*:\s*"([^"]+)"/);
        var mH2 = html.match(/"url_high"\s*:\s*"([^"]+)"/);
        var mS2 = html.match(/"hls"\s*:\s*"([^"]+)"/);
        if (mL2 && mL2[1]) { q['480p'] = mL2[1]; log('getStreamLinks → Метод 2: 480p'); }
        if (mH2 && mH2[1]) { q['720p'] = mH2[1]; log('getStreamLinks → Метод 2: 720p'); }
        if (mS2 && mS2[1]) { q['HLS']  = mS2[1]; log('getStreamLinks → Метод 2: HLS'); }
      }

      // Метод 3: xvideos-cdn.com direct mp4/m3u8
      if (!Object.keys(q).length) {
        var mSd     = html.match(/["'](https?:\/\/[a-z0-9-]+\.xvideos-cdn\.com\/[^"'\s]+mp4_sd\.mp4[^"'\s]*)/);
        var mHd     = html.match(/["'](https?:\/\/[a-z0-9-]+\.xvideos-cdn\.com\/[^"'\s]+mp4_hd\.mp4[^"'\s]*)/);
        var mCdnHls = html.match(/["'](https?:\/\/[a-z0-9-]+\.xvideos-cdn\.com\/[^"'\s]+\.m3u8[^"'\s]*)/);
        if (mSd     && mSd[1])     { q['480p'] = mSd[1];     log('getStreamLinks → Метод 3: 480p CDN'); }
        if (mHd     && mHd[1])     { q['720p'] = mHd[1];     log('getStreamLinks → Метод 3: 720p CDN'); }
        if (mCdnHls && mCdnHls[1]) { q['HLS']  = mCdnHls[1]; log('getStreamLinks → Метод 3: HLS CDN'); }
      }

      // Метод 4: любые mp4
      if (!Object.keys(q).length) {
        var reMp4 = /["'](https?:\/\/[^"'\s]+\.mp4[^"'\s]*)/g;
        var m4, idx4 = 0;
        while ((m4 = reMp4.exec(html)) && idx4 < 3) { q['auto' + idx4] = m4[1]; idx4++; }
      }

      // Метод 5: m3u8
      if (!Object.keys(q).length) {
        var mM = html.match(/["'](https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/);
        if (mM && mM[1]) q['HLS'] = mM[1];
      }

      var keys = Object.keys(q);
      if (!keys.length) {
        err('getStreamLinks → ❌ ссылки не найдены');
        warn('  html5player:', (html.match(/html5player/gi)     || []).length);
        warn('  xvideos-cdn:', (html.match(/xvideos-cdn\.com/gi) || []).length);
        warn('  .mp4:',        (html.match(/\.mp4/gi)            || []).length);
        notyErr('Нет ссылок на видео');
        failure('no_links'); return;
      }

      log('getStreamLinks → ✅ качеств:', keys.length);
      notyOk('Качеств: ' + keys.length);
      success({ qualities: q });
    }, function (e) { err('getStreamLinks → ошибка:', e); failure(e); });
  }

  // ----------------------------------------------------------
  // buildMenu
  // ----------------------------------------------------------
  function buildMenu(url, categories) {
    var state   = parseState(url);
    var sortObj = arrayFind(SORTS, function (s) { return s.val === state.sort; }) || SORTS[0];
    var sortSub = [];
    for (var i = 0; i < SORTS.length; i++) {
      sortSub.push({ title: SORTS[i].title, playlist_url: HOST + '/' + SORTS[i].urlPath + '/1' });
    }
    var menu = [
      { title: 'Поиск', playlist_url: HOST, search_on: true },
      { title: 'Сортировка: ' + sortObj.title, submenu: sortSub },
    ];
    if (categories && categories.length) {
      var catSub = [];
      for (var j = 0; j < categories.length; j++) {
        catSub.push({ title: categories[j].title, playlist_url: HOST + '/' + categories[j].urlPath });
      }
      menu.push({ title: 'Категории (' + categories.length + ')', submenu: catSub });
    }
    return menu;
  }

  // ----------------------------------------------------------
  // ПУБЛИЧНЫЙ ИНТЕРФЕЙС
  // ----------------------------------------------------------
  var Parser = {

    main: function (params, ok, fail) {
      log('main()', safeParams(params));
      httpGet(HOST + '/', function (html) {
        var results = parsePlaylist(html);
        if (!results.length) { fail('no_cards'); return; }
        log('main() → карточек:', results.length);
        getCategories(function (cats) {
          ok({ results: results, collection: true, total_pages: 30, menu: buildMenu(HOST, cats) });
        });
      }, function (e) { err('main() → ошибка:', e); fail(e); });
    },

    view: function (params, ok, fail) {
      log('view()', safeParams(params));
      var rawUrl = ((params && params.url) || HOST).replace(/[?&]pg=\d+/, '');
      var page   = parseInt((params && params.page), 10) || 1;
      var state  = parseState(rawUrl);
      var load   = buildUrl(state.sort, state.search, state.category, page);

      log('view() → url:', load, '| стр.', page);

      httpGet(load, function (html) {
        var results = parsePlaylist(html);
        if (!results.length) { fail('no_cards'); return; }
        getCategories(function (cats) {
          ok({
            results:     results,
            collection:  true,
            total_pages: results.length >= 25 ? page + 5 : page,
            menu:        buildMenu(rawUrl, cats),
          });
        });
      }, function (e) { err('view() → ошибка:', e); fail(e); });
    },

    search: function (params, ok, fail) {
      var query = ((params && params.query) || '').trim();
      var page  = parseInt((params && params.page), 10) || 1;
      log('search() "' + query + '" стр.' + page);
      if (!query) { fail('empty_query'); return; }

      var searchUrl = buildUrl('top', query, '', page);
      httpGet(searchUrl, function (html) {
        var results = parsePlaylist(html);
        ok({
          title:       'xv-ru: ' + query,
          results:     results,
          url:         HOST + '/?k=' + encodeURIComponent(query) + '&top',
          collection:  true,
          total_pages: results.length >= 25 ? page + 5 : 1,
        });
      }, function (e) {
        err('search() → ошибка:', e);
        ok({ title: 'xv-ru', results: [], collection: true, total_pages: 1 });
      });
    },

    qualities: function (url, ok, fail) {
      log('qualities() →', url);
      try { getStreamLinks(url, ok, fail); }
      catch(e) { err('qualities:', e.message); fail(e.message); }
    },
  };

  // ----------------------------------------------------------
  // РЕГИСТРАЦИЯ
  // ----------------------------------------------------------
  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, Parser);
      log('v' + VERSION + ' зарегистрирован');
      notyOk('xv-ru v' + VERSION);
      return true;
    }
    return false;
  }

  if (!tryRegister()) {
    var _e = 0;
    var _t = setInterval(function () {
      _e += 100;
      if (tryRegister()) clearInterval(_t);
      else if (_e >= 10000) { clearInterval(_t); notyErr('Таймаут регистрации'); }
    }, 100);
  }

})();
