"use strict";

/**
 * ============================================================================
 *  Trahkino — минимальный плагин для Lampa (Android TV)
 *  Сайт: https://trahkino.me
 *  Назначение: парсинг каталога + воспроизведение видео
 * ============================================================================
 *  Архитектура:
 *    1. Babel-хелперы          — совместимость ES6+ (min-набор)
 *    2. HTTP-клиент (Http)     — GET-запросы через fetch / Lampa.Reguest
 *    3. HTML-парсер (Parser)   — regex-извлечение из HTML
 *    4. Модели данных          — VideoItem, QualityResult
 *    5. Сайт-парсер (Trahkino)— Invoke, Playlist, StreamLinks
 *    6. UI-интеграция          — меню, категории, просмотр, предпросмотр
 *    7. Инициализация          — регистрация в Lampa
 * ============================================================================
 */

/* ==========================================================================
 *  РАЗДЕЛ 1: Babel-хелперы (min-набор для async/await + spread + class)
 * ========================================================================== */

/**
 * Приводит объект к массиву (для оператора spread).
 * @param {*} e - Итерируемый объект
 * @returns {Array}
 */
function _toConsumableArray(e) {
  return _arrayWithoutHoles(e) || _iterableToArray(e) || _unsupportedIterableToArray(e) || _nonIterableSpread()
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.")
}

function _iterableToArray(e) {
  if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e)
}

function _arrayWithoutHoles(e) {
  if (Array.isArray(e)) return _arrayLikeToArray(e)
}

function _unsupportedIterableToArray(e, t) {
  if (e) {
    if ("string" == typeof e) return _arrayLikeToArray(e, t);
    var a = {}.toString.call(e).slice(8, -1);
    return "Map" === a || "Set" === a ? Array.from(e) : void 0
  }
}

function _arrayLikeToArray(e, t) {
  (null == t || t > e.length) && (t = e.length);
  for (var a = 0, n = Array(t); a < t; a++) n[a] = e[a];
  return n
}

/** Обёртка для async-функций (генерирует Promise + step-машину). */
function asyncGeneratorStep(e, t, a, n, r, i, o) {
  try {
    var s = e[i](o),
      l = s.value
  } catch (e) {
    return void a(e)
  }
  s.done ? t(l) : Promise.resolve(l).then(n, r)
}

function _asyncToGenerator(e) {
  return function() {
    var t = this,
      a = arguments;
    return new Promise((function(n, r) {
      var i = e.apply(t, a);

      function o(e) {
        asyncGeneratorStep(i, n, r, o, s, "next", e)
      }

      function s(e) {
        asyncGeneratorStep(i, n, r, o, s, "throw", e)
      }
      o(void 0)
    }))
  }
}

function _classCallCheck(e, t) {
  if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
}

function _defineProperties(e, t) {
  for (var a = 0; a < t.length; a++) {
    var n = t[a];
    n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(e, n.key, n)
  }
}

function _createClass(e, t, a) {
  return t && _defineProperties(e.prototype, t), a && _defineProperties(e, a), Object.defineProperty(e, "prototype", {
    writable: !1
  }), e
}

/** Регенератор для async/await — минимальная версия. */
function _regenerator() {
  /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT) */
  var e, t, a = "function" == typeof Symbol ? Symbol : {},
    n = a.iterator || "@@iterator";

  function i(a, n, r, i) {
    var l = n && n.prototype instanceof s ? n : s,
      c = Object.create(l.prototype);
    return _regeneratorDefine2(c, "_invoke", function(a, n, r) {
      var i, s, l, c = 0,
        u = r || [],
        p = !1,
        d = {
          p: 0, n: 0, v: e, a: h,
          f: h.bind(e, 4),
          d: function(t, a) { return i = t, s = 0, l = e, d.n = a, o }
        };

      function h(a, n) {
        for (s = a, l = n, t = 0; !p && c && !r && t < u.length; t++) {
          var r, i = u[t],
            h = d.p,
            m = i[2];
          a > 3 ? (r = m === n) && (l = i[(s = i[4]) ? 5 : (s = 3, 3)], i[4] = i[5] = e) : i[0] <= h && ((r = a < 2 && h < i[1]) ? (s = 0, d.v = n, d.n = i[1]) : h < m && (r = a < 3 || i[0] > n || n > m) && (i[4] = a, i[5] = n, d.n = m, s = 0))
        }
        if (r || a > 1) return o;
        throw p = !0, n
      }
      return function(r, u, m) {
        if (c > 1) throw TypeError("Generator is already running");
        for (p && 1 === u && h(u, m), s = u, l = m;
          (t = s < 2 ? e : l) || !p;) {
          i || (s ? s < 3 ? (s > 1 && (d.n = -1), h(s, l)) : d.n = l : d.v = l);
          try {
            if (c = 2, i) {
              if (s || (r = "next"), t = i[r]) {
                if (!(t = t.call(i, l))) throw TypeError("iterator result is not an object");
                if (!t.done) return t;
                l = t.value, s < 2 && (s = 0)
              } else 1 === s && (t = i.return) && t.call(i), s < 2 && (l = TypeError("The iterator does not provide a '" + r + "' method"), s = 1);
              i = e
            } else if ((t = (p = d.n < 0) ? l : a.call(n, d)) !== o) break
          } catch (t) {
            i = e, s = 1, l = t
          } finally {
            c = 1
          }
        }
        return { value: t, done: p }
      }
    }(a, r, i), !0), c
  }
  var o = {};

  function s() {}
  function l() {}
  function c() {}
  t = Object.getPrototypeOf;
  var u = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, (function() { return this })), t),
    p = c.prototype = s.prototype = Object.create(u);

  function d(e) {
    return Object.setPrototypeOf ? Object.setPrototypeOf(e, c) : (e.__proto__ = c, _regeneratorDefine2(e, "@@toStringTag", "GeneratorFunction")), e.prototype = Object.create(p), e
  }
  return l.prototype = c, _regeneratorDefine2(p, "constructor", c), _regeneratorDefine2(c, "constructor", l), l.displayName = "GeneratorFunction", _regeneratorDefine2(c, "@@toStringTag", "GeneratorFunction"), _regeneratorDefine2(p), _regeneratorDefine2(p, "@@toStringTag", "Generator"), _regeneratorDefine2(p, n, (function() { return this })), _regeneratorDefine2(p, "toString", (function() { return "[object Generator]" })), (_regenerator = function() { return { w: i, m: d } })()
}

function _regeneratorDefine2(e, t, a, n) {
  var r = Object.defineProperty;
  try { r({}, "", {}) } catch (e) { r = 0 }
  _regeneratorDefine2 = function(e, t, a, n) {
    if (t) r ? r(e, t, { value: a, enumerable: !n, configurable: !n, writable: !n }) : e[t] = a;
    else {
      var i = function(t, a) { _regeneratorDefine2(e, t, (function(e) { return this._invoke(t, a, e) })) };
      i("next", 0), i("throw", 1), i("return", 2)
    }
  }, _regeneratorDefine2(e, t, a, n)
}

/* ==========================================================================
 *  РАЗДЕЛ 2: HTTP-клиент (Http)
 *  Выполняет GET-запросы. На Android использует нативный Lampa.Reguest,
 *  на остальных платформах — стандартный fetch.
 * ========================================================================== */
var Http = (e = function() {
  function e() { _classCallCheck(this, e) }
  return _createClass(e, null, [
    {
      /**
       * Гарантирует наличие User-Agent в заголовках.
       * @param {Object} e - Заголовки запроса
       * @returns {Object} - Заголовки с User-Agent
       */
      key: "ensureHeaders",
      value: function(e) {
        var t = e ? Object.assign({}, e) : {};
        // Подмена User-Agent для обхода блокировок
        return t["user-agent"] || t["User-Agent"] || (t["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"), t
      }
    },
    {
      /**
       * Выполняет HTTP GET-запрос.
       * @param {string} a - URL для запроса
       * @param {Object} n - Заголовки запроса (опционально)
       * @param {string} r - Кодировка ответа (опционально, например "windows-1251")
       * @returns {Promise<string>} - Текст ответа
       */
      key: "Get",
      value: (t = _asyncToGenerator(_regenerator().m((function t(a, n, r) {
        var i, o, s, l, c;
        return _regenerator().w((function(t) {
          for (;;) switch (t.n) {
            case 0:
              if (!e.isAndroid) { t.n = 1; break }
              return t.a(2, e.Native(a)); // Нативный запрос на Android
            case 1:
              return i = e.ensureHeaders(n), o = { method: "GET", headers: i }, t.n = 2, fetch(a, o);
            case 2:
              if (s = t.v, null == r) { t.n = 4; break }
              return t.n = 3, s.arrayBuffer(); // Декодирование с заданной кодировкой
            case 3:
              return l = t.v, c = new TextDecoder(r), t.a(2, c.decode(l));
            case 4:
              return t.n = 5, s.text();
            case 5:
              return t.a(2, t.v)
          }
        }), t)
      }))), function(e, a, n) { return t.apply(this, arguments) })
    },
    {
      /**
       * Нативный HTTP-запрос через Lampa.Reguest (для Android).
       * @param {string} t - URL
       * @param {Object} a - Заголовки
       * @param {Function} n - Кодировка
       * @returns {Promise<string>}
       */
      key: "Native",
      value: function(t, a, n) {
        return new Promise((function(r, i) {
          var o = new window.Lampa.Reguest;
          o.native(t, (function(e) {
            "object" === typeof e ? r(JSON.stringify(e)) : r(e), o.clear()
          }), i, a, { dataType: "text", timeout: 8e3, headers: e.ensureHeaders(n) })
        }))
      }
    }
  ]);
  var t
}(), e.isAndroid = "undefined" != typeof window && void 0 !== window.Lampa && void 0 !== window.Lampa.Platform && "function" == typeof window.Lampa.Platform.is && window.Lampa.Platform.is("android"), e);

/* ==========================================================================
 *  РАЗДЕЛ 3: HTML-парсер (Parser)
 *  Утилита для извлечения данных из HTML с помощью регулярных выражений.
 * ========================================================================== */
var Parser = function() {
  return _createClass((function e() { _classCallCheck(this, e) }), null, [
    {
      /**
       * Извлекает группу из строки по регулярному выражению.
       * @param {string} e - Исходная строка (HTML)
       * @param {RegExp} t - Регулярное выражение с捕获-группой
       * @param {number} n - Номер группы (по умолчанию 1)
       * @returns {string|null} - Совпавшая строка или null
       */
      key: "extract",
      value: function(e, t) {
        var a, n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 1,
          r = (null === (a = e.match(t)) || void 0 === a ? void 0 : a[n]) || null;
        return r && "" !== r.trim() ? r.trim() : null
      }
    }
  ])
}();

/* ==========================================================================
 *  РАЗДЕЛ 4: Модели данных
 * ========================================================================== */

/**
 * Видео-элемент для карточки в каталоге.
 * @param {string} name     - Название видео
 * @param {string} video    - URL видео / URL страницы
 * @param {string} picture  - URL постера/превью
 * @param {string|null} preview - URL превью-видео (webm/mp4)
 * @param {string|null} time    - Длительность (например "22:01")
 * @param {string|null} quality - Метка качества ("HD", "1080p")
 * @param {boolean} json     - Нужно ли парсить страницу для получения потоков
 * @param {boolean} related - Есть ли похожие видео
 * @param {Object|null} model - Модель (имя + URL)
 */
var VideoItem = _createClass((function e(t, a, n, r, i, o, s, l, c) {
  _classCallCheck(this, e),
    this.name = t,       // Название
    this.video = a,      // URL видео или страницы
    this.picture = n,    // Постер
    this.preview = r,    // Превью-ролик
    this.time = i,       // Длительность
    this.quality = o,    // Качество
    this.json = s,       // Нужен парсинг страницы?
    this.related = l,    // Похожие видео
    this.model = c       // Модель (актёр)
}));

/**
 * Результат разбора страницы видео — потоки по качествам + похожие.
 * @param {Object} t - Объект { "240p": "url", "360p": "url", ... } или { auto: "url" }
 * @param {boolean} relatedMode - true, если запрошены только похожие видео
 */
var ViewResult = _createClass((function e(t, a) {
  _classCallCheck(this, e),
    a ? (this.total_pages = 1, this.list = t.related) : (this.qualitys = t.qualitys, this.recomends = t.recomends)
}));

/**
 * Результат извлечения потоков — качества + рекомендации.
 * @param {Object} t - Объект { "240p": "url", "720p": "url", ... }
 * @param {Array} a - Массив рекомендованных VideoItem
 */
var QualResult = _createClass((function e(t, a) {
  _classCallCheck(this, e), this.qualitys = t, this.recomends = a
}));

/* ==========================================================================
 *  РАЗДЕЛ 5: Парсер сайта trahkino.me (Trahkino)
 * ==========================================================================
 * Структура сайта:
 *   Главная: https://trahkino.me/ — каталог видео с AJAX-пагинацией
 *   Видео:  https://trahkino.me/video/XXXXXX/ — страница с flashvars
 *   Поиск: https://trahkino.me/search/q/ЗАПРОС/
 *   Сортировки: sort_by=post_date | video_viewed | rating
 *   Пагинация: data-parameters="sort_by:...;from:N" (N начинается с 1)
 *
 * Список видео (главная):
 *   <div class="item">
 *     <a href="/video/XXXXXX/" title="Название">
 *       <div class="img">
 *         <img data-original="https://...jpg">
 *       </div>
 *       <strong class="title">Название</strong>
 *       <div class="duration">22:01</div>
 *       <div class="views">84K</div>
 *     </a>
 *   </div>
 *
 * Страница видео (flashvars):
 *   video_url        = "function/0/URL_240p.mp4/"   → 240p
 *   video_alt_url    = "function/0/URL_360p.mp4/"   → 360p
 *   video_alt_url2   = "function/0/URL_480p.mp4/"   → 480p
 *   video_alt_url3   = "function/0/URL_720p.mp4/"   → 720p
 *   video_alt_url4   = "function/0/URL_1080p.mp4/"  → 1080p
 * ========================================================================== */

var Trahkino = (t = function() {
  function e() { _classCallCheck(this, e) }
  return _createClass(e, [
    {
      /**
       * Главный метод маршрутизации — определяет тип запроса и делегирует.
       * Если URL содержит /video/XXXXXX — парсит страницу видео,
       * иначе — парсит каталог.
       *
       * @param {string} a - URL (абсолютный или относительный)
       * @returns {Promise<ViewResult|QualResult>}
       */
      key: "Invoke",
      value: (t = _asyncToGenerator(_regenerator().m((function t(a) {
        var n, r, i, o, s, c, u, p, d;
        return _regenerator().w((function(t) {
          for (;;) switch (t.n) {
            case 0:
              // Если URL — страница отдельного видео (например /video/416484/)
              if (!/\/video\/\d+\/?$/.test(a)) { t.n = 2; break }
              return t.n = 1, Http.Get(a);
            case 1:
              // Извлекаем потоки и похожие видео
              return n = t.v, t.a(2, new ViewResult(this.StreamLinks(n), a.includes("&related")));
            case 2:
              // --- Парсинг каталога ---
              r = new URL(a, e.host);
              i = r.searchParams.get("search") || "";   // Поисковый запрос
              o = r.searchParams.get("sort") || "post_date"; // Сортировка
              s = parseInt(r.searchParams.get("from") || "1", 10); // Номер страницы (начиная с 1)
              c = this.buildUrl(e.host, i, o, s);
              return t.n = 3, Http.Get(c);
            case 3:
              p = t.v;
              // Формируем меню + список
              return t.a(2, {
                menu: this.Menu(o),
                list: this.Playlist(p)
              });
            case 4:
              return t.a(2)
          }
        }), t, this)
      }))), function(e) { return t.apply(this, arguments) })
    },
    {
      /**
       * Строит URL для каталога или поиска.
       * @param {string} e - Базовый хост (https://trahkino.me)
       * @param {string} t - Поисковый запрос (пустой = каталог)
       * @param {string} a - Сортировка: post_date | video_viewed | rating
       * @param {number} n - Номер страницы (от 1)
       * @returns {string} - Полный URL
       *
       * Примеры:
       *   /                           → главная, новые, страница 1
       *   /search/q/секс/from:2/     → поиск, страница 2
       *   /search/q/секс/sort_by:video_viewed/from:1/ → поиск + сортировка
       */
      key: "buildUrl",
      value: function(e, t, a, n) {
        var url = e + "/";
        if (t) {
          // Поиск
          url += "search/q/" + encodeURIComponent(t) + "/";
          if (a && a !== "post_date") url += "sort_by:" + a + "/";
          if (n > 1) url += "from:" + n + "/";
        } else {
          // Каталог с сортировкой
          if (a && a !== "post_date") url += "sort_by:" + a + "/";
          if (n > 1) url += "from:" + n + "/";
        }
        return url;
      }
    },
    {
      /**
       * Парсит HTML главной/поисковой страницы и извлекает массив VideoItem.
       * Ищет все <div class="item"> и извлекает из них данные.
       *
       * @param {string} html - HTML-код страницы
       * @returns {VideoItem[]} - Массив видео-элементов
       */
      key: "Playlist",
      value: function(html) {
        if (!html) return [];
        var items = [];
        // Разбиваем по карточкам видео
        var parts = html.split('<div class="item ">');
        for (var i = 1; i < parts.length; i++) {
          var chunk = parts[i];
          // Извлекаем ссылку и название: <a href="/video/XXXXXX/" title="Название">
          var linkMatch = /<a\s+href="https?:\/\/[^"]*\/video\/(\d+)\/?"\s+title="([^"]+)"/.exec(chunk);
          if (linkMatch && linkMatch[1] && linkMatch[2]) {
            var videoId = linkMatch[1];
            var title = linkMatch[2];

            // Постер: data-original="https://.../1.jpg"
            var poster = Parser.extract(chunk, /data-original="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/)
              || Parser.extract(chunk, /data-webp="(https?:\/\/[^"]+)"/);

            // Длительность: <div class="duration">22:01</div>
            var duration = Parser.extract(chunk, /<div class="duration">([^<]+)<\/div>/);

            items.push(new VideoItem(
              title,
              e.host + "/video/" + videoId + "/",
              poster || "",
              null,       // preview — нет
              duration,
              null,       // quality — определим на странице видео
              true,       // json = true — нужно парсить страницу
              true,       // related = true — есть похожие видео
              null        // model
            ));
          }
        }
        return items;
      }
    },
    {
      /**
       * Формирует меню фильтров (сортировка + поиск).
       * @param {string} t - Текущая сортировка
       * @returns {Object[]} - Массив пунктов меню для Lampa.Select
       */
      key: "Menu",
      value: function(t) {
        var host = e.host;
        var sortLabel = t === "video_viewed" ? "Популярные" : t === "rating" ? "Лучшие" : "Новые";
        return [
          new MenuItem("Поиск", host + "/", "search_on"),
          new MenuItem("Сортировка: " + sortLabel, "submenu", void 0, [
            new MenuItem("Новые", host + "/"),
            new MenuItem("Популярные", host + "/sort_by:video_viewed/"),
            new MenuItem("Лучшие", host + "/sort_by:rating/")
          ])
        ];
      }
    },
    {
      /**
       * Извлекает ссылки на видео всех качеств из flashvars на странице видео.
       *
       * Формат в HTML:
       *   var flashvars = {
       *     video_url:       'function/0/URL_240p.mp4/',
       *     video_alt_url:    'function/0/URL_360p.mp4/',
       *     video_alt_url2:   'function/0/URL_480p.mp4/',
       *     video_alt_url3:   'function/0/URL_720p.mp4/',
       *     video_alt_url4:   'function/0/URL_1080p.mp4/',
       *     ...
       *   };
       *
       * @param {string} html - HTML страницы видео
       * @returns {QualResult} - { qualitys: { "240p": "url", ... }, recomends: [...] }
       */
      key: "StreamLinks",
      value: function(html) {
        var qualitys = {};
        var recomends = [];

        if (!html) return new QualResult(qualitys, recomends);

        // --- Извлечение URL видео из flashvars ---
        // Паттерн: video_url: 'function/0/https://trahkino.me/get_file/.../FILE.mp4/'
        // Нужно вытащить URL между function/0/ и最后的 /
        var urlPattern = /video_(?:alt_)?url\d?\s*:\s*'function\/0\/(https?:\/\/[^']+\/get_file\/[^']+\.mp4)\/'/gi;
        var match;
        while ((match = urlPattern.exec(html)) !== null) {
          var fullUrl = match[1];
          // Определяем качество из URL: .../416484_720p.mp4
          var qualityMatch = /(\d+p)\.mp4/.exec(fullUrl);
          if (qualityMatch) {
            qualitys[qualityMatch[1]] = fullUrl;
          } else {
            // Без суффикса качества — это базовый файл (240p)
            qualitys["240p"] = fullUrl;
          }
        }

        // Fallback: если regex не сработал — ищем любой get_file URL
        if (Object.keys(qualitys).length === 0) {
          var fallbackPattern = /https?:\/\/[^'"\s]+\/get_file\/[^'"\s]+\.mp4/g;
          while ((match = fallbackPattern.exec(html)) !== null) {
            var url = match[0];
            var qm = /(\d+p)\.mp4/.exec(url);
            qualitys[qm ? qm[1] : "auto"] = url;
          }
        }

        // --- Извлечение похожих видео ---
        // Ищем контейнер рекомендуемых видео
        var relatedContainer = html.split('list_videos_recommended_videos_items');
        if (relatedContainer.length > 1) {
          var relatedHtml = relatedContainer[1];
          // Берём только первый блок (до следующего контейнера)
          var relatedCut = relatedHtml.split('id="list_videos_');
          if (relatedCut.length > 1) relatedHtml = relatedCut[0];

          var relatedParts = relatedHtml.split('<div class="item ');
          for (var i = 1; i < relatedParts.length; i++) {
            var chunk = relatedParts[i];
            var linkMatch = /<a\s+href="https?:\/\/[^"]*\/video\/(\d+)\/?"\s+title="([^"]+)"/.exec(chunk);
            if (linkMatch && linkMatch[1] && linkMatch[2]) {
              var poster = Parser.extract(chunk, /data-original="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/);
              var duration = Parser.extract(chunk, /<div class="duration">([^<]+)<\/div>/);
              recomends.push(new VideoItem(
                linkMatch[2],
                e.host + "/video/" + linkMatch[1] + "/",
                poster || "",
                null,
                duration,
                null,
                true,
                false,
                null
              ));
            }
          }
        }

        return new QualResult(qualitys, recomends);
      }
    }
  ]);
  var t;
}(), t.host = "https://trahkino.me", t);

/* ==========================================================================
 *  РАЗДЕЛ 6: Модель пункта меню
 * ========================================================================== */

/**
 * Элемент меню (сортировка, категория, поиск).
 * @param {string} t - Заголовок пункта
 * @param {string} a - URL (playlist_url)
 * @param {*} n - Флаг "search_on" (поиск) или undefined
 * @param {Array} r - Подменю (опционально)
 */
var MenuItem = _createClass((function e(t, a, n, r) {
  _classCallCheck(this, e),
    this.title = t,
    this.playlist_url = a,
    n && (this.search_on = n),
    r && (this.submenu = r)
}));

/* ==========================================================================
 *  РАЗДЕЛ 7: UI-интеграция с Lampa
 * ========================================================================== */
! function() {
  var PLUGIN_NAME = "AdultJS"; // Имя плагина для Lampa

  // Локализация
  Lampa.Lang.add({
    lampac_adultName: { ru: "Для взрослых", en: "Adult 18+", uk: "Для взрослых", zh: "Adult 18+" }
  });

  // Экземпляр HTTP-клиента Lampa (для отмены запросов)
  var lampaRequest = new Lampa.Reguest;

  // ================================================================
  // Вспомогательные функции
  // ================================================================

  /**
   * Выбирает видео лучшего качества из объекта качеств.
   * Например: qualitys = { "240p": "url1", "720p": "url2", "1080p": "url3" }
   * Берётся качество из настроек Lampa, иначе — максимальное доступное.
   *
   * @param {Object} e - { "240p": "url", "720p": "url", ... }
   * @returns {string|undefined} - URL видео выбранного качества
   */
  function selectQuality(e) {
    var best, preferred = Lampa.Storage.get("video_quality_default", "1080") + "p";
    if (e) {
      // Ищем предпочтительное качество
      for (var key in e) {
        if (key.indexOf(preferred) !== -1) best = e[key];
      }
      // Fallback: первое доступное
      if (!best) {
        var keys = Object.keys(e);
        // Сортируем по убыванию качества
        keys.sort(function(a, b) {
          return parseInt(b) - parseInt(a);
        });
        if (keys.length) best = e[keys[0]];
      }
    }
    return best;
  }

  /**
   * Скрывает и останавливает предпросмотр видео.
   */
  var previewTimer, previewContainer;
  function hidePreview() {
    clearTimeout(previewTimer);
    if (previewContainer) {
      try { previewContainer.find("video")[0].pause(); } catch (e) {}
      previewContainer.addClass("hide");
      previewContainer = false;
    }
  }

  // ================================================================
  // Объект с утилитами UI
  // ================================================================
  var UI = {
    /** Форматирует название сайта для меню. */
    sourceTitle: function(title) {
      return Lampa.Utils.capitalizeFirstLetter(title.split(".")[0]);
    },

    /**
     * Запускает воспроизведение видео через встроенный плеер Lampa.
     * @param {VideoItem} item - Видео-элемент
     */
    play: function(item) {
      var controllerName = Lampa.Controller.enabled().name;

      if (item.json) {
        // --- Нужно сначала получить потоки ---
        Lampa.Loading.start(function() {
          lampaRequest.clear();
          Lampa.Loading.stop();
        });

        Trahkino.Invoke(item.video).then(function(result) {
          if (result.qualitys && Object.keys(result.qualitys).length === 0) {
            Lampa.Noty.show("Не удалось найти видео");
            Lampa.Loading.stop();
            return;
          }

          var qualities = result.qualitys;
          var recomends = result.recomends || [];
          Lampa.Loading.stop();

          // Формируем объект для плеера
          var playerObj = {
            title: item.name,
            url: selectQuality(qualities),
            quality: qualities
          };

          Lampa.Player.play(playerObj);

          // Плейлист из похожих видео
          var playlist = recomends.length ? recomends : [playerObj];
          Lampa.Player.playlist(playlist);

          // Возврат к контроллеру после закрытия плеера
          Lampa.Player.callback(function() {
            Lampa.Controller.toggle(controllerName);
          });
        }).catch(function() {
          Lampa.Noty.show("Ошибка загрузки видео");
          Lampa.Loading.stop();
        });

      } else {
        // --- Прямая ссылка на видео ---
        var playerObj = {
          title: item.name,
          url: item.video,
          quality: item.qualitys
        };
        Lampa.Player.play(playerObj);
        Lampa.Player.playlist([playerObj]);
        Lampa.Player.callback(function() {
          Lampa.Controller.toggle(controllerName);
        });
      }
    },

    /** Нормализует карточки для отображения в Lampa. */
    fixCards: function(items) {
      items.forEach(function(item) {
        item.background_image = item.picture;
        item.poster = item.picture;
        item.img = item.picture;
        item.name = Lampa.Utils.capitalizeFirstLetter(item.name).replace(/\&(.*?);/g, "");
      });
    },

    /** Заменяет отсутствующее качество на длительность. */
    fixList: function(items) {
      items.forEach(function(item) {
        if (!item.quality && item.time) item.quality = item.time;
      });
      return items;
    },

    /**
     * Показывает превью-видео при наведении на карточку (задержка 1.5 сек).
     * @param {jQuery} elem - DOM-элемент карточки
     * @param {VideoItem} item - Видео-элемент
     */
    preview: function(elem, item) {
      hidePreview();
      previewTimer = setTimeout(function() {
        if (item.preview && Lampa.Storage.field("sisi_preview")) {
          var videoEl = elem.find("video");
          var container = elem.find(".sisi-video-preview");

          if (!videoEl) {
            videoEl = document.createElement("video");
            container = document.createElement("div");
            container.addClass("sisi-video-preview");
            // Стили для оверлея превью
            container.style.cssText = "position:absolute;width:100%;height:100%;left:0;top:0;overflow:hidden;border-radius:1em;";
            videoEl.style.cssText = "position:absolute;width:100%;height:100%;left:0;top:0;object-fit:cover;";
            container.append(videoEl);
            elem.find(".card__view").append(container);
            videoEl.src = item.preview;
            videoEl.addEventListener("ended", function() { container.addClass("hide"); });
            videoEl.load();
          }

          previewContainer = container;
          try { videoEl.play(); } catch (e) {}
          container.removeClass("hide");
        }
      }, 1500);
    },

    /** Контекстное меню (похожие видео). */
    menu: function(elem, item) {
      var items = [];
      if (item.related) items.push({ title: "Похожие", related: true });
      Lampa.Select.show({
        title: "Меню",
        items: items,
        onSelect: function(selected) {
          if (selected.related) {
            Lampa.Activity.push({
              url: item.video + "&related",
              title: "Похожие - " + item.title,
              component: "sisi_view_" + PLUGIN_NAME,
              page: 1
            });
          }
        },
        onBack: function() { Lampa.Controller.toggle("content"); }
      });
    }
  };

  // ================================================================
  // Контроллер основного экрана (список сайтов → каталог)
  // ================================================================

  /**
   * Создаёт контроллер InteractionMain — главный экран плагина.
   * Показывает каталог trahkino.me.
   */
  function createMainController(params) {
    var controller = new Lampa.InteractionMain(params);

    controller.create = function() {
      this.activity.loader(true);
      loadMain(params, this.build.bind(this), this.empty.bind(this));
      return this.render();
    };

    controller.empty = function(msg) {
      var empty = new Lampa.Empty({
        descr: typeof msg === "string" ? msg : Lampa.Lang.translate("empty_text_two")
      });
      Lampa.Activity.all().forEach(function(a) {
        if (this.activity == a.activity) {
          a.activity.render().find(".activity__body > div")[0].appendChild(empty.render(true));
        }
      }.bind(this));
      this.start = empty.start.bind(empty);
      this.activity.loader(false);
      this.activity.toggle();
    };

    controller.onMore = function(item) {
      Lampa.Activity.push({
        url: item.url,
        title: item.title,
        component: "sisi_view_" + PLUGIN_NAME,
        page: 2
      });
    };

    controller.onAppend = function(container, item) {
      var origFocus = item.onFocus;
      item.onFocus = function(elem, data) {
        origFocus(elem, data);
        UI.preview(elem, data);
      };
    };

    return controller;
  }

  /**
   * Загружает каталог с trahkino.me и передаёт данные контроллеру.
   */
  function loadMain(params, onSuccess, onError) {
    Trahkino.Invoke(params.url || "").then(function(result) {
      if (result.list) {
        result.results = UI.fixList(result.list);
        result.collection = true;
        result.total_pages = 30; // TODO: парсить реальное число страниц
        UI.fixCards(result.results);
        delete result.list;
        onSuccess(result);
      } else {
        onError();
      }
    }).catch(function() {
      console.log("Trahkino", "ошибка загрузки", params.url);
      onError();
    });
  }

  // ================================================================
  // Контроллер просмотра каталога (категории/сортировка/поиск)
  // ================================================================

  /**
   * Создаёт контроллер InteractionCategory — просмотр каталога
   * с фильтрами и постраничной навигацией.
   */
  function createCategoryController(params) {
    var controller = new Lampa.InteractionCategory(params);
    var menuData = null;

    controller.create = function() {
      var self = this;
      this.activity.loader(true);

      Trahkino.Invoke(params).then(function(result) {
        menuData = result.menu;
        if (menuData) {
          menuData.forEach(function(item) {
            var parts = item.title.split(":");
            item.title = parts[0].trim();
            if (parts[1]) {
              item.subtitle = Lampa.Utils.capitalizeFirstLetter(parts[1].trim().replace(/all/i, "Любой"));
            }
            // Форматирование подменю
            if (item.submenu) {
              item.submenu.forEach(function(sub) {
                sub.title = Lampa.Utils.capitalizeFirstLetter(sub.title.trim().replace(/all/i, "Любой"));
              });
            }
          });
        }

        self.build(result);
        controller.render().find(".category-full").addClass("mapping--grid cols--3");
      }.bind(this), this.empty.bind(this));
    };

    controller.nextPageReuest = function(url, onSuccess, onError) {
      Trahkino.Invoke(url).then(onSuccess.bind(this), onError.bind(this));
    };

    controller.cardRender = function(elem, item, events) {
      events.onMenu = function() { return UI.menu(elem, item); };
      events.onEnter = function() { hidePreview(); UI.play(item); };
      var origFocus = events.onFocus;
      events.onFocus = function(elem, data) {
        origFocus(elem, data);
        UI.preview(elem, data);
      };
    };

    /** Открывает панель фильтров (поиск + сортировка). */
    controller.filter = function() {
      if (!menuData) return;
      var items = menuData.filter(function(i) { return !i.search_on; });
      var searchItem = menuData.find(function(i) { return i.search_on; });

      if (searchItem) {
        items.unshift({
          title: "Найти",
          onSelect: function() {
            $("body").addClass("ambience--enable");
            Lampa.Input.edit({
              title: "Поиск",
              value: "",
              free: true,
              nosave: true
            }, function(query) {
              $("body").removeClass("ambience--enable");
              Lampa.Controller.toggle("content");
              if (query) {
                Lampa.Activity.push({
                  url: Trahkino.host + "/search/q/" + encodeURIComponent(query) + "/",
                  title: "Поиск - " + query,
                  component: "sisi_view_" + PLUGIN_NAME,
                  page: 1
                });
              }
            });
          }
        });
      }

      Lampa.Select.show({
        title: "Фильтр",
        items: items,
        onBack: function() { Lampa.Controller.toggle("content"); },
        onSelect: function(selected) {
          if (selected.submenu) {
            Lampa.Select.show({
              title: selected.title,
              items: selected.submenu,
              onBack: function() { controller.filter(); },
              onSelect: function(sub) {
                Lampa.Activity.push({
                  url: sub.playlist_url,
                  title: selected.title,
                  component: "sisi_view_" + PLUGIN_NAME,
                  page: 1
                });
              }
            });
          }
        }
      });
    };

    controller.onRight = controller.filter.bind(controller);
    return controller;
  }

  // ================================================================
  // Создание пункта меню в Lampa
  // ================================================================

  /**
   * Создаёт пункт меню в боковой панели Lampa и настраивает
   * кнопку фильтра в шапке.
   */
  function createMenuEntry() {
    // HTML-элемент пункта меню
    var menuItem = $('<li class="menu__item selector" data-action="trahkino">' +
      '<div class="menu__ico">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512" fill="currentColor">' +
          '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>' +
        '</svg>' +
      '</div>' +
      '<div class="menu__text">' + Lampa.Lang.translate("lampac_adultName") + '</div>' +
    '</li>');

    // Метка "TK" на иконке
    var badge = $("<div>TK</div>");
    badge.css({
      position: "absolute", right: "-0.4em", bottom: "-0.4em",
      color: "#fff", fontSize: "0.6em", borderRadius: "0.5em",
      fontWeight: 900, textTransform: "uppercase"
    });
    menuItem.find(".menu__ico").css("position", "relative").append(badge);

    // Обработка нажатия на пункт меню
    menuItem.on("hover:enter", function() {
      Lampa.Activity.push({
        url: Trahkino.host + "/",
        title: "Trahkino",
        component: "sisi_view_" + PLUGIN_NAME,
        page: 1
      });
    });

    // Добавляем в боковое меню Lampa
    $(".menu .menu__list").eq(0).append(menuItem);

    // ================================================================
    // Кнопка фильтра в шапке (показывается только в компоненте sisi_view)
    // ================================================================
    (function() {
      var currentActivity;
      var hideTimer;

      var filterBtn = $('<div class="head__action head__settings selector">' +
        '<svg height="36" viewBox="0 0 38 36" fill="none" xmlns="http://www.w3.org/2000/svg">' +
          '<rect x="1.5" y="1.5" width="35" height="33" rx="1.5" stroke="currentColor" stroke-width="3"/>' +
          '<rect x="7" y="8" width="24" height="3" rx="1.5" fill="currentColor"/>' +
          '<rect x="7" y="16" width="24" height="3" rx="1.5" fill="currentColor"/>' +
          '<rect x="7" y="25" width="24" height="3" rx="1.5" fill="currentColor"/>' +
        '</svg>' +
      '</div>');

      filterBtn.hide();

      // Нажатие на кнопку фильтра
      filterBtn.on("hover:enter", function() {
        if (currentActivity) {
          var comp = currentActivity.component;
          if (typeof comp === "function") comp = comp();
          if (comp && comp.filter) comp.filter();
        }
      });

      // Вставляем кнопку после кнопки поиска в шапке
      $(".head .open--search").after(filterBtn);

      // Показываем/скрываем кнопку фильтра в зависимости от активного экрана
      Lampa.Listener.follow("activity", function(event) {
        if (event.type === "start") {
          currentActivity = event.object;
          clearTimeout(hideTimer);
          hideTimer = setTimeout(function() {
            if (currentActivity && currentActivity.component !== "sisi_view_" + PLUGIN_NAME) {
              filterBtn.hide();
              currentActivity = false;
            }
          }, 1e3);
          if (event.component === "sisi_view_" + PLUGIN_NAME) {
            filterBtn.show();
            currentActivity = event.object;
          }
        }
      });
    })();

    // ================================================================
    // Настройка предпросмотра (toggle в настройках Lampa)
    // ================================================================
    if (!window.sisi_add_param_ready) {
      window.sisi_add_param_ready = true;
      Lampa.SettingsApi.addComponent({
        component: "Trahkino",
        name: Lampa.Lang.translate("lampac_adultName"),
        icon: '<svg width="200" height="243" viewBox="0 0 200 243" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 10C55 10 20 45 20 90s35 80 80 80 80-35 80-80S145 10 100 10z" stroke="currentColor" stroke-width="10"/></svg>'
      });
      Lampa.SettingsApi.addParam({
        component: "Trahkino",
        param: { name: "sisi_preview", type: "trigger", values: "", default: true },
        field: {
          name: "Предпросмотр",
          description: "Показывать предпросмотр при наведение на карточку"
        }
      });
    }
  }

  // ================================================================
  // Регистрация компонентов и запуск
  // ================================================================
  window["plugin_trahkino_ready"] || function() {
    // Предотвращаем повторную инициализацию
    window["plugin_trahkino_ready"] = true;

    // Регистрируем компоненты Lampa:
    // "sisi_AdultJS"  — главный экран ( InteractionMain )
    // "sisi_view_AdultJS" — каталог с фильтрами ( InteractionCategory )
    Lampa.Component.add("sisi_" + PLUGIN_NAME, createMainController);
    Lampa.Component.add("sisi_view_" + PLUGIN_NAME, createCategoryController);

    // Если приложение уже загружено — создаём меню сразу,
    // иначе ждём события "ready"
    if (window.appready) {
      createMenuEntry();
    } else {
      Lampa.Listener.follow("app", function(event) {
        if (event.type === "ready") createMenuEntry();
      });
    }
  }();
}();
