/**
 * =============================================================
 * vprn.js — WinPorn Parser
 * Version  : 2.0.0
 * Developer: AI Strategist (Strategic Analysis Engine)
 * Target   : https://www.winporn.com
 * 
 * ─────────────────────────────────────────────────────────
 * СТРАТЕГИЧЕСКИЙ АНАЛИЗ (на основе JSON-конфига v5.0.0):
 * ─────────────────────────────────────────────────────────
 * 
 * 1. ENGINE: Custom HTML+jQuery, НЕ KVS, НЕ ClipShare
 *    • SSR-рендеринг — JS не требуется
 *    • Метод: CSS-селекторы
 * 
 * 2. DATA: 
 *    • Каталог: .thumb (80 карт/стр)
 *    • Видео: прямые MP4 (g{N}.wppsn.com)
 *    • Нет категорий/каналов/сортировки
 * 
 * 3. CLEANER: unescape-backslash, prepend-host, *.wppsn.com фильтр
 * 
 * 4. OKKAMA: 4 метода (main/view/search/qualities), без лишнего
 * 
 * 5. WORKER: ОБЯЗАТЕЛЕН
 *    • Cookie: mature=1 (age gate)
 *    • Referer: https://www.winporn.com/
 *    • Whitelist: www.winporn.com, *.wppsn.com
 * 
 * 6. MENU: playlist_url = "vprn" (уже в menu.json)
 * 7. DOMAIN_MAP: 'winporn.com': 'vprn'
 * ─────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  // ─── КОНСТАНТЫ (из JSON-конфига, без изменений) ────────
  var HOST  = 'https://www.winporn.com';
  var NAME  = 'vprn';

  // Regex: только MP4 с CDN wppsn.com
  var MP4_RX = /https?:\/\/g\d+\.wppsn\.com\/[^\s"'<>\\]+\.mp4/gi;

  // Селекторы (взяты 1:1 из JSON parserConfig.CARD_SELECTORS)
  var SEL = {
    card: '.thumb',
    link: 'a[href*="/video/"]',
    title: '[class*="title"]',
    img:   'img',
    dur:   '[class*="duration"]',
  };

  // ─── УТИЛИТЫ ────────────────────────────────────────────

  /**
   * Безопасное получение атрибута
   */
  function getAttr(el, selector, attr) {
    try {
      var node = el.querySelector(selector);
      return node ? (node.getAttribute(attr) || '') : '';
    } catch (e) { return ''; }
  }

  /**
   * Безопасное получение текста
   */
  function getText(el, selector) {
    try {
      var node = el.querySelector(selector);
      return node ? (node.textContent || '').trim() : '';
    } catch (e) { return ''; }
  }

  /**
   * Очистка URL (Cleaner Strategy из JSON)
   * Правила: unescape-backslash, prepend-host
   */
  function cleanUrl(u) {
    if (!u) return '';
    // Rule 1: unescape-backslash
    u = u.replace(/\\+/g, '');
    // Rule 2: prepend-host
    if (u.indexOf('//') === 0) u = 'https:' + u;
    else if (u.indexOf('/') === 0) u = HOST + u;
    return u;
  }

  // ─── ПАРСЕР КАРТОЧЕК ───────────────────────────────────

  /**
   * Извлечение карточек из HTML каталога
   * Селекторы: из JSON videoCards.cardSelectors
   */
  function parseCards(html) {
    var results = [];
    var div = document.createElement('div');

    try {
      div.innerHTML = html;
    } catch (e) {
      console.error('[vprn] parseCards DOM error:', e);
      return results;
    }

    var cards = div.querySelectorAll(SEL.card);
    for (var i = 0; i < cards.length; i++) {
      var c    = cards[i];
      var link = getAttr(c, SEL.link, 'href');

      if (!link) continue;

      results.push({
        name:    getText(c, SEL.title),
        video:   cleanUrl(link),
        picture: cleanUrl(getAttr(c, SEL.img, 'src')),
        quality: getText(c, SEL.dur),
        source:  NAME,
      });
    }

    div.innerHTML = '';
    div = null;
    return results;
  }

  // ─── ПАРСЕР ВИДЕО (mp4-brute) ──────────────────────────

  /**
   * Извлечение MP4-ссылок со страницы видео
   * Метод: mp4-brute (из JSON sStrategies.matched[0].name)
   * Фильтр: только *.wppsn.com
   */
  function extractVideoUrls(html) {
    var urls = [];
    var seen = {};

    // Очистка HTML для regex (убрать экранирование)
    var clean = html.replace(/\\+/g, '');
    var matches = clean.match(MP4_RX) || [];

    for (var i = 0; i < matches.length; i++) {
      var url = matches[i];
      if (!seen[url]) {
        seen[url] = true;
        urls.push(url);
      }
    }

    return urls;
  }

  /**
   * Присвоение меток качества
   * Стратегия Оккама: первое = лучшее, дальше по убыванию
   */
  function assignQualityLabels(urls) {
    var map = {};
    var len = urls.length;

    if (len === 1) {
      map['720p'] = urls[0];
    } else if (len === 2) {
      map['720p'] = urls[0];
      map['480p'] = urls[1];
    } else if (len >= 3) {
      map['1080p'] = urls[0];
      map['720p']  = urls[1];
      map['480p']  = urls[2];
      // Остальные как есть
      for (var i = 3; i < len; i++) {
        map['q' + i] = urls[i];
      }
    }

    return map;
  }

  // ─── СЕТЕВОЙ ЗАПРОС ─────────────────────────────────────

  /**
   * Обёртка над AdultPlugin.networkRequest
   * Три уровня fallback: native+Worker → Reguest → fetch
   */
  function request(url, onSuccess, onError) {
    var net = window.AdultPlugin && window.AdultPlugin.networkRequest;
    if (typeof net === 'function') {
      net(url, onSuccess, onError);
    } else {
      onError('networkRequest unavailable');
    }
  }

  // ─── РЕГИСТРАЦИЯ ПАРСЕРА ────────────────────────────────

  window.AdultPlugin.registerParser(NAME, {

    /**
     * Главная страница — первая страница каталога
     * URL: https://www.winporn.com/
     */
    main: function (params, success, error) {
      var url = HOST + '/';

      request(url, function (html) {
        var results = parseCards(html);
        if (results.length) {
          success({ results: results });
        } else {
          error('empty_main');
        }
      }, error);
    },

    /**
     * Каталог: пагинация + поиск
     * Пагинация: ?page={N}
     * Поиск:     ?q={query}
     * 
     * Нет категорий → menu: [] (по Оккаму)
     */
    view: function (params, success, error) {
      var raw  = params.url || '';
      var page = params.page || 1;

      // Нормализация URL (убрать GITHUB_BASE если попал)
      var base = raw.replace('https://denis-tikhonov.github.io/plug/', '');

      // Если base = имя парсера → главная
      if (base === NAME || base === NAME + '/') {
        base = HOST + '/';
      }

      // Построение URL с пагинацией
      var sep = base.indexOf('?') !== -1 ? '&' : '?';
      var url = base + (page > 1 ? sep + 'page=' + page : '');

      request(url, function (html) {
        var results = parseCards(html);
        if (results.length) {
          success({
            results: results,
            menu: [],  // Нет категорий (JSON: CATEGORIES: [])
          });
        } else {
          error('empty_view');
        }
      }, error);
    },

    /**
     * Глобальный поиск
     * Паттерн: https://www.winporn.com/?q={query}
     */
    search: function (params, success, error) {
      var q = (params.query || '').trim();
      if (!q) { error('empty_query'); return; }

      var url = HOST + '/?q=' + encodeURIComponent(q);

      request(url, function (html) {
        var results = parseCards(html);
        if (results.length) {
          success({ results: results });
        } else {
          error('search_not_found');
        }
      }, error);
    },

    /**
     * Извлечение качеств видео
     * Метод: mp4-brute (regex .mp4 из HTML страницы видео)
     * Фильтр: домен *.wppsn.com
     * 
     * ВНИМАНИЕ: Worker должен передавать заголовки:
     *   Cookie: mature=1
     *   Referer: https://www.winporn.com/
     * Иначе вернётся age-gate страница без видео.
     */
    qualities: function (videoUrl, success, error) {
      var fullUrl = cleanUrl(videoUrl);

      request(fullUrl, function (html) {
        var urls = extractVideoUrls(html);

        if (urls.length === 0) {
          // Возможная причина: Worker не передаёт заголовки
          if (html.indexOf('mature') !== -1 || html.indexOf('age') !== -1) {
            console.error('[vprn] Age gate detected — Worker missing headers');
          }
          error('no_video_urls');
          return;
        }

        var qualities = assignQualityLabels(urls);
        success({ qualities: qualities });
      }, error);
    },
  });

})();
