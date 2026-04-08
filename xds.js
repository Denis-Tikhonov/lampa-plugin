// =============================================================
// xds.js — Парсер-шаблон для подключения нового источника
// Version  : 1.0.0
// Changed  : [1.0.0] Шаблон по схеме phub.js
//            [1.0.0] Замените CONFIG под реальный сайт xds
// =============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // [1.0.0] КОНФИГУРАЦИЯ — замените под реальный xds-сайт
  // ----------------------------------------------------------
  var CONFIG = {
    base_url:   'https://xds-site.com',        // ← замените
    search_url: 'https://xds-site.com/search', // ← замените
    page_param: 'page',
    sel: {
      item:     '.video-item',    // ← замените под структуру сайта
      title:    '.video-title a',
      thumb:    'img.thumb',
      preview:  'img[data-preview]',
      href:     'a.video-link',
      duration: '.duration',
    },
    categories: [
      { title: 'Главная',    url: 'https://xds-site.com/'             },
      { title: 'Новинки',    url: 'https://xds-site.com/?sort=newest' },
      { title: 'Популярное', url: 'https://xds-site.com/?sort=popular' },
    ],
  };

  // ----------------------------------------------------------
  // [1.0.0] ПАРСИНГ — аналогичен phub.js, адаптируйте селекторы
  // ----------------------------------------------------------
  function buildPageUrl(baseUrl, page) {
    if (!page || page <= 1) return baseUrl;
    var sep = baseUrl.indexOf('?') !== -1 ? '&' : '?';
    return baseUrl + sep + CONFIG.page_param + '=' + page;
  }

  function parseItem(el) {
    var titleEl = el.querySelector(CONFIG.sel.title);
    var thumbEl = el.querySelector(CONFIG.sel.thumb);
    var hrefEl  = el.querySelector(CONFIG.sel.href);
    if (!titleEl || !hrefEl) return null;

    var name    = (titleEl.getAttribute('title') || titleEl.textContent || '').trim();
    var href    = hrefEl.getAttribute('href') || '';
    var picture = thumbEl ? (thumbEl.getAttribute('src') || '') : '';
    var preview = thumbEl ? (thumbEl.getAttribute('data-preview') || '') : '';
    var durEl   = el.querySelector(CONFIG.sel.duration);
    var duration = durEl ? durEl.textContent.trim() : '';
    var videoUrl = href.indexOf('http') === 0 ? href : CONFIG.base_url + href;

    return {
      name:    name,
      picture: picture,
      preview: preview,
      video:   videoUrl,
      quality: duration,
      time:    duration,
      source:  'xds',
    };
  }

  function parsePage(html) {
    var doc   = new DOMParser().parseFromString(html, 'text/html');
    var items = [];
    doc.querySelectorAll(CONFIG.sel.item).forEach(function (el) {
      var card = parseItem(el);
      if (card && card.name && card.video) items.push(card);
    });
    return items;
  }

  function fetchPage(url, success, error) {
    var net = new Lampa.Reguest();
    net.silent(url, function (data) {
      if (typeof data === 'string') success(data);
      else error('Unexpected response');
    }, function () {
      fetch(url).then(function (r) { return r.text(); }).then(success).catch(error);
    }, false, { dataType: 'text' });
  }

  // ----------------------------------------------------------
  // [1.0.0] ПУБЛИЧНЫЙ ИНТЕРФЕЙС
  // ----------------------------------------------------------
  var XdsParser = {
    main: function (params, success, error) {
      fetchPage(CONFIG.categories[0].url, function (html) {
        var results = parsePage(html);
        if (!results.length) { error(); return; }
        success({ results: results, collection: true, total_pages: 30, menu: XdsParser._buildMenu(CONFIG.categories[0].url) });
      }, error);
    },

    view: function (params, success, error) {
      var url  = (params.url || CONFIG.categories[0].url).split('&pg=')[0].split('?pg=')[0];
      var page = parseInt(params.page) || 1;
      fetchPage(buildPageUrl(url, page), function (html) {
        var results = parsePage(html);
        if (!results.length) { error(); return; }
        success({ results: results, collection: true, total_pages: page + 5, menu: XdsParser._buildMenu(url) });
      }, error);
    },

    search: function (params, success, error) {
      var url = CONFIG.search_url + '?search=' + encodeURIComponent(params.query || '');
      fetchPage(buildPageUrl(url, params.page || 1), function (html) {
        var results = parsePage(html);
        if (!results.length) { error(); return; }
        success({ title: 'xds: ' + params.query, results: results, url: url, collection: true, total_pages: 10 });
      }, error);
    },

    _buildMenu: function (activeUrl) {
      return CONFIG.categories.map(function (cat) {
        return { title: cat.title, playlist_url: cat.url, selected: cat.url === activeUrl };
      });
    },
  };

  // ----------------------------------------------------------
  // [1.0.0] РЕГИСТРАЦИЯ
  // ----------------------------------------------------------
  if (window.AdultPlugin && window.AdultPlugin.registerParser) {
    window.AdultPlugin.registerParser('xds', XdsParser);
  } else {
    var w = setInterval(function () {
      if (window.AdultPlugin && window.AdultPlugin.registerParser) {
        window.AdultPlugin.registerParser('xds', XdsParser);
        clearInterval(w);
      }
    }, 100);
  }

})();
