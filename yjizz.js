// =============================================================
// yjizz.js — Парсер YouJizz для AdultJS / AdultPlugin (Lampa)
// Version  : 2.0.1
// Changes  :
//   [2.0.1] Исправлен buildSearchUrl → /search/query-page.html
//           Исправлены поля постера → +img, +poster, +background_image
// =============================================================

(function () {
  'use strict';

  var NAME = 'yjizz';
  var HOST = 'https://www.youjizz.com';

  var SORTS = [
    { title: 'Популярное',  val: 'most-popular'    },
    { title: 'Новинки',     val: 'newest-clips'    },
    { title: 'Топ недели',  val: 'top-rated-week'  },
    { title: 'Топ месяца',  val: 'top-rated-month' },
    { title: 'Лучшее',      val: 'top-rated'       },
    { title: 'В тренде',    val: 'trending'        },
    { title: 'HD',          val: 'highdefinition'  },
  ];

  var CATS = [
    { title: 'Мачеха',         val: 'stepmom'        },
    { title: 'Японки',         val: 'japanese'       },
    { title: 'MILF',           val: 'milf'           },
    { title: 'Анал',           val: 'anal'           },
    { title: 'Любительское',   val: 'amateur'        },
    { title: 'Кремпай',        val: 'creampie'       },
    { title: 'Большие сиськи', val: 'big-tits'       },
    { title: 'Threesome',      val: 'threesome'      },
    { title: 'Сводная сестра', val: 'step-sister'    },
    { title: 'POV',            val: 'pov'            },
    { title: 'Латинки',        val: 'latina'         },
    { title: 'Азиатки',        val: 'asian'          },
    { title: 'Молодые',        val: 'teen'           },
    { title: 'Хентай',         val: 'hentai'         },
    { title: 'Межрасовый',     val: 'interracial'    },
    { title: 'Зрелые',         val: 'mature'         },
    { title: 'Gangbang',       val: 'gangbang'       },
    { title: 'Ebony',          val: 'ebony'          },
    { title: 'Массаж',         val: 'massage'        },
    { title: 'Компиляция',     val: 'compilation'    },
    { title: 'Blacked',        val: 'blacked'        },
    { title: 'Сестра',         val: 'sister'         },
    { title: 'Taboo',          val: 'taboo'          },
    { title: 'BBC',            val: 'bbc'            },
    { title: 'Big Ass',        val: 'big-ass'        },
    { title: 'Блондинки',      val: 'blonde'         },
    { title: 'Blowjob',        val: 'blowjob'        },
    { title: 'Папочка',        val: 'daddy'          },
    { title: 'Семья',          val: 'family'         },
    { title: 'Японские жёны',  val: 'japanese-wife'  },
    { title: 'Stepdaughter',   val: 'stepdaughter'   },
    { title: 'Casting',        val: 'casting'        },
    { title: 'Pinay',          val: 'pinay'          },
    { title: 'Stepsister',     val: 'stepsister'     },
    { title: 'Czech Streets',  val: 'czech-streets'  },
    { title: 'Lana Rhoades',   val: 'lana-rhoades'   },
    { title: 'Riley Reid',     val: 'riley-reid'     },
    { title: 'Cory Chase',     val: 'cory-chase'     },
    { title: 'Brandi Love',    val: 'brandi-love'    },
  ];

  // ----------------------------------------------------------
  // HTTP
  // ----------------------------------------------------------
  function httpGet(url, success, error) {
    if (window.AdultPlugin &&
        typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, success, error);
    } else {
      if (typeof fetch === 'undefined') { error('fetch unavailable'); return; }
      fetch(url, {
        method:  'GET',
        headers: { 'Cookie': 'mature=1' }
      })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.text();
        })
        .then(success)
        .catch(error);
    }
  }

  // ----------------------------------------------------------
  // ПОСТРОЕНИЕ URL
  // ----------------------------------------------------------
  function buildCatalogUrl(sort, page) {
    return HOST + '/' + (sort || SORTS[0].val) + '/' + (page || 1) + '.html';
  }

  function buildCatUrl(cat, page) {
    return HOST + '/categories/' + cat + '-' + (page || 1) + '.html';
  }

  // ★ ИСПРАВЛЕНО: /search/step-sister-1.html
  function buildSearchUrl(query, page) {
    var slug = query.trim().toLowerCase().replace(/\s+/g, '-');
    return HOST + '/search/' + slug + '-' + (page || 1) + '.html';
  }

  // ----------------------------------------------------------
  // ПАРСИНГ КАРТОЧЕК
  // ----------------------------------------------------------
  function parseCards(html) {
    if (!html) return [];
    var doc   = new DOMParser().parseFromString(html, 'text/html');
    var cards = [];

    var items = doc.querySelectorAll('.video-item');
    if (!items || !items.length) {
      items = doc.querySelectorAll('.video-thumb');
    }
    if (!items || !items.length) return [];

    for (var i = 0; i < items.length; i++) {
      var card = _parseCard(items[i]);
      if (card) cards.push(card);
    }
    return cards;
  }

  function _parseCard(el) {
    var aEl = el.querySelector('a.frame.video');
    if (!aEl) aEl = el.querySelector('a.frame');
    if (!aEl) aEl = el.querySelector('a[href*="/videos/"]');
    if (!aEl) return null;

    var href = aEl.getAttribute('href') || '';
    if (!href) return null;
    if (href.indexOf('http') !== 0) href = HOST + href;

    var preview = aEl.getAttribute('data-clip') || null;
    if (preview && preview.indexOf('http') !== 0) preview = 'https:' + preview;

    var imgEl   = el.querySelector('img');
    var picture = '';
    if (imgEl) {
      picture = imgEl.getAttribute('data-original') ||
                imgEl.getAttribute('src') || '';
    }
    if (picture && picture.indexOf('http') !== 0 && picture.length > 1) {
      picture = 'https:' + picture;
    }
    // Игнорируем spacer-заглушку
    if (picture.indexOf('spacer') !== -1) picture = '';

    var titleEl = el.querySelector('.video-title a');
    if (!titleEl) titleEl = el.querySelector('.video-title');
    var name = '';
    if (titleEl) name = titleEl.textContent.trim();
    if (!name)   name = (aEl.getAttribute('title') || '').trim();
    if (!name)   return null;

    var durEl = el.querySelector('span.time, .time');
    var time  = '';
    if (durEl) time = durEl.textContent.replace(/[^\d:]/g, '').trim();

    var qualEl  = el.querySelector('span.i-hd, [class*="i-hd"]');
    var quality = qualEl ? 'HD' : '';

    return {
      name:             name,
      video:            href,
      // ★ ИСПРАВЛЕНО: четыре поля постера вместо одного
      picture:          picture,
      img:              picture,
      poster:           picture,
      background_image: picture,
      preview:          preview,
      time:             time,
      quality:          quality,
      json:             true,
      related:          true,
      model:            null,
      source:           NAME,
    };
  }

  // ----------------------------------------------------------
  // ИЗВЛЕЧЕНИЕ ВИДЕО СО СТРАНИЦЫ
  // ----------------------------------------------------------
  function getVideoLinks(videoPageUrl, success, error) {
    httpGet(videoPageUrl, function (html) {
      var qualitys = {};

      // --- Метод 1: dataEncodings ---
      try {
        var idx = html.indexOf('dataEncodings');
        if (idx !== -1) {
          var arrStart = html.indexOf('[', idx);
          if (arrStart !== -1) {
            var depth  = 0;
            var arrEnd = -1;
            for (var ci = arrStart; ci < html.length; ci++) {
              if      (html[ci] === '[') depth++;
              else if (html[ci] === ']') {
                depth--;
                if (depth === 0) { arrEnd = ci; break; }
              }
            }
            if (arrEnd !== -1) {
              var jsonStr = html.substring(arrStart, arrEnd + 1);
              var dataEnc = JSON.parse(jsonStr);
              dataEnc.forEach(function (enc) {
                if (!enc.filename || enc.quality === undefined) return;
                var u = enc.filename.replace(/\\\//g, '/');
                if (u.indexOf('http') !== 0) u = 'https:' + u;
                var key = (String(enc.quality).toLowerCase() === 'auto')
                  ? 'auto'
                  : (enc.quality + 'p');
                if (!qualitys[key] || u.indexOf('.m3u8') !== -1) {
                  qualitys[key] = u;
                }
              });
              if (Object.keys(qualitys).length) {
                console.log('[yjizz] qualitys via dataEncodings:', Object.keys(qualitys));
              }
            }
          }
        }
      } catch (e) {
        console.warn('[yjizz] dataEncodings parse error:', e.message || e);
      }

      // --- Метод 2: <source src title> ---
      if (!Object.keys(qualitys).length) {
        try {
          var doc     = new DOMParser().parseFromString(html, 'text/html');
          var sources = doc.querySelectorAll('video source[src][title]');
          for (var si = 0; si < sources.length; si++) {
            var src   = sources[si].getAttribute('src')   || '';
            var title = sources[si].getAttribute('title') || 'auto';
            if (!src || src.indexOf('blob:') === 0) continue;
            if (src.indexOf('http') !== 0) src = 'https:' + src;
            var key2 = (title.toLowerCase() === 'auto') ? 'auto' : (title + 'p');
            qualitys[key2] = src;
          }
          if (Object.keys(qualitys).length) {
            console.log('[yjizz] qualitys via <source>:', Object.keys(qualitys));
          }
        } catch (e) {
          console.warn('[yjizz] <source> parse error:', e.message || e);
        }
      }

      // --- Метод 3: regex m3u8 ---
      if (!Object.keys(qualitys).length) {
        var re3 = /((?:https?:)?\/\/abre-videos\.youjizz\.com\/[^"'\s]+\.m3u8[^"'\s]*)/g;
        var m3;
        while ((m3 = re3.exec(html)) !== null) {
          var u3 = m3[1];
          if (u3.indexOf('http') !== 0) u3 = 'https:' + u3;
          qualitys['auto'] = u3;
          console.log('[yjizz] qualitys via regex m3u8:', u3.substring(0, 80));
          break;
        }
      }

      if (!Object.keys(qualitys).length) {
        error('YouJizz: видео не найдено на странице');
        return;
      }

      success(qualitys);

    }, error);
  }

  // ----------------------------------------------------------
  // МЕНЮ
  // ----------------------------------------------------------
  function buildMenu() {
    return [
      {
        title:        '🔍 Поиск',
        search_on:    true,
        playlist_url: NAME + '/search/',
      },
      {
        title:        '🗂 Сортировка',
        playlist_url: 'submenu',
        submenu:      SORTS.map(function (s) {
          return {
            title:        s.title,
            playlist_url: NAME + '/sort/' + s.val,
          };
        }),
      },
      {
        title:        '📂 Категории',
        playlist_url: 'submenu',
        submenu:      CATS.map(function (c) {
          return {
            title:        c.title,
            playlist_url: NAME + '/cat/' + c.val,
          };
        }),
      },
    ];
  }

  // ----------------------------------------------------------
  // РОУТЕР
  // ----------------------------------------------------------
  function parseSearchParam(url) {
    var m = url.match(/[?&]search=([^&]*)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function routeLoad(url, page, success, error) {
    console.log('[yjizz] routeLoad → "' + url + '" page=' + page);

    var PREFIX_SORT = NAME + '/sort/';
    var PREFIX_CAT  = NAME + '/cat/';
    var PREFIX_SRCH = NAME + '/search/';

    var sq = parseSearchParam(url);
    if (sq !== null) {
      var q5 = sq.trim();
      fetchPage(
        q5 ? buildSearchUrl(q5, page) : buildCatalogUrl(SORTS[0].val, page),
        page, success, error
      );
      return;
    }

    if (url.indexOf(PREFIX_SORT) === 0) {
      var sort = url.replace(PREFIX_SORT, '').split('?')[0].trim();
      fetchPage(buildCatalogUrl(sort || SORTS[0].val, page), page, success, error);
      return;
    }

    if (url.indexOf(PREFIX_CAT) === 0) {
      var cat = url.replace(PREFIX_CAT, '').split('?')[0].trim();
      if (cat) {
        fetchPage(buildCatUrl(cat, page), page, success, error);
        return;
      }
    }

    if (url.indexOf(PREFIX_SRCH) === 0) {
      var rawQ = url.replace(PREFIX_SRCH, '').split('?')[0].trim();
      if (rawQ) {
        fetchPage(buildSearchUrl(decodeURIComponent(rawQ), page), page, success, error);
        return;
      }
    }

    fetchPage(buildCatalogUrl(SORTS[0].val, page), page, success, error);
  }

  // ----------------------------------------------------------
  // ЗАГРУЗКА КАРТОЧЕК
  // ----------------------------------------------------------
  function fetchPage(loadUrl, page, success, error) {
    console.log('[yjizz] fetchPage → ' + loadUrl);
    httpGet(loadUrl, function (html) {
      var results = parseCards(html);
      if (!results.length) {
        error('YouJizz: карточки не найдены');
        return;
      }
      success({
        results:     results,
        collection:  true,
        total_pages: results.length >= 20 ? page + 5 : page,
        menu:        buildMenu(),
      });
    }, error);
  }

  // ----------------------------------------------------------
  // ПУБЛИЧНЫЙ ИНТЕРФЕЙС
  // ----------------------------------------------------------
  var YjizzParser = {

    main: function (params, success, error) {
      fetchPage(buildCatalogUrl(SORTS[0].val, 1), 1, success, error);
    },

    view: function (params, success, error) {
      var page = parseInt(params.page, 10) || 1;
      var url  = params.url || NAME;
      routeLoad(url, page, success, error);
    },

    search: function (params, success, error) {
      var query = (params.query || '').trim();
      var page  = parseInt(params.page, 10) || 1;
      if (!query) {
        success({ title: '', results: [], collection: true, total_pages: 1 });
        return;
      }
      fetchPage(buildSearchUrl(query, page), page, function (data) {
        data.title = 'YouJizz: ' + query;
        data.url   = NAME + '/search/' + encodeURIComponent(query);
        success(data);
      }, error);
    },

    qualities: function (videoUrl, success, error) {
      getVideoLinks(videoUrl, success, error);
    },
  };

  // ----------------------------------------------------------
  // РЕГИСТРАЦИЯ
  // ----------------------------------------------------------
  function tryRegister() {
    if (window.AdultPlugin &&
        typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, YjizzParser);
      console.log('[yjizz] v2.0.1 зарегистрирован OK');
      return true;
    }
    return false;
  }

  if (!tryRegister()) {
    var _elapsed = 0;
    var _poll = setInterval(function () {
      _elapsed += 100;
      if (tryRegister() || _elapsed >= 10000) clearInterval(_poll);
    }, 100);
  }

})();
