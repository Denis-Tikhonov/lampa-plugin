// =============================================================
// ostr.js — OstroePorno Parser для AdultJS (Lampa)
// =============================================================
// Версия  : 1.2.0
// Изменения:
//   [1.2.0] Переписан под структуру p365 (эталон):
//           - [FIX] Транспорт: window.AdultPlugin.networkRequest
//           - [FIX] qualities() → { qualities: {...} } строки URL
//           - [FIX] extractQualities: <source> / kt_player / mp4 fallback
//           - [FIX] parsePlaylist: DOMParser, множество fallback-селекторов
//           - [FIX] buildUrl: search=/?search=, cat=/category/{slug}, page=&page=N
//           - [FIX] routeView: NAME/cat/ как в p365
//           - [ADD] 62 категории из JSON navigation.categories
//   [1.1.0] XHR + Worker fallback (устарело)
//   [1.0.0] Базовый парсер
// =============================================================

(function () {
  'use strict';

  var VERSION = '1.2.0';
  var NAME    = 'ostr';
  var HOST    = 'http://ostroeporno.com';

  // ----------------------------------------------------------
  // КАТЕГОРИИ — полный список из JSON (69 категорий)
  // JSON: url = HOST/category/{slug}
  // ----------------------------------------------------------
  var CATEGORIES = [
    { title: '🇷🇺 Русское',           slug: 'russkoe'                },
    { title: '🏠 Домашнее',            slug: 'domashnee'              },
    { title: '🏠 Русское домашнее',    slug: 'russkoe_domashnee'      },
    { title: '👧 Молодые',             slug: 'molodyee'               },
    { title: '👅 Минет',               slug: 'minet'                  },
    { title: '🍑 Брюнетки',            slug: 'bryunetki'              },
    { title: '👠 Чулки и колготки',    slug: 'chulki_i_kolgotki'      },
    { title: '👵 Зрелые',              slug: 'zrelyee'                },
    { title: '👪 Инцесты',             slug: 'incesty'                },
    { title: '💦 Анал',                slug: 'anal'                   },
    { title: '💎 HD видео',            slug: 'hd_video'               },
    { title: '🍒 Большие сиськи',      slug: 'bolqshie_sisqki'        },
    { title: '🍑 Большие задницы',     slug: 'bolqshie_zadnicy'       },
    { title: '🍆 Большим членом',      slug: 'bolqshim_chlenom'       },
    { title: '💛 Блондинки',           slug: 'blondinki'              },
    { title: '🌏 Азиатки',             slug: 'aziatki'                },
    { title: '🔗 БДСМ',                slug: 'bdsm'                   },
    { title: '👫 Брат с сестрой',      slug: 'brat_s_sestroj'         },
    { title: '🌸 Армянское',           slug: 'armyanskoe'             },
    { title: '👥 Групповой секс',      slug: 'gruppovoj_seks'         },
    { title: '👫 ЖМЖ',                 slug: 'zhmzh'                  },
    { title: '👫 МЖМ',                 slug: 'mzhm'                   },
    { title: '👥 Толпой',              slug: 'tolpoj'                 },
    { title: '🔀 Двойное проникнов.',  slug: 'dvojnoe_proniknovenie'  },
    { title: '💕 Лесбиянки',           slug: 'lesbiyanki'             },
    { title: '👩 Мамки',               slug: 'mamki'                  },
    { title: '👩 Мать и сын',          slug: 'matq_i_syn'             },
    { title: '👨 Отец и дочь',         slug: 'otec_i_dochq'           },
    { title: '🌿 Жен. мастурбация',    slug: 'zhenskaya_masturbaciya' },
    { title: '🌹 Измена',              slug: 'izmena'                 },
    { title: '🏔️ Кавказ',             slug: 'kavkaz'                 },
    { title: '🌺 Красивое',            slug: 'krasivoe'               },
    { title: '🔍 Крупный план',        slug: 'krupnyj_plan'           },
    { title: '👅 Кунилингус',          slug: 'kunilingus'             },
    { title: '🚶 На улице',            slug: 'na_ulice'               },
    { title: '🌸 Нежное',              slug: 'nezhnoe'                },
    { title: '🎭 Кастинг',             slug: 'kasting'                },
    { title: '🍸 Пьяные',              slug: 'pqyanyee'               },
    { title: '🦊 Рыжие',               slug: 'ryzhie'                 },
    { title: '⚫ Негры',               slug: 'negry'                  },
    { title: '⚫ Негритянки',          slug: 'negrityanki'            },
    { title: '💆 Секс массаж',         slug: 'seks_massazh'           },
    { title: '💍 С женой',             slug: 's_zhenoj'               },
    { title: '💦 Сквирт',              slug: 'skvirt'                 },
    { title: '🎓 Студенты',            slug: 'studenty'               },
    { title: '🍩 Толстушки',           slug: 'tolstushki'             },
    { title: '💃 Трансы',              slug: 'transy'                 },
    { title: '🔥 Жёсткое',             slug: 'zhestkoe'               },
    { title: '🌿 Худые',               slug: 'hudyee'                 },
    { title: '🇺🇿 Узбеки',            slug: 'uzbeki'                 },
    { title: '💦 Глотает сперму',      slug: 'glotaet_spermu'         },
    { title: '👁️ От первого лица',    slug: 'ot_pervogo_lica'        },
    { title: '⏱️ Короткие ролики',    slug: 'korotkie_roliki'        },
    { title: '📷 Скрытая камера',      slug: 'skrytaya_kamera'        },
    { title: '🌸 Бритая киска',        slug: 'britaya_kiska'          },
    { title: '💧 Кончают внутрь',      slug: 'konchayut_vnutrq'       },
    { title: '🌊 Мощный оргазм',       slug: 'mownyj_orgazm'          },
    { title: '🌿 Волосатые вагины',    slug: 'volosatyee_vaginy'      },
    { title: '🎭 Извращения',          slug: 'izvraweniya'            },
    { title: '👠 На каблуках',         slug: 'na_kablukah'            },
    { title: '🍳 Секс на кухне',       slug: 'seks_na_kuhne'          },
    { title: '🎉 Оргии',               slug: 'orgii'                  },
    { title: '👔 Униформа',            slug: 'uniforma'               },
  ];

  // ----------------------------------------------------------
  // ТРАНСПОРТ — идентично p365
  // ----------------------------------------------------------
  function httpGet(url, success, error) {
    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, success, error);
    } else {
      fetch(url)
        .then(function (r) { return r.text(); })
        .then(success)
        .catch(error);
    }
  }

  // ----------------------------------------------------------
  // ОЧИСТКА URL
  // JSON: protocolRelative=true, rootRelative=true
  // ----------------------------------------------------------
  function cleanUrl(url) {
    if (!url) return '';
    var u = url.replace(/\\/g, '');
    if (u.indexOf('//') === 0)                      u = 'http:' + u;
    if (u.charAt(0) === '/' && u.charAt(1) !== '/') u = HOST + u;
    return u;
  }

  // ----------------------------------------------------------
  // ПАРСИНГ КАТАЛОГА
  // JSON: cardSelector=null — SSR нестабилен
  // Перебираем типичные селекторы для этого движка
  // ----------------------------------------------------------
  function parsePlaylist(html) {
    var results = [];
    var doc     = new DOMParser().parseFromString(html, 'text/html');

    // Перебор селекторов в порядке приоритета
    var SELS = ['.thumb', '.video-item', '.item', 'article.video', '.video'];
    var items;
    for (var s = 0; s < SELS.length; s++) {
      items = doc.querySelectorAll(SELS[s]);
      if (items && items.length > 0) {
        console.log('[ostr] parsePlaylist → selector "' + SELS[s] + '" найдено:', items.length);
        break;
      }
    }

    // Fallback: все ссылки на /video/
    if (!items || items.length === 0) {
      console.log('[ostr] parsePlaylist → fallback: ссылки /video/');
      var links = doc.querySelectorAll('a[href*="/video/"]');
      for (var j = 0; j < links.length; j++) {
        var aEl  = links[j];
        var href = cleanUrl(aEl.getAttribute('href') || '');
        if (!href) continue;
        var imgA = aEl.querySelector('img');
        var picA = imgA ? cleanUrl(imgA.getAttribute('data-src') || imgA.getAttribute('src') || '') : '';
        var nameA = (aEl.getAttribute('title') || aEl.textContent || '').replace(/\s+/g, ' ').trim() || 'Video';
        results.push({
          name: nameA, video: href, picture: picA, img: picA,
          poster: picA, background_image: picA,
          time: '', quality: 'HD', json: true, source: NAME,
        });
      }
      console.log('[ostr] parsePlaylist → fallback карточек:', results.length);
      return results;
    }

    for (var i = 0; i < items.length; i++) {
      var el     = items[i];
      var linkEl = el.querySelector('a[href]');
      if (!linkEl) continue;

      var link = cleanUrl(linkEl.getAttribute('href') || '');
      if (!link) continue;

      var imgEl = el.querySelector('img');
      var pic   = imgEl
        ? cleanUrl(imgEl.getAttribute('data-src') || imgEl.getAttribute('src') || '')
        : '';

      var titleEl = el.querySelector('a[title], .title, .name, h2, h3');
      var name    = (titleEl
        ? (titleEl.getAttribute('title') || titleEl.textContent)
        : (linkEl.getAttribute('title') || linkEl.textContent)
      ).replace(/\s+/g, ' ').trim() || 'Video';

      var durEl = el.querySelector('.duration, .time, .length');
      var time  = durEl ? durEl.textContent.trim() : '';

      results.push({
        name:             name,
        video:            link,
        picture:          pic,
        img:              pic,
        poster:           pic,
        background_image: pic,
        time:             time,
        quality:          'HD',
        json:             true,
        source:           NAME,
      });
    }

    console.log('[ostr] parsePlaylist → карточек:', results.length);
    return results;
  }

  // ----------------------------------------------------------
  // ИЗВЛЕЧЕНИЕ КАЧЕСТВ — 3 стратегии
  // JSON: extractionStrategies=[] — JS-рендер, ищем всё подряд
  // ----------------------------------------------------------
  function extractQualities(html) {
    var q = {};

    // Стратегия 1: <source> с label
    var re1 = /<source[^>]+src="([^"]+)"[^>]*label="([^"]+)"/gi;
    var re2 = /<source[^>]+label="([^"]+)"[^>]*src="([^"]+)"/gi;
    var m;
    while ((m = re1.exec(html)) !== null) {
      if (m[1] && m[1].indexOf('.mp4') !== -1) q[m[2]] = cleanUrl(m[1]);
    }
    if (!Object.keys(q).length) {
      while ((m = re2.exec(html)) !== null) {
        if (m[2] && m[2].indexOf('.mp4') !== -1) q[m[1]] = cleanUrl(m[2]);
      }
    }

    // Стратегия 2: kt_player / JW
    if (!Object.keys(q).length) {
      var vm  = html.match(/video_url\s*[:=]\s*['"]([^'"]+)['"]/);
      var vm2 = html.match(/video_alt_url\s*[:=]\s*['"]([^'"]+)['"]/);
      if (vm)  q['480p'] = cleanUrl(vm[1]);
      if (vm2) q['720p'] = cleanUrl(vm2[1]);
    }

    // Стратегия 3: любой .mp4
    if (!Object.keys(q).length) {
      var mp4 = html.match(/['"]([^'"]+\.mp4[^'"]*)['"]/i);
      if (mp4) q['HD'] = cleanUrl(mp4[1]);
    }

    return q;
  }

  // ----------------------------------------------------------
  // URL BUILDER
  // JSON: search=/?search=, category=HOST/category/{slug}, page=&page=N
  // ----------------------------------------------------------
  function buildUrl(type, value, page) {
    var url = HOST;
    page    = parseInt(page, 10) || 1;

    if (type === 'search') {
      url += '/?search=' + encodeURIComponent(value);
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
      { title: '🔍 Поиск',  search_on: true, playlist_url: NAME + '/search/' },
      { title: '🆕 Новинки', playlist_url: NAME + '/new' },
      {
        title:        '📂 Категории',
        playlist_url: 'submenu',
        submenu:      CATEGORIES.map(function (c) {
          return { title: c.title, playlist_url: NAME + '/cat/' + c.slug };
        }),
      },
    ];
  }

  // ----------------------------------------------------------
  // РОУТИНГ — идентично p365
  // ----------------------------------------------------------
  function routeView(url, page, success, error) {
    var fetchUrl;
    var searchMatch = url.match(/[?&]search=([^&]*)/);

    if (searchMatch) {
      fetchUrl = buildUrl('search', decodeURIComponent(searchMatch[1]), page);
    } else if (url.indexOf(NAME + '/cat/') === 0) {
      var cat = url.replace(NAME + '/cat/', '').split('?')[0];
      fetchUrl = buildUrl('cat', cat, page);
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
      success({
        results:     results,
        collection:  true,
        total_pages: page + 1,
        menu:        buildMenu(),
      });
    }, error);
  }

  // ----------------------------------------------------------
  // ПАРСЕР API
  // ----------------------------------------------------------
  var OstrParser = {

    main: function (params, success, error) {
      routeView(NAME + '/new', 1, success, error);
    },

    view: function (params, success, error) {
      routeView(params.url || NAME, params.page || 1, success, error);
    },

    search: function (params, success, error) {
      var query = (params.query || '').trim();
      httpGet(buildUrl('search', query, 1), function (html) {
        var results = parsePlaylist(html);
        success({
          title:       'OstroeP: ' + query,
          results:     results,
          collection:  true,
          total_pages: results.length >= 20 ? 2 : 1,
        });
      }, error);
    },

    qualities: function (videoPageUrl, success, error) {
      console.log('[ostr] qualities() →', videoPageUrl);
      httpGet(videoPageUrl, function (html) {
        console.log('[ostr] qualities() html длина:', html.length);
        if (!html || html.length < 500) { error('html < 500'); return; }

        var found = extractQualities(html);
        var keys  = Object.keys(found);
        console.log('[ostr] qualities() найдено:', keys.length, JSON.stringify(keys));

        if (keys.length > 0) {
          success({ qualities: found });
        } else {
          console.warn('[ostr] <source>:', (html.match(/<source/gi)  || []).length);
          console.warn('[ostr] .mp4:',    (html.match(/\.mp4/gi)     || []).length);
          console.warn('[ostr] video_url:',(html.match(/video_url/gi)|| []).length);
          error('Видео не найдено');
        }
      }, error);
    },
  };

  // ----------------------------------------------------------
  // РЕГИСТРАЦИЯ — идентично p365
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
    var poll = setInterval(function () {
      if (tryRegister()) clearInterval(poll);
    }, 200);
    setTimeout(function () { clearInterval(poll); }, 5000);
  }

})();
