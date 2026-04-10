// =============================================================
// xv-ru.js — Парсер xv-ru.com для AdultJS / AdultPlugin (Lampa)
// Version  : 1.4.0
// Changed  :
//   [1.4.0] ИСПРАВЛЕНО: slugToName — новый regex /video.{hash}/{id}/0/{slug}
//           ДОБАВЛЕНО:  getStreamLinks — regex для mp4/hls cdn xvideos-cdn.com
//           ДОБАВЛЕНО:  Cookie: static_cdn=1 во все сетевые запросы
// =============================================================

(function () {
  'use strict';

  var HOST = 'https://www.xv-ru.com';
  var NAME = 'xv-ru';
  var TAG  = '[xv-ru]';

  var WORKER_DEFAULT = 'https://ВАШ-WORKER.ВАШ-АККАУНТ.workers.dev/?url=';

  // ----------------------------------------------------------
  // Заголовки — добавляем static_cdn cookie [1.4.0]
  // ----------------------------------------------------------
  var REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Cookie':     'static_cdn=1',
    'Referer':    HOST + '/',
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

  // ----------------------------------------------------------
  // _slugProcess — slug в читаемый заголовок
  // "while_wrestling_with_my_stepsister" → "While Wrestling With My Stepsister"
  // ----------------------------------------------------------
  function _slugProcess(slug) {
    if (!slug || slug.length < 3) return '';
    var words = slug.replace(/[-_]+/g, ' ').trim().split(' ');
    var result = [];
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (!w) continue;
      result.push(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    }
    return result.join(' ');
  }

  // ----------------------------------------------------------
  // slugToName [1.4.0 ИСПРАВЛЕНО]
  //
  // Реальный паттерн xv-ru.com:
  //   /video.{hash}/{id}/{num}/{slug}
  //   /video.oufcople1b0/47056948/0/while_wrestling_with_my_stepsister...
  //                               ↑ /0/ пропускаем — это не slug!
  //
  // Старый regex `/(\d+)\/([^\/]+)/` ловил "0" как slug.
  // Новый regex захватывает сегмент ПОСЛЕ двух числовых частей.
  // ----------------------------------------------------------
  function slugToName(href) {
    if (!href) return '';

    // Приоритет 1: /video.{hash}/{id}/{num}/{slug} — основной формат xv-ru
    var mFull = href.match(/\/video\.[^\/]+\/\d+\/\d+\/([^\/\?#]+)/);
    if (mFull && mFull[1] && mFull[1].length >= 3) {
      return _slugProcess(mFull[1]);
    }

    // Приоритет 2: /THUMBNUM/{slug} — страховочный fallback
    var mThumb = href.match(/\/THUMBNUM\/([^\/\?#]+)/i);
    if (mThumb && mThumb[1] && mThumb[1].length >= 3) {
      return _slugProcess(mThumb[1]);
    }

    // Приоритет 3: последний не-числовой сегмент пути
    var parts = href.replace(/\/+$/, '').split('/');
    for (var i = parts.length - 1; i >= 0; i--) {
      var seg = parts[i];
      if (!seg) continue;
      if (/^\d+$/.test(seg)) continue;                          // пропускаем числа
      if (seg.toUpperCase() === 'THUMBNUM') continue;           // пропускаем THUMBNUM
      if (seg.indexOf('video.') === 0) continue;                // пропускаем video.hash
      if (seg.length < 3) continue;
      return _slugProcess(seg);
    }

    return '';
  }

  // ----------------------------------------------------------
  // Сетевой слой — с поддержкой заголовков [1.4.0]
  // ----------------------------------------------------------
  function httpGet(url, success, failure) {
    log('httpGet -> ' + url);

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
      log('httpGet -> Worker: ' + full.substring(0, 100));
      Lampa.Network.native(
        full,
        function (r) { success(typeof r === 'string' ? r : JSON.stringify(r)); },
        function (e) {
          warn('httpGet -> native ошибка, fallback Reguest');
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
      log('httpGet -> Reguest: ' + url);
      try {
        var net = new Lampa.Reguest();
        net.silent(url,
          function (data) { success(typeof data === 'string' ? data : ''); },
          function (e) {
            warn('httpGet -> Reguest ошибка, fallback fetch');
            _fetch(url, success, failure);
          },
          false,
          { dataType: 'text', timeout: 12000, headers: REQUEST_HEADERS }
        );
        return;
      } catch (ex) {
        warn('httpGet -> Reguest исключение: ' + ex.message);
      }
    }
    _fetch(url, success, failure);
  }

  function _fetch(url, success, failure) {
    if (typeof fetch === 'undefined') { failure('no_http_method'); return; }
    log('httpGet -> fetch: ' + url);
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
        err('httpGet -> fetch ошибка: ' + e.message);
        failure(e.message);
      });
  }

  // ----------------------------------------------------------
  // Сортировки
  // ----------------------------------------------------------
  var SORTS = [
    { title: 'Новинки',    val: 'new',  urlPath: 'new'         },
    { title: 'Лучшее',     val: 'best', urlPath: 'best-videos' },
    { title: 'Популярные', val: 'top',  urlPath: 'most-viewed' },
  ];

  // ----------------------------------------------------------
  // parseState
  // ----------------------------------------------------------
  function parseState(url) {
    var sort = '', search = '';
    if (!url) return { sort: sort, search: search };

    var kMatch = url.match(/[?&]search=([^&]+)/) || url.match(/[?&]k=([^&]+)/);
    if (kMatch && kMatch[1]) {
      search = decodeURIComponent(kMatch[1].replace(/\+/g, ' '));
    } else {
      var path = url.replace(HOST, '').replace(/^\//, '').replace(/\/\d+\/?$/, '');
      for (var i = 0; i < SORTS.length; i++) {
        if (path === SORTS[i].urlPath || path.indexOf(SORTS[i].urlPath + '/') === 0) {
          sort = SORTS[i].val;
          break;
        }
      }
    }

    log('parseState -> sort=' + sort + ' search=' + search);
    return { sort: sort, search: search };
  }

  // ----------------------------------------------------------
  // buildUrl
  // ----------------------------------------------------------
  function buildUrl(sort, search, page) {
    page = parseInt(page, 10) || 1;

    if (search) {
      var offset = page > 1 ? '&p=' + (page - 1) : '';
      return HOST + '/?k=' + encodeURIComponent(search) + offset;
    }

    if (!sort) {
      return page <= 1 ? HOST + '/' : HOST + '/new/' + page;
    }

    var sortObj = arrayFind(SORTS, function (s) { return s.val === sort; }) || SORTS[0];
    return HOST + '/' + sortObj.urlPath + '/' + page;
  }

  // ----------------------------------------------------------
  // _getImgSrc
  // ----------------------------------------------------------
  function _getImgSrc(img) {
    if (!img) return '';
    var candidates = [
      img.getAttribute('data-src'),
      img.getAttribute('data-original'),
      img.getAttribute('data-thumb'),
      img.getAttribute('data-xvideos-src'),
      img.getAttribute('src'),
    ];
    for (var i = 0; i < candidates.length; i++) {
      var v = candidates[i];
      if (!v) continue;
      if (v.indexOf('blank.gif')  !== -1) continue;
      if (v.indexOf('data:image') === 0)  continue;
      if (v.indexOf('spacer.gif') !== -1) continue;
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
  // _extractCard
  // ----------------------------------------------------------
  function _extractCard(el) {

    var aEl = el.querySelector('a[href*="/video"]');
    if (!aEl) aEl = el.querySelector('a[href]');
    if (!aEl) return null;

    var rawHref = aEl.getAttribute('href') || '';
    if (!rawHref) return null;
    if (rawHref.indexOf('http') !== 0) rawHref = HOST + rawHref;

    var href = _cleanVideoHref(rawHref);

    var imgEl = aEl.querySelector('img') || el.querySelector('img');

    var name = '';

    var titleEl = el.querySelector('p.title a') || el.querySelector('p.title');
    if (titleEl) name = (titleEl.getAttribute('title') || titleEl.textContent || '').trim();

    if (!name) name = (aEl.getAttribute('title') || '').trim();

    if (!name) {
      var anyTitle = el.querySelector('[title]');
      if (anyTitle) name = (anyTitle.getAttribute('title') || '').trim();
    }

    if (!name && imgEl) name = (imgEl.getAttribute('alt') || '').trim();

    // slugToName теперь правильно извлекает slug из /video.{hash}/{id}/0/{slug}
    if (!name || name.length < 3) name = slugToName(rawHref);

    if (!name || name.length < 3) return null;

    var picture = _getImgSrc(imgEl);

    var durEl = el.querySelector('.duration, span.duration, time, .dur');
    var time  = durEl ? (durEl.textContent || '').trim() : '';

    log('_extractCard -> OK: "' + name + '" | ' + href);

    return {
      name:    name,
      video:   href,
      picture: picture,
      preview: null,
      time:    time,
      quality: 'HD',
      json:    true,
      related: true,
      source:  NAME,
    };
  }

  // ----------------------------------------------------------
  // parsePlaylist
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
        '.mozaique .thumb',
        '.thumb',
        '.thumbs .thumb',
        '.video-thumb',
        '.video-item',
      ];

      for (var s = 0; s < selectors.length; s++) {
        var els = doc.querySelectorAll(selectors[s]);
        if (!els.length) continue;
        log('parsePlaylist -> CSS "' + selectors[s] + '" найдено: ' + els.length);

        forEachNode(els, function (el) {
          var parent = el.parentElement;
          if (parent && _hasClass(parent, 'thumb')) return;

          var c = _extractCard(el);
          if (c && !seen[c.video]) {
            seen[c.video] = true;
            cards.push(c);
          }
        });

        if (cards.length) break;
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

        var href = _cleanVideoHref(rawHref);
        if (seen[href]) return;

        var img = a.querySelector('img');
        if (!img && a.parentElement) img = a.parentElement.querySelector('img');

        var title = '';
        if (img) title = (img.getAttribute('alt') || '').trim();
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
      warn('parsePlaylist -> НИЧЕГО НЕ НАЙДЕНО');
      warn('parsePlaylist -> div[class*=thumb]: ' + doc.querySelectorAll('div[class*="thumb"]').length);
      warn('parsePlaylist -> a[href*=video]: '    + doc.querySelectorAll('a[href*="/video"]').length);
      warn('parsePlaylist -> body (первые 500): ' + (doc.body ? doc.body.innerHTML.substring(0, 500) : 'нет body'));
    } else {
      log('parsePlaylist -> первая карточка: "' + cards[0].name + '" | ' + cards[0].video);
      log('parsePlaylist -> picture[0]: ' + (cards[0].picture || 'пусто'));
      log('parsePlaylist -> ИТОГО: ' + cards.length);
    }

    return cards;
  }

  // ----------------------------------------------------------
  // getStreamLinks [1.4.0 — добавлены CDN-regex xvideos-cdn.com]
  //
  // Реальные URL из анализа сайта:
  //   MP4 SD:  https://mp4-cdn77.xvideos-cdn.com/.../mp4_sd.mp4?secure=...
  //   MP4 HD:  https://mp4-cdn77.xvideos-cdn.com/.../mp4_hd.mp4?secure=...
  //   HLS:     https://hls-cdn77.xvideos-cdn.com/TOKEN.../hls.m3u8
  //   (также встречаются: mp4-gcore, hls-gcore домены)
  // ----------------------------------------------------------
  function getStreamLinks(url, success, failure) {
    log('getStreamLinks -> ' + url);
    httpGet(url, function (html) {
      log('getStreamLinks -> HTML длина: ' + html.length);
      var q = {};

      // --- Метод 1: html5player.set* (классический xvideos API) ---
      var mLow  = html.match(/html5player\.setVideoUrlLow$['"]([^'"]+)['"]$/);
      var mHigh = html.match(/html5player\.setVideoUrlHigh$['"]([^'"]+)['"]$/);
      var mHLS  = html.match(/html5player\.setVideoHLS$['"]([^'"]+)['"]$/);
      if (mLow  && mLow[1])  q['480p'] = mLow[1];
      if (mHigh && mHigh[1]) q['720p'] = mHigh[1];
      if (mHLS  && mHLS[1])  q['HLS']  = mHLS[1];

      // --- Метод 2: JSON-поля в JS ({"url_low":".."}) ---
      if (!Object.keys(q).length) {
        var mL2 = html.match(/"url_low"\s*:\s*"([^"]+)"/);
        var mH2 = html.match(/"url_high"\s*:\s*"([^"]+)"/);
        var mS2 = html.match(/"hls"\s*:\s*"([^"]+)"/);
        if (mL2 && mL2[1]) q['480p'] = mL2[1];
        if (mH2 && mH2[1]) q['720p'] = mH2[1];
        if (mS2 && mS2[1]) q['HLS']  = mS2[1];
      }

      // --- Метод 3: CDN xvideos-cdn.com [1.4.0] ---
      // Ищем конкретные CDN-домены из реального анализа сайта
      if (!Object.keys(q).length) {
        // mp4_sd.mp4 — стандартное качество
        var mSd = html.match(/["'](https?:\/\/mp4-[a-z0-9]+\.xvideos-cdn\.com\/[^"'\s]+mp4_sd\.mp4[^"'\s]*)/);
        // mp4_hd.mp4 — высокое качество
        var mHd = html.match(/["'](https?:\/\/mp4-[a-z0-9]+\.xvideos-cdn\.com\/[^"'\s]+mp4_hd\.mp4[^"'\s]*)/);
        // hls.m3u8
        var mCdnHls = html.match(/["'](https?:\/\/hls-[a-z0-9]+\.xvideos-cdn\.com\/[^"'\s]+\.m3u8[^"'\s]*)/);
        if (mSd     && mSd[1])     q['480p'] = mSd[1];
        if (mHd     && mHd[1])     q['720p'] = mHd[1];
        if (mCdnHls && mCdnHls[1]) q['HLS']  = mCdnHls[1];
      }

      // --- Метод 4: любой .mp4 в тексте ---
      if (!Object.keys(q).length) {
        var reMp4 = /["'](https?:\/\/[^"'\s]+\.mp4[^"'\s]*)/g;
        var m4, idx4 = 0;
        while ((m4 = reMp4.exec(html)) && idx4 < 3) {
          q['auto' + idx4] = m4[1];
          idx4++;
        }
      }

      // --- Метод 5: любой .m3u8 в тексте ---
      if (!Object.keys(q).length) {
        var mM = html.match(/["'](https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/);
        if (mM && mM[1]) q['HLS'] = mM[1];
      }

      // --- Итог ---
      var keys = Object.keys(q);
      if (!keys.length) {
        err('getStreamLinks -> ссылки не найдены');
        warn('getStreamLinks -> html5player hits:   ' + (html.match(/html5player/gi)    || []).length);
        warn('getStreamLinks -> xvideos-cdn hits:   ' + (html.match(/xvideos-cdn\.com/gi) || []).length);
        warn('getStreamLinks -> .mp4 hits:          ' + (html.match(/\.mp4/gi)           || []).length);
        warn('getStreamLinks -> URL был: ' + url);
        failure('xv-ru: нет ссылок на видео');
        return;
      }

      log('getStreamLinks -> качеств: ' + keys.length);
      for (var k = 0; k < keys.length; k++) {
        log('  ' + keys[k] + ' -> ' + q[keys[k]].substring(0, 80));
      }
      success({ qualitys: q });

    }, function (e) {
      err('getStreamLinks -> ошибка: ' + e);
      failure(e);
    });
  }

  // ----------------------------------------------------------
  // Меню
  // ----------------------------------------------------------
  function buildMenu(url) {
    var state   = parseState(url);
    var sortObj = arrayFind(SORTS, function (s) { return s.val === state.sort; }) || SORTS[0];

    var sortSub = [];
    for (var i = 0; i < SORTS.length; i++) {
      sortSub.push({
        title:        SORTS[i].title,
        playlist_url: HOST + '/' + SORTS[i].urlPath + '/1',
      });
    }

    return [
      { title: 'Поиск', playlist_url: HOST, search_on: true },
      { title: 'Сортировка: ' + sortObj.title, playlist_url: 'submenu', submenu: sortSub },
    ];
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
        success({
          results:     results,
          collection:  true,
          total_pages: 30,
          menu:        buildMenu(HOST),
        });
      }, function (e) {
        err('main() -> ошибка: ' + e);
        failure(e);
      });
    },

    view: function (params, success, failure) {
      var rawUrl = ((params && params.url) || HOST).replace(/[?&]pg=\d+/, '');
      var page   = parseInt((params && params.page), 10) || 1;
      var state  = parseState(rawUrl);
      var load   = buildUrl(state.sort, state.search, page);

      log('view() -> loadUrl: ' + load);
      log('view() -> ' + JSON.stringify({ url: rawUrl, page: page, search: state.search }));

      httpGet(load, function (html) {
        var results = parsePlaylist(html);
        if (!results.length) { failure('xv-ru: нет карточек'); return; }
        log('view() -> карточек: ' + results.length);
        success({
          results:     results,
          collection:  true,
          total_pages: results.length >= 30 ? page + 5 : page,
          menu:        buildMenu(rawUrl),
        });
      }, function (e) {
        err('view() -> ошибка: ' + e);
        failure(e);
      });
    },

    search: function (params, success, failure) {
      var query = (params && params.query) || '';
      var page  = parseInt((params && params.page), 10) || 1;
      log('search() -> "' + query + '" стр.' + page);

      if (!query) { failure('xv-ru: пустой запрос'); return; }

      httpGet(buildUrl('', query, page), function (html) {
        var results = parsePlaylist(html);
        if (!results.length) { failure('xv-ru: ничего не найдено'); return; }
        log('search() -> найдено: ' + results.length);
        success({
          title:       'xv-ru: ' + query,
          results:     results,
          url:         HOST + '/?k=' + encodeURIComponent(query),
          collection:  true,
          total_pages: page + 5,
        });
      }, function (e) {
        err('search() -> ошибка: ' + e);
        failure(e);
      });
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
      log('v1.4.0 зарегистрирован');
      return true;
    }
    return false;
  }

  if (!tryRegister()) {
    var _elapsed = 0;
    var _timer   = setInterval(function () {
      _elapsed += 100;
      if (tryRegister() || _elapsed >= 10000) clearInterval(_timer);
    }, 100);
  }

})();
