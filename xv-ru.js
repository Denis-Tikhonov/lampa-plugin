// =============================================================
// xv-ru.js — Парсер xv-ru.com для AdultJS / AdultPlugin (Lampa)
// Version  : 1.1.0
// Changed  :
//   [1.1.0] ИСПРАВЛЕНО: XPath захватывал вложенные .thumb → дублирование
//           ИСПРАВЛЕНО: parseState не обрабатывал search= от AdultJS фильтра
//           ИСПРАВЛЕНО: _extractCard возвращал blank.gif вместо реального picture
//           ИСПРАВЛЕНО: дедупликация карточек по href через seen{}
//           ИСПРАВЛЕНО: CSS стратегия пропускает вложенные .thumb
//           ИСПРАВЛЕНО: buildUrl корректно строит URL для поиска и сортировки
// =============================================================

(function () {
  'use strict';

  var HOST = 'https://www.xv-ru.com';
  var NAME = 'xv-ru';
  var TAG  = '[xv-ru]';

  // ----------------------------------------------------------
  // Worker URL — замените на URL вашего задеплоенного воркера
  // ----------------------------------------------------------
  var WORKER_DEFAULT = 'https://ВАШ-WORKER.ВАШ-АККАУНТ.workers.dev/?url=';

  function getWorkerUrl() {
    var url = (window.AdultPlugin && window.AdultPlugin.workerUrl)
      ? window.AdultPlugin.workerUrl
      : WORKER_DEFAULT;
    if (url && url.slice(-1) !== '=') url += '=';
    return url;
  }

  // ----------------------------------------------------------
  // Полифиллы (WebOS 3, Tizen 2)
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

  function log(msg) { console.log(TAG, msg); }
  function warn(msg) { console.warn(TAG, msg); }
  function err(msg) { console.error(TAG, msg); }

  // ----------------------------------------------------------
  // Сетевой слой
  // ----------------------------------------------------------
  function httpGet(url, success, failure) {
    log('httpGet -> ' + url);

    // Приоритет 0: централизованный AdultJS 1.5.0
    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, success, failure, { type: 'html' });
      return;
    }

    // Приоритет 1: Lampa.Network.native + Worker
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
        false
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
          { dataType: 'text', timeout: 12000 }
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
    fetch(url, { method: 'GET' })
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
  //
  // ИСПРАВЛЕНИЕ [1.1.0]:
  //   AdultJS передаёт параметр поиска как search= (не k=).
  //   Теперь обрабатываем оба варианта: search= и k=
  // ----------------------------------------------------------
  function parseState(url) {
    var sort = '', search = '';
    if (!url) {
      log('parseState -> sort= search=');
      return { sort: sort, search: search };
    }

    // ИСПРАВЛЕНИЕ: ловим search= (от AdultJS фильтра) и k= (нативный xvideos)
    var kMatch = url.match(/[?&]search=([^&]+)/) || url.match(/[?&]k=([^&]+)/);
    if (kMatch && kMatch[1]) {
      search = decodeURIComponent(kMatch[1].replace(/\+/g, ' '));
    } else {
      // Определяем сортировку по пути URL
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
      // xvideos: страница 1 → p=0 (или без p), страница 2 → p=1
      var offset = page > 1 ? '&p=' + (page - 1) : '';
      return HOST + '/?k=' + encodeURIComponent(search) + offset;
    }

    if (!sort) {
      // Главная — только первая страница без параметров
      return page <= 1 ? HOST + '/' : HOST + '/new/' + page;
    }

    var sortObj = arrayFind(SORTS, function (s) { return s.val === sort; }) || SORTS[0];
    return HOST + '/' + sortObj.urlPath + '/' + page;
  }

  // ----------------------------------------------------------
  // parsePlaylist
  //
  // ИСПРАВЛЕНИЕ [1.1.0]:
  //   Добавлена дедупликация seen{} — любой дубль по href игнорируется.
  //   XPath использует ancestor-check чтобы брать только верхний уровень .thumb.
  //   CSS стратегия пропускает вложенные .thumb через parentElement.classList.
  // ----------------------------------------------------------
  function parsePlaylist(html) {
    if (!html) { warn('parsePlaylist -> html пустой'); return []; }
    log('parsePlaylist -> длина HTML: ' + html.length);

    var doc;
    try {
      doc = new DOMParser().parseFromString(html, 'text/html');
      log('parsePlaylist -> DOMParser OK');
    } catch (e) {
      err('parsePlaylist -> DOMParser ошибка: ' + e.message);
      return [];
    }

    var cards = [];
    var seen  = {}; // ИСПРАВЛЕНИЕ: ключ = href, исключаем дубли

    // --- Стратегия 1: XPath (только верхний уровень .thumb) ---
    log('parsePlaylist -> Стратегия 1: XPath...');
    try {
      // ИСПРАВЛЕНИЕ: not(ancestor::div[contains(@class,"thumb")]) — исключаем вложенные
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

    // --- Стратегия 2: CSS querySelectorAll ---
    if (!cards.length) {
      log('parsePlaylist -> Стратегия 2: CSS div.thumb...');
      var selectors = ['.thumb', '.thumbs .thumb', '.mozaique .thumb', '.video-thumb', '.video-item'];

      for (var s = 0; s < selectors.length; s++) {
        var els = doc.querySelectorAll(selectors[s]);
        if (!els.length) continue;
        log('parsePlaylist -> CSS "' + selectors[s] + '" найдено: ' + els.length);

        forEachNode(els, function (el) {
          // ИСПРАВЛЕНИЕ: пропускаем вложенные .thumb
          var parent = el.parentElement;
          if (parent && parent.className && parent.className.indexOf('thumb') !== -1) return;

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

    // --- Стратегия 3: все a[href*=/video] содержащие img ---
    if (!cards.length) {
      log('parsePlaylist -> Стратегия 3: a[href*=video] img...');
      var links = doc.querySelectorAll('a[href*="/video"]');

      forEachNode(links, function (a) {
        var href = a.getAttribute('href') || '';
        if (!href || href.indexOf('/video') === -1) return;
        if (href.indexOf('http') !== 0) href = HOST + href;
        if (seen[href]) return;

        var img = a.querySelector('img');
        if (!img) return;

        var title = (a.getAttribute('title') || img.getAttribute('alt') || '').trim();
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

    if (!cards.length) {
      warn('parsePlaylist -> НИЧЕГО НЕ НАЙДЕНО');
      // Диагностика
      warn('parsePlaylist -> div[class*=thumb]: ' + doc.querySelectorAll('div[class*="thumb"]').length);
      warn('parsePlaylist -> a[href*=video]: '    + doc.querySelectorAll('a[href*="/video"]').length);
      warn('parsePlaylist -> body (первые 300 символов): ' + (doc.body ? doc.body.innerHTML.substring(0, 300) : 'нет body'));
    } else {
      log('parsePlaylist -> первая карточка: ' + cards[0].name + ' | ' + cards[0].video);
      log('parsePlaylist -> ИТОГО карточек: '  + cards.length);
    }

    return cards;
  }

  // ----------------------------------------------------------
  // _getImgSrc — получение реального URL картинки
  //
  // ИСПРАВЛЕНИЕ [1.1.0]:
  //   Фильтруем blank.gif и data:image placeholder,
  //   которые xvideos подставляет до lazy-load.
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
      if (v.indexOf('blank.gif')  !== -1) continue; // placeholder xvideos
      if (v.indexOf('data:image') === 0)  continue; // base64 placeholder
      if (v.indexOf('spacer.gif') !== -1) continue; // другой placeholder
      if (v.length < 10) continue;
      return v;
    }
    return '';
  }

  // ----------------------------------------------------------
  // _extractCard
  // ----------------------------------------------------------
  function _extractCard(el) {
    // Ссылка на видео
    var aEl = el.querySelector('a[href*="/video"]');
    if (!aEl) aEl = el.querySelector('a[href]');
    if (!aEl) return null;

    var href = aEl.getAttribute('href') || '';
    if (!href || href.indexOf('/video') === -1) return null;
    if (href.indexOf('http') !== 0) href = HOST + href;

    // Название
    var name = '';
    var titleEl = el.querySelector('p.title a') || el.querySelector('p.title');
    if (titleEl) name = (titleEl.getAttribute('title') || titleEl.textContent || '').trim();
    if (!name) name = (aEl.getAttribute('title') || '').trim();
    if (!name) {
      var anyTitle = el.querySelector('[title]');
      if (anyTitle) name = anyTitle.getAttribute('title').trim();
    }
    if (!name || name.length < 3) return null;

    // Картинка — сначала ищем внутри ссылки, потом по всему элементу
    var imgEl = aEl.querySelector('img') || el.querySelector('img');
    var picture = _getImgSrc(imgEl);

    // Длительность
    var durEl = el.querySelector('.duration, span.duration, time, .dur');
    var time  = durEl ? (durEl.textContent || '').trim() : '';

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
  // getStreamLinks — прямые ссылки на видео
  // ----------------------------------------------------------
  function getStreamLinks(url, success, failure) {
    log('getStreamLinks -> ' + url);
    httpGet(url, function (html) {
      log('getStreamLinks -> HTML длина: ' + html.length);
      var q = {};

      // html5player (основной паттерн xvideos)
      var mLow  = html.match(/html5player\.setVideoUrlLow$['"]([^'"]+)['"]$/);
      var mHigh = html.match(/html5player\.setVideoUrlHigh$['"]([^'"]+)['"]$/);
      var mHLS  = html.match(/html5player\.setVideoHLS$['"]([^'"]+)['"]$/);
      if (mLow  && mLow[1])  { q['480p'] = mLow[1];  log('getStreamLinks -> low: '  + mLow[1].substring(0, 80)); }
      if (mHigh && mHigh[1]) { q['720p'] = mHigh[1]; log('getStreamLinks -> high: ' + mHigh[1].substring(0, 80)); }
      if (mHLS  && mHLS[1])  { q['HLS']  = mHLS[1];  log('getStreamLinks -> HLS: '  + mHLS[1].substring(0, 80)); }

      // JSON формат
      if (!Object.keys(q).length) {
        var mL2 = html.match(/"url_low"\s*:\s*"([^"]+)"/);
        var mH2 = html.match(/"url_high"\s*:\s*"([^"]+)"/);
        var mS2 = html.match(/"hls"\s*:\s*"([^"]+)"/);
        if (mL2 && mL2[1]) q['480p'] = mL2[1];
        if (mH2 && mH2[1]) q['720p'] = mH2[1];
        if (mS2 && mS2[1]) q['HLS']  = mS2[1];
      }

      // .mp4 fallback
      if (!Object.keys(q).length) {
        var reMp4 = /["'](https?:\/\/[^"'\s]+\.mp4[^"'\s]*)/g;
        var m4, idx4 = 0;
        while ((m4 = reMp4.exec(html)) && idx4 < 3) {
          q['auto' + idx4] = m4[1];
          idx4++;
        }
      }

      // .m3u8 fallback
      if (!Object.keys(q).length) {
        var mM = html.match(/["'](https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/);
        if (mM && mM[1]) q['HLS'] = mM[1];
      }

      var keys = Object.keys(q);
      if (!keys.length) {
        err('getStreamLinks -> ссылки не найдены');
        warn('getStreamLinks -> html5player упоминаний: ' + (html.match(/html5player/gi) || []).length);
        warn('getStreamLinks -> mp4 упоминаний: '         + (html.match(/\.mp4/gi)       || []).length);
        failure('xv-ru: нет ссылок на видео');
        return;
      }

      log('getStreamLinks -> качеств: ' + keys.length);
      for (var k = 0; k < keys.length; k++) {
        log('  ' + keys[k] + ' -> ' + q[keys[k]].substring(0, 80));
      }
      success({ qualitys: q });

    }, function (e) {
      err('getStreamLinks -> ошибка загрузки: ' + e);
      failure(e);
    });
  }

  // ----------------------------------------------------------
  // Меню фильтра
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
  // Публичный интерфейс парсера
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
      log('view() -> ' + JSON.stringify({ url: rawUrl, page: page, query: state.search }));

      httpGet(load, function (html) {
        var results = parsePlaylist(html);
        if (!results.length) { failure('xv-ru: нет карточек'); return; }
        log('view() -> успех, карточек: ' + results.length);
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
  // Регистрация в AdultPlugin
  // ----------------------------------------------------------
  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, Parser);
      log('v1.1.0 зарегистрирован');
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
