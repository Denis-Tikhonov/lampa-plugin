// =============================================================
// phub.js — Парсер PornHub для AdultJS
// Version  : 1.0.0
// Changed  : [1.0.0] Первая версия: категории + поиск, без авторизации
//            [1.0.0] Парсинг HTML на клиенте через DOMParser
//            [1.0.0] Регистрация через window.AdultPlugin.registerParser
// =============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // [1.0.0] КОНФИГУРАЦИЯ
  // ----------------------------------------------------------
  var CONFIG = {
    // Базовый URL сайта
    base_url:   'https://www.pornhub.com',
    // URL страницы поиска (?search=... будет добавлен парсером)
    search_url: 'https://www.pornhub.com/video/search',
    // Параметр пагинации
    page_param: 'page',
    // CSS-селекторы (по структуре из анализа HTML)
    sel: {
      item:      'li.pcVideoListItem',
      title:     'a.thumbnailTitle, .title a',
      thumb:     'img.js-videoThumb, img.thumb',
      preview:   'img[data-mediabook]',
      href:      'a.linkVideoThumb, a.js-linkVideoThumb',
      duration:  'var.duration',
      views:     '.views var',
      added:     'var.added',
      // Категории
      cat_item:  '.categoriesWrap a, .wrap a[href*="/categories/"]',
    },
    // Категории — статичный список, чтобы не парсить лишнюю страницу
    categories: [
      { title: 'Главная',      url: 'https://www.pornhub.com/recommended' },
      { title: 'Новинки',      url: 'https://www.pornhub.com/video?o=newest' },
      { title: 'Популярное',   url: 'https://www.pornhub.com/video?o=mv' },
      { title: 'Топ недели',   url: 'https://www.pornhub.com/video?o=tr&t=w' },
      { title: 'Топ месяца',   url: 'https://www.pornhub.com/video?o=tr&t=m' },
      { title: 'Лучшее',       url: 'https://www.pornhub.com/video?o=tr&t=a' },
      { title: 'Русские',      url: 'https://www.pornhub.com/video?c=36' },
      { title: 'Азиатки',      url: 'https://www.pornhub.com/video?c=1'  },
      { title: 'Анал',         url: 'https://www.pornhub.com/video?c=2'  },
      { title: 'Оральный',     url: 'https://www.pornhub.com/video?c=70' },
      { title: 'Лесбиянки',    url: 'https://www.pornhub.com/video?c=14' },
      { title: 'Студентки',    url: 'https://www.pornhub.com/video?c=7'  },
      { title: 'Массаж',       url: 'https://www.pornhub.com/video?c=55' },
      { title: 'Зрелые',       url: 'https://www.pornhub.com/video?c=44' },
    ],
  };

  // ----------------------------------------------------------
  // [1.0.0] ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // ----------------------------------------------------------

  // Получить значение атрибута или текст по нескольким возможным селекторам
  function queryAttr(root, selectors, attr) {
    var sels = selectors.split(',');
    for (var i = 0; i < sels.length; i++) {
      var el = root.querySelector(sels[i].trim());
      if (el) return attr ? (el.getAttribute(attr) || '') : (el.textContent || el.innerText || '');
    }
    return '';
  }

  // [1.0.0] Формирование URL с пагинацией
  function buildPageUrl(baseUrl, page) {
    if (!page || page <= 1) return baseUrl;
    var sep = baseUrl.indexOf('?') !== -1 ? '&' : '?';
    return baseUrl + sep + CONFIG.page_param + '=' + page;
  }

  // [1.0.0] Парсинг одного <li> элемента карточки
  function parseItem(li) {
    var titleEl = li.querySelector(CONFIG.sel.title);
    var thumbEl = li.querySelector(CONFIG.sel.thumb);
    var hrefEl  = li.querySelector(CONFIG.sel.href);

    if (!titleEl || !hrefEl) return null;

    var name    = (titleEl.getAttribute('title') || titleEl.textContent || '').trim();
    var href    = hrefEl.getAttribute('href') || '';
    var picture = '';
    var preview = '';

    if (thumbEl) {
      // [1.0.0] Предпочитаем data-mediumthumb → src
      picture = thumbEl.getAttribute('data-mediumthumb') ||
                thumbEl.getAttribute('src') || '';
      // Видео-превью из data-mediabook
      preview = thumbEl.getAttribute('data-mediabook') || '';
    }

    var duration = '';
    var durEl = li.querySelector(CONFIG.sel.duration);
    if (durEl) duration = durEl.textContent.trim();

    var views = '';
    var viewEl = li.querySelector(CONFIG.sel.views);
    if (viewEl) views = viewEl.textContent.trim();

    var added = '';
    var addedEl = li.querySelector(CONFIG.sel.added);
    if (addedEl) added = addedEl.textContent.trim();

    // Полный URL видео
    var videoUrl = href.indexOf('http') === 0 ? href : CONFIG.base_url + href;

    return {
      name:    name,
      picture: picture,
      preview: preview,
      video:   videoUrl,   // [1.0.0] ссылка на страницу видео (не прямой .mp4)
      quality: duration,   // отображается как качество в Lampa
      time:    duration,
      source:  'phub',
      views:   views,
      added:   added,
    };
  }

  // [1.0.0] Парсинг всей HTML-страницы → массив карточек
  function parsePage(html) {
    var parser = new DOMParser();
    var doc    = parser.parseFromString(html, 'text/html');
    var items  = [];

    var lis = doc.querySelectorAll(CONFIG.sel.item);
    lis.forEach(function (li) {
      var card = parseItem(li);
      if (card && card.name && card.video) items.push(card);
    });

    return items;
  }

  // [1.0.0] Определить есть ли следующая страница
  function hasNextPage(html, currentPage) {
    var parser = new DOMParser();
    var doc    = parser.parseFromString(html, 'text/html');
    // Ищем кнопку "Следующая" или пагинацию
    var nextBtn = doc.querySelector('.page_next:not(.disabled), a[data-page="' + (currentPage + 1) + '"]');
    return !!nextBtn;
  }

  // ----------------------------------------------------------
  // [1.0.0] ЗАГРУЗКА HTML ЧЕРЕЗ FETCH
  // Внимание: phub может блокировать запросы без User-Agent.
  // На Android TV Lampa использует нативный WebView, CORS обычно
  // не применяется. Если сайт заблокирует — нужен CORS-прокси.
  // ----------------------------------------------------------
  function fetchPage(url, success, error) {
    try {
      // [1.0.0] Пробуем через Lampa.Reguest (нативный запрос на Android)
      var net = new Lampa.Reguest();
      net.silent(url, function (data) {
        // data может быть строкой (HTML) или объектом
        if (typeof data === 'string') success(data);
        else error('Unexpected response type');
      }, function (e) {
        // [1.0.0] Fallback: обычный fetch
        fetch(url, {
          headers: {
            'Accept': 'text/html,application/xhtml+xml',
          },
        })
        .then(function (r) { return r.text(); })
        .then(success)
        .catch(error);
      }, false, { dataType: 'text' });
    } catch (e) {
      error(e);
    }
  }

  // ----------------------------------------------------------
  // [1.0.0] ПУБЛИЧНЫЙ ИНТЕРФЕЙС ПАРСЕРА
  // ----------------------------------------------------------
  var PhubParser = {

    // [1.0.0] Главная — загружаем первую категорию «Рекомендованное»
    main: function (params, success, error) {
      var url = CONFIG.categories[0].url;
      fetchPage(url, function (html) {
        var results = parsePage(html);
        if (!results.length) { error(); return; }
        success({
          results:     results,
          collection:  true,
          total_pages: 30,
          menu:        PhubParser._buildMenu(url),
        });
      }, error);
    },

    // [1.0.0] Просмотр категории / страницы
    view: function (params, success, error) {
      // params.url — URL категории, может содержать ?pg=N от Lampa
      var url  = (params.url || CONFIG.categories[0].url).split('&pg=')[0].split('?pg=')[0];
      var page = parseInt(params.page) || 1;
      var loadUrl = buildPageUrl(url, page);

      fetchPage(loadUrl, function (html) {
        var results = parsePage(html);
        if (!results.length) { error(); return; }
        success({
          results:     results,
          collection:  true,
          total_pages: hasNextPage(html, page) ? page + 10 : page,
          menu:        PhubParser._buildMenu(url),
        });
      }, error);
    },

    // [1.0.0] Поиск
    search: function (params, success, error) {
      var query = encodeURIComponent(params.query || '');
      var page  = parseInt(params.page) || 1;
      var url   = CONFIG.search_url + '?search=' + query;
      var loadUrl = buildPageUrl(url, page);

      fetchPage(loadUrl, function (html) {
        var results = parsePage(html);
        if (!results.length) { error(); return; }
        success({
          title:       'phub: ' + params.query,
          results:     results,
          url:         url,
          collection:  true,
          total_pages: hasNextPage(html, page) ? page + 10 : page,
        });
      }, error);
    },

    // [1.0.0] Построить меню фильтра из категорий CONFIG
    _buildMenu: function (activeUrl) {
      return CONFIG.categories.map(function (cat) {
        return {
          title:        cat.title,
          playlist_url: cat.url,
          selected:     cat.url === activeUrl,
        };
      });
    },
  };

  // ----------------------------------------------------------
  // [1.0.0] РЕГИСТРАЦИЯ В AdultPlugin
  // ----------------------------------------------------------
  if (window.AdultPlugin && window.AdultPlugin.registerParser) {
    window.AdultPlugin.registerParser('phub', PhubParser);
  } else {
    // [1.0.0] Если AdultJS ещё не загружен — ждём
    var waitInterval = setInterval(function () {
      if (window.AdultPlugin && window.AdultPlugin.registerParser) {
        window.AdultPlugin.registerParser('phub', PhubParser);
        clearInterval(waitInterval);
      }
    }, 100);
  }

})();

