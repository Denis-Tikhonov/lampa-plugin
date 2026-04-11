// =============================================================
// xv-ru.js — Парсер xv-ru.com для AdultJS / AdultPlugin (Lampa)
// Version  : 1.6.0
// Changed  :
//   [1.6.0] ИСПРАВЛЕНО: нет постеров — data-src пуст при lazy loading
//           ДОБАВЛЕНО:  _parseXvJson() — картинки из window.xv.conf JSON
//           ДОБАВЛЕНО:  _buildThumbMap() — Map {videoUrl → thumbUrl}
//           ДОБАВЛЕНО:  regex-поиск xvideos-cdn.com URL как fallback
//           ИСПРАВЛЕНО: slugToName — поддержка формата /video.{hash}/{slug}
//           ИСПРАВЛЕНО: noscript img — извлечение через regex из textContent
// =============================================================

(function () {
  'use strict';

  var HOST = 'https://www.xv-ru.com';
  var NAME = 'xv-ru';
  var TAG  = '[xv-ru 1.6.0]';

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
    if (url && url.slice(-1) !== '=') url += '=';
    return url;
  }

  // ----------------------------------------------------------
  // Полифиллы
  // ----------------------------------------------------------
  if (!Array.prototype.find) {
    Array.prototype.find = function (fn) {
      for (var i = 0; i < this.length; i++) if (fn(this[i], i, this)) return this[i];
    };
  }
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (s, p) {
      p = p || 0; return this.indexOf(s, p) === p;
    };
  }

  // ----------------------------------------------------------
  // Утилиты
  // ----------------------------------------------------------
  function forEachNode(list, fn) {
    if (!list) return;
    for (var i = 0; i < list.length; i++) fn(list[i], i);
  }

  function arrayFind(arr, fn) {
    if (!arr) return undefined;
    for (var i = 0; i < arr.length; i++) if (fn(arr[i], i)) return arr[i];
  }

  function log(msg)  { console.log(TAG, msg); }
  function warn(msg) { console.warn(TAG, msg); }
  function err(msg)  { console.error(TAG, msg); }

  function _ts() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' +
           ('0' + d.getMinutes()).slice(-2) + ':' +
           ('0' + d.getSeconds()).slice(-2) + '.' +
           ('00' + d.getMilliseconds()).slice(-3);
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
  // slugToName [1.6.0]
  //
  // Формат A: /video.{hash}/{id}/{num}/{slug}  — с числовым ID
  // Формат B: /video.{hash}/{slug}             — без числового ID (quickies)
  //
  // Правило: берём ПОСЛЕДНИЙ сегмент пути, который не является
  //          числом и не начинается с "video."
  // ----------------------------------------------------------
  function slugToName(href) {
    if (!href) return '';

    // Формат A: /video.hash/12345/0/real_slug_here
    var mFull = href.match(/\/video\.[^\/]+\/\d+\/\d+\/([^\/\?#]+)/);
    if (mFull && mFull[1] && mFull[1].length >= 3) {
      return _slugProcess(mFull[1]);
    }

    // Формат B: /video.hash/real_slug_here (quickies — без числового ID)
    var mShort = href.match(/\/video\.([^\/]+)\/([^\/\?#]+)$/);
    if (mShort && mShort[2] && mShort[2].length >= 3 && !/^\d+$/.test(mShort[2])) {
      return _slugProcess(mShort[2]);
    }

    // Fallback THUMBNUM
    var mThumb = href.match(/\/THUMBNUM\/([^\/\?#]+)/i);
    if (mThumb && mThumb[1] && mThumb[1].length >= 3) {
      return _slugProcess(mThumb[1]);
    }

    // Последний не-числовой сегмент пути
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
  // [1.6.0] _parseXvJson — извлечь данные о видео из window.xv.conf
  //
  // Сайт встраивает в страницу JSON с данными quickies-видео:
  //   window.xv.conf = {..., "data": {"quickies": {"videos": {"H": [...], "V": [...]}}}}
  //
  // Каждый элемент содержит: url, title, thumb_url
  // ----------------------------------------------------------
  function _parseXvJson(html) {
    var map = {};  // { нормализованный url → { thumb, title } }

    // Ищем блок window.xv.conf = {...}
    var confMatch = html.match(/window\.xv\.conf\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (!confMatch || !confMatch[1]) {
      warn('_parseXvJson -> window.xv.conf не найден');
      return map;
    }

    var conf;
    try {
      conf = JSON.parse(confMatch[1]);
    } catch (e) {
      // JSON.parse может упасть — пробуем альтернативный парсинг
      warn('_parseXvJson -> JSON.parse ошибка: ' + e.message + ', пробую regex...');
      return _parseXvJsonRegex(html, map);
    }

    // Извлекаем данные quickies
    var videos = [];
    try {
      var q = conf.data && conf.data.quickies && conf.data.quickies.videos;
      if (q) {
        if (q.H && q.H.length) videos = videos.concat(q.H);
        if (q.V && q.V.length) videos = videos.concat(q.V);
      }
    } catch (e) {
      warn('_parseXvJson -> ошибка обхода quickies: ' + e.message);
    }

    for (var i = 0; i < videos.length; i++) {
      var v = videos[i];
      if (!v.url || !v.thumb_url) continue;

      // Нормализуем URL: убираем слеши в начале/конце
      var vUrl = v.url.replace(/^\//, '');  // "video.uvpohkk12ff/real_life..."
      var fullUrl = HOST + '/' + vUrl;

      map[fullUrl] = {
        thumb: v.thumb_url,
        title: v.title || '',
      };
    }

    log('_parseXvJson -> JSON видео в Map: ' + Object.keys(map).length);
    return map;
  }

  // [1.6.0] Fallback: извлечение данных через regex если JSON.parse упал
  function _parseXvJsonRegex(html, map) {
    // Ищем пары url + thumb_url
    var re = /"url"\s*:\s*"(\/video[^"]+)"[^}]*?"thumb_url"\s*:\s*"([^"]+)"/g;
    var m;
    var count = 0;
    while ((m = re.exec(html)) && count < 200) {
      var vUrl  = m[1].replace(/\\\//g, '/');
      var thumb = m[2].replace(/\\\//g, '/');
      map[HOST + vUrl] = { thumb: thumb, title: '' };
      count++;
    }
    log('_parseXvJsonRegex -> найдено через regex: ' + count);
    return map;
  }

  // ----------------------------------------------------------
  // [1.6.0] _buildThumbMap — дополнительный Map из regex по всему HTML
  //
  // Ищем паттерн: URL видео рядом с URL картинки xvideos-cdn.com
  // Страховочный метод если JSON не содержит нужные видео
  // ----------------------------------------------------------
  function _buildThumbMap(html) {
    var map = {};

    // Метод: из JSON-подобных структур в JS
    // "encoded_id":"uvpohkk12ff",...,"thumb_url":"https://thumb-cdn77..."
    var reFull = /"url"\s*:\s*"(\/video[^"]{5,})"(?:[^}]{0,500}?)"thumb_url"\s*:\s*"(https:\/\/[^"]+xvideos-cdn\.com[^"]+)"/g;
    var m;
    while ((m = reFull.exec(html))) {
      var url   = HOST + m[1].replace(/\\\//g, '/');
      var thumb = m[2].replace(/\\\//g, '/');
      if (!map[url]) map[url] = thumb;
    }

    log('_buildThumbMap -> в Map: ' + Object.keys(map).length);
    return map;
  }

  // ----------------------------------------------------------
  // Сетевой слой
  // ----------------------------------------------------------
  function httpGet(url, success, failure) {
    log('[' + _ts() + '] httpGet -> ' + url);

    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(
        url, success, failure,
        { type: 'html', headers: REQUEST_HEADERS }
      );
      return;
    }

    if (typeof Lampa !== 'undefined' &&
        Lampa.Network &&
        typeof Lampa.Network.native === 'function') {
      var full = getWorkerUrl() + encodeURIComponent(url);
      log('[' + _ts() + '] httpGet -> Worker: ' + full.substring(0, 120));
      Lampa.Network.native(
        full,
        function (r) { success(typeof r === 'string' ? r : JSON.stringify(r)); },
        function (e) {
          warn('[' + _ts() + '] httpGet -> native ошибка, fallback Reguest');
          _reguest(url, success, failure);
        },
        false,
        { headers: REQUEST_HEADERS }
      );
      return;
    }

    _reguest(url, success, failure);
  }

  function _reguest(url, success, failure) {
    if (typeof Lampa !== 'undefined' && Lampa.Reguest) {
      log('[' + _ts() + '] httpGet -> Reguest: ' + url);
      try {
        var net = new Lampa.Reguest();
        net.silent(url,
          function (data) { success(typeof data === 'string' ? data : ''); },
          function (e) {
            warn('[' + _ts() + '] httpGet -> Reguest ошибка, fallback fetch');
            _fetch(url, success, failure);
          },
          false,
          { dataType: 'text', timeout: 12000, headers: REQUEST_HEADERS }
        );
        return;
      } catch (ex) {
        warn('[' + _ts() + '] httpGet -> Reguest исключение: ' + ex.message);
      }
    }
    _fetch(url, success, failure);
  }

  function _fetch(url, success, failure) {
    if (typeof fetch === 'undefined') { failure('no_http_method'); return; }
    log('[' + _ts() + '] httpGet -> fetch: ' + url);
    fetch(url, { method: 'GET', headers: REQUEST_HEADERS })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(success)
      .catch(function (e) {
        err('[' + _ts() + '] httpGet -> fetch ошибка: ' + e.message);
        failure(e.message);
      });
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
  // Кэш категорий
  // ----------------------------------------------------------
  var _categoriesCache   = null;
  var _categoriesLoading = false;
  var _categoriesCallbacks = [];

  function parseCategories(html) {
    if (!html) return [];
    var doc;
    try { doc = new DOMParser().parseFromString(html, 'text/html'); }
    catch (e) { err('parseCategories -> ' + e.message); return []; }

    var cats = [], seen = {};
    var links = doc.querySelectorAll('a[href*="/c/"]');
    log('parseCategories -> ссылок /c/: ' + links.length);

    forEachNode(links, function (a) {
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

    log('parseCategories -> категорий: ' + cats.length);
    return cats;
  }

  function getCategories(callback) {
    if (_categoriesCache) { callback(_categoriesCache); return; }
    _categoriesCallbacks.push(callback);
    if (_categoriesLoading) return;
    _categoriesLoading = true;

    httpGet(HOST + '/c', function (html) {
      _categoriesCache = parseCategories(html);
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
      warn('getCategories -> ошибка: ' + e);
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
  // [1.6.0] _getImgSrc — расширенный, с noscript regex и cdn regex
  // ----------------------------------------------------------
  function _getImgSrc(img) {
    if (!img) return '';

    // Стандартные атрибуты lazy loading
    var candidates = [
      img.getAttribute('data-src'),
      img.getAttribute('data-original'),
      img.getAttribute('data-thumb'),
      img.getAttribute('data-xvideos-src'),
      img.getAttribute('data-poster'),
      img.getAttribute('src'),
    ];

    var THUMB_RE = /xvideos-cdn\.com/;

    for (var i = 0; i < candidates.length; i++) {
      var v = candidates[i];
      if (!v || v.length < 10) continue;
      if (v.indexOf('blank.gif')   !== -1) continue;
      if (v.indexOf('data:image')  === 0)  continue;
      if (v.indexOf('spacer.gif')  !== -1) continue;
      if (v.indexOf('placeholder') !== -1) continue;
      // Предпочитаем CDN xvideos-cdn.com, но принимаем любой валидный
      return v;
    }

    return '';
  }

  // [1.6.0] Извлечь картинку из noscript тега через regex
  function _getImgFromNoscript(el) {
    var noscripts = el.querySelectorAll('noscript');
    for (var i = 0; i < noscripts.length; i++) {
      var txt = noscripts[i].textContent || noscripts[i].innerHTML || '';
      // <img src="URL" или <img data-src="URL"
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

  // [1.6.0] Поиск URL xvideos-cdn.com рядом с элементом через outerHTML
  function _getImgFromOuterHtml(el) {
    try {
      var outerHtml = el.outerHTML || '';
      var m = outerHtml.match(/https?:\/\/[a-z0-9-]+\.xvideos-cdn\.com\/[^\s"'<>]+(?:_t|\.jpg|\.jpeg|\.webp)[^\s"'<>]*/);
      if (m && m[0]) return m[0];
    } catch (e) {}
    return '';
  }

  // ----------------------------------------------------------
  // _hasClass
  // ----------------------------------------------------------
  function _hasClass(el, cls) {
    if (!el || !el.className) return false;
    if (el.classList) return el.classList.contains(cls);
    return (' ' + el.className + ' ').indexOf(' ' + cls + ' ') !== -1;
  }

  // ----------------------------------------------------------
  // _cleanVideoHref
  // ----------------------------------------------------------
  function _cleanVideoHref(href) {
    if (!href) return href;
    href = href.replace(/\/THUMBNUM\//i, '/');
    href = href.replace(/\/THUMBNUM$/i, '');
    return href;
  }

  // ----------------------------------------------------------
  // [1.6.0] _extractCard — принимает thumbMap для fallback картинки
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

    // --- Название ---
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

    // Из thumbMap — может содержать title
    if ((!name || name.length < 3) && thumbMap[href] && thumbMap[href].title) {
      name = thumbMap[href].title;
    }

    var imgEl = aEl.querySelector('img') || el.querySelector('img');
    if (!name && imgEl) name = (imgEl.getAttribute('alt') || '').trim();
    if (!name || name.length < 3) name = slugToName(rawHref);
    if (!name || name.length < 3) return null;

    // ----------------------------------------------------------
    // [1.6.0] Картинка — расширенная цепочка источников
    //
    // Приоритет:
    //   1. Из thumbMap (window.xv.conf JSON) — самый надёжный
    //   2. img[data-src] и другие атрибуты
    //   3. noscript содержимое
    //   4. outerHTML regex поиск xvideos-cdn.com
    // ----------------------------------------------------------
    var picture = '';

    // 1. JSON Map
    if (thumbMap[href] && thumbMap[href].thumb) {
      picture = thumbMap[href].thumb;
      log('_extractCard -> 🖼 из JSON: ' + picture.substring(0, 60));
    }

    // 2. img атрибуты
    if (!picture) {
      picture = _getImgSrc(imgEl);
      if (picture) log('_extractCard -> 🖼 из img attr: ' + picture.substring(0, 60));
    }

    // 3. noscript
    if (!picture) {
      picture = _getImgFromNoscript(el);
      if (picture) log('_extractCard -> 🖼 из noscript: ' + picture.substring(0, 60));
    }

    // 4. outerHTML regex
    if (!picture) {
      picture = _getImgFromOuterHtml(el);
      if (picture) log('_extractCard -> 🖼 из outerHTML: ' + picture.substring(0, 60));
    }

    if (!picture) {
      warn('_extractCard -> ⚠ нет картинки для: ' + href.substring(0, 60));
    }

    // --- Длительность ---
    var durSelectors = ['.duration', 'span.duration', 'time', '.dur', '.video-duration'];
    var time = '';
    for (var ds = 0; ds < durSelectors.length; ds++) {
      var durEl = el.querySelector(durSelectors[ds]);
      if (durEl) { time = (durEl.textContent || '').trim(); if (time) break; }
    }

    // --- Качество ---
    var qualityEl = el.querySelector('.video-hd-mark, .hd-mark, .quality');
    var quality   = qualityEl ? (qualityEl.textContent || '').trim() : 'HD';
    if (!quality) quality = 'HD';

    log('_extractCard -> ✅ "' + name.substring(0, 40) + '" pic=' + (picture ? '✅' : '❌'));

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
  // [1.6.0] parsePlaylist — thumbMap строится ПЕРЕД обходом карточек
  // ----------------------------------------------------------
  function parsePlaylist(html) {
    if (!html) { warn('parsePlaylist -> html пустой'); return []; }
    log('parsePlaylist -> длина HTML: ' + html.length);

    var doc;
    try { doc = new DOMParser().parseFromString(html, 'text/html'); }
    catch (e) { err('parsePlaylist -> DOMParser: ' + e.message); return []; }

    // [1.6.0] Строим Map картинок ДО обхода карточек
    log('parsePlaylist -> строим thumbMap из JSON...');
    var thumbMap = _parseXvJson(html);

    // Дополняем через regex если JSON дал мало результатов
    if (Object.keys(thumbMap).length < 5) {
      log('parsePlaylist -> JSON дал мало — дополняем regex thumbMap...');
      var regexMap = _buildThumbMap(html);
      for (var rk in regexMap) {
        if (!thumbMap[rk]) thumbMap[rk] = { thumb: regexMap[rk], title: '' };
      }
    }

    log('parsePlaylist -> thumbMap итого: ' + Object.keys(thumbMap).length);

    // Диагностика
    log('parsePlaylist -> ДИАГНОСТИКА:');
    log('  div.thumb:         ' + doc.querySelectorAll('div.thumb').length);
    log('  .mozaique .thumb:  ' + doc.querySelectorAll('.mozaique .thumb').length);
    log('  a[href*=/video]:   ' + doc.querySelectorAll('a[href*="/video"]').length);
    log('  img[data-src]:     ' + doc.querySelectorAll('img[data-src]').length);
    log('  noscript:          ' + doc.querySelectorAll('noscript').length);
    log('  p.title:           ' + doc.querySelectorAll('p.title').length);

    var cards = [];
    var seen  = {};

    // --- Стратегия 1: XPath ---
    log('parsePlaylist -> Стратегия 1: XPath...');
    try {
      var xp = "//div[contains(concat(' ',normalize-space(@class),' '),' thumb ') " +
               "and not(ancestor::div[contains(concat(' ',normalize-space(@class),' '),' thumb ')]) " +
               "and .//a[contains(@href,'/video')]]";
      var nodes = doc.evaluate(xp, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      log('parsePlaylist -> XPath узлов: ' + nodes.snapshotLength);

      for (var i = 0; i < nodes.snapshotLength; i++) {
        var c = _extractCard(nodes.snapshotItem(i), thumbMap);
        if (c && !seen[c.video]) { seen[c.video] = true; cards.push(c); }
      }
      log('parsePlaylist -> XPath карточек: ' + cards.length);
    } catch (e) {
      warn('parsePlaylist -> XPath ошибка: ' + e.message);
    }

    // --- Стратегия 2: CSS ---
    if (!cards.length) {
      log('parsePlaylist -> Стратегия 2: CSS...');
      var selectors = [
        '.mozaique .thumb-block', '.mozaique .thumb',
        '.thumb-block', '.thumb',
        '.thumbs .thumb', '.video-thumb', '.video-item', '.thumb-inside',
      ];
      for (var s = 0; s < selectors.length; s++) {
        var els = doc.querySelectorAll(selectors[s]);
        if (!els.length) continue;
        log('parsePlaylist -> CSS "' + selectors[s] + '" найдено: ' + els.length);

        forEachNode(els, function (el) {
          var parent = el.parentElement;
          if (parent && _hasClass(parent, 'thumb')) return;
          var c = _extractCard(el, thumbMap);
          if (c && !seen[c.video]) { seen[c.video] = true; cards.push(c); }
        });

        if (cards.length) {
          log('parsePlaylist -> CSS успешно: "' + selectors[s] + '"');
          break;
        }
      }
    }

    // --- Стратегия 3: a[href*=video] ---
    if (!cards.length) {
      log('parsePlaylist -> Стратегия 3: a[href*=video]...');
      var links = doc.querySelectorAll('a[href*="/video"]');

      forEachNode(links, function (a) {
        var rawHref = a.getAttribute('href') || '';
        if (!rawHref) return;
        if (rawHref.indexOf('http') !== 0) rawHref = HOST + rawHref;
        if (rawHref.indexOf('/video') === -1) return;

        var href = _cleanVideoHref(rawHref);
        if (seen[href]) return;

        // Картинка
        var pic = '';
        if (thumbMap[href]) pic = thumbMap[href].thumb || '';

        if (!pic) {
          var img = a.querySelector('img') || (a.parentElement && a.parentElement.querySelector('img'));
          if (img) pic = _getImgSrc(img);
        }
        if (!pic) pic = _getImgFromNoscript(a.parentElement || a);
        if (!pic) pic = _getImgFromOuterHtml(a.parentElement || a);

        // Название
        var title = '';
        if (thumbMap[href] && thumbMap[href].title) title = thumbMap[href].title;
        if (!title || title.length < 3) {
          var parentEl = a.parentElement;
          if (parentEl) {
            var pTitle = parentEl.querySelector('p.title, .title');
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
      log('parsePlaylist -> Стратегия 3: ' + cards.length);
    }

    // --- Итог ---
    if (!cards.length) {
      warn('parsePlaylist -> ❌ НИЧЕГО НЕ НАЙДЕНО');
      warn('  div[class*=thumb]: ' + doc.querySelectorAll('div[class*="thumb"]').length);
      warn('  a[href*=video]: '    + doc.querySelectorAll('a[href*="/video"]').length);
      if (doc.body) warn('  body (500): ' + doc.body.innerHTML.substring(0, 500));
    } else {
      var withPic = 0, noPic = 0;
      for (var ci = 0; ci < cards.length; ci++) {
        if (cards[ci].picture) withPic++; else noPic++;
      }
      log('parsePlaylist -> ✅ ИТОГО: ' + cards.length);
      log('  с картинками: ' + withPic + '  без: ' + noPic);
      log('  первая: "' + cards[0].name.substring(0, 40) + '"');
      log('  picture[0]: ' + (cards[0].picture ? cards[0].picture.substring(0, 70) : '❌ ПУСТО'));
    }

    return cards;
  }

  // ----------------------------------------------------------
  // getStreamLinks
  // ----------------------------------------------------------
  function getStreamLinks(url, success, failure) {
    log('getStreamLinks -> ' + url);
    httpGet(url, function (html) {
      log('getStreamLinks -> HTML длина: ' + html.length);
      var q = {};

      var mLow  = html.match(/html5player\.setVideoUrlLow$['"]([^'"]+)['"]$/);
      var mHigh = html.match(/html5player\.setVideoUrlHigh$['"]([^'"]+)['"]$/);
      var mHLS  = html.match(/html5player\.setVideoHLS$['"]([^'"]+)['"]$/);
      if (mLow  && mLow[1])  { q['480p'] = mLow[1];  log('getStreamLinks -> Метод 1: 480p'); }
      if (mHigh && mHigh[1]) { q['720p'] = mHigh[1]; log('getStreamLinks -> Метод 1: 720p'); }
      if (mHLS  && mHLS[1])  { q['HLS']  = mHLS[1];  log('getStreamLinks -> Метод 1: HLS'); }

      if (!Object.keys(q).length) {
        var mL2 = html.match(/"url_low"\s*:\s*"([^"]+)"/);
        var mH2 = html.match(/"url_high"\s*:\s*"([^"]+)"/);
        var mS2 = html.match(/"hls"\s*:\s*"([^"]+)"/);
        if (mL2 && mL2[1]) { q['480p'] = mL2[1]; log('getStreamLinks -> Метод 2: 480p'); }
        if (mH2 && mH2[1]) { q['720p'] = mH2[1]; log('getStreamLinks -> Метод 2: 720p'); }
        if (mS2 && mS2[1]) { q['HLS']  = mS2[1]; log('getStreamLinks -> Метод 2: HLS'); }
      }

      if (!Object.keys(q).length) {
        var mSd     = html.match(/["'](https?:\/\/[a-z0-9-]+\.xvideos-cdn\.com\/[^"'\s]+mp4_sd\.mp4[^"'\s]*)/);
        var mHd     = html.match(/["'](https?:\/\/[a-z0-9-]+\.xvideos-cdn\.com\/[^"'\s]+mp4_hd\.mp4[^"'\s]*)/);
        var mCdnHls = html.match(/["'](https?:\/\/[a-z0-9-]+\.xvideos-cdn\.com\/[^"'\s]+\.m3u8[^"'\s]*)/);
        if (mSd     && mSd[1])     { q['480p'] = mSd[1];     log('getStreamLinks -> Метод 3: 480p CDN'); }
        if (mHd     && mHd[1])     { q['720p'] = mHd[1];     log('getStreamLinks -> Метод 3: 720p CDN'); }
        if (mCdnHls && mCdnHls[1]) { q['HLS']  = mCdnHls[1]; log('getStreamLinks -> Метод 3: HLS CDN'); }
      }

      if (!Object.keys(q).length) {
        var reMp4 = /["'](https?:\/\/[^"'\s]+\.mp4[^"'\s]*)/g;
        var m4, idx4 = 0;
        while ((m4 = reMp4.exec(html)) && idx4 < 3) { q['auto' + idx4] = m4[1]; idx4++; }
      }

      if (!Object.keys(q).length) {
        var mM = html.match(/["'](https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/);
        if (mM && mM[1]) q['HLS'] = mM[1];
      }

      var keys = Object.keys(q);
      if (!keys.length) {
        err('getStreamLinks -> ❌ ссылки не найдены');
        warn('  html5player:   ' + (html.match(/html5player/gi)     || []).length);
        warn('  xvideos-cdn:   ' + (html.match(/xvideos-cdn\.com/gi) || []).length);
        warn('  .mp4:          ' + (html.match(/\.mp4/gi)            || []).length);
        warn('  URL: ' + url);
        var jsFrags = html.match(/html5player\.[^\n]{0,200}/g);
        if (jsFrags) for (var fi = 0; fi < Math.min(jsFrags.length, 3); fi++) warn('  ' + jsFrags[fi]);
        failure('xv-ru: нет ссылок на видео'); return;
      }

      log('getStreamLinks -> ✅ качеств: ' + keys.length);
      for (var k = 0; k < keys.length; k++) log('  ' + keys[k] + ' -> ' + q[keys[k]].substring(0, 100));
      success({ qualitys: q });

    }, function (e) { err('getStreamLinks -> ошибка: ' + e); failure(e); });
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
      { title: 'Сортировка: ' + sortObj.title, playlist_url: 'submenu', submenu: sortSub },
    ];
    if (categories && categories.length) {
      var catSub = [];
      for (var j = 0; j < categories.length; j++) {
        catSub.push({ title: categories[j].title, playlist_url: HOST + '/' + categories[j].urlPath });
      }
      menu.push({ title: 'Категории (' + categories.length + ')', playlist_url: 'submenu', submenu: catSub });
    }
    return menu;
  }

  // ----------------------------------------------------------
  // Публичный интерфейс
  // ----------------------------------------------------------
  var Parser = {

    main: function (params, success, failure) {
      log('main() -> вызван');
      httpGet(HOST + '/', function (html) {
        var results = parsePlaylist(html);
        if (!results.length) { failure('xv-ru: нет карточек'); return; }
        log('main() -> карточек: ' + results.length);
        getCategories(function (cats) {
          success({ results: results, collection: true, total_pages: 30, menu: buildMenu(HOST, cats) });
        });
      }, function (e) { err('main() -> ошибка: ' + e); failure(e); });
    },

    view: function (params, success, failure) {
      var rawUrl = ((params && params.url) || HOST).replace(/[?&]pg=\d+/, '');
      var page   = parseInt((params && params.page), 10) || 1;
      var state  = parseState(rawUrl);
      var load   = buildUrl(state.sort, state.search, state.category, page);

      log('view() -> ' + load + ' | стр.' + page);

      httpGet(load, function (html) {
        var results = parsePlaylist(html);
        if (!results.length) { failure('xv-ru: нет карточек'); return; }
        getCategories(function (cats) {
          success({
            results:     results,
            collection:  true,
            total_pages: results.length >= 25 ? page + 5 : page,
            menu:        buildMenu(rawUrl, cats),
          });
        });
      }, function (e) { err('view() -> ошибка: ' + e); failure(e); });
    },

    search: function (params, success, failure) {
      var query = (params && params.query) || '';
      var page  = parseInt((params && params.page), 10) || 1;
      log('search() -> "' + query + '" стр.' + page);
      if (!query) { failure('xv-ru: пустой запрос'); return; }

      var searchUrl = buildUrl('top', query, '', page);
      httpGet(searchUrl, function (html) {
        var results = parsePlaylist(html);
        if (!results.length) { failure('xv-ru: ничего не найдено'); return; }
        success({
          title:       'xv-ru: ' + query,
          results:     results,
          url:         HOST + '/?k=' + encodeURIComponent(query) + '&top',
          collection:  true,
          total_pages: page + 5,
        });
      }, function (e) { err('search() -> ошибка: ' + e); failure(e); });
    },

    qualitys: function (url, success, failure) {
      log('qualitys() -> ' + url);
      getStreamLinks(url, success, failure);
    },
  };

  // ----------------------------------------------------------
  // Регистрация
  // ----------------------------------------------------------
  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, Parser);
      log('✅ v1.6.0 зарегистрирован');
      return true;
    }
    return false;
  }

  if (!tryRegister()) {
    var _elapsed = 0;
    var _timer   = setInterval(function () {
      _elapsed += 100;
      if (tryRegister() || _elapsed >= 10000) {
        clearInterval(_timer);
        if (_elapsed >= 10000) err('❌ registerParser не найден за 10с');
      }
    }, 100);
  }

})();
