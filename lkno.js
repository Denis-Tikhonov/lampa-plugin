// =============================================================
// lkno.js — Парсер Lenkino для AdultJS / AdultPlugin (Lampa)
// Version  : 1.1.0
// Changed  : [1.0.0] Исходный вариант (lkno.js загруженный)
//            [1.1.0] FIX: net.ajax() не существует в Lampa.Reguest.
//                    Правильный метод: net.silent() с {dataType:'text'}.
//            [1.1.0] FIX: $(html) для парсинга — вызывает загрузку img/
//                    script в WebView → подвешивает UI на Android TV.
//                    Заменён на DOMParser (безопасный, без сетевых запросов).
//            [1.1.0] FIX: host 'https://lenkino.guru' — устаревший домен.
//                    Актуальный: 'https://wes.lenkino.adult'
//                    (из AdultJS_debug_v1.3.2 [BLOCK:13] конфиг Lenkino).
//            [1.1.0] FIX: CSS-класс '.movie-item' не соответствует
//                    реальной HTML-структуре. По данным AdultJS_debug:
//                    contentParse.nodes = "//div[@class='item']".
//                    Используем div.item + XPath через DOMParser.
//            [1.1.0] FIX: регистрация добавила polling.
//            [1.1.0] FIX: добавлен fetchHtml с правильным fallback.
// =============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // [1.1.0] КОНФИГУРАЦИЯ
  // БАГ v1.0.0: устаревший домен lenkino.guru
  // ИСПРАВЛЕНИЕ: wes.lenkino.adult (из AdultJS_debug [BLOCK:13])
  // ----------------------------------------------------------
  var HOST = 'https://wes.lenkino.adult';
  var NAME = 'lkno';

  var CATEGORIES = [
    { title: 'Новое',          url: HOST + '/page/{page}'              },
    { title: 'Лучшие',         url: HOST + '/top-porno/page/{page}'    },
    { title: 'Горячие',        url: HOST + '/hot-porno/page/{page}'    },
    { title: 'Русское порно',  url: HOST + '/a1-russian/page/{page}'   },
    { title: 'Порно зрелых',   url: HOST + '/milf-porn/page/{page}'    },
    { title: 'Анал',           url: HOST + '/anal-porno/page/{page}'   },
    { title: 'Большие сиськи', url: HOST + '/big-tits/page/{page}'     },
    { title: 'Лесби',          url: HOST + '/lesbi-porno/page/{page}'  },
    { title: 'Минет',          url: HOST + '/blowjob/page/{page}'      },
    { title: 'Хардкор',        url: HOST + '/hardcore/page/{page}'     },
  ];

  // ----------------------------------------------------------
  // [1.1.0] HTTP-ХЕЛПЕР
  //
  // БАГ v1.0.0: net.ajax() — метода нет в Lampa.Reguest.
  // ИСПРАВЛЕНИЕ: net.silent() с { dataType:'text' }.
  // ----------------------------------------------------------
  function fetchHtml(url, success, error) {
    try {
      var net = new Lampa.Reguest();
      net.silent(
        url,
        function (data) {
          if (typeof data === 'string' && data.length > 50) {
            success(data);
          } else {
            _fetchFallback(url, success, error);
          }
        },
        function () { _fetchFallback(url, success, error); },
        false,
        { dataType: 'text', timeout: 10000 }
      );
    } catch (e) {
      _fetchFallback(url, success, error);
    }
  }

  function _fetchFallback(url, success, error) {
    if (typeof fetch === 'undefined') { error('fetch unavailable'); return; }
    fetch(url, { method: 'GET' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(success)
      .catch(error);
  }

  // ----------------------------------------------------------
  // [1.1.0] ПОСТРОЕНИЕ URL С ПАГИНАЦИЕЙ
  // Lenkino использует /page/{N}/ в шаблоне URL
  // ----------------------------------------------------------
  function buildUrl(template, page) {
    return template.replace('{page}', page || 1);
  }

  function getBaseTemplate(url) {
    // Убираем страницу из текущего URL если есть
    return url.replace(/\/page\/\d+\/?$/, '') + '/page/{page}';
  }

  // ----------------------------------------------------------
  // [1.1.0] ПАРСЕР КАРТОЧЕК
  //
  // БАГ v1.0.0: $(html) — jQuery парсит HTML и загружает все ресурсы.
  //   На Android TV это подвешивает UI.
  // ИСПРАВЛЕНИЕ: DOMParser — безопасный парсинг без сетевых запросов.
  //
  // БАГ v1.0.0: '.movie-item' — неверный CSS-класс.
  // ИСПРАВЛЕНИЕ: 'div.item' (из AdultJS_debug contentParse.nodes).
  //
  // Структура карточки Lenkino (div.item):
  //   .itm-tit a    → название + ссылка
  //   img.lzy       → data-srcset (картинка) + data-preview (превью)
  //   .itm-dur      → длительность
  //   .itm-opt-mdl  → ссылка на модель
  // ----------------------------------------------------------
  function parsePlaylist(html) {
    var doc   = new DOMParser().parseFromString(html, 'text/html');
    var items = [];

    doc.querySelectorAll('div.item').forEach(function (el) {
      // Заголовок и ссылка
      var linkEl = el.querySelector('.itm-tit a, .item-title a, a.preview_link');
      if (!linkEl) return;

      var name = (linkEl.getAttribute('title') || linkEl.textContent || '').trim();
      var href = linkEl.getAttribute('href') || '';
      if (!name || !href) return;

      // Полный URL
      var videoUrl = href.indexOf('http') === 0 ? href : HOST + href;

      // Картинка: data-srcset или data-src или src
      var imgEl   = el.querySelector('img.lzy, img[data-srcset], img[data-src], img');
      var picture = '';
      var preview = '';
      if (imgEl) {
        picture = imgEl.getAttribute('data-srcset') ||
                  imgEl.getAttribute('data-src')    ||
                  imgEl.getAttribute('src')         || '';
        preview = imgEl.getAttribute('data-preview') || '';
        if (picture && picture.indexOf('http') !== 0) picture = HOST + picture;
        if (preview && preview.indexOf('http') !== 0) preview = HOST + preview;
      }

      // Длительность
      var durEl    = el.querySelector('.itm-dur, .itm-dur.fnt-cs, .item-duration, .duration');
      var duration = durEl ? durEl.textContent.trim() : '';

      // Качество
      var qualEl   = el.querySelector('.itm-hd, .hd-mark, .quality');
      var quality  = qualEl ? qualEl.textContent.trim() : 'HD';

      items.push({
        name:    name,
        video:   videoUrl,  // страница видео; json:true → нужен второй запрос
        picture: picture,
        preview: preview,
        time:    duration,
        quality: quality,
        json:    true,      // нужен переход на страницу для извлечения плеера
        related: true,
        model:   null,
        source:  NAME,
      });
    });

    return items;
  }

  // ----------------------------------------------------------
  // [1.1.0] ПОСТРОЕНИЕ МЕНЮ ФИЛЬТРА
  // ----------------------------------------------------------
  function buildMenu(currentUrl) {
    var items = CATEGORIES.map(function (cat) {
      return {
        title:        cat.title,
        playlist_url: buildUrl(cat.url, 1),
        selected:     currentUrl && currentUrl.indexOf(cat.url.replace('/page/{page}', '')) !== -1,
      };
    });

    // Добавляем поиск
    items.unshift({
      title:        'Поиск',
      playlist_url: HOST + '/index.php?do=search&subaction=search&story=',
      search_on:    true,
    });

    return items;
  }

  // ----------------------------------------------------------
  // [1.0.0] ПУБЛИЧНЫЙ ИНТЕРФЕЙС
  // ----------------------------------------------------------
  var LknoParser = {

    main: function (params, success, error) {
      var url = buildUrl(CATEGORIES[0].url, 1);
      fetchHtml(url, function (html) {
        var results = parsePlaylist(html);
        if (!results.length) { error('Lenkino: нет карточек'); return; }
        success({ results: results, collection: true, total_pages: 50, menu: buildMenu(url) });
      }, error);
    },

    view: function (params, success, error) {
      var page    = parseInt(params.page, 10) || 1;
      var rawUrl  = params.url || buildUrl(CATEGORIES[0].url, 1);
      // Нормализуем: убираем pg= от Lampa, строим правильный URL с /page/N/
      var baseUrl = rawUrl.replace(/\/page\/\d+\/?/, '').replace(/[?&]pg=\d+/, '');
      var loadUrl = baseUrl.replace(/\/$/, '') + '/page/' + page + '/';

      fetchHtml(loadUrl, function (html) {
        var results = parsePlaylist(html);
        if (!results.length) { error('Lenkino: нет карточек на стр. ' + page); return; }
        success({
          results:     results,
          collection:  true,
          total_pages: results.length > 0 ? page + 10 : page,
          menu:        buildMenu(rawUrl),
        });
      }, error);
    },

    search: function (params, success, error) {
      var url = HOST + '/index.php?do=search&subaction=search&story='
              + encodeURIComponent(params.query || '');
      fetchHtml(url, function (html) {
        var results = parsePlaylist(html);
        if (!results.length) { error('Lenkino: ничего не найдено'); return; }
        success({
          title:       'Lenkino: ' + params.query,
          results:     results,
          url:         url,
          collection:  true,
          total_pages: 10,
        });
      }, error);
    },
  };

  // ----------------------------------------------------------
  // [1.1.0] РЕГИСТРАЦИЯ с polling
  // ----------------------------------------------------------
  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, LknoParser);
      console.log('[lkno] v1.1.0 registered OK');
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
