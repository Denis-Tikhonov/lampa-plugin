// =============================================================
// p365.js — Парсер Porno365Tube для AdultJS (Lampa)
// Version  : 1.4.0
// Based on : 1.3.0 (архитектура) + анализ реального HTML страницы видео
//
// [1.4.0] ИСПРАВЛЕНО извлечение видео:
//   — УДАЛЕНЫ: xvideos-паттерны (setVideoHlsUrl, setVideoUrlHigh/Low)
//              которых на этом сайте нет — они от другого движка
//   — ДОБАВЛЕНЫ реальные источники (из анализа top.porno365tube.win):
//     1) <source src="..." size="480"> — прямые get_file URL (основной)
//     2) og:video content="...720.mp4" — HD c CDN uch3.vids69.com
//     3) get_file fallback regex — любой get_file URL как резерв
//   — УБРАН remote_control.php — токены time-bound, протухают быстро
//
// Структура URL видеофайлов:
//   get_file : https://top.porno365tube.win/get_file/2/{hash}/0/{id}/{id}_{size}.mp4
//   og:video : https://uch3.vids69.com/content/0/{id}/xxxxx_{quality}.mp4
//
// Worker ALLOWED_TARGETS (обязательно):
//   top.porno365tube.win   — сайт + get_file CDN
//   uch3.vids69.com        — CDN видеофайлов 720p (уже есть в Worker 1.3.5)
// =============================================================

(function () {
  'use strict';

  var NAME = 'p365';
  var HOST = 'https://top.porno365tube.win';

  var CATEGORIES = [
    { title: 'HD порно',          slug: 'hd-porno'               },
    { title: 'Анал',              slug: 'anal'                   },
    { title: 'Молодые',           slug: 'molodye'                },
    { title: 'Блондинки',         slug: 'blondinki'              },
    { title: 'Минет',             slug: 'minet'                  },
    { title: 'Большие жопы',      slug: 'bolshie-jopy'           },
    { title: 'Русское',           slug: 'russkoe'                },
    { title: 'Зрелые',            slug: 'zrelye'                 },
    { title: 'Измена',            slug: 'izmena'                 },
    { title: 'Домашнее',          slug: 'domashnee'              },
    { title: 'Большие сиськи',    slug: 'bolshie-siski'          },
    { title: 'Большие члены',     slug: 'bolshie-chleny'         },
    { title: 'Брюнетки',          slug: 'bryunetki'              },
    { title: 'Мамки',             slug: 'mamki'                  },
    { title: 'Групповое',         slug: 'gruppovoe'              },
    { title: 'Лесбиянки',         slug: 'lesbiyanki'             },
    { title: 'Кастинг',           slug: 'kasting'                },
    { title: 'Межрасовое',        slug: 'mejrassovoe'            },
    { title: 'БДСМ',              slug: 'bdsm'                   },
    { title: 'Мастурбация',       slug: 'masturbaciya'           },
  ];

  // ----------------------------------------------------------
  // Очистка URL (из v1.3.0, сохраняем как есть)
  // ----------------------------------------------------------
  function cleanUrl(url) {
    if (!url) return '';
    var clean = url.replace(/\\/g, '');
    if (clean.indexOf('//') === 0) clean = 'https:' + clean;
    if (clean.indexOf('/') === 0 && clean.indexOf('//') !== 0) {
      clean = HOST + clean;
    }
    return clean;
  }

  // ----------------------------------------------------------
  // Сетевой запрос
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
  // [1.4.0] ИЗВЛЕЧЕНИЕ КАЧЕСТВ ВИДЕО
  //
  // Реальная структура страницы видео top.porno365tube.win:
  //
  //   <video id="player" poster="...">
  //     <source src="https://top.porno365tube.win/get_file/2/{hash}/0/704/704_preview.mp4"
  //             type="video/mp4" size="preview">                   ← ПРОПУСКАЕМ
  //     <source src="https://top.porno365tube.win/get_file/2/{hash}/0/704/704_480.mp4"
  //             type="video/mp4" size="480">                       ← БЕРЁМ
  //   </video>
  //
  //   <meta property="og:video"
  //         content="https://uch3.vids69.com/content/0/704/10147_720.mp4"/> ← БЕРЁМ (720p HD)
  //
  // remote_control.php НЕ берём — time-bound токены (протухают).
  // ----------------------------------------------------------
  function extractQualities(html) {
    var q = {};

    // ----------------------------------------------------------
    // Стратегия 1: <source> теги с атрибутом size
    // Формат: <source src="URL" type="video/mp4" size="480">
    // Порядок атрибутов может быть любым — проверяем оба варианта
    // ----------------------------------------------------------
    var reSrc1 = /<source[^>]+src="([^"]+)"[^>]+size="([^"]+)"/gi;
    var reSrc2 = /<source[^>]+size="([^"]+)"[^>]+src="([^"]+)"/gi;
    var m;

    while ((m = reSrc1.exec(html)) !== null) {
      var src  = m[1];
      var size = m[2];
      if (size === 'preview') continue;        // превью не нужно
      if (!src || src.indexOf('.mp4') === -1) continue;
      q[size + 'p'] = cleanUrl(src);
      console.log('[P365] <source> size=' + size + ': ' + src.substring(0, 80));
    }

    // Если первый regex ничего не дал — пробуем обратный порядок атрибутов
    if (!Object.keys(q).length) {
      while ((m = reSrc2.exec(html)) !== null) {
        var size2 = m[1];
        var src2  = m[2];
        if (size2 === 'preview') continue;
        if (!src2 || src2.indexOf('.mp4') === -1) continue;
        q[size2 + 'p'] = cleanUrl(src2);
        console.log('[P365] <source> rev size=' + size2 + ': ' + src2.substring(0, 80));
      }
    }

    // ----------------------------------------------------------
    // Стратегия 2: og:video meta-тег
    // Обычно содержит 720p с CDN uch3.vids69.com
    // Берём только mp4-ссылки (не embed URL)
    // ----------------------------------------------------------
    var ogMatches = html.match(/<meta[^>]+property="og:video"[^>]+content="([^"]+\.mp4[^"]*)"/gi);
    if (!ogMatches) {
      // Пробуем обратный порядок атрибутов meta
      ogMatches = html.match(/<meta[^>]+content="([^"]+\.mp4[^"]*)"[^>]+property="og:video"/gi);
    }

    if (ogMatches) {
      for (var oi = 0; oi < ogMatches.length; oi++) {
        var urlMatch = ogMatches[oi].match(/content="([^"]+\.mp4[^"]*)"/i);
        if (!urlMatch || !urlMatch[1]) continue;
        var ogUrl = cleanUrl(urlMatch[1]);

        // Пропускаем embed-ссылки (не mp4 файлы)
        if (ogUrl.indexOf('/embed/') !== -1) continue;

        // Определяем качество из имени файла (например 10147_720.mp4 → 720p)
        var qMatch = ogUrl.match(/_(\d+)\.mp4/);
        var label  = qMatch ? qMatch[1] + 'p' : 'HD';

        if (!q[label]) {
          q[label] = ogUrl;
          console.log('[P365] og:video ' + label + ': ' + ogUrl.substring(0, 80));
        }
      }
    }

    // ----------------------------------------------------------
    // Стратегия 3: get_file URL fallback
    // Если <source> почему-то не нашёлся — ищем любой get_file URL
    // ----------------------------------------------------------
    if (!Object.keys(q).length) {
      var getFileRe = /(https?:\/\/top\.porno365tube\.win\/get_file\/[^"'\s]+\.mp4)/g;
      var gf;
      var gfCount = 0;
      while ((gf = getFileRe.exec(html)) !== null && gfCount < 5) {
        var gfUrl  = cleanUrl(gf[1]);
        if (gfUrl.indexOf('preview') !== -1) continue;  // пропускаем preview
        var gfQ    = gfUrl.match(/_(\d+)\.mp4/);
        var gfLabel = gfQ ? gfQ[1] + 'p' : ('auto' + gfCount);
        if (!q[gfLabel]) {
          q[gfLabel] = gfUrl;
          console.log('[P365] get_file fallback ' + gfLabel + ': ' + gfUrl.substring(0, 80));
          gfCount++;
        }
      }
    }

    return q;
  }

  // ----------------------------------------------------------
  // Парсинг каталога (из v1.3.0, без изменений)
  // ----------------------------------------------------------
  function parsePlaylist(html) {
    var results = [];
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var items = doc.querySelectorAll('.video-block');

    console.log('[P365] parsePlaylist → .video-block найдено:', items.length);

    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      var a  = el.querySelector('a[href*="/videos/"]');
      if (!a) continue;

      var href = a.getAttribute('href');
      if (href.indexOf('http') !== 0) href = HOST + href;

      var img = el.querySelector('img');
      var pic = '';
      if (img) {
        pic = img.getAttribute('data-src') || img.getAttribute('src') || '';
        pic = cleanUrl(pic);
      }

      var titleEl = el.querySelector('.title');
      var name    = (titleEl ? titleEl.textContent.trim() : '') ||
                    (img ? (img.getAttribute('alt') || '') : '') ||
                    'No Title';
      name = name.replace(/\s+/g, ' ').trim();
      if (name.length < 3) continue;

      var durEl = el.querySelector('.duration, span.duration');
      var time  = durEl ? durEl.textContent.trim() : '';

      results.push({
        name:             name,
        video:            href,   // страница видео → qualities() извлечёт mp4
        picture:          pic,
        img:              pic,
        poster:           pic,
        background_image: pic,
        time:             time,
        quality:          'HD',
        json:             true,   // Lampa вызовет qualities() при открытии
        source:           NAME,
      });
    }

    console.log('[P365] parsePlaylist → карточек:', results.length);
    return results;
  }

  // ----------------------------------------------------------
  // Построение URL
  // ----------------------------------------------------------
  function buildUrl(path, page, query) {
    var url = HOST;
    page = parseInt(page, 10) || 1;

    if (query) {
      url += '/search/?q=' + encodeURIComponent(query);
      if (page > 1) url += '&from=' + page;
    } else if (path && path !== NAME && path !== 'main') {
      url += '/categories/' + path + (page > 1 ? '/' + page : '/');
    } else {
      url += (page > 1 ? '/' + page : '/');
    }

    return url;
  }

  function buildMenu() {
    return [
      { title: 'Поиск', search_on: true, playlist_url: NAME + '/search/' },
      {
        title:        'Категории',
        playlist_url: 'submenu',
        submenu:      CATEGORIES.map(function (c) {
          return { title: c.title, playlist_url: NAME + '/cat/' + c.slug };
        }),
      },
    ];
  }

  // ----------------------------------------------------------
  // Роутинг
  // ----------------------------------------------------------
  function routeView(url, page, success, error) {
    var fetchUrl;

    var searchMatch = url.match(/[?&]search=([^&]*)/);
    if (searchMatch) {
      fetchUrl = buildUrl(null, page, decodeURIComponent(searchMatch[1]));
    } else if (url.indexOf(NAME + '/cat/') === 0) {
      var cat = url.replace(NAME + '/cat/', '').split('?')[0];
      fetchUrl = buildUrl(cat, page);
    } else {
      fetchUrl = buildUrl(null, page);
    }

    console.log('[P365] routeView →', fetchUrl);

    httpGet(fetchUrl, function (html) {
      console.log('[P365] html длина:', html.length);
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
  // Публичный интерфейс
  // ----------------------------------------------------------
  var P365Parser = {

    main: function (params, success, error) {
      routeView(NAME + '/main', 1, success, error);
    },

    view: function (params, success, error) {
      routeView(params.url || NAME, params.page || 1, success, error);
    },

    search: function (params, success, error) {
      var query = (params.query || '').trim();
      var url   = buildUrl(null, params.page || 1, query);
      httpGet(url, function (html) {
        var results = parsePlaylist(html);
        success({
          title:       'P365: ' + query,
          results:     results,
          collection:  true,
          total_pages: results.length >= 20 ? 2 : 1,
        });
      }, error);
    },

    // [1.4.0] qualities() — исправлено
    qualities: function (videoPageUrl, success, error) {
      console.log('[P365] qualities() → страница:', videoPageUrl);

      httpGet(videoPageUrl, function (html) {
        console.log('[P365] qualities() → html длина:', html.length);

        // Диагностика: проверяем что html пришёл нормально
        if (!html || html.length < 1000) {
          console.warn('[P365] qualities() → html слишком короткий, возможно блокировка');
          error('Страница видео недоступна (html < 1000 байт)');
          return;
        }

        var found = extractQualities(html);
        var keys  = Object.keys(found);

        console.log('[P365] qualities() → найдено качеств:', keys.length, JSON.stringify(keys));

        if (keys.length > 0) {
          success({ qualities: found });
        } else {
          // Финальная диагностика если ничего не нашли
          console.warn('[P365] qualities() → ничего не найдено');
          console.warn('[P365]   <source>:', (html.match(/<source/gi) || []).length);
          console.warn('[P365]   get_file:', (html.match(/get_file/gi) || []).length);
          console.warn('[P365]   og:video:', (html.match(/og:video/gi) || []).length);
          console.warn('[P365]   .mp4:',     (html.match(/\.mp4/gi)    || []).length);
          error('Видео не найдено');
        }
      }, error);
    },
  };

  // ----------------------------------------------------------
  // Регистрация
  // ----------------------------------------------------------
  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, P365Parser);
      console.log('[P365] v1.4.0 зарегистрирован');
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
