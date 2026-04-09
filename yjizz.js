// =============================================================
// yjizz.js — Парсер YouJizz для AdultJS / AdultPlugin (Lampa)
// Version  : 1.0.0
// Changed  : [1.0.0] Первая версия.
//            Конфиг взят из AdultJS_debug_v1.3.2 [BLOCK:13] nexthub P[].
//            Структура сайта из документа Site Structure Analyzer v2.0.
//
// Структура URL (из analyzer):
//   Главная/каталог: /{sort}/{page}.html
//   Поиск:           /search?q={query} (GET-форма)
//   Категории:       /categories/{name}-{page}.html
//
// Структура карточки (из analyzer + AdultJS_debug contentParse):
//   nodes:    //div[@class='video-thumb']    ← из AdultJS_debug
//   или:      .video-item                    ← из analyzer
//   name:     .video-title a / .video-item .video-title
//   href:     a.frame.video @href / .video-item a
//   img:      img @data-original             ← lazy-load
//   duration: span.time / .video-item .time
//   preview:  a @data-clip                   ← видео-превью
//
// Получение видео (из AdultJS_debug view.regexMatch):
//   "quality":"Auto","filename":"{value}"
//   формат: "https:{value}"
// =============================================================

(function () {
  'use strict';

  var HOST = 'https://www.youjizz.com';
  var NAME = 'yjizz';

  // ----------------------------------------------------------
  // [1.0.0] HTTP
  // ----------------------------------------------------------
  function httpGet(url, success, error) {
    try {
      var net = new Lampa.Reguest();
      net.silent(
        url,
        function (data) {
          if (typeof data === 'string' && data.length > 50) success(data);
          else _fallback(url, success, error);
        },
        function () { _fallback(url, success, error); },
        false,
        { dataType: 'text', timeout: 12000 }
      );
    } catch (e) { _fallback(url, success, error); }
  }

  function _fallback(url, success, error) {
    if (typeof fetch === 'undefined') { error('fetch unavailable'); return; }
    fetch(url, { method: 'GET' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(success).catch(error);
  }

  // ----------------------------------------------------------
  // [1.0.0] КОНФИГУРАЦИЯ СОРТИРОВОК И КАТЕГОРИЙ
  // Источник: AdultJS_debug [BLOCK:13] Youjizz + Site Analyzer
  //
  // Шаблон пагинации: /{sort}/{page}.html
  // ----------------------------------------------------------
  var SORTS = [
    { title: 'Новинки',    val: 'newest-clips'    },
    { title: 'Популярное', val: 'most-popular'     },
    { title: 'Топ недели', val: 'top-rated-week'   },
    { title: 'Топ месяца', val: 'top-rated-month'  },
    { title: 'Лучшее',     val: 'top-rated'        },
    { title: 'В тренде',   val: 'trending'         },
    { title: 'HD',         val: 'highdefinition'   },
  ];

  // Категории из Site Analyzer (топ-20)
  var CATS = [
    { title: 'Мачеха',       val: 'stepmom'          },
    { title: 'Японки',       val: 'japanese'          },
    { title: 'MILF',         val: 'milf'              },
    { title: 'Анал',         val: 'anal'              },
    { title: 'Любительское', val: 'amateur'           },
    { title: 'Камшот',       val: 'creampie'          },
    { title: 'Большие сиськи',val:'big-tits'          },
    { title: 'Threesome',    val: 'threesome'         },
    { title: 'Сводная сестра',val:'step-sister'       },
    { title: 'POV',          val: 'pov'               },
    { title: 'Латинки',      val: 'latina'            },
    { title: 'Азиатки',      val: 'asian'             },
    { title: 'Молодые',      val: 'teen'              },
    { title: 'Хентай',       val: 'hentai'            },
    { title: 'Межрасовый',   val: 'interracial'       },
    { title: 'Зрелые',       val: 'mature'            },
    { title: 'Gangbang',     val: 'gangbang'          },
    { title: 'Ebony',        val: 'ebony'             },
    { title: 'Массаж',       val: 'massage'           },
    { title: 'Компиляция',   val: 'compilation'       },
  ];

  // ----------------------------------------------------------
  // [1.0.0] ПОСТРОЕНИЕ URL
  // Источник: AdultJS_debug [BLOCK:13] Youjizz route
  //
  // Каталог:  /{sort}/{page}.html
  // Категория: /categories/{name}-{page}.html
  // Поиск:    /search?q={query} (нет пагинации в URL — только первая страница)
  // Поиск p2+:/search/{query}-{page}.html  ← паттерн из AdultJS_debug
  // ----------------------------------------------------------
  function buildCatalogUrl(sort, page) {
    sort = sort || SORTS[0].val;
    page = page || 1;
    return HOST + '/' + sort + '/' + page + '.html';
  }

  function buildCatUrl(cat, page) {
    page = page || 1;
    return HOST + '/categories/' + cat + '-' + page + '.html';
  }

  function buildSearchUrl(query, page) {
    page = page || 1;
    if (page === 1) return HOST + '/search?q=' + encodeURIComponent(query);
    // Паттерн из AdultJS_debug: /search/{search}-{page}.html
    return HOST + '/search/' + encodeURIComponent(query) + '-' + page + '.html';
  }

  // ----------------------------------------------------------
  // [1.0.0] ПАРСИНГ КАТАЛОГА
  // Источник: AdultJS_debug contentParse.nodes = "//div[@class='video-thumb']"
  // + fallback на .video-item из Site Analyzer
  //
  // Приоритет атрибутов:
  //   картинка: data-original > src
  //   превью:   a[data-clip]
  //   duration: span.time
  // ----------------------------------------------------------
  function parsePlaylist(html) {
    if (!html) return [];
    var doc   = new DOMParser().parseFromString(html, 'text/html');
    var cards = [];

    // Пробуем XPath: //div[@class='video-thumb'] (из AdultJS_debug)
    var useXPath = false;
    try {
      var xNodes = doc.evaluate(
        "//div[@class='video-thumb']",
        doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
      );
      if (xNodes.snapshotLength > 0) {
        useXPath = true;
        for (var xi = 0; xi < xNodes.snapshotLength; xi++) {
          var card = _parseVideoThumb(xNodes.snapshotItem(xi));
          if (card) cards.push(card);
        }
      }
    } catch (e) {}

    // Fallback: .video-item (из Site Analyzer)
    if (!cards.length) {
      doc.querySelectorAll('.video-item').forEach(function (el) {
        var card = _parseVideoItem(el);
        if (card) cards.push(card);
      });
    }

    return cards;
  }

  // Парсинг блока video-thumb (AdultJS_debug структура)
  function _parseVideoThumb(el) {
    var titleEl = el.querySelector('.video-title a, .title a');
    var aEl     = el.querySelector('a.frame.video, a[class*="frame"]') || el.querySelector('a');
    if (!titleEl || !aEl) return null;

    var name = (aEl.getAttribute('title') || titleEl.textContent || '').trim();
    var href = aEl.getAttribute('href') || '';
    if (!href) return null;
    if (href.indexOf('http') !== 0) href = HOST + href;

    var imgEl   = el.querySelector('img');
    var picture = imgEl ? (imgEl.getAttribute('data-original') || imgEl.getAttribute('src') || '') : '';

    // Превью: data-clip атрибут на ссылке
    var preview = aEl.getAttribute('data-clip') || null;

    var durEl = el.querySelector('span.time, .time');
    var time  = durEl ? durEl.textContent.trim() : '';

    var qualEl = el.querySelector('[class*="hd"], .hd-badge');
    var qual   = qualEl ? 'HD' : '';

    return { name: name, video: href, picture: picture, preview: preview,
             time: time, quality: qual, json: true, related: true, model: null, source: NAME };
  }

  // Парсинг блока .video-item (Site Analyzer структура)
  function _parseVideoItem(el) {
    var titleEl = el.querySelector('.video-title');
    var aEl     = el.querySelector('a');
    if (!titleEl || !aEl) return null;

    var name = titleEl.textContent.trim();
    var href = aEl.getAttribute('href') || '';
    if (!name || !href) return null;
    if (href.indexOf('http') !== 0) href = HOST + href;

    var imgEl   = el.querySelector('img');
    var picture = imgEl ? (imgEl.getAttribute('data-original') || imgEl.getAttribute('src') || '') : '';

    var durEl   = el.querySelector('.time');
    var time    = durEl ? durEl.textContent.trim() : '';

    var qualEl  = el.querySelector('[class*="hd"]');

    return { name: name, video: href, picture: picture, preview: null,
             time: time, quality: qualEl ? 'HD' : '', json: true, related: true, model: null, source: NAME };
  }

  // ----------------------------------------------------------
  // [1.0.0] ПОЛУЧЕНИЕ ПРЯМОЙ ССЫЛКИ НА ВИДЕО
  // Источник: AdultJS_debug [BLOCK:13] Youjizz view.regexMatch
  //
  // Паттерн: "quality":"Auto","filename":"{value}"
  // Формат:  "https:{value}"
  //
  // Страница видео содержит JS-объект с источниками:
  // {"quality":"Auto","filename":"//cdn.youjizz.com/.../video.m3u8"}
  // ----------------------------------------------------------
  function getStreamLinks(videoPageUrl, success, error) {
    httpGet(videoPageUrl, function (html) {
      var qualitys = {};

      // Паттерн 1: "quality":"Auto","filename":"..." (из AdultJS_debug)
      var re1 = /"quality":"Auto","filename":"([^"]+)"/;
      var m1  = html.match(re1);
      if (m1 && m1[1]) {
        var url = m1[1];
        if (!url.startsWith('http')) url = 'https:' + url;
        qualitys['auto'] = url;
      }

      // Паттерн 2: конкретные качества "quality":"720p","filename":"..."
      var re2  = /"quality":"([^"]+)","filename":"([^"]+)"/g;
      var m2;
      while ((m2 = re2.exec(html)) !== null) {
        if (m2[1] === 'Auto') continue;
        var qurl = m2[2];
        if (!qurl.startsWith('http')) qurl = 'https:' + qurl;
        qualitys[m2[1]] = qurl;
      }

      // Паттерн 3 (fallback): прямые .mp4 или .m3u8 в script
      if (!Object.keys(qualitys).length) {
        var re3 = /(https?:\/\/[^"'\s]+\.(mp4|m3u8)[^"'\s]*)/g;
        var m3;
        while ((m3 = re3.exec(html)) !== null) {
          if (m3[1].includes('cdn') || m3[1].includes('youjizz')) {
            qualitys['auto'] = m3[1];
            break;
          }
        }
      }

      if (!Object.keys(qualitys).length) { error('YouJizz: нет источников видео'); return; }
      success({ qualitys: qualitys });
    }, error);
  }

  // ----------------------------------------------------------
  // [1.0.0] РАЗБОР СОСТОЯНИЯ ИЗ URL
  // ----------------------------------------------------------
  function parseState(url) {
    var path = url.replace(HOST, '').replace(/^\//, '');
    var sort = '', cat = '', search = '';

    if (path.startsWith('search')) {
      // /search?q=... или /search/{query}-{page}.html
      var qm = path.match(/[?&]q=([^&]+)/);
      if (qm) search = decodeURIComponent(qm[1]);
      else {
        var sm = path.match(/search\/([^-]+)/);
        if (sm) search = decodeURIComponent(sm[1]);
      }
    } else if (path.startsWith('categories/')) {
      // /categories/{name}-{page}.html
      var cm = path.match(/categories\/([^-]+)/);
      if (cm) cat = cm[1];
    } else {
      // /{sort}/{page}.html
      var sm2 = path.split('/')[0];
      if (sm2 && SORTS.find(function (s) { return s.val === sm2; })) sort = sm2;
    }

    return { sort: sort, cat: cat, search: search };
  }

  // ----------------------------------------------------------
  // [1.0.0] МЕНЮ ФИЛЬТРА
  // ----------------------------------------------------------
  function buildMenu(url) {
    var state   = parseState(url || '');
    var sortObj = SORTS.find(function (s) { return s.val === state.sort; }) || SORTS[0];
    var catObj  = CATS.find(function (c)  { return c.val === state.cat;  });

    var items = [{ title: 'Поиск', playlist_url: HOST, search_on: true }];

    items.push({
      title:        'Сортировка: ' + sortObj.title,
      playlist_url: 'submenu',
      submenu:      SORTS.map(function (s) {
        return { title: s.title, playlist_url: HOST + '/' + s.val + '/1.html' };
      }),
    });

    items.push({
      title:        'Категория: ' + (catObj ? catObj.title : 'Все'),
      playlist_url: 'submenu',
      submenu:      CATS.map(function (c) {
        return { title: c.title, playlist_url: HOST + '/categories/' + c.val + '-1.html' };
      }),
    });

    return items;
  }

  // ----------------------------------------------------------
  // [1.0.0] ПУБЛИЧНЫЙ ИНТЕРФЕЙС
  // ----------------------------------------------------------
  var YjizzParser = {

    main: function (params, success, error) {
      httpGet(buildCatalogUrl(SORTS[0].val, 1), function (html) {
        var results = parsePlaylist(html);
        if (!results.length) { error('YouJizz: нет карточек'); return; }
        success({ results: results, collection: true, total_pages: 30,
                  menu: buildMenu(HOST + '/' + SORTS[0].val + '/1.html') });
      }, error);
    },

    view: function (params, success, error) {
      var rawUrl = (params.url || HOST).replace(/[?&]pg=\d+/, '');
      var page   = parseInt(params.page, 10) || 1;
      var state  = parseState(rawUrl);
      var loadUrl;

      if (state.search) {
        loadUrl = buildSearchUrl(state.search, page);
      } else if (state.cat) {
        loadUrl = buildCatUrl(state.cat, page);
      } else {
        loadUrl = buildCatalogUrl(state.sort || SORTS[0].val, page);
      }

      httpGet(loadUrl, function (html) {
        var results = parsePlaylist(html);
        if (!results.length) { error('YouJizz: нет карточек'); return; }
        success({
          results:     results,
          collection:  true,
          total_pages: results.length >= 20 ? page + 5 : page,
          menu:        buildMenu(rawUrl),
        });
      }, error);
    },

    search: function (params, success, error) {
      var query = params.query || '';
      var page  = parseInt(params.page, 10) || 1;
      httpGet(buildSearchUrl(query, page), function (html) {
        var results = parsePlaylist(html);
        if (!results.length) { error('YouJizz: ничего не найдено'); return; }
        success({
          title:       'YouJizz: ' + query,
          results:     results,
          url:         HOST + '/search?q=' + encodeURIComponent(query),
          collection:  true,
          total_pages: page + 5,
        });
      }, error);
    },

    qualitys: function (videoUrl, success, error) {
      getStreamLinks(videoUrl, success, error);
    },
  };

  // ----------------------------------------------------------
  // [1.0.0] РЕГИСТРАЦИЯ
  // ----------------------------------------------------------
  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, YjizzParser);
      console.log('[yjizz] v1.0.0 registered OK');
      return true;
    }
    return false;
  }

  if (!tryRegister()) {
    var _e = 0, _t = setInterval(function () {
      _e += 100;
      if (tryRegister() || _e >= 10000) clearInterval(_t);
    }, 100);
  }

})();
