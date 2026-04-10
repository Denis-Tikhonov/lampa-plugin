// =============================================================
// xv-ru.js — Парсер xv-ru.com для AdultJS / AdultPlugin (Lampa)
// Version  : 1.5.0
// Changed  :
//   [1.4.0] slugToName — regex /video.{hash}/{id}/0/{slug}
//   [1.4.0] getStreamLinks — regex для mp4/hls cdn xvideos-cdn.com
//   [1.4.0] Cookie: static_cdn=1 во все сетевые запросы
//   [1.5.0] ИСПРАВЛЕНО: поиск — добавлена сортировка &top в поиске
//   [1.5.0] ДОБАВЛЕНО:  категории /c/{slug}-{id} — парсинг и навигация
//   [1.5.0] ДОБАВЛЕНО:  parseState() — извлечение category из URL
//   [1.5.0] ДОБАВЛЕНО:  buildUrl() — 4-й параметр category
//   [1.5.0] ДОБАВЛЕНО:  динамическое получение категорий со страницы
//   [1.5.0] ДОБАВЛЕНО:  расширенные селекторы для title (.title a, p.title)
//   [1.5.0] ИСПРАВЛЕНО: _getImgSrc — fallback на noscript img
//   [1.5.0] ДОБАВЛЕНО:  меню с категориями
//   [1.5.0] ДОБАВЛЕНО:  пагинация поиска через &p=
//   [1.5.0] ДОБАВЛЕНО:  пагинация категорий через /{page}
//   [1.5.0] СОХРАНЕНО:  все логи и тестирование из 1.4.0
// =============================================================

(function () {
  'use strict';

  var HOST = 'https://www.xv-ru.com';
  var NAME = 'xv-ru';
  var TAG  = '[xv-ru 1.5.0]';

  var WORKER_DEFAULT = 'https://ВАШ-WORKER.ВАШ-АККАУНТ.workers.dev/?url=';

  // ----------------------------------------------------------
  // Заголовки
  // ----------------------------------------------------------
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
  if (!Array.prototype.findIndex) {
    Array.prototype.findIndex = function (fn) {
      for (var i = 0; i < this.length; i++) if (fn(this[i], i, this)) return i;
      return -1;
    };
  }
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (s, p) {
      p = p || 0;
      return this.indexOf(s, p) === p;
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

  // [1.5.0] Метка времени для подробных логов
  function _ts() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' +
      ('0' + d.getMinutes()).slice(-2) + ':' +
      ('0' + d.getSeconds()).slice(-2) + '.' +
      ('00' + d.getMilliseconds()).slice(-3);
  }

  // ----------------------------------------------------------
  // _slugProcess — slug в читаемый заголовок
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
  // slugToName
  // /video.{hash}/{id}/{num}/{slug}
  // ----------------------------------------------------------
  function slugToName(href) {
    if (!href) return '';

    var mFull = href.match(/\/video\.[^\/]+\/\d+\/\d+\/([^\/\?#]+)/);
    if (mFull && mFull[1] && mFull[1].length >= 3) {
      return _slugProcess(mFull[1]);
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
    fetch(url, {
      method:  'GET',
      headers: REQUEST_HEADERS,
    })
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
  // Сортировки [1.5.0] — добавлены searchParam для сортировки в поиске
  // ----------------------------------------------------------
  var SORTS = [
    { title: 'Новинки',      val: 'new',  urlPath: 'new',          searchParam: ''     },
    { title: 'Лучшее',       val: 'best', urlPath: 'best-videos',  searchParam: '&top' },
    { title: 'Популярные',   val: 'top',  urlPath: 'most-viewed',  searchParam: '&top' },
    { title: 'Длительные',   val: 'long', urlPath: 'longest',      searchParam: ''     },
  ];

  // ----------------------------------------------------------
  // [1.5.0] Кэш категорий — загружается динамически
  // ----------------------------------------------------------
  var _categoriesCache = null;
  var _categoriesLoading = false;
  var _categoriesCallbacks = [];

  // ----------------------------------------------------------
  // [1.5.0] parseCategories — извлечь категории из HTML
  // Формат ссылки: /c/{slug}-{id}
  // ----------------------------------------------------------
  function parseCategories(html) {
    if (!html) return [];

    var doc;
    try {
      doc = new DOMParser().parseFromString(html, 'text/html');
    } catch (e) {
      err('parseCategories -> DOMParser ошибка: ' + e.message);
      return [];
    }

    var cats = [];
    var seen = {};

    // Ищем все ссылки на категории
    var links = doc.querySelectorAll('a[href*="/c/"]');
    log('parseCategories -> найдено ссылок /c/: ' + links.length);

    forEachNode(links, function (a) {
      var href = a.getAttribute('href') || '';
      var match = href.match(/\/c\/([^\/\?#]+)/);
      if (!match || !match[1]) return;

      var slug = match[1]; // "Asian_Woman-32"
      if (seen[slug]) return;
      seen[slug] = true;

      var title = (a.textContent || '').trim();
      if (!title || title.length < 2) {
        // Извлечь из slug: "Asian_Woman-32" → "Asian Woman"
        title = slug.replace(/-\d+$/, '').replace(/[_-]+/g, ' ').trim();
      }

      if (title.length >= 2) {
        cats.push({
          title: title,
          val:   slug,
          urlPath: 'c/' + slug,
        });
      }
    });

    log('parseCategories -> категорий найдено: ' + cats.length);
    if (cats.length > 0) {
      log('parseCategories -> первые 5: ' + cats.slice(0, 5).map(function (c) {
        return c.title + ' (' + c.urlPath + ')';
      }).join(', '));
    }

    return cats;
  }

  // ----------------------------------------------------------
  // [1.5.0] getCategories — получить категории (с кэшем)
  // ----------------------------------------------------------
  function getCategories(callback) {
    if (_categoriesCache) {
      callback(_categoriesCache);
      return;
    }

    _categoriesCallbacks.push(callback);

    if (_categoriesLoading) return;
    _categoriesLoading = true;

    // Страница с категориями — пробуем основную + /c/
    var catPageUrl = HOST + '/c';
    log('getCategories -> загрузка ' + catPageUrl);

    httpGet(catPageUrl, function (html) {
      _categoriesCache = parseCategories(html);
      _categoriesLoading = false;

      // Если на /c/ мало категорий — попробовать главную
      if (_categoriesCache.length < 5) {
        log('getCategories -> мало категорий на /c/, пробую главную...');
        httpGet(HOST + '/', function (mainHtml) {
          var mainCats = parseCategories(mainHtml);
          // Объединить
          var seen = {};
          for (var i = 0; i < _categoriesCache.length; i++) {
            seen[_categoriesCache[i].val] = true;
          }
          for (var j = 0; j < mainCats.length; j++) {
            if (!seen[mainCats[j].val]) {
              _categoriesCache.push(mainCats[j]);
            }
          }
          log('getCategories -> объединено категорий: ' + _categoriesCache.length);
          _flushCatCallbacks();
        }, function () {
          _flushCatCallbacks();
        });
      } else {
        _flushCatCallbacks();
      }
    }, function (e) {
      warn('getCategories -> ошибка загрузки: ' + e);
      _categoriesCache = [];
      _categoriesLoading = false;
      _flushCatCallbacks();
    });
  }

  function _flushCatCallbacks() {
    var cbs = _categoriesCallbacks.slice();
    _categoriesCallbacks = [];
    for (var i = 0; i < cbs.length; i++) {
      try { cbs[i](_categoriesCache); } catch (e) {}
    }
  }

  // ----------------------------------------------------------
  // [1.5.0] parseState — ПОЛНЫЙ: sort, search, category
  // ----------------------------------------------------------
  function parseState(url) {
    var sort = '', search = '', category = '';
    if (!url) return { sort: sort, search: search, category: category };

    log('parseState -> входной URL: ' + url);

    // 1) Поиск: ?k=query&top
    var kMatch = url.match(/[?&]k=([^&]+)/);
    if (kMatch && kMatch[1]) {
      search = decodeURIComponent(kMatch[1].replace(/\+/g, ' '));

      // Сортировка внутри поиска
      if (url.indexOf('&top')  !== -1) sort = 'top';
      if (url.indexOf('&new')  !== -1) sort = 'new';
      if (url.indexOf('&best') !== -1) sort = 'best';
      if (url.indexOf('&long') !== -1) sort = 'long';

      log('parseState -> ПОИСК: search="' + search + '" sort=' + sort);
      return { sort: sort, search: search, category: category };
    }

    // 2) Ловим search= параметр (от AdultJS)
    var searchMatch = url.match(/[?&]search=([^&]+)/);
    if (searchMatch && searchMatch[1]) {
      search = decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
      log('parseState -> ПОИСК (search=): search="' + search + '"');
      return { sort: sort, search: search, category: category };
    }

    // 3) Категория: /c/{slug}-{id}
    var cMatch = url.match(/\/c\/([^\/\?#]+)/);
    if (cMatch && cMatch[1]) {
      category = cMatch[1];
      log('parseState -> КАТЕГОРИЯ: ' + category);
      return { sort: sort, search: search, category: category };
    }

    // 4) Обычная сортировка
    var path = url.replace(HOST, '').replace(/^\//, '').replace(/\/\d+\/?$/, '');
    for (var i = 0; i < SORTS.length; i++) {
      if (path === SORTS[i].urlPath || path.indexOf(SORTS[i].urlPath + '/') === 0) {
        sort = SORTS[i].val;
        break;
      }
    }

    log('parseState -> sort=' + sort + ' search=' + search + ' category=' + category);
    return { sort: sort, search: search, category: category };
  }

  // ----------------------------------------------------------
  // [1.5.0] buildUrl — ПОЛНЫЙ: sort, search, category, page
  //
  // Поиск:     /?k=query&top&p=0
  // Категория:  /c/Asian_Woman-32/2
  // Сортировка: /new/2, /best-videos/3, /most-viewed/1
  // ----------------------------------------------------------
  function buildUrl(sort, search, category, page) {
    page = parseInt(page, 10) || 1;

    // ===== ПОИСК =====
    if (search) {
      // Параметр пагинации: &p=0 (первая страница), &p=1 (вторая)
      var offset = page > 1 ? '&p=' + (page - 1) : '';

      // Сортировка внутри поиска
      var sortParam = '';
      if (sort === 'top' || sort === 'best') sortParam = '&top';

      var searchUrl = HOST + '/?k=' + encodeURIComponent(search) + sortParam + offset;
      log('buildUrl -> ПОИСК: ' + searchUrl);
      return searchUrl;
    }

    // ===== КАТЕГОРИЯ =====
    if (category) {
      var catUrl = HOST + '/c/' + category + (page > 1 ? '/' + page : '');
      log('buildUrl -> КАТЕГОРИЯ: ' + catUrl);
      return catUrl;
    }

    // ===== СОРТИРОВКА =====
    if (!sort) {
      var defUrl = page <= 1 ? HOST + '/' : HOST + '/new/' + page;
      log('buildUrl -> ДЕФОЛТ: ' + defUrl);
      return defUrl;
    }

    var sortObj = arrayFind(SORTS, function (s) { return s.val === sort; }) || SORTS[0];
    var sortUrl = HOST + '/' + sortObj.urlPath + '/' + page;
    log('buildUrl -> СОРТИРОВКА: ' + sortUrl);
    return sortUrl;
  }

  // ----------------------------------------------------------
  // _getImgSrc [1.5.0] — расширенный поиск картинки
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
      if (!v) continue;
      if (v.indexOf('blank.gif')  !== -1) continue;
      if (v.indexOf('data:image') === 0)  continue;
      if (v.indexOf('spacer.gif') !== -1) continue;
      if (v.indexOf('placeholder') !== -1) continue;
      if (v.length < 10) continue;
      return v;
    }
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
  // [1.5.0] _extractCard — расширенные селекторы для title и img
  // ----------------------------------------------------------
  function _extractCard(el) {

    var aEl = el.querySelector('a[href*="/video"]');
    if (!aEl) aEl = el.querySelector('a[href]');
    if (!aEl) return null;

    var rawHref = aEl.getAttribute('href') || '';
    if (!rawHref) return null;
    if (rawHref.indexOf('http') !== 0) rawHref = HOST + rawHref;

    // Пропускаем ссылки не на видео
    if (rawHref.indexOf('/video') === -1 && rawHref.indexOf('/video.') === -1) {
      return null;
    }

    var href = _cleanVideoHref(rawHref);

    // --- Картинка ---
    var imgEl = aEl.querySelector('img') || el.querySelector('img');
    var picture = _getImgSrc(imgEl);

    // [1.5.0] Fallback: ищем картинку в noscript
    if (!picture) {
      var noscript = el.querySelector('noscript');
      if (noscript) {
        var nsMatch = noscript.textContent.match(/src=["']([^"']+)/);
        if (nsMatch && nsMatch[1]) {
          picture = nsMatch[1];
          log('_extractCard -> картинка из noscript: ' + picture.substring(0, 60));
        }
      }
    }

    // [1.5.0] Fallback: ищем в data-mediabook или style background
    if (!picture && el.getAttribute('data-mediabook')) {
      picture = el.getAttribute('data-mediabook');
    }
    if (!picture) {
      var styleEl = el.querySelector('[style*="background"]');
      if (styleEl) {
        var bgMatch = (styleEl.getAttribute('style') || '').match(/url\(['"]?([^'")]+)/);
        if (bgMatch && bgMatch[1]) picture = bgMatch[1];
      }
    }

    // --- Название ---
    var name = '';

    // [1.5.0] Расширенные селекторы для названия
    var titleSelectors = [
      'p.title a',
      'p.title',
      '.title a',
      '.title',
      '.video-title a',
      '.video-title',
      'a .title',
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

    if (!name && imgEl) name = (imgEl.getAttribute('alt') || '').trim();

    if (!name || name.length < 3) name = slugToName(rawHref);

    if (!name || name.length < 3) return null;

    // --- Длительность ---
    var durSelectors = ['.duration', 'span.duration', 'time', '.dur', '.video-duration'];
    var time = '';
    for (var ds = 0; ds < durSelectors.length; ds++) {
      var durEl = el.querySelector(durSelectors[ds]);
      if (durEl) {
        time = (durEl.textContent || '').trim();
        if (time) break;
      }
    }

    // --- Качество ---
    var qualityEl = el.querySelector('.video-hd-mark, .hd-mark, .quality');
    var quality = qualityEl ? (qualityEl.textContent || '').trim() : 'HD';
    if (!quality) quality = 'HD';

    log('_extractCard -> OK: "' + name.substring(0, 50) + '" | pic=' +
        (picture ? picture.substring(0, 50) : 'ПУСТО') + ' | ' + href.substring(0, 60));

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
  // parsePlaylist [1.5.0] — расширенное извлечение
  // ----------------------------------------------------------
  function parsePlaylist(html) {
    if (!html) { warn('parsePlaylist -> html пустой'); return []; }
    log('parsePlaylist -> длина HTML: ' + html.length);

    var doc;
    try {
      doc = new DOMParser().parseFromString(html, 'text/html');
    } catch (e) {
      err('parsePlaylist -> DOMParser ошибка: ' + e.message);
      return [];
    }

    var cards = [];
    var seen  = {};

    // [1.5.0] Диагностика HTML-структуры
    log('parsePlaylist -> ДИАГНОСТИКА:');
    log('  div.thumb:               ' + doc.querySelectorAll('div.thumb').length);
    log('  .mozaique .thumb:        ' + doc.querySelectorAll('.mozaique .thumb').length);
    log('  a[href*="/video"]:       ' + doc.querySelectorAll('a[href*="/video"]').length);
    log('  img[data-src]:           ' + doc.querySelectorAll('img[data-src]').length);
    log('  img[src]:                ' + doc.querySelectorAll('img[src]').length);
    log('  .thumb-inside:           ' + doc.querySelectorAll('.thumb-inside').length);
    log('  p.title:                 ' + doc.querySelectorAll('p.title').length);

    // --- Стратегия 1: XPath ---
    log('parsePlaylist -> Стратегия 1: XPath...');
    try {
      var xp = "//div[contains(concat(' ',normalize-space(@class),' '),' thumb ') " +
               "and not(ancestor::div[contains(concat(' ',normalize-space(@class),' '),' thumb ')]) " +
               "and .//a[contains(@href,'/video')]]";

      var nodes = doc.evaluate(xp, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      log('parsePlaylist -> XPath найдено узлов: ' + nodes.snapshotLength);

      for (var i = 0; i < nodes.snapshotLength; i++) {
        var c = _extractCard(nodes.snapshotItem(i));
        if (c && !seen[c.video]) {
          seen[c.video] = true;
          cards.push(c);
        }
      }
      log('parsePlaylist -> XPath извлечено карточек: ' + cards.length);
    } catch (e) {
      warn('parsePlaylist -> XPath ошибка: ' + e.message);
    }

    // --- Стратегия 2: CSS ---
    if (!cards.length) {
      log('parsePlaylist -> Стратегия 2: CSS...');
      var selectors = [
        '.mozaique .thumb-block',
        '.mozaique .thumb',
        '.thumb-block',
        '.thumb',
        '.thumbs .thumb',
        '.video-thumb',
        '.video-item',
        '.thumb-inside',
      ];

      for (var s = 0; s < selectors.length; s++) {
        var els = doc.querySelectorAll(selectors[s]);
        if (!els.length) continue;
        log('parsePlaylist -> CSS "' + selectors[s] + '" найдено: ' + els.length);

        forEachNode(els, function (el) {
          var parent = el.parentElement;
          if (parent && _hasClass(parent, 'thumb') && selectors[s] === '.thumb') return;

          var c = _extractCard(el);
          if (c && !seen[c.video]) {
            seen[c.video] = true;
            cards.push(c);
          }
        });

        if (cards.length) {
          log('parsePlaylist -> CSS стратегия успешна: "' + selectors[s] + '"');
          break;
        }
      }
      log('parsePlaylist -> CSS извлечено карточек: ' + cards.length);
    }

    // --- Стратегия 3: a[href*=video] ---
    if (!cards.length) {
      log('parsePlaylist -> Стратегия 3: a[href*=video]...');
      var links = doc.querySelectorAll('a[href*="/video"]');

      forEachNode(links, function (a) {
        var rawHref = a.getAttribute('href') || '';
        if (!rawHref) return;
        if (rawHref.indexOf('http') !== 0) rawHref = HOST + rawHref;
        if (rawHref.indexOf('/video') === -1 && rawHref.indexOf('/video.') === -1) return;

        var href = _cleanVideoHref(rawHref);
        if (seen[href]) return;

        var img = a.querySelector('img');
        if (!img && a.parentElement) img = a.parentElement.querySelector('img');
        if (!img && a.closest) {
          var closestThumb = a.closest('.thumb, .thumb-block');
          if (closestThumb) img = closestThumb.querySelector('img');
        }

        var title = '';

        // Проверяем родительский элемент на наличие title
        var parentEl = a.parentElement;
        if (parentEl) {
          var pTitle = parentEl.querySelector('p.title, .title');
          if (pTitle) title = (pTitle.getAttribute('title') || pTitle.textContent || '').trim();
        }

        if (!title && img) title = (img.getAttribute('alt') || '').trim();
        if (!title || title.length < 3) {
          var attrTitle = (a.getAttribute('title') || '').trim();
          if (attrTitle.length >= 3) title = attrTitle;
        }
        if (!title || title.length < 3) title = slugToName(rawHref);
        if (!title || title.length < 3) return;

        var pic = _getImgSrc(img);
        seen[href] = true;
        cards.push({
          name: title, video: href, picture: pic,
          preview: null, time: '', quality: 'HD',
          json: true, related: true, source: NAME,
        });
      });
      log('parsePlaylist -> Стратегия 3 извлечено: ' + cards.length);
    }

    // --- Итог ---
    if (!cards.length) {
      warn('parsePlaylist -> ❌ НИЧЕГО НЕ НАЙДЕНО');
      warn('parsePlaylist -> div[class*=thumb]: ' + doc.querySelectorAll('div[class*="thumb"]').length);
      warn('parsePlaylist -> a[href*=video]: '    + doc.querySelectorAll('a[href*="/video"]').length);
      warn('parsePlaylist -> body.innerHTML (первые 1000): ');
      if (doc.body) {
        warn(doc.body.innerHTML.substring(0, 1000));
      } else {
        warn('body отсутствует!');
      }
    } else {
      log('parsePlaylist -> ✅ ИТОГО: ' + cards.length + ' карточек');
      log('parsePlaylist -> первая: "' + cards[0].name.substring(0, 40) + '"');
      log('parsePlaylist -> picture[0]: ' + (cards[0].picture || 'ПУСТО'));
      log('parsePlaylist -> video[0]:   ' + cards[0].video.substring(0, 80));

      // [1.5.0] Статистика по картинкам
      var withPic = 0, noPic = 0;
      for (var ci = 0; ci < cards.length; ci++) {
        if (cards[ci].picture) withPic++;
        else noPic++;
      }
      log('parsePlaylist -> с картинками: ' + withPic + ', без: ' + noPic);
    }

    return cards;
  }

  // ----------------------------------------------------------
  // getStreamLinks [1.5.0]
  // ----------------------------------------------------------
  function getStreamLinks(url, success, failure) {
    log('getStreamLinks -> ' + url);
    httpGet(url, function (html) {
      log('getStreamLinks -> HTML длина: ' + html.length);
      var q = {};

      // --- Метод 1: html5player.set* ---
      var mLow  = html.match(/html5player\.setVideoUrlLow\(['"]([^'"]+)['"]\)/);
      var mHigh = html.match(/html5player\.setVideoUrlHigh\(['"]([^'"]+)['"]\)/);
      var mHLS  = html.match(/html5player\.setVideoHLS\(['"]([^'"]+)['"]\)/);
      if (mLow  && mLow[1])  { q['480p'] = mLow[1];  log('getStreamLinks -> Метод 1: 480p найден'); }
      if (mHigh && mHigh[1]) { q['720p'] = mHigh[1];  log('getStreamLinks -> Метод 1: 720p найден'); }
      if (mHLS  && mHLS[1])  { q['HLS']  = mHLS[1];   log('getStreamLinks -> Метод 1: HLS найден'); }

      // --- Метод 2: JSON-поля ---
      if (!Object.keys(q).length) {
        log('getStreamLinks -> Метод 2: JSON-поля...');
        var mL2 = html.match(/"url_low"\s*:\s*"([^"]+)"/);
        var mH2 = html.match(/"url_high"\s*:\s*"([^"]+)"/);
        var mS2 = html.match(/"hls"\s*:\s*"([^"]+)"/);
        if (mL2 && mL2[1]) { q['480p'] = mL2[1]; log('getStreamLinks -> Метод 2: 480p'); }
        if (mH2 && mH2[1]) { q['720p'] = mH2[1]; log('getStreamLinks -> Метод 2: 720p'); }
        if (mS2 && mS2[1]) { q['HLS']  = mS2[1]; log('getStreamLinks -> Метод 2: HLS'); }
      }

      // --- Метод 3: CDN xvideos-cdn.com ---
      if (!Object.keys(q).length) {
        log('getStreamLinks -> Метод 3: CDN regex...');
        var mSd = html.match(/["'](https?:\/\/mp4-[a-z0-9]+\.xvideos-cdn\.com\/[^"'\s]+mp4_sd\.mp4[^"'\s]*)/);
        var mHd = html.match(/["'](https?:\/\/mp4-[a-z0-9]+\.xvideos-cdn\.com\/[^"'\s]+mp4_hd\.mp4[^"'\s]*)/);
        var mCdnHls = html.match(/["'](https?:\/\/hls-[a-z0-9]+\.xvideos-cdn\.com\/[^"'\s]+\.m3u8[^"'\s]*)/);

        // [1.5.0] Также ищем на gcore CDN
        if (!mSd) mSd = html.match(/["'](https?:\/\/mp4-gcore\.xvideos-cdn\.com\/[^"'\s]+mp4_sd\.mp4[^"'\s]*)/);
        if (!mHd) mHd = html.match(/["'](https?:\/\/mp4-gcore\.xvideos-cdn\.com\/[^"'\s]+mp4_hd\.mp4[^"'\s]*)/);
        if (!mCdnHls) mCdnHls = html.match(/["'](https?:\/\/hls-gcore\.xvideos-cdn\.com\/[^"'\s]+\.m3u8[^"'\s]*)/);

        // [1.5.0] Ещё вариант: thumbs-gcore / thumb-cdn77
        if (!mSd) mSd = html.match(/["'](https?:\/\/[a-z0-9-]+\.xvideos-cdn\.com\/[^"'\s]+mp4_sd\.mp4[^"'\s]*)/);
        if (!mHd) mHd = html.match(/["'](https?:\/\/[a-z0-9-]+\.xvideos-cdn\.com\/[^"'\s]+mp4_hd\.mp4[^"'\s]*)/);
        if (!mCdnHls) mCdnHls = html.match(/["'](https?:\/\/[a-z0-9-]+\.xvideos-cdn\.com\/[^"'\s]+\.m3u8[^"'\s]*)/);

        if (mSd     && mSd[1])     { q['480p'] = mSd[1];     log('getStreamLinks -> Метод 3: 480p CDN'); }
        if (mHd     && mHd[1])     { q['720p'] = mHd[1];     log('getStreamLinks -> Метод 3: 720p CDN'); }
        if (mCdnHls && mCdnHls[1]) { q['HLS']  = mCdnHls[1]; log('getStreamLinks -> Метод 3: HLS CDN'); }
      }

      // --- Метод 4: любой .mp4 ---
      if (!Object.keys(q).length) {
        log('getStreamLinks -> Метод 4: любой .mp4...');
        var reMp4 = /["'](https?:\/\/[^"'\s]+\.mp4[^"'\s]*)/g;
        var m4, idx4 = 0;
        while ((m4 = reMp4.exec(html)) && idx4 < 3) {
          q['auto' + idx4] = m4[1];
          log('getStreamLinks -> Метод 4: auto' + idx4 + ' -> ' + m4[1].substring(0, 60));
          idx4++;
        }
      }

      // --- Метод 5: любой .m3u8 ---
      if (!Object.keys(q).length) {
        log('getStreamLinks -> Метод 5: любой .m3u8...');
        var mM = html.match(/["'](https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/);
        if (mM && mM[1]) { q['HLS'] = mM[1]; log('getStreamLinks -> Метод 5: HLS'); }
      }

      // --- Итог ---
      var keys = Object.keys(q);
      if (!keys.length) {
        err('getStreamLinks -> ❌ ссылки не найдены');
        warn('getStreamLinks -> html5player hits:    ' + (html.match(/html5player/gi)     || []).length);
        warn('getStreamLinks -> xvideos-cdn hits:    ' + (html.match(/xvideos-cdn\.com/gi) || []).length);
        warn('getStreamLinks -> .mp4 hits:           ' + (html.match(/\.mp4/gi)            || []).length);
        warn('getStreamLinks -> .m3u8 hits:          ' + (html.match(/\.m3u8/gi)           || []).length);
        warn('getStreamLinks -> setVideoUrl hits:    ' + (html.match(/setVideoUrl/gi)      || []).length);
        warn('getStreamLinks -> URL был: ' + url);

        // [1.5.0] Дамп фрагмента JS, содержащего ссылки на видео
        var jsFrags = html.match(/html5player\.[^\n]{0,200}/g);
        if (jsFrags) {
          warn('getStreamLinks -> фрагменты html5player:');
          for (var fi = 0; fi < Math.min(jsFrags.length, 5); fi++) {
            warn('  ' + jsFrags[fi]);
          }
        }

        failure('xv-ru: нет ссылок на видео');
        return;
      }

      log('getStreamLinks -> ✅ качеств: ' + keys.length);
      for (var k = 0; k < keys.length; k++) {
        log('  ' + keys[k] + ' -> ' + q[keys[k]].substring(0, 100));
      }
      success({ qualitys: q });

    }, function (e) {
      err('getStreamLinks -> ошибка: ' + e);
      failure(e);
    });
  }

  // ----------------------------------------------------------
  // [1.5.0] buildMenu — с категориями
  // ----------------------------------------------------------
  function buildMenu(url, categories) {
    var state   = parseState(url);
    var sortObj = arrayFind(SORTS, function (s) { return s.val === state.sort; }) || SORTS[0];

    // Подменю сортировки
    var sortSub = [];
    for (var i = 0; i < SORTS.length; i++) {
      sortSub.push({
        title:        SORTS[i].title,
        playlist_url: HOST + '/' + SORTS[i].urlPath + '/1',
      });
    }

    var menu = [
      { title: 'Поиск', playlist_url: HOST, search_on: true },
      { title: 'Сортировка: ' + sortObj.title, playlist_url: 'submenu', submenu: sortSub },
    ];

    // [1.5.0] Подменю категорий
    if (categories && categories.length) {
      var catSub = [];
      for (var j = 0; j < categories.length; j++) {
        catSub.push({
          title:        categories[j].title,
          playlist_url: HOST + '/' + categories[j].urlPath,
        });
      }
      menu.push({
        title: 'Категории (' + categories.length + ')',
        playlist_url: 'submenu',
        submenu: catSub,
      });
    }

    log('buildMenu -> пунктов: ' + menu.length);
    return menu;
  }

  // ----------------------------------------------------------
  // Публичный интерфейс
  // ----------------------------------------------------------
  var Parser = {

    // ====================
    // main — главная страница
    // ====================
    main: function (params, success, failure) {
      log('main() -> вызван');
      httpGet(HOST + '/', function (html) {
        var results = parsePlaylist(html);
        if (!results.length) { failure('xv-ru: нет карточек'); return; }
        log('main() -> карточек: ' + results.length);

        // [1.5.0] Подгружаем категории для меню
        getCategories(function (cats) {
          log('main() -> категорий загружено: ' + cats.length);
          success({
            results:     results,
            collection:  true,
            total_pages: 30,
            menu:        buildMenu(HOST, cats),
          });
        });
      }, function (e) {
        err('main() -> ошибка: ' + e);
        failure(e);
      });
    },

    // ====================
    // view — страница каталога / категории / сортировки
    // ====================
    view: function (params, success, failure) {
      var rawUrl = ((params && params.url) || HOST).replace(/[?&]pg=\d+/, '');
      var page   = parseInt((params && params.page), 10) || 1;
      var state  = parseState(rawUrl);
      var load   = buildUrl(state.sort, state.search, state.category, page);

      log('view() -> loadUrl: ' + load);
      log('view() -> ' + JSON.stringify({
        url:      rawUrl,
        page:     page,
        search:   state.search,
        sort:     state.sort,
        category: state.category,
      }));

      httpGet(load, function (html) {
        var results = parsePlaylist(html);
        if (!results.length) { failure('xv-ru: нет карточек'); return; }
        log('view() -> карточек: ' + results.length);

        // [1.5.0] Подгружаем категории для меню
        getCategories(function (cats) {
          success({
            results:     results,
            collection:  true,
            total_pages: results.length >= 25 ? page + 5 : page,
            menu:        buildMenu(rawUrl, cats),
          });
        });
      }, function (e) {
        err('view() -> ошибка: ' + e);
        failure(e);
      });
    },

    // ====================
    // search — поиск
    // ====================
    search: function (params, success, failure) {
      var query = (params && params.query) || '';
      var page  = parseInt((params && params.page), 10) || 1;
      log('search() -> "' + query + '" стр.' + page);

      if (!query) { failure('xv-ru: пустой запрос'); return; }

      // [1.5.0] По умолчанию сортировка по релевантности (&top)
      var searchUrl = buildUrl('top', query, '', page);
      log('search() -> URL: ' + searchUrl);

      httpGet(searchUrl, function (html) {
        var results = parsePlaylist(html);
        if (!results.length) { failure('xv-ru: ничего не найдено'); return; }
        log('search() -> найдено: ' + results.length);
        success({
          title:       'xv-ru: ' + query,
          results:     results,
          url:         HOST + '/?k=' + encodeURIComponent(query) + '&top',
          collection:  true,
          total_pages: page + 5,
        });
      }, function (e) {
        err('search() -> ошибка: ' + e);
        failure(e);
      });
    },

    // ====================
    // qualitys — извлечение видео
    // ====================
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
      log('✅ v1.5.0 зарегистрирован');
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
        if (_elapsed >= 10000) err('❌ AdultPlugin.registerParser не найден за 10с');
      }
    }, 100);
  }

})();
