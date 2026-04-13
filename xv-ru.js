// =============================================================
// xv-ru.js — Парсер xv-ru.com для AdultJS / AdultPlugin (Lampa)
// Version  : 2.0.2
// Changes  :
//   [2.0.2] Исправлены Категории (внедрен список из JSON)
//           Исправлены Названия (генерация из URL slug, т.к. title в HTML отсутствует)
//           Добавлен Cookie: disclaimer=1
// =============================================================

(function () {
  'use strict';

  var HOST      = 'https://www.xv-ru.com';
  var NAME      = 'xv-ru';
  var TAG       = '[xv-ru]';
  var VERSION   = '2.0.2';
  var NOTY_TIME = 3000;

  var WORKER_DEFAULT = 'https://zonaproxy.777b737.workers.dev/?url=';

  // Обновленные заголовки с Age Gate (из JSON)
  var REQUEST_HEADERS = {
    'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Cookie':          'disclaimer=1; static_cdn=1', // <--- Добавлено disclaimer=1
    'Referer':         HOST + '/',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  var SORTS = [
    { title: 'Новинки',    val: 'new',  urlPath: 'new',          searchParam: ''     },
    { title: 'Лучшее',     val: 'best', urlPath: 'best-videos',  searchParam: '&top' },
    { title: 'Популярные', val: 'top',  urlPath: 'most-viewed',  searchParam: '&top' },
    { title: 'Длительные', val: 'long', urlPath: 'longest',      searchParam: ''     },
  ];

  // ----------------------------------------------------------
  // СПИСОК КАТЕГОРИЙ (Из JSON navigation.categories.merged)
  // ----------------------------------------------------------
  var CATEGORIES = [
    { title: 'Азиат',         slug: 'Asian_Woman-32' },
    { title: 'Анал',          slug: 'Anal-12' },
    { title: 'Арабки',        slug: 'Arab-159' },
    { title: 'Бисексуалы',    slug: 'Bi_Sexual-62' },
    { title: 'Блондинки',     slug: 'Blonde-20' },
    { title: 'Большие Попы',  slug: 'Big_Ass-24' },
    { title: 'Большие Сиськи',slug: 'Big_Tits-23' },
    { title: 'Большие яйца',  slug: 'Big_Cock-34' },
    { title: 'Брюнетки',      slug: 'Brunette-25' },
    { title: 'В масле',       slug: 'Oiled-22' },
    { title: 'Веб камеры порно', slug: 'Cam_Porn-58' },
    { title: 'Гэнгбэнг',      slug: 'Gangbang-69' },
    { title: 'Зияющие отверстия', slug: 'Gapes-167' },
    { title: 'Зрелые',        slug: 'Mature-38' },
    { title: 'ИИ',            slug: 'AI-239' },
    { title: 'Индийский',     slug: 'Indian-89' },
    { title: 'Испорченная семья', slug: 'Fucked_Up_Family-81' },
    { title: 'Кончает внутрь', slug: 'Creampie-40' },
    { title: 'Куколд / Горячая Жена', slug: 'Cuckold-237' },
    { title: 'Латинки',       slug: 'Latina-16' },
    { title: 'Лесбиянки',     slug: 'Lesbian-26' },
    { title: 'Любительское порно', slug: 'Amateur-65' },
    { title: 'Мамочки. МИЛФ', slug: 'Milf-19' },
    { title: 'Межрассовые',   slug: 'Interracial-27' },
    { title: 'Минет',         slug: 'Blowjob-15' },
    { title: 'Нижнее бельё',  slug: 'Lingerie-83' },
    { title: 'Попки',         slug: 'Ass-14' },
    { title: 'Рыжие',         slug: 'Redhead-31' },
    { title: 'Сквиртинг',     slug: 'Squirting-56' },
    { title: 'Соло',          slug: 'Solo_and_Masturbation-33' },
    { title: 'Сперма',        slug: 'Cumshot-18' },
    { title: 'Тинейджеры',    slug: 'Teen-13' },
    { title: 'Фемдом',        slug: 'Femdom-235' },
    { title: 'Фистинг',       slug: 'Fisting-165' },
    { title: 'Черные Женщины',slug: 'bbw-51' },
    { title: 'Черный',        slug: 'Black_Woman-30' },
    { title: 'Чулки,колготки',slug: 'Stockings-28' },
    { title: 'ASMR',          slug: 'ASMR-229' }
  ];

  function getWorkerUrl() {
    var url = (window.AdultPlugin && window.AdultPlugin.workerUrl) ? window.AdultPlugin.workerUrl : WORKER_DEFAULT;
    if (url && url.charAt(url.length - 1) !== '=') url = url + '=';
    return url;
  }

  function log(m, d)  { console.log(TAG, m, d !== undefined ? d : ''); }
  function warn(m, d) { console.warn(TAG, m, d !== undefined ? d : ''); }
  function err(m, d)  { console.error(TAG, m, d !== undefined ? d : ''); }

  function notyErr(msg) { try { Lampa.Noty.show(TAG + ' ⛔ ' + msg, { time: NOTY_TIME, style: 'error' }); } catch(e) {} }
  function notyOk(msg) { try { Lampa.Noty.show(TAG + ' ✅ ' + msg, { time: NOTY_TIME }); } catch(e) {} }

  // ----------------------------------------------------------
  // СЕТЕВОЙ СЛОЙ
  // ----------------------------------------------------------
  function httpGet(url, ok, fail) {
    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, ok, fail, { type: 'html', headers: REQUEST_HEADERS });
      return;
    }
    var workerUrl = getWorkerUrl();
    var fullUrl = workerUrl + encodeURIComponent(url);
    
    fetch(fullUrl, { method: 'GET', headers: REQUEST_HEADERS })
      .then(function (r) { return r.text(); })
      .then(ok)
      .catch(fail);
  }

  // ----------------------------------------------------------
  // УТИЛИТЫ
  // ----------------------------------------------------------
  // Генерация названия из slug, т.к. в HTML title отсутствует (по JSON)
  function getTitleFromUrl(url) {
    if (!url) return '';
    // Берем последнюю часть URL
    var parts = url.split('/').filter(function(p){ return p && p.length > 0; });
    var lastPart = parts[parts.length - 1] || '';
    // Убираем параметры запроса если есть
    lastPart = lastPart.split('?')[0];
    // Заменяем подчеркивания на пробелы и делаем первую букву заглавной
    if (!lastPart) return "Video";
    
    return lastPart.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });
  }

  // ----------------------------------------------------------
  // РОУТИНГ И ПАРСИНГ
  // ----------------------------------------------------------
  function parseSearchParam(url) {
    // JSON показывает параметр "k"
    var match = url.match(/[?&](search|k)=([^&]*)/);
    if (match) return decodeURIComponent(match[2].replace(/\+/g, ' '));
    return null;
  }

  function routeView(url, page, success, error) {
    log('routeView → url="' + url + '" page=' + page);

    // 1. Поиск через фильтр Lampa (?search=... или ?k=...)
    var searchParam = parseSearchParam(url);
    if (searchParam !== null) {
      fetchPage(buildUrl('top', searchParam, '', page), page, success, error);
      return;
    }

    // 2. Категории (xv-ru/c/...)
    if (url.indexOf(NAME + '/c/') !== -1) {
      var cat = url.split('/c/')[1].split('?')[0];
      fetchPage(buildUrl('', '', cat, page), page, success, error);
      return;
    }

    // 3. Сортировки (new, best, etc)
    for (var i = 0; i < SORTS.length; i++) {
        if (url.indexOf(SORTS[i].urlPath) !== -1 || url.indexOf(SORTS[i].val) !== -1) {
            fetchPage(buildUrl(SORTS[i].val, '', '', page), page, success, error);
            return;
        }
    }

    // По умолчанию
    fetchPage(buildUrl('new', '', '', page), page, success, error);
  }

  function buildUrl(sort, search, category, page) {
    page = parseInt(page, 10) || 1;
    if (search) {
      // Поиск использует ?k= (JSON)
      var offset = page > 1 ? '&p=' + (page - 1) : ''; // Обычно XVideos использует p для пагинации поиска
      var sortParam = (sort === 'top' || sort === 'best') ? '&top' : '';
      return HOST + '/?k=' + encodeURIComponent(search) + sortParam + offset;
    }
    if (category) return HOST + '/c/' + category + (page > 1 ? '/' + page : '');
    
    var sObj = SORTS.filter(function(s){ return s.val === sort; })[0] || SORTS[0];
    return HOST + '/' + sObj.urlPath + '/' + page;
  }

  function fetchPage(loadUrl, page, success, error) {
    httpGet(loadUrl, function (html) {
      var results = parsePlaylist(html);
      if (!results.length) { error('Ничего не найдено'); return; }
      success({
        results: results,
        collection: true,
        total_pages: results.length >= 20 ? page + 5 : page,
        menu: buildMenu(loadUrl)
      });
    }, error);
  }

  // ----------------------------------------------------------
  // ПАРСИНГ КАРТОЧЕК (ИСПРАВЛЕНО)
  // ----------------------------------------------------------
  function _extractCard(el) {
    var aEl = el.querySelector('a[href*="/video"]');
    if (!aEl) return null;
    
    var rawHref = aEl.getAttribute('href') || '';
    if (rawHref.indexOf('http') !== 0) rawHref = HOST + rawHref;
    var href = rawHref.replace(/\/THUMBNUM\//i, '/');

    // 1. Попытка взять название из атрибута (если вдруг есть)
    var name = (aEl.getAttribute('title') || '').trim();

    // 2. ИСПРАВЛЕНИЕ: Если нет названия, генерируем из URL (требование на основе JSON)
    if (!name) {
      name = getTitleFromUrl(href);
    }
    if (!name) name = "Video"; // Фоллбэк

    // 3. Картинка (data-src по JSON)
    var pic = "";
    var img = el.querySelector('img');
    if (img) {
        pic = img.getAttribute('data-src') || img.getAttribute('src') || "";
    }

    return {
      name: name,
      video: href,
      // Обязательные поля AdultJS
      picture: pic,
      img: pic,
      poster: pic,
      background_image: pic,
      time: (el.querySelector('.duration')?.textContent || '').trim(),
      quality: 'HD',
      json: true,
      related: true,
      source: NAME
    };
  }

  function parsePlaylist(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var items = doc.querySelectorAll('.thumb');
    var cards = [];
    for(var i=0; i<items.length; i++){
        var c = _extractCard(items[i]);
        if(c) cards.push(c);
    }
    return cards;
  }

  // ----------------------------------------------------------
  // МЕНЮ И КАТЕГОРИИ
  // ----------------------------------------------------------
  function getCategories() {
    // Возвращаем статический список из JSON вместо парсинга страницы
    return CATEGORIES.map(function(c) {
        return {
            title: c.title,
            val: c.slug,
            urlPath: 'c/' + c.slug
        };
    });
  }

  function buildMenu(url) {
    var cats = getCategories();
    return [
      { title: '🔍 Поиск', search_on: true, playlist_url: NAME + '/search/' },
      { title: '🔥 Сортировка', submenu: SORTS.map(function(s){ return {title: s.title, playlist_url: NAME + '/' + s.val}; }) },
      { title: '📂 Категории', submenu: cats.map(function(c){ return {title: c.title, playlist_url: NAME + '/' + c.urlPath}; }) }
    ];
  }

  // ----------------------------------------------------------
  // ИНТЕРФЕЙС ПАРСЕРА
  // ----------------------------------------------------------
  var XvParser = {
    main: function (params, success, error) {
      routeView(NAME + '/new', 1, success, error);
    },
    view: function (params, success, error) {
      routeView(params.url || NAME, params.page || 1, success, error);
    },
    search: function (params, success, error) {
      var q = (params.query || '').trim();
      if (!q) return success({results:[]});
      fetchPage(buildUrl('top', q, '', params.page || 1), params.page || 1, function(data){
          data.title = 'xv-ru: ' + q;
          success(data);
      }, error);
    },
    qualities: function (url, success, error) {
        httpGet(url, function(html){
            var q = {};
            // Стандартный паттерн для Xvideos клонов
            var mH = html.match(/html5player\.setVideoUrlHigh\(['"]([^'"]+)['"]\)/);
            var mL = html.match(/html5player\.setVideoUrlLow\(['"]([^'"]+)['"]\)/);
            if(mH) q['720p'] = mH[1];
            if(mL) q['480p'] = mL[1];
            
            // Паттерн HLS из JSON (hls-cdn77)
            if (!q['720p'] && !q['480p']) {
                 var mHls = html.match(/"(https?:\/\/hls[^"]+\.m3u8[^"]*)"/);
                 if (mHls) q['auto'] = mHls[1];
            }

            if(Object.keys(q).length) success({qualities: q});
            else error('Видео не найдено');
        }, error);
    }
  };

  function register() {
    if (window.AdultPlugin && window.AdultPlugin.registerParser) {
      window.AdultPlugin.registerParser(NAME, XvParser);
      notyOk('xv-ru v' + VERSION);
    } else {
      setTimeout(register, 500);
    }
  }
  register();

})();
