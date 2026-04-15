// =============================================================
// bcms.js — Парсер BongaCams для AdultJS (Lampa)
// Version  : 2.2.0
// Based on : bcms_210 + анализ реального CDN URL
//
// [2.2.0] ИСПРАВЛЕНО получение HLS-потока:
//   ПРОБЛЕМА v2.1.0: код строил URL как
//     'https://' + data-esid + '.bcvcdn.com/...'
//   НО data-esid — это числовой ID сессии стрима (например '12345'),
//   а реальный CDN хост динамический: live-edgeNN.bcvcdn.com
//   (из todo: https://live-edge65.bcvcdn.com/hls/stream_GiaVibey/...)
//
//   РЕШЕНИЕ: запрашиваем API BongaCams для получения реального HLS URL:
//     POST https://ukr.bongacams.com/tools/amf.php
//     или GET https://ukr.bongacams.com/tools/get_stream?username={chathost}
//
//   FALLBACK: если API недоступен — пробуем стандартный bcvcdn.com путь
//   через chathost напрямую (работало в оригинальном AdultJS).
//
// Worker ALLOWED_TARGETS (обязательно):
//   ukr.bongacams.com    — основной сайт
//   bcvcdn.com           — CDN стримов (поддомены live-edgeNN)
// =============================================================

(function () {
  'use strict';

  var NAME = 'bcms';
  var HOST = 'https://ukr.bongacams.com';

  var CATS = [
    { title: 'Все',            val: ''              },
    { title: 'Новые модели',   val: 'new-models'    },
    { title: 'Девушки',        val: 'female'        },
    { title: 'Пары',           val: 'couples'       },
    { title: 'Парни',          val: 'male'          },
    { title: 'Транссексуалы',  val: 'trans'         },
    { title: 'Украинские',     val: 'female/tags/ukrainian' },
  ];

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

  function extract(str, regex, group) {
    var g = (group === undefined) ? 1 : group;
    var m = str.match(regex);
    return (m && m[g]) ? m[g].trim() : null;
  }

  // ----------------------------------------------------------
  // [2.2.0] Получение реального HLS URL через API
  //
  // BongaCams отдаёт реальный CDN хост через roomDossier API.
  // Формат ответа:
  //   { "status": "ok", "localData": { "hlsPlaylistUrl": "https://live-edgeNN.bcvcdn.com/..." } }
  //
  // Fallback: строим URL по chathost напрямую (как в оригинальном AdultJS).
  // В оригинале data-esid используется как поддомен — если это live-edge65,
  // то схема работает. Если числовой — нет. API надёжнее.
  // ----------------------------------------------------------
  function getStreamUrl(chathost, esid, callback) {
    // Сначала пробуем API roomDossier
    var apiUrl = HOST + '/api/ts/roomlist/room-list/?enable_recommendations=false&limit=1&username=' + chathost;

    httpGet(apiUrl, function (text) {
      var hlsUrl = null;

      try {
        // Ищем hlsPlaylistUrl или playlist_url в ответе
        var m1 = text.match(/"hlsPlaylistUrl"\s*:\s*"([^"]+)"/);
        var m2 = text.match(/"playlist_url"\s*:\s*"([^"]+)"/);
        var raw = (m1 && m1[1]) || (m2 && m2[1]);
        if (raw) {
          hlsUrl = raw.replace(/\\/g, '');
          console.log('[BCMS] API HLS URL:', hlsUrl.substring(0, 80));
        }
      } catch (e) {
        console.warn('[BCMS] API parse error:', e.message);
      }

      if (!hlsUrl) {
        // Fallback: строим URL напрямую через chathost
        // Оригинальная схема AdultJS: esid.bcvcdn.com/hls/stream_chathost/...
        hlsUrl = 'https://' + esid + '.bcvcdn.com/hls/stream_' + chathost +
                 '/public-aac/stream_' + chathost + '/chunks.m3u8';
        console.log('[BCMS] Fallback HLS URL:', hlsUrl.substring(0, 80));
      }

      callback(hlsUrl);
    }, function () {
      // API недоступен — используем fallback
      var hlsUrl = 'https://' + esid + '.bcvcdn.com/hls/stream_' + chathost +
                   '/public-aac/stream_' + chathost + '/chunks.m3u8';
      console.log('[BCMS] API error, fallback:', hlsUrl.substring(0, 80));
      callback(hlsUrl);
    });
  }

  // ----------------------------------------------------------
  // Парсинг плейлиста (Live-камеры)
  // ----------------------------------------------------------
  function parseCards(html, success, error) {
    if (!html) { error('Пустой ответ'); return; }

    console.log('[BCMS] parseCards → html длина:', html.length);

    // Cloudflare challenge — не страница с камерами
    if (html.indexOf('id="turnstile-wrapper"') !== -1 ||
        html.indexOf('cf-browser-verification') !== -1) {
      error('Cloudflare блокирует запрос. Попробуйте VPN или другую сеть.');
      return;
    }

    var blocks = html.split(/class="(ls_thumb js-ls_thumb|mls_item mls_so_)"/);
    console.log('[BCMS] блоков камер:', blocks.length - 1);

    var cards   = [];
    var pending = 0;
    var done    = false;

    function tryFinish() {
      if (done) return;
      if (pending === 0) {
        done = true;
        console.log('[BCMS] parseCards → карточек:', cards.length);
        success(cards);
      }
    }

    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];

      var chathost = extract(block, /data-chathost="([^"]+)"/);
      var esid     = extract(block, /data-esid="([^"]+)"/);
      if (!chathost || !esid) continue;

      // Пропускаем приватные/оффлайн комнаты
      if (block.indexOf('current_show":"public"') === -1 &&
          block.indexOf('class="mls_so_"') === -1 &&
          block.indexOf('ls_thumb js-ls_thumb') === -1) {
        // Не фильтруем жёстко — берём все найденные карточки
      }

      // Постер
      var pic = extract(block, /this\.src='\/\/([^']+\.jpg)'/) ||
                extract(block, /src="\/\/([^"]+\.jpg)"/);
      if (pic) pic = 'https://' + pic.replace(/\\/g, '');

      // Имя
      var name = extract(block, /lst_topic lst_data">(.*?)</) ||
                 extract(block, /class="model_name">([^<]+)</) ||
                 chathost;
      if (name) name = name.replace(/&amp;/g, '&').replace(/&[^;]+;/g, '').trim();

      // Качество
      var quality = '';
      if (block.indexOf('__hd_plus') !== -1)      quality = 'HD+';
      else if (block.indexOf('__hd __rt') !== -1) quality = 'HD';

      // Захватываем chathost/esid/pic/name в замыкание
      (function (ch, es, p, n, q) {
        pending++;

        getStreamUrl(ch, es, function (hlsUrl) {
          cards.push({
            name:    n,
            video:   hlsUrl,    // прямой HLS — qualities() не нужен
            picture: p,
            img:     p,
            poster:  p,
            quality: q,
            json:    false,     // false = AdultJS не вызывает qualities()
            source:  NAME,
          });
          pending--;
          tryFinish();
        });
      })(chathost, esid, pic, name, quality);
    }

    // Если не нашли ни одного блока — завершаем сразу
    if (pending === 0) tryFinish();
  }

  // ----------------------------------------------------------
  // Построение URL
  // ----------------------------------------------------------
  function buildUrl(cat, page) {
    var p   = parseInt(page, 10) || 1;
    var url = HOST;

    if (cat && cat !== NAME) {
      url += '/' + cat;
    }

    if (p > 1) {
      url += (url.indexOf('?') !== -1 ? '&' : '?') + 'page=' + p;
    }

    return url;
  }

  function buildMenu() {
    return [
      { title: 'Поиск моделей', search_on: true, playlist_url: NAME + '/search/' },
      {
        title:        'Категории',
        playlist_url: 'submenu',
        submenu:      CATS.map(function (c) {
          return { title: c.title, playlist_url: NAME + '/cat/' + c.val };
        }),
      },
    ];
  }

  // ----------------------------------------------------------
  // Роутинг
  // ----------------------------------------------------------
  function routeView(url, page, success, error) {
    var cat = null;

    var searchMatch = url.match(/[?&]search=([^&]*)/);
    if (searchMatch) {
      // Поиск: BongaCams не имеет отдельного поиска моделей через GET
      // Используем главную страницу — поиск не поддерживается
      cat = null;
    } else if (url.indexOf(NAME + '/cat/') === 0) {
      cat = url.replace(NAME + '/cat/', '').split('?')[0];
    }

    var fetchUrl = buildUrl(cat, page);
    console.log('[BCMS] routeView →', fetchUrl);

    httpGet(fetchUrl, function (html) {
      parseCards(html, function (cards) {
        success({
          results:     cards,
          collection:  true,
          total_pages: cards.length >= 20 ? page + 1 : page,
          menu:        buildMenu(),
        });
      }, error);
    }, error);
  }

  // ----------------------------------------------------------
  // Публичный интерфейс
  // ----------------------------------------------------------
  var BcmsParser = {

    main: function (params, success, error) {
      routeView(NAME, 1, success, error);
    },

    view: function (params, success, error) {
      routeView(params.url || NAME, params.page || 1, success, error);
    },

    search: function (params, success, error) {
      // BongaCams поиск: GET /female?q=name или просто главная
      var query    = (params.query || '').trim();
      var fetchUrl = query
        ? HOST + '/female?q=' + encodeURIComponent(query)
        : HOST + '/';

      httpGet(fetchUrl, function (html) {
        parseCards(html, function (cards) {
          success({
            title:       'BC: ' + query,
            results:     cards,
            collection:  true,
            total_pages: 1,
          });
        }, error);
      }, error);
    },
  };

  // ----------------------------------------------------------
  // Регистрация
  // ----------------------------------------------------------
  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, BcmsParser);
      console.log('[BCMS] v2.2.0 зарегистрирован');
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
