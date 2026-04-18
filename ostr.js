// =============================================================
// ostr.js — OstroePorno Parser для AdultJS (Lampa)
// =============================================================
// Версия  : 1.4.0
// Изменения:
//   [1.4.0] КРИТИЧЕСКИЙ FIX qualities():
//           Анализ HTML страницы видео:
//             <script src="/js/video243-925.js"></script>
//           → Видео URL находится в ОТДЕЛЬНОМ JS-файле вида /js/video{id}.js
//             который генерируется сервером динамически для каждого видео.
//             Этот файл содержит uppod-плеер с прямыми ссылками на mp4.
//
//           Алгоритм:
//           1. Из HTML страницы извлекаем src="/js/video*.js"
//           2. Загружаем этот JS-файл отдельным запросом
//           3. Парсим из него video_url / video_alt_url / uppod конфиг
//
//   [1.3.0] Поиск в <script> тегах, base64, iframe
//   [1.2.0] Переписан под структуру p365
//   [1.0.0] Базовый парсер
// =============================================================

(function () {
  'use strict';

  var VERSION = '1.4.0';
  var NAME    = 'ostr';
  var HOST    = 'http://ostroeporno.com';

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
    { title: '🇺🇿 Uzbeki',            slug: 'uzbeki'                 },
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
  // ОЧИСТКА URL
  // ----------------------------------------------------------
  function cleanUrl(url) {
    if (!url) return '';
    var u = url.replace(/\\/g, '').trim();
    // Удаляем кавычки если остались
    u = u.replace(/^['"`]+|['"`]+$/g, '');
    if (u.indexOf('//') === 0)                      u = 'http:' + u;
    if (u.charAt(0) === '/' && u.charAt(1) !== '/') u = HOST + u;
    return u;
  }

  // ----------------------------------------------------------
  // ПАРСИНГ КАТАЛОГА
  // ----------------------------------------------------------
  function parsePlaylist(html) {
    var results = [];
    var doc     = new DOMParser().parseFromString(html, 'text/html');

    var SELS = ['.thumb', '.video-item', '.item', 'article.video', '.video'];
    var items;
    for (var s = 0; s < SELS.length; s++) {
      items = doc.querySelectorAll(SELS[s]);
      if (items && items.length > 0) {
        console.log('[ostr] selector "' + SELS[s] + '":', items.length);
        break;
      }
    }

    if (!items || items.length === 0) {
      var links = doc.querySelectorAll('a[href*="/video/"]');
      console.log('[ostr] fallback /video/ links:', links.length);
      for (var j = 0; j < links.length; j++) {
        var aEl  = links[j];
        var href = cleanUrl(aEl.getAttribute('href') || '');
        if (!href) continue;
        var imgA  = aEl.querySelector('img');
        var picA  = imgA ? cleanUrl(imgA.getAttribute('data-src') || imgA.getAttribute('src') || '') : '';
        var nameA = (aEl.getAttribute('title') || aEl.textContent || '').replace(/\s+/g, ' ').trim() || 'Video';
        results.push({
          name: nameA, video: href,
          picture: picA, img: picA, poster: picA, background_image: picA,
          time: '', quality: 'HD', json: true, source: NAME,
        });
      }
      return results;
    }

    for (var i = 0; i < items.length; i++) {
      var el     = items[i];
      var linkEl = el.querySelector('a[href]');
      if (!linkEl) continue;
      var link = cleanUrl(linkEl.getAttribute('href') || '');
      if (!link) continue;
      var imgEl   = el.querySelector('img');
      var pic     = imgEl ? cleanUrl(imgEl.getAttribute('data-src') || imgEl.getAttribute('src') || '') : '';
      var titleEl = el.querySelector('a[title], .title, .name, h2, h3');
      var name    = (titleEl
        ? (titleEl.getAttribute('title') || titleEl.textContent)
        : (linkEl.getAttribute('title')  || linkEl.textContent)
      ).replace(/\s+/g, ' ').trim() || 'Video';
      var durEl = el.querySelector('.duration, .time, .length');
      var time  = durEl ? durEl.textContent.trim() : '';
      results.push({
        name: name, video: link,
        picture: pic, img: pic, poster: pic, background_image: pic,
        time: time, quality: 'HD', json: true, source: NAME,
      });
    }

    console.log('[ostr] карточек:', results.length);
    return results;
  }

  // ----------------------------------------------------------
  // ИЗВЛЕЧЕНИЕ URL ИЗ JS-ФАЙЛА UPPOD-ПЛЕЕРА
  //
  // Файл /js/video243-925.js содержит uppod({...}) или
  // аналогичную конструкцию с полями:
  //   file: "http://..."     — основное видео
  //   filehd: "http://..."  — HD версия
  //   file2: "http://..."   — резервная ссылка
  // ----------------------------------------------------------
  function parseVideoJs(jsContent) {
    var q = {};

    console.log('[ostr] parseVideoJs длина:', jsContent.length);

    // uppod({ file:"url", filehd:"url" })
    // kt_player({ video_url:"url", video_alt_url:"url" })

    var patterns = [
      { key: 'filehd',        label: '720p' },
      { key: 'file2hd',       label: '720p' },
      { key: 'file_hd',       label: '720p' },
      { key: 'video_alt_url', label: '720p' },
      { key: 'file',          label: '480p' },
      { key: 'file2',         label: '480p' },
      { key: 'video_url',     label: '480p' },
      { key: 'url',           label: 'HD'   },
      { key: 'src',           label: 'HD'   },
    ];

    patterns.forEach(function (p) {
      if (q[p.label]) return; // уже нашли это качество
      // Ищем: key: "value" или key : 'value' или key="value"
      var re  = new RegExp(p.key + '\\s*[:=]\\s*[\'"`]([^\'"` ]+)[\'"`]', 'i');
      var m   = jsContent.match(re);
      if (m && m[1]) {
        var u = cleanUrl(m[1]);
        // Проверяем что это реальный URL, не пустой/шаблон
        if (u && u.indexOf('{') === -1 && (
          u.indexOf('.mp4') !== -1 ||
          u.indexOf('.m3u8') !== -1 ||
          u.indexOf('http') === 0
        )) {
          q[p.label] = u;
          console.log('[ostr] parseVideoJs ' + p.key + ' → ' + p.label + ':', u.substring(0, 100));
        }
      }
    });

    // Fallback: любой http URL с mp4 в JS-файле
    if (!Object.keys(q).length) {
      var mp4s = jsContent.match(/https?:\/\/[^"'\s,;)]+\.mp4[^"'\s,;)]*/gi);
      if (mp4s) {
        mp4s.forEach(function (u, i) {
          if (u.indexOf('{') !== -1) return;
          var qm  = u.match(/_(\d+)p?\.mp4/);
          var lbl = qm ? qm[1] + 'p' : (i === 0 ? 'HD' : 'HD' + i);
          if (!q[lbl]) {
            q[lbl] = cleanUrl(u);
            console.log('[ostr] parseVideoJs mp4 fallback:', u.substring(0, 100));
          }
        });
      }
    }

    return q;
  }

  // ----------------------------------------------------------
  // QUALITIES — главная логика
  //
  // Шаг 1: загружаем страницу видео
  // Шаг 2: ищем <script src="/js/video*.js">
  // Шаг 3: загружаем этот JS-файл
  // Шаг 4: парсим из него URL видео
  // ----------------------------------------------------------
  function extractFromPage(html, videoPageUrl, success, error) {
    // ----------------------------------------------------------
    // [1.4.0] ГЛАВНАЯ СТРАТЕГИЯ: /js/video{N}.js
    // Паттерн из HTML: <script src="/js/video243-925.js">
    // ----------------------------------------------------------
    var videoJsMatch = html.match(/<script[^>]+src="(\/js\/video[^"]+\.js)"/i);

    if (videoJsMatch) {
      var jsUrl = HOST + videoJsMatch[1];
      console.log('[ostr] найден video JS файл:', jsUrl);

      httpGet(jsUrl, function (jsContent) {
        var found = parseVideoJs(jsContent);
        if (Object.keys(found).length > 0) {
          console.log('[ostr] qualities из video JS:', JSON.stringify(Object.keys(found)));
          success({ qualities: found });
        } else {
          console.warn('[ostr] video JS пуст, пробуем fallback...');
          fallbackExtract(html, success, error);
        }
      }, function (e) {
        console.warn('[ostr] video JS загрузить не удалось:', e);
        fallbackExtract(html, success, error);
      });
      return;
    }

    // JS-файл не найден — пробуем fallback
    console.warn('[ostr] video JS не найден в HTML, пробуем fallback...');
    fallbackExtract(html, success, error);
  }

  // ----------------------------------------------------------
  // FALLBACK — если /js/video*.js не найден
  // ----------------------------------------------------------
  function fallbackExtract(html, success, error) {
    var q = {};

    // uppod/kt_player прямо в HTML (inline script)
    var patterns = [
      { re: /video_alt_url\s*[:=]\s*['"`]([^'"`]+\.mp4[^'"`]*)['"` ]/i, label: '720p' },
      { re: /video_url\s*[:=]\s*['"`]([^'"`]+\.mp4[^'"`]*)['"` ]/i,     label: '480p' },
      { re: /filehd\s*[:=]\s*['"`]([^'"`]+\.mp4[^'"`]*)['"` ]/i,        label: '720p' },
      { re: /file\s*[:=]\s*['"`]([^'"`]+\.mp4[^'"`]*)['"` ]/i,          label: '480p' },
    ];

    patterns.forEach(function (p) {
      if (q[p.label]) return;
      var m = html.match(p.re);
      if (m && m[1] && m[1].indexOf('{') === -1) {
        q[p.label] = cleanUrl(m[1]);
      }
    });

    // data-атрибуты
    if (!Object.keys(q).length) {
      var dataRe = /data-(?:src|url|file|video|mp4)\s*=\s*['"]([^'"]+\.mp4[^'"]*)['"]/gi;
      var dm;
      while ((dm = dataRe.exec(html)) !== null) {
        if (dm[1].indexOf('{') === -1) { q['HD'] = cleanUrl(dm[1]); break; }
      }
    }

    // iframe embed
    if (!Object.keys(q).length) {
      var iframeM = html.match(/<iframe[^>]+src="(https?:\/\/[^"]+)"/i);
      if (iframeM && iframeM[1].indexOf('ostroeporno.com') === -1) {
        q['embed'] = iframeM[1];
        console.log('[ostr] fallback iframe:', iframeM[1]);
      }
    }

    // Любой mp4
    if (!Object.keys(q).length) {
      var anyMp4 = html.match(/https?:\/\/[^"'\s<>\\]+\.mp4[^"'\s<>\\]*/gi);
      if (anyMp4) {
        anyMp4.forEach(function (u) {
          if (u.indexOf('{') !== -1) return;
          var qm  = u.match(/_(\d+)p?\.mp4/);
          var lbl = qm ? qm[1] + 'p' : 'HD';
          if (!q[lbl]) q[lbl] = cleanUrl(u);
        });
      }
    }

    var keys = Object.keys(q);

    if (keys.length > 0) {
      // Если embed iframe — запрашиваем его рекурсивно
      if (keys.length === 1 && q['embed']) {
        var embedUrl = q['embed'];
        console.log('[ostr] embed iframe →', embedUrl);
        httpGet(embedUrl, function (embedHtml) {
          var eq   = {};
          var ekeys = [];

          // Парсим из embed HTML
          var ep = extractVideoJs(embedHtml);
          eq = ep;
          ekeys = Object.keys(eq);

          if (ekeys.length > 0) {
            success({ qualities: eq });
          } else {
            success({ qualities: { 'embed': embedUrl } });
          }
        }, function () {
          success({ qualities: { 'embed': embedUrl } });
        });
        return;
      }
      success({ qualities: q });
    } else {
      error('Видео не найдено (все стратегии исчерпаны)');
    }
  }

  // Простой парсер для embed HTML (без рекурсии в httpGet)
  function extractVideoJs(html) {
    var q = {};
    var mp4s = html.match(/https?:\/\/[^"'\s,;)\\]+\.mp4[^"'\s,;)\\]*/gi);
    if (mp4s) {
      mp4s.forEach(function (u) {
        if (u.indexOf('{') !== -1) return;
        var qm  = u.match(/_(\d+)p?\.mp4/);
        var lbl = qm ? qm[1] + 'p' : 'HD';
        if (!q[lbl]) q[lbl] = u.replace(/\\/g, '');
      });
    }
    return q;
  }

  // ----------------------------------------------------------
  // URL BUILDER
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
        title: '📂 Категории', playlist_url: 'submenu',
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
    var fetchUrl;
    var sm = url.match(/[?&]search=([^&]*)/);
    if (sm) {
      fetchUrl = buildUrl('search', decodeURIComponent(sm[1]), page);
    } else if (url.indexOf(NAME + '/cat/') === 0) {
      fetchUrl = buildUrl('cat', url.replace(NAME + '/cat/', '').split('?')[0], page);
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
      success({ results: results, collection: true, total_pages: page + 1, menu: buildMenu() });
    }, error);
  }

  // ----------------------------------------------------------
  // ПАРСЕР API
  // ----------------------------------------------------------
  var OstrParser = {
    main: function (p, s, e) { routeView(NAME + '/new', 1, s, e); },
    view: function (p, s, e) { routeView(p.url || NAME, p.page || 1, s, e); },
    search: function (p, s, e) {
      var query = (p.query || '').trim();
      httpGet(buildUrl('search', query, 1), function (html) {
        s({ title: 'OstroeP: ' + query, results: parsePlaylist(html), collection: true, total_pages: 2 });
      }, e);
    },

    qualities: function (videoPageUrl, success, error) {
      console.log('[ostr] qualities() →', videoPageUrl);

      httpGet(videoPageUrl, function (html) {
        console.log('[ostr] qualities() html длина:', html.length);
        if (!html || html.length < 200) { error('html < 200'); return; }

        // Диагностика
        var videoJsFiles = html.match(/<script[^>]+src="(\/js\/video[^"]+\.js)"/gi) || [];
        console.log('[ostr] /js/video*.js файлов найдено:', videoJsFiles.length);
        if (videoJsFiles.length) console.log('[ostr] video JS:', videoJsFiles[0]);
        console.log('[ostr] uppod:',     (html.match(/uppod/gi)      || []).length);
        console.log('[ostr] kt_player:', (html.match(/kt_player/gi)  || []).length);
        console.log('[ostr] <iframe:',   (html.match(/<iframe/gi)    || []).length);

        extractFromPage(html, videoPageUrl, success, error);
      }, error);
    },
  };

  // ----------------------------------------------------------
  // РЕГИСТРАЦИЯ
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
    var poll = setInterval(function () { if (tryRegister()) clearInterval(poll); }, 200);
    setTimeout(function () { clearInterval(poll); }, 5000);
  }

})();
