- Search URL: `/search/step-sister-1.html` (spaces to hyphens)
- Image: `data-original` attribute on `img.lazy`, protocol-relative URLs need `https:` prepended
- Preview: `data-clip` attribute on `a.frame.video`
- The parser was based on briz204 structure

I don't have the full previous context, so I need to piece together the complete parser file from these HTML patterns and the AdultJS framework conventions.

Looking at how other parsers like xds.js are structured, I need to build out the main methods that handle the homepage with horizontal bands, the catalog/category/search views, global search functionality, and individual video details. For YouJizz specifically, I'm working with the main domain structure and category pages, then search endpoints that convert spaces to hyphens in the URL.

Writing the parser structure... I'm structuring the complete parser with the key methods needed: config for the host and name, URL builders for search and catalog pages, a fetch function to retrieve and parse the HTML, and a card parser that extracts the video link, thumbnail image with proper URL formatting, and preview clip data. Writing the parser code... Still writing parser... Setting up the request handler to parse the response and extract video items from the DOM using multiple selector strategies, then falling back to alternative selectors if the initial ones don't find anything. I should prioritize the `data-original` attribute for image URLs since that's where the actual poster is stored, rather than filtering out spacer.gif. Looking at how other plugins handle this, I notice that `json: false` in xds.js means it returns direct MP4 URLs, whereas YouJizz requires navigating to a video page first to extract the actual playable URL — so I'll need to implement a separate method to handle that extraction step. I need to figure out how the plugin handles video extraction—whether to use a direct URL, an API endpoint, or extract from the page itself. Since YouJizz requires parsing the video page to get the actual stream, I'll structure the parser to use the `qualities` function for that extraction, and I'll start writing out the complete parser code now. Writing the parser structure... Still writing parser... Still writing the HTTP helper... Writing the menu structure... Writing routing logic...

Now I'm setting up a function to extract the video URL from the page HTML by trying multiple regex patterns to find the MP4 file link, then returning it with quality metadata or an error if nothing's found.

Building the parser API... I'm setting up a polling mechanism that attempts to register the parser every 100 milliseconds until it succeeds or times out after 10 seconds. Now I'm examining the HTML structure of the video cards to identify the correct selectors for extracting video information from the page.

Looking at the frame-wrapper element, I notice it contains the link and image but no title, which means the title must be in a parent or sibling element. The `.video-item` container is likely the proper card selector since it would hold both the frame-wrapper and the title element. I'm also confirming that my approach to handle lazy-loaded images is correct by preferring the `data-original` attribute over the spacer.gif placeholder in the `src` attribute.

Now I need to figure out pagination detection from the HTML and decide whether to use the `video` field directly or implement the `qualities` method for the AdultJS plugin.

Looking at how other parsers handle this, I think the right approach is to set the `url` field to the page URL and implement a `qualities` method that fetches the actual video URL when needed, since YouJizz requires extracting the stream from the video page itself.

Finalizing the complete parser... I'm focusing on the image selector strategy — the lazy-loaded images use `data-original` attributes, so my querySelector chain will find them correctly. For titles, I'm trying multiple selector patterns since I don't have the exact HTML structure, and falling back to parsing the URL slug if needed. Now I'm writing out the complete parser code.

I'm settling on version 1.1.0 since we're fixing the search URL format and poster field detection. For the total pages, I should try parsing the pagination links to find the maximum page number rather than hardcoding it to 10, which would give more accurate results.

Writing the complete parser... I need to see the next thinking content to rewrite it. You've provided the guidelines and my current rewritten thinking, but the "next thinking" section appears to be empty or missing.

Could you please share the next thinking that needs to be rewritten?

</div>

```javascript
// =============================================================
// yjizz.js — YouJizz Parser для AdultPlugin / Lampa
// Version  : 1.1.0
// Changes  :
//   [1.0.0] Базовый парсер: популярное, категории, поиск
//   [1.1.0] Исправлен URL поиска → /search/query-page.html
//           Исправлены поля постера → img, poster, background_image
//           Добавлен Noty "Ничего не найдено"
// =============================================================

(function () {
'use strict';

// ----------------------------------------------------------
// КОНФИГ
// ----------------------------------------------------------
var NAME = 'yjizz';
var HOST = 'https://www.youjizz.com';

// ----------------------------------------------------------
// КАТЕГОРИИ
// ----------------------------------------------------------
var CATEGORIES = [
  { title: '🔥 Популярное',      path: 'most-popular'   },
  { title: '🆕 Новинки',         path: 'new-videos'     },
  { title: '⭐ Топ рейтинг',     path: 'top-rated'      },
  { title: '👁 Просматриваемые', path: 'most-viewed'    },
  { title: '💋 Любительское',    path: 'amateur'        },
  { title: '🎓 Молодые',         path: 'teens'          },
  { title: '👩 Зрелые',          path: 'mature'         },
  { title: '🌸 Азиатки',         path: 'asian'          },
  { title: '🏳‍🌈 Лесби',         path: 'lesbian'        },
  { title: '🎭 Анальное',        path: 'anal'           }
];

// ----------------------------------------------------------
// УТИЛИТЫ
// ----------------------------------------------------------

// Протокол-относительный → https
function prependHttps(url) {
  if (!url) return '';
  return (url.indexOf('//') === 0) ? 'https:' + url : url;
}

// /search/step-sister-1.html
// Пробелы → дефисы, всё в нижнем регистре
function buildSearchUrl(query, page) {
  var slug = query.trim().toLowerCase().replace(/\s+/g, '-');
  return HOST + '/search/' + slug + '-' + (page || 1) + '.html';
}

// /most-popular-1.html  /  /categories/milf-1.html
function buildCatalogUrl(path, page) {
  return HOST + '/' + path + '-' + (page || 1) + '.html';
}

// Извлечь title из slug URL: /videos/my-step-sister-16320161.html → "My step sister"
function titleFromHref(href) {
  var slug = (href || '').replace(/\.html$/, '').split('/').pop() || '';
  slug = slug.replace(/-\d+$/, '');                       // убрать ID на конце
  slug = slug.replace(/-/g, ' ');
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

// Определить кол-во страниц из пагинации
function detectTotalPages(doc) {
  var links = doc.querySelectorAll('.pagination a, .pager a, [class*="paginat"] a');
  var max   = 1;
  for (var i = 0; i < links.length; i++) {
    var href = links[i].getAttribute('href') || '';
    var m    = href.match(/-(\d+)\.html$/);
    if (m) {
      var n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return max > 1 ? Math.min(max, 50) : 10; // fallback 10
}

// ----------------------------------------------------------
// ПАРСИНГ КАРТОЧКИ
// ----------------------------------------------------------
function _parseCard(el) {
  // Ссылка на видео
  var linkEl = el.querySelector('a.frame.video') ||
               el.querySelector('a[href*="/videos/"]');
  if (!linkEl) return null;

  var href = (linkEl.getAttribute('href') || '').trim();
  if (!href || href === '#') return null;
  var videoPageUrl = (href.indexOf('http') === 0) ? href : HOST + href;

  // -------------------------------------------------------
  // ПОСТЕР — приоритет data-original (lazy-load атрибут)
  // -------------------------------------------------------
  var imgEl   = el.querySelector('img[data-original], img.lazy, img');
  var picture = '';

  if (imgEl) {
    var raw = imgEl.getAttribute('data-original') ||
              imgEl.getAttribute('data-src')      ||
              imgEl.getAttribute('src')           || '';

    picture = prependHttps(raw);

    // Игнорируем spacer-заглушку
    if (picture.indexOf('spacer.gif') !== -1) picture = '';
  }

  // -------------------------------------------------------
  // ПРЕВЬЮ-КЛИП (data-clip на ссылке)
  // -------------------------------------------------------
  var clip = prependHttps(linkEl.getAttribute('data-clip') || '');

  // -------------------------------------------------------
  // ЗАГОЛОВОК
  // -------------------------------------------------------
  var titleEl = el.querySelector('.title a, a.title, .video-title a, .video-title, h2 a, h2');
  var title   = titleEl
    ? (titleEl.textContent || titleEl.innerText || '').trim()
    : titleFromHref(href);

  if (!title) title = titleFromHref(href);

  // -------------------------------------------------------
  // ДЛИТЕЛЬНОСТЬ
  // -------------------------------------------------------
  var durEl = el.querySelector('.duration, .video-duration, .time, [class*="duration"]');
  var dur   = durEl ? (durEl.textContent || '').trim() : '';

  // -------------------------------------------------------
  // КАРТОЧКА — все поля постера чтобы Lampa точно показал
  // -------------------------------------------------------
  return {
    name             : title,
    url              : videoPageUrl,
    picture          : picture,     // ← все четыре поля
    img              : picture,     //   для совместимости
    poster           : picture,     //   с разными версиями
    background_image : picture,     //   AdultPlugin / Lampa
    preview          : clip,
    time             : dur,
    quality          : 'HD',
    json             : false,
    source           : NAME
  };
}

// ----------------------------------------------------------
// HTTP-ЗАПРОС
// ----------------------------------------------------------
function httpGet(url, success, error) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.timeout = 15000;

  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return;
    if (xhr.status >= 200 && xhr.status < 300) {
      success(xhr.responseText);
    } else {
      error('HTTP ' + xhr.status);
    }
  };

  xhr.ontimeout = function () { error('Timeout');        };
  xhr.onerror   = function () { error('Network error'); };
  xhr.send();
}

// ----------------------------------------------------------
// РАЗБОР HTML-СТРАНИЦЫ → массив карточек
// ----------------------------------------------------------
function parsePage(html) {
  var doc;
  try {
    doc = (new DOMParser()).parseFromString(html, 'text/html');
  } catch (e) {
    return { results: [], totalPages: 1 };
  }

  // Пробуем несколько селекторов контейнера карточки
  var items = doc.querySelectorAll('li.video-item, .video-item, .thumb-block');
  if (!items.length) {
    items = doc.querySelectorAll('.frame-wrapper');
  }

  var results = [];
  for (var i = 0; i < items.length; i++) {
    var card = _parseCard(items[i]);
    if (card) results.push(card);
  }

  return {
    results    : results,
    totalPages : detectTotalPages(doc)
  };
}

// ----------------------------------------------------------
// ЗАГРУЗКА И РАЗБОР ЛИСТИНГА
// ----------------------------------------------------------
function fetchListing(pageUrl, success, error) {
  console.log('[yjizz] fetchListing →', pageUrl);

  httpGet(pageUrl, function (html) {
    var parsed = parsePage(html);

    if (!parsed.results.length) {
      try { Lampa.Noty.show('Ничего не найдено'); } catch (e) {}
      error('Ничего не найдено');
      return;
    }

    success({
      results     : parsed.results,
      collection  : true,
      total_pages : parsed.totalPages,
      menu        : buildMenu()
    });
  }, error);
}

// ----------------------------------------------------------
// МЕНЮ
// ----------------------------------------------------------
function buildMenu() {
  var menu = [
    {
      title        : '🔍 Поиск',
      search_on    : true,
      playlist_url : NAME + '/search/'
    },
    {
      title        : '🔥 Популярное',
      playlist_url : NAME + '/popular'
    },
    {
      title        : '🆕 Новинки',
      playlist_url : NAME + '/new'
    }
  ];

  var submenu = CATEGORIES.map(function (c) {
    return {
      title        : c.title,
      playlist_url : NAME + '/cat/' + c.path
    };
  });

  menu.push({
    title    : '📂 Категории',
    submenu  : submenu
  });

  return menu;
}

// ----------------------------------------------------------
// РОУТЕР VIEW
// ----------------------------------------------------------
function parseSearchParam(url) {
  var m = url.match(/[?&]search=([^&]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function routeView(url, page, success, error) {
  var searchPrefix = NAME + '/search/';
  var catPrefix    = NAME + '/cat/';

  console.log('[yjizz] routeView → url="' + url + '" page=' + page);

  // 1) Фильтр-поиск: yjizz/search/?search=wife
  var searchParam = parseSearchParam(url);
  if (searchParam !== null) {
    fetchListing(buildSearchUrl(searchParam.trim(), page), success, error);
    return;
  }

  // 2) Поиск по пути: yjizz/search/wife
  if (url.indexOf(searchPrefix) === 0) {
    var rawQ  = url.replace(searchPrefix, '').split('?')[0];
    var query = decodeURIComponent(rawQ).trim();

    if (query) {
      fetchListing(buildSearchUrl(query, page), success, error);
    } else {
      fetchListing(buildCatalogUrl('most-popular', page), success, error);
    }
    return;
  }

  // 3) Категория: yjizz/cat/milf
  if (url.indexOf(catPrefix) === 0) {
    var catPath = url.replace(catPrefix, '').split('?')[0];
    fetchListing(buildCatalogUrl(catPath, page), success, error);
    return;
  }

  // 4) Новинки
  if (url === NAME + '/new') {
    fetchListing(buildCatalogUrl('new-videos', page), success, error);
    return;
  }

  // 5) Всё остальное → популярное
  fetchListing(buildCatalogUrl('most-popular', page), success, error);
}

// ----------------------------------------------------------
// QUALITIES — извлечь URL видео из страницы видео
// ----------------------------------------------------------
function fetchQualities(pageUrl, success, error) {
  httpGet(pageUrl, function (html) {
    // Паттерны поиска video URL в исходнике страницы
    var patterns = [
      /video_url['":\s]+['"]([^'"]+\.mp4[^'"]*)['"]/i,
      /file:\s*['"]([^'"]+\.mp4[^'"]*)['"]/i,
      /['"]([^'"]+youjizz[^'"]+\.mp4[^'"]*)['"]/i,
      /source\s+src=['"]([^'"]+\.mp4[^'"]*)['"]/i
    ];

    for (var i = 0; i < patterns.length; i++) {
      var m = html.match(patterns[i]);
      if (m && m[1]) {
        var videoUrl = prependHttps(m[1]);
        success([{ url: videoUrl, label: 'HD' }]);
        return;
      }
    }

    error('Video URL не найден');
  }, error);
}

// ----------------------------------------------------------
// API ПАРСЕРА
// ----------------------------------------------------------
var YJizzParser = {

  // Главный экран
  main: function (params, success, error) {
    fetchListing(buildCatalogUrl('most-popular', 1), success, error);
  },

  // Каталог / категория / поиск
  view: function (params, success, error) {
    var page = parseInt(params.page, 10) || 1;
    var url  = params.url || (NAME + '/popular');
    routeView(url, page, success, error);
  },

  // Глобальный поиск через строку Lampa
  search: function (params, success, error) {
    var query = (params.query || '').trim();
    var page  = parseInt(params.page, 10) || 1;

    if (!query) {
      success({ title: '', results: [], collection: true, total_pages: 1 });
      return;
    }

    fetchListing(buildSearchUrl(query, page), function (data) {
      data.title = 'YouJizz: ' + query;
      data.url   = NAME + '/search/' + encodeURIComponent(query);
      success(data);
    }, error);
  },

  // Получить прямой URL видео
  qualities: function (params, success, error) {
    var url = params.url || '';
    if (!url) { error('Нет URL'); return; }
    fetchQualities(url, success, error);
  }
};

// ----------------------------------------------------------
// РЕГИСТРАЦИЯ
// ----------------------------------------------------------
function tryRegister() {
  if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
    window.AdultPlugin.registerParser(NAME, YJizzParser);
    console.log('[yjizz] v1.1.0 зарегистрирован');
    try {
      setTimeout(function () {
        Lampa.Noty.show('YouJizz [yjizz] v1.1.0 подключён', { time: 2500 });
      }, 600);
    } catch (e) {}
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
