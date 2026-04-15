// =============================================================
// z777.js — Парсер Zoo-XVideos для AdultJS / AdultPlugin (Lampa)
// Version  : 1.0.0
// Architecture: Based on XDS (routing) & YouJizz (DOM parsing)
// =============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // КОНФИГ
  // ----------------------------------------------------------
  var NAME = 'z777';
  var HOST = 'https://zoo-xvideos.com';

  // Куки для обхода Age Gate (из arch.txt)
  var HEADERS = {
    'Cookie': 'disclaimer=</span>'
  };

  // ----------------------------------------------------------
  // HTTP ЗАПРОСЫ (с поддержкой Age Gate)
  // ----------------------------------------------------------
  function httpGet(url, success, error) {
    // Приоритет: встроенный networkRequest плагина (он сам проксирует)
    if (window.AdultPlugin &&
        typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, success, error, HEADERS);
    } else {
      // Фоллбэк на fetch, если плагин недоступен (требуется прокси из-за CORS)
      if (typeof fetch === 'undefined') { error('fetch unavailable'); return; }
      
      // Примечание: в реальном окружении Lampa AdultPlugin сеть работает через своего клиента.
      // Здесь просто эмуляция.
      fetch(url, {
        method: 'GET',
        headers: HEADERS
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
  // ПАРСИНГ КАРТОЧЕК (DOMParser)
  // Селекторы из arch.txt / json.txt
  // ----------------------------------------------------------
  function parseCards(html) {
    if (!html) return [];
    var doc   = new DOMParser().parseFromString(html, 'text/html');
    var items = doc.querySelectorAll('.thumb'); // Основной селектор
    var cards = [];

    for (var i = 0; i < items.length; i++) {
      var card = _parseCard(items[i]);
      if (card) cards.push(card);
    }
    return cards;
  }

  function _parseCard(el) {
    // 1. Ссылка
    var aEl = el.querySelector('a');
    if (!aEl) return null;
    var href = aEl.getAttribute('href') || '';
    if (href && href.indexOf('http') !== 0) href = HOST + href;

    // 2. Название
    // Приоритет: a[title] -> img[alt] -> текст внутри
    var name = aEl.getAttribute('title') || '';
    if (!name) {
      var imgEl = el.querySelector('img');
      if (imgEl) name = imgEl.getAttribute('alt') || '';
    }
    name = name.trim();
    if (!name) return null;

    // 3. Постер (Картинка)
    var imgEl = el.querySelector('img');
    var picture = '';
    if (imgEl) {
      picture = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || '';
      if (picture && picture.indexOf('//') === 0) picture = 'https:' + picture;
    }

    // 4. Длительность
    var time = '';
    var spanEl = el.querySelector('span'); // В анализе указано .thumb span
    if (spanEl) {
      var t = spanEl.textContent.trim();
      // Простая валидация формата времени (цифры и двоеточие)
      if (/[\d:]+/.test(t)) time = t;
    }

    // ----------------------------------------------------------
    // ФОРМИРОВАНИЕ ОБЪЕКТА КАРТОЧКИ
    // Добавляем поля img, poster, background_image (требование 2)
    // ----------------------------------------------------------
    return {
      name:             name,
      video:            href, // Ссылка на страницу видео
      picture:          picture,
      img:              picture,         // ← Требование AdultJS
      poster:           picture,         // ← Требование AdultJS
      background_image: picture,         // ← Требование AdultJS
      preview:          picture,         // Превью (обычно клип, здесь статика)
      time:             time,
      quality:          '',              // На сайте не обозначено явно
      json:             true,            // Требуем перехода на страницу для получения ссылки
      related:          true,
      model:            null,
      source:           NAME
    };
  }

  // ----------------------------------------------------------
  // ПОЛУЧЕНИЕ ПРЯМОЙ ССЫЛКИ НА ВИДЕО
  // Метод: video_tag (src из <video>)
  // ----------------------------------------------------------
  function getVideoLinks(videoPageUrl, success, error) {
    httpGet(videoPageUrl, function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var vid = doc.querySelector('video');
      
      if (vid && vid.src) {
        var src = vid.src;
        if (src.indexOf('//') === 0) src = 'https:' + src;
        success({ 'auto': src });
      } else {
        // Попытка найти source внутри video
        var source = doc.querySelector('video source');
        if (source && source.src) {
           var src2 = source.src;
           if (src2.indexOf('//') === 0) src2 = 'https:' + src2;
           success({ 'auto': src2 });
        } else {
          error('Не найден тег <video> на странице');
        }
      }
    }, error);
  }

  // ----------------------------------------------------------
  // МЕНЮ
  // ----------------------------------------------------------
  function buildMenu() {
    return [
      {
        title:        '🔍 Поиск',
        search_on:    true,             // Активирует кнопку фильтра в Lampa
        playlist_url: NAME + '/search/' // Шаблон для роутера
      },
      {
        title:        '🔥 Топ видео',
        playlist_url: NAME + '/top'
      },
      {
        title:        '🆕 Новинки',
        playlist_url: NAME + '/new'
      }
    ];
  }

  // ----------------------------------------------------------
  // ПОСТРОЕНИЕ URL
  // Согласно arch.txt: pagination &page={N}, search ?q=...
  // ----------------------------------------------------------
  function buildUrl(type, query, page) {
    page = page || 1;
    var url = HOST + '/';

    if (type === 'search' && query) {
      url += '?q=' + encodeURIComponent(query);
    } else if (type === 'new') {
      // Новинки обычно без параметров или /new/
      url += '?sort=new'; // Примерная логика, если есть сортировка
    }
    // top или просто main оставляем корень или ?page=

    if (page > 1) {
      var separator = url.indexOf('?') !== -1 ? '&' : '?';
      url += separator + 'page=' + page;
    }

    return url;
  }

  // ----------------------------------------------------------
  // РОУТЕР (Smart Routing)
  // Логика из xds_1.1.0: разбор ?search= и путей
  // ----------------------------------------------------------
  function parseSearchParam(url) {
    var match = url.match(/[?&]search=([^&]*)/);
    if (match) return decodeURIComponent(match[1]);
    return null;
  }

  function routeView(url, page, success, error) {
    console.log('[z777] routeView → "' + url + '" page=' + page);

    var PREFIX = NAME + '/';

    // 1. Поиск через фильтр Lampa: z777/search/?search=query
    var searchParam = parseSearchParam(url);
    if (searchParam !== null) {
      fetchPage(buildUrl('search', searchParam, page), page, success, error);
      return;
    }

    // 2. Прямой путь: z777/search/query
    if (url.indexOf(PREFIX + 'search/') === 0) {
      var rawQuery = url.replace(PREFIX + 'search/', '').split('?')[0];
      var query    = decodeURIComponent(rawQuery).trim();
      fetchPage(buildUrl('search', query, page), page, success, error);
      return;
    }

    // 3. Разделы: /top, /new
    if (url.indexOf(PREFIX + 'top') === 0) {
      fetchPage(HOST + '/?page=' + page, page, success, error); // Топ обычно корень
      return;
    }
    
    if (url.indexOf(PREFIX + 'new') === 0) {
      fetchPage(HOST + '/?sort=date&page=' + page, page, success, error); // Предполагаемый параметр
      return;
    }

    // 4. Default
    fetchPage(HOST + '/?page=' + page, page, success, error);
  }

  // ----------------------------------------------------------
  // ЗАГРУЗКА СТРАНИЦЫ
  // ----------------------------------------------------------
  function fetchPage(loadUrl, page, success, error) {
    console.log('[z777] fetchPage → ' + loadUrl);
    httpGet(loadUrl, function (html) {
      var results = parseCards(html);
      if (!results.length) {
        // Пустой результат - это не всегда ошибка, но для парсера предупреждение
        console.warn('[z777] Нет карточек на странице, возможно конец или блокировка');
      }

      success({
        results:     results,
        collection:  true,
        total_pages: results.length >= 20 ? page + 5 : page, // Простая пагинация
        menu:        buildMenu()
      });
    }, error);
  }

  // ----------------------------------------------------------
  // ПУБЛИЧНЫЙ ИНТЕРФЕЙС ПАРСЕРА
  // ----------------------------------------------------------
  var Z777Parser = {

    main: function (params, success, error) {
      // Стартовая страница
      fetchPage(HOST + '/?page=1', 1, success, error);
    },

    view: function (params, success, error) {
      var page = parseInt(params.page, 10) || 1;
      var url  = params.url || (NAME + '/top');
      
      // Делегируем роутеру
      routeView(url, page, success, error);
    },

    search: function (params, success, error) {
      var query = (params.query || '').trim();
      var page  = parseInt(params.page, 10) || 1;

      if (!query) {
        success({ title: '', results: [], collection: true, total_pages: 1 });
        return;
      }

      fetchPage(buildUrl('search', query, page), page, function (data) {
        data.title = 'ZooXVideos: ' + query;
        data.url   = NAME + '/search/' + encodeURIComponent(query);
        success(data);
      }, error);
    },

    qualities: function (videoUrl, success, error) {
      getVideoLinks(videoUrl, success, error);
    }
  };

  // ----------------------------------------------------------
  // РЕГИСТРАЦИЯ В СИСТЕМЕ
  // ----------------------------------------------------------
  function tryRegister() {
    if (window.AdultPlugin &&
        typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, Z777Parser);
      console.log('[z777] v1.0.0 зарегистрирован');
      
      // Уведомление (опционально, как в примерах)
      try {
        setTimeout(function () {
          Lampa.Noty.show('Z777 [zoo-xvideos] подключён', { time: 2500 });
        }, 600);
      } catch (e) {}
      
      return true;
    }
    return false;
  }

  // Поллинг готовности API
  if (!tryRegister()) {
    var _elapsed = 0;
    var _poll = setInterval(function () {
      _elapsed += 100;
      if (tryRegister() || _elapsed >= 10000) clearInterval(_poll);
    }, 100);
  }

})();