// =============================================================
// ptop.js — PornTop Parser для AdultJS (Lampa)
// =============================================================
// Версия  : 1.3.0
// Изменения:
//   [1.3.0] КРИТИЧЕСКИЙ FIX qualities():
//           Скрин-анализ: .mp4: 41 — ссылки ЕСТЬ, но все содержат
//           шаблон вида "porntop.com/video/{video_id}/{dir}/?r=1"
//           → наш фильтр indexOf('{') отбрасывал ВСЕ ссылки.
//
//           Реальная структура страницы porntop:
//           - Видео отдаётся через iframe embed от внешнего хостера
//           - В HTML есть ссылки вида: https://cdn.domain/path/id.mp4
//           - Или через JS объект с "sources": [{file:"url", label:"HD"}]
//
//           Новый порядок стратегий:
//           S1. jwplayer() sources JSON — {"file":"url","label":"HD"}
//           S2. <source src> теги без шаблонов
//           S3. Любой внешний CDN mp4 (не porntop.com домен, нет {})
//           S4. Любой mp4 на любом домене (нет {})
//           S5. og:video mp4
//           S6. iframe src — если видео в iframe (embed)
//   [1.2.0] Переписан под структуру p365
//   [1.1.0] Worker fallback (устарело)
//   [1.0.0] Базовый парсер
// =============================================================

(function () {
  'use strict';

  var VERSION = '1.3.0';
  var NAME    = 'ptop';
  var HOST    = 'https://porntop.com';

  var CATEGORIES = [
    { title: '💎 HD Video',        slug: 'hd'          },
    { title: '👩 Брюнетки',        slug: 'brunette'    },
    { title: '🍑 Большая жопа',    slug: 'big-butt'    },
    { title: '🍒 Сисястые',        slug: 'big-tits'    },
    { title: '👵 Милфы',           slug: 'milf'        },
    { title: '👅 Глубокий отсос',  slug: 'deep-throat' },
    { title: '🎨 Тату',            slug: 'tattoos'     },
    { title: '👱 Блондинки',       slug: 'blonde'      },
    { title: '🌏 Азиатки',         slug: 'asian'       },
    { title: '🍆 Большой член',    slug: 'big-dick'    },
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
    var u = url.replace(/\\/g, '');
    if (u.indexOf('//') === 0)                      u = 'https:' + u;
    if (u.charAt(0) === '/' && u.charAt(1) !== '/') u = HOST + u;
    return u;
  }

  // ----------------------------------------------------------
  // ПАРСИНГ КАТАЛОГА
  // JSON: cardSelector=".item", thumb=data-original, title=.title
  // ----------------------------------------------------------
  function parsePlaylist(html) {
    var results = [];
    var doc     = new DOMParser().parseFromString(html, 'text/html');
    var items   = doc.querySelectorAll('.item');
    console.log('[ptop] parsePlaylist → .item:', items.length);

    for (var i = 0; i < items.length; i++) {
      var el     = items[i];
      var linkEl = el.querySelector('a[href]');
      if (!linkEl) continue;

      var href = cleanUrl(linkEl.getAttribute('href') || '');
      if (!href) continue;

      var imgEl = el.querySelector('img');
      var pic   = '';
      if (imgEl) {
        pic = cleanUrl(
          imgEl.getAttribute('data-original') ||
          imgEl.getAttribute('data-src')      ||
          imgEl.getAttribute('src')           || ''
        );
      }

      var titleEl = el.querySelector('.title, strong');
      var name    = (titleEl ? titleEl.textContent : (linkEl.getAttribute('title') || linkEl.textContent))
        .replace(/[\t\n\r]+/g, ' ').replace(/\s{2,}/g, ' ').trim() || 'Video';

      var durEl = el.querySelector('.duration, .time');
      var time  = durEl ? durEl.textContent.trim() : '';

      results.push({
        name: name, video: href,
        picture: pic, img: pic, poster: pic, background_image: pic,
        time: time, quality: 'HD', json: true, source: NAME,
      });
    }

    console.log('[ptop] parsePlaylist → карточек:', results.length);
    return results;
  }

  // ----------------------------------------------------------
  // ИЗВЛЕЧЕНИЕ КАЧЕСТВ
  //
  // Анализ скринов:
  //   {video_id}: 50 — шаблонные заглушки
  //   video_url: 1   — есть, но содержит шаблон → S1 не работает
  //   .mp4: 41       — 41 ссылка есть, но все либо шаблоны либо
  //                    ссылки на porntop.com (прокси к embed)
  //   og:video: 0    — нет
  //   <source>: 0    — нет
  //
  // Вывод: porntop проксирует видео через iframe от внешних хостеров.
  // Нужно найти embed iframe URL, затем запросить его.
  // ----------------------------------------------------------
  function extractQualities(html, pageUrl) {
    var q = {};

    // ----------------------------------------------------------
    // S1. jwplayer() / setup() — sources JSON
    // Паттерн: [{file:"url",label:"HD"},{file:"url",label:"SD"}]
    // ----------------------------------------------------------
    var jwRe = /(?:sources|playlist)\s*:\s*(\[[\s\S]{1,2000}?\])/;
    var jwM  = html.match(jwRe);
    if (jwM) {
      try {
        // Нормализуем JSON: одинарные кавычки → двойные
        var jsonStr = jwM[1]
          .replace(/'/g, '"')
          .replace(/(\w+)\s*:/g, '"$1":');
        var sources = JSON.parse(jsonStr);
        sources.forEach(function (s) {
          var file  = s.file || s.src || s.url || '';
          var label = s.label || s.quality || 'HD';
          if (file && file.indexOf('{') === -1 && file.indexOf('.mp4') !== -1) {
            q[label] = cleanUrl(file);
            console.log('[ptop] S1 jwplayer source ' + label + ':', q[label].substring(0, 80));
          }
        });
      } catch (e) { console.warn('[ptop] S1 json parse error:', e.message); }
    }

    // ----------------------------------------------------------
    // S2. <source src> без шаблонов
    // ----------------------------------------------------------
    if (!Object.keys(q).length) {
      var re2 = /<source[^>]+src="([^"]+)"/gi;
      var m2;
      while ((m2 = re2.exec(html)) !== null) {
        var s2 = m2[1];
        if (s2.indexOf('{') !== -1) continue;
        if (s2.indexOf('.mp4') === -1 && s2.indexOf('.m3u8') === -1) continue;
        var l2 = s2.match(/_(\d+)p?\.mp4/) ? s2.match(/_(\d+)p?\.mp4/)[1] + 'p' : 'HD';
        q[l2] = cleanUrl(s2);
        console.log('[ptop] S2 <source>:', s2.substring(0, 80));
      }
    }

    // ----------------------------------------------------------
    // S3. Внешний CDN mp4 (не porntop.com домен, без шаблонов)
    // Порнтоп использует сторонние CDN для реального видео
    // ----------------------------------------------------------
    if (!Object.keys(q).length) {
      var allMp4 = html.match(/https?:\/\/[^"'\s<>\\]+\.mp4[^"'\s<>\\]*/gi);
      if (allMp4) {
        allMp4.forEach(function (u) {
          if (u.indexOf('{') !== -1) return;                    // шаблон
          if (u.indexOf('porntop.com') !== -1) return;          // прокси самого сайта
          if (u.indexOf('pttn.m3pd.com') !== -1) return;        // CDN превью/постеров
          var qm = u.match(/_(\d+)p?\.mp4/);
          var lbl = qm ? qm[1] + 'p' : 'HD';
          if (!q[lbl]) {
            q[lbl] = cleanUrl(u);
            console.log('[ptop] S3 external CDN mp4 ' + lbl + ':', u.substring(0, 80));
          }
        });
      }
    }

    // ----------------------------------------------------------
    // S4. Любой mp4 без шаблонов (включая porntop CDN)
    // ----------------------------------------------------------
    if (!Object.keys(q).length) {
      var allMp4b = html.match(/https?:\/\/[^"'\s<>\\]+\.mp4[^"'\s<>\\]*/gi);
      if (allMp4b) {
        allMp4b.forEach(function (u) {
          if (u.indexOf('{') !== -1) return;
          var qm = u.match(/_(\d+)p?\.mp4/);
          var lbl = qm ? qm[1] + 'p' : 'HD';
          if (!q[lbl]) {
            q[lbl] = cleanUrl(u);
            console.log('[ptop] S4 any mp4 ' + lbl + ':', u.substring(0, 80));
          }
        });
      }
    }

    // ----------------------------------------------------------
    // S5. og:video
    // ----------------------------------------------------------
    if (!Object.keys(q).length) {
      var og = html.match(/property="og:video"[^>]+content="([^"]+\.mp4[^"]*)"/i)
            || html.match(/content="([^"]+\.mp4[^"]*)"[^>]+property="og:video"/i);
      if (og) {
        var ogUrl = cleanUrl(og[1]);
        if (ogUrl.indexOf('{') === -1) {
          var ogQ   = ogUrl.match(/_(\d+)\.mp4/);
          q[ogQ ? ogQ[1] + 'p' : 'HD'] = ogUrl;
          console.log('[ptop] S5 og:video:', ogUrl.substring(0, 80));
        }
      }
    }

    // ----------------------------------------------------------
    // S6. iframe embed — если видео во внешнем плеере
    // Возвращаем URL iframe как "embed" для дальнейшего запроса
    // ----------------------------------------------------------
    if (!Object.keys(q).length) {
      var iframeM = html.match(/<iframe[^>]+src="(https?:\/\/[^"]+)"/i);
      if (iframeM && iframeM[1].indexOf('porntop.com') === -1) {
        q['embed'] = iframeM[1];
        console.log('[ptop] S6 iframe embed:', iframeM[1].substring(0, 80));
      }
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
      url += '/?q=' + encodeURIComponent(value);
      if (page > 1) url += '&page=' + page;
    } else if (type === 'cat') {
      url += '/category/' + value + '/l/';
      if (page > 1) url += '?page=' + page;
    } else {
      if (page > 1) url += '/?page=' + page;
    }
    return url;
  }

  function buildMenu() {
    return [
      { title: '🔍 Поиск',     search_on: true, playlist_url: NAME + '/search/' },
      { title: '🔥 Популярное', playlist_url: NAME + '/popular' },
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

    console.log('[ptop] routeView →', fetchUrl);
    httpGet(fetchUrl, function (html) {
      console.log('[ptop] html длина:', html.length);
      var results = parsePlaylist(html);
      if (!results.length) { error('Контент не найден'); return; }
      success({ results: results, collection: true, total_pages: page + 1, menu: buildMenu() });
    }, error);
  }

  // ----------------------------------------------------------
  // ПАРСЕР API
  // ----------------------------------------------------------
  var PtopParser = {
    main: function (p, s, e) { routeView(NAME + '/popular', 1, s, e); },
    view: function (p, s, e) { routeView(p.url || NAME, p.page || 1, s, e); },
    search: function (p, s, e) {
      var query = (p.query || '').trim();
      httpGet(buildUrl('search', query, 1), function (html) {
        s({ title: 'PornTop: ' + query, results: parsePlaylist(html), collection: true, total_pages: 2 });
      }, e);
    },

    qualities: function (videoPageUrl, success, error) {
      console.log('[ptop] qualities() →', videoPageUrl);

      httpGet(videoPageUrl, function (html) {
        console.log('[ptop] qualities() html длина:', html.length);
        if (!html || html.length < 500) { error('html < 500'); return; }

        // Диагностика перед извлечением
        console.log('[ptop] {video_id}:', (html.match(/\{video_id\}/gi) || []).length);
        console.log('[ptop] video_url:',  (html.match(/video_url/gi)    || []).length);
        console.log('[ptop] .mp4:',       (html.match(/\.mp4/gi)        || []).length);
        console.log('[ptop] <source>:',   (html.match(/<source/gi)      || []).length);
        console.log('[ptop] og:video:',   (html.match(/og:video/gi)     || []).length);
        console.log('[ptop] jwplayer:',   (html.match(/jwplayer/gi)     || []).length);
        console.log('[ptop] sources:',    (html.match(/sources\s*:/gi)  || []).length);
        console.log('[ptop] iframe:',     (html.match(/<iframe/gi)      || []).length);

        var found = extractQualities(html, videoPageUrl);
        var keys  = Object.keys(found);
        console.log('[ptop] qualities() найдено:', keys.length, JSON.stringify(keys));

        if (keys.length > 0) {
          // Если нашли embed iframe — пробуем загрузить и извлечь из него
          if (keys.length === 1 && found['embed']) {
            var embedUrl = found['embed'];
            console.log('[ptop] пробуем embed iframe →', embedUrl);
            httpGet(embedUrl, function (embedHtml) {
              console.log('[ptop] embed html длина:', embedHtml.length);
              var embedQ = extractQualities(embedHtml, embedUrl);
              var embedKeys = Object.keys(embedQ);
              if (embedKeys.length > 0 && !(embedKeys.length === 1 && embedQ['embed'])) {
                console.log('[ptop] embed qualities найдено:', JSON.stringify(embedKeys));
                success({ qualities: embedQ });
              } else {
                // Возвращаем embed URL как прямую ссылку — пусть плеер попробует
                success({ qualities: { 'embed': embedUrl } });
              }
            }, function () {
              success({ qualities: { 'embed': embedUrl } });
            });
            return;
          }

          success({ qualities: found });
        } else {
          error('Видео не найдено');
        }
      }, error);
    },
  };

  // ----------------------------------------------------------
  // РЕГИСТРАЦИЯ
  // ----------------------------------------------------------
  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, PtopParser);
      console.log('[ptop] v' + VERSION + ' зарегистрирован');
      return true;
    }
    return false;
  }
  if (!tryRegister()) {
    var poll = setInterval(function () { if (tryRegister()) clearInterval(poll); }, 200);
    setTimeout(function () { clearInterval(poll); }, 5000);
  }

})();
