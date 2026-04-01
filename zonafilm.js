// ==========================================================================
// СОКРАЩЁННАЯ ВЕРСИЯ ПЛАГИНА AdultJS — ТОЛЬКО TrahKino.me
// ==========================================================================
// Оригинальный файл: zonafilm_Trahkino_Log.js (6263 строк)
// Данная версия содержит только код, необходимый для парсинга сайта
// trahkino.me через универсальную систему NextHub.
//
// Удалено:
//   - Парсеры BongaCams, XVIDEOS, XNXX, SpankBang, Chaturbate, Eporner
//   - Конфигурации ~28 других сайтов из массива P
//   - Соответствующие роуты в диспетчере
//
// Оставлено:
//   - Babel polyfills для async/await и классов
//   - Интеграция с фреймворком Lampa (UI, API, компоненты)
//   - HTTP-клиент (fetch + Native для Android)
//   - Система NextHub (универсальный конфигурируемый парсер)
//   - Конфигурация TrahKino.me
//   - Упрощённый роутер и глобальный объект AdultJS
//
// Архитектура запросов для TrahKino:
//   1. Пользователь открывает TrahKino в меню
//   2. URL формируется как nexthub://TrahKino?mode=list
//   3. NextHub.buildListUrl() создаёт URL списка (например /latest-updates/1/)
//   4. HTTP.Get() загружает HTML-страницу
//   5. NextHub.toPlaylist() парсит HTML через XPath и создаёт массив VideoItem
//   6. При клике на видео:
//      a. URL страницы видео передаётся через nexthub://TrahKino?mode=view&href=...
//      b. NextHub.extractStreams() загружает страницу и ищет ссылки через regexMatch
//      c. Паттерн: function/0/(https://.../get_file/..._1080p.mp4)/
//      d. Возвращает StreamResult с объектом { auto: url }
//
// ПРИМЕЧАНИЕ: CORS-проблема
//   HTTP.Get() использует fetch() для не-Android устройств.
//   fetch() блокируется CORS-политикой браузера при запросах к trahkino.me.
//   Для обхода необходим серверный прокси или использование Native HTTP.
// ==========================================================================


"use strict";

// [ВСТАВЬТЕ СЮДА МОДУЛЬ ЛОГИРОВАНИЯ]
class PluginLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      message,
      data: data ? JSON.stringify(data, null, 2) : null,
    };
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    console.log(`[AdultJS] ${message}`, data);
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

const logger = new PluginLogger();
// [КОНЕЦ ВСТАВКИ]
function _toConsumableArray(e) {
  return (
    _arrayWithoutHoles(e) ||
    _iterableToArray(e) ||
    _unsupportedIterableToArray(e) ||
    _nonIterableSpread()
  );
}
function _nonIterableSpread() {
  throw new TypeError(
    "Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.",
  );
}
function _iterableToArray(e) {
  if (
    ("undefined" != typeof Symbol && null != e[Symbol.iterator]) ||
    null != e["@@iterator"]
  )
    return Array.from(e);
}
function _arrayWithoutHoles(e) {
  if (Array.isArray(e)) return _arrayLikeToArray(e);
}
function _slicedToArray(e, t) {
  return (
    _arrayWithHoles(e) ||
    _iterableToArrayLimit(e, t) ||
    _unsupportedIterableToArray(e, t) ||
    _nonIterableRest()
  );
}
function _nonIterableRest() {
  throw new TypeError(
    "Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.",
  );
}
function _iterableToArrayLimit(e, t) {
  var a =
    null == e
      ? null
      : ("undefined" != typeof Symbol && e[Symbol.iterator]) || e["@@iterator"];
  if (null != a) {
    var n,
      r,
      i,
      o,
      s = [],
      l = !0,
      c = !1;
    try {
      if (((i = (a = a.call(e)).next), 0 === t)) {
        if (Object(a) !== a) return;
        l = !1;
      } else
        for (
          ;
          !(l = (n = i.call(a)).done) && (s.push(n.value), s.length !== t);
          l = !0
        );
    } catch (e) {
      ((c = !0), (r = e));
    } finally {
      try {
        if (!l && null != a.return && ((o = a.return()), Object(o) !== o))
          return;
      } finally {
        if (c) throw r;
      }
    }
    return s;
  }
}
function _arrayWithHoles(e) {
  if (Array.isArray(e)) return e;
}
function _createForOfIteratorHelper(e, t) {
  var a =
    ("undefined" != typeof Symbol && e[Symbol.iterator]) || e["@@iterator"];
  if (!a) {
    if (
      Array.isArray(e) ||
      (a = _unsupportedIterableToArray(e)) ||
      (t && e && "number" == typeof e.length)
    ) {
      a && (e = a);
      var n = 0,
        r = function () {};
      return {
        s: r,
        n: function () {
          return n >= e.length ? { done: !0 } : { done: !1, value: e[n++] };
        },
        e: function (e) {
          throw e;
        },
        f: r,
      };
    }
    throw new TypeError(
      "Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.",
    );
  }
  var i,
    o = !0,
    s = !1;
  return {
    s: function () {
      a = a.call(e);
    },
    n: function () {
      var e = a.next();
      return ((o = e.done), e);
    },
    e: function (e) {
      ((s = !0), (i = e));
    },
    f: function () {
      try {
        o || null == a.return || a.return();
      } finally {
        if (s) throw i;
      }
    },
  };
}
function _unsupportedIterableToArray(e, t) {
  if (e) {
    if ("string" == typeof e) return _arrayLikeToArray(e, t);
    var a = {}.toString.call(e).slice(8, -1);
    return (
      "Object" === a && e.constructor && (a = e.constructor.name),
      "Map" === a || "Set" === a
        ? Array.from(e)
        : "Arguments" === a ||
            /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(a)
          ? _arrayLikeToArray(e, t)
          : void 0
    );
  }
}
function _arrayLikeToArray(e, t) {
  (null == t || t > e.length) && (t = e.length);
  for (var a = 0, n = Array(t); a < t; a++) n[a] = e[a];
  return n;
}
function _typeof(e) {
  return (
    (_typeof =
      "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
        ? function (e) {
            return typeof e;
          }
        : function (e) {
            return e &&
              "function" == typeof Symbol &&
              e.constructor === Symbol &&
              e !== Symbol.prototype
              ? "symbol"
              : typeof e;
          }),
    _typeof(e)
  );
}
function _regenerator() {
  /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e,
    t,
    a = "function" == typeof Symbol ? Symbol : {},
    n = a.iterator || "@@iterator",
    r = a.toStringTag || "@@toStringTag";
  function i(a, n, r, i) {
    var l = n && n.prototype instanceof s ? n : s,
      c = Object.create(l.prototype);
    return (
      _regeneratorDefine2(
        c,
        "_invoke",
        (function (a, n, r) {
          var i,
            s,
            l,
            c = 0,
            u = r || [],
            p = !1,
            d = {
              p: 0,
              n: 0,
              v: e,
              a: h,
              f: h.bind(e, 4),
              d: function (t, a) {
                return ((i = t), (s = 0), (l = e), (d.n = a), o);
              },
            };
          function h(a, n) {
            for (s = a, l = n, t = 0; !p && c && !r && t < u.length; t++) {
              var r,
                i = u[t],
                h = d.p,
                m = i[2];
              a > 3
                ? (r = m === n) &&
                  ((l = i[(s = i[4]) ? 5 : ((s = 3), 3)]), (i[4] = i[5] = e))
                : i[0] <= h &&
                  ((r = a < 2 && h < i[1])
                    ? ((s = 0), (d.v = n), (d.n = i[1]))
                    : h < m &&
                      (r = a < 3 || i[0] > n || n > m) &&
                      ((i[4] = a), (i[5] = n), (d.n = m), (s = 0)));
            }
            if (r || a > 1) return o;
            throw ((p = !0), n);
          }
          return function (r, u, m) {
            if (c > 1) throw TypeError("Generator is already running");
            for (
              p && 1 === u && h(u, m), s = u, l = m;
              (t = s < 2 ? e : l) || !p;
            ) {
              i ||
                (s
                  ? s < 3
                    ? (s > 1 && (d.n = -1), h(s, l))
                    : (d.n = l)
                  : (d.v = l));
              try {
                if (((c = 2), i)) {
                  if ((s || (r = "next"), (t = i[r]))) {
                    if (!(t = t.call(i, l)))
                      throw TypeError("iterator result is not an object");
                    if (!t.done) return t;
                    ((l = t.value), s < 2 && (s = 0));
                  } else
                    (1 === s && (t = i.return) && t.call(i),
                      s < 2 &&
                        ((l = TypeError(
                          "The iterator does not provide a '" + r + "' method",
                        )),
                        (s = 1)));
                  i = e;
                } else if ((t = (p = d.n < 0) ? l : a.call(n, d)) !== o) break;
              } catch (t) {
                ((i = e), (s = 1), (l = t));
              } finally {
                c = 1;
              }
            }
            return { value: t, done: p };
          };
        })(a, r, i),
        !0,
      ),
      c
    );
  }
  var o = {};
  function s() {}
  function l() {}
  function c() {}
  t = Object.getPrototypeOf;
  var u = [][n]
      ? t(t([][n]()))
      : (_regeneratorDefine2((t = {}), n, function () {
          return this;
        }),
        t),
    p = (c.prototype = s.prototype = Object.create(u));
  function d(e) {
    return (
      Object.setPrototypeOf
        ? Object.setPrototypeOf(e, c)
        : ((e.__proto__ = c), _regeneratorDefine2(e, r, "GeneratorFunction")),
      (e.prototype = Object.create(p)),
      e
    );
  }
  return (
    (l.prototype = c),
    _regeneratorDefine2(p, "constructor", c),
    _regeneratorDefine2(c, "constructor", l),
    (l.displayName = "GeneratorFunction"),
    _regeneratorDefine2(c, r, "GeneratorFunction"),
    _regeneratorDefine2(p),
    _regeneratorDefine2(p, r, "Generator"),
    _regeneratorDefine2(p, n, function () {
      return this;
    }),
    _regeneratorDefine2(p, "toString", function () {
      return "[object Generator]";
    }),
    (_regenerator = function () {
      return { w: i, m: d };
    })()
  );
}
function _regeneratorDefine2(e, t, a, n) {
  var r = Object.defineProperty;
  try {
    r({}, "", {});
  } catch (e) {
    r = 0;
  }
  ((_regeneratorDefine2 = function (e, t, a, n) {
    if (t)
      r
        ? r(e, t, { value: a, enumerable: !n, configurable: !n, writable: !n })
        : (e[t] = a);
    else {
      var i = function (t, a) {
        _regeneratorDefine2(e, t, function (e) {
          return this._invoke(t, a, e);
        });
      };
      (i("next", 0), i("throw", 1), i("return", 2));
    }
  }),
    _regeneratorDefine2(e, t, a, n));
}
function asyncGeneratorStep(e, t, a, n, r, i, o) {
  try {
    var s = e[i](o),
      l = s.value;
  } catch (e) {
    return void a(e);
  }
  s.done ? t(l) : Promise.resolve(l).then(n, r);
}
function _asyncToGenerator(e) {
  return function () {
    var t = this,
      a = arguments;
    return new Promise(function (n, r) {
      var i = e.apply(t, a);
      function o(e) {
        asyncGeneratorStep(i, n, r, o, s, "next", e);
      }
      function s(e) {
        asyncGeneratorStep(i, n, r, o, s, "throw", e);
      }
      o(void 0);
    });
  };
}
function ownKeys(e, t) {
  var a = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    (t &&
      (n = n.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })),
      a.push.apply(a, n));
  }
  return a;
}
function _objectSpread(e) {
  for (var t = 1; t < arguments.length; t++) {
    var a = null != arguments[t] ? arguments[t] : {};
    t % 2
      ? ownKeys(Object(a), !0).forEach(function (t) {
          _defineProperty(e, t, a[t]);
        })
      : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(a))
        : ownKeys(Object(a)).forEach(function (t) {
            Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(a, t));
          });
  }
  return e;
}
function _defineProperty(e, t, a) {
  return (
    (t = _toPropertyKey(t)) in e
      ? Object.defineProperty(e, t, {
          value: a,
          enumerable: !0,
          configurable: !0,
          writable: !0,
        })
      : (e[t] = a),
    e
  );
}
function _classCallCheck(e, t) {
  if (!(e instanceof t))
    throw new TypeError("Cannot call a class as a function");
}
function _defineProperties(e, t) {
  for (var a = 0; a < t.length; a++) {
    var n = t[a];
    ((n.enumerable = n.enumerable || !1),
      (n.configurable = !0),
      "value" in n && (n.writable = !0),
      Object.defineProperty(e, _toPropertyKey(n.key), n));
  }
}
function _createClass(e, t, a) {
  return (
    t && _defineProperties(e.prototype, t),
    a && _defineProperties(e, a),
    Object.defineProperty(e, "prototype", { writable: !1 }),
    e
  );
}
function _toPropertyKey(e) {
  var t = _toPrimitive(e, "string");
  return "symbol" == _typeof(t) ? t : t + "";
}
function _toPrimitive(e, t) {
  if ("object" != _typeof(e) || !e) return e;
  var a = e[Symbol.toPrimitive];
  if (void 0 !== a) {
    var n = a.call(e, t || "default");
    if ("object" != _typeof(n)) return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === t ? String : Number)(e);
}

// ====================================================================
// ОСНОВНОЙ МОДУЛЬ ПЛАГИНА: Интеграция с фреймворком Lampa
// Включает: локализацию, UI-помощники (проигрыватель, превью, карточки),
// API-сервис (меню, просмотр, плейлист, поиск, качества)
// ====================================================================
!(function (e, t, a, n, r, i, o, s) {
  !(function () {
    var e = "AdultJS";
    Lampa.Lang.add({
      lampac_adultName: {
        ru: "Adult JS",
        en: "Adult 18+",
        uk: "Для взрослых",
        zh: "Adult 18+",
      },
    });
    var t,
      a,
      n = new Lampa.Reguest();
    function r(e) {
      var t,
        a = Lampa.Storage.get("video_quality_default", "1080") + "p";
      if (e) {
        for (var n in e) 0 == n.indexOf(a) && (t = e[n]);
        t || (t = e[Lampa.Arrays.getKeys(e)[0]]);
      }
      return t;
    }
    function i() {
      if ((clearTimeout(t), a)) {
        var e,
          n = a.find("video");
        try {
          e = n.pause();
        } catch (e) {}
        (void 0 !== e && e.then(function () {}).catch(function (e) {}),
          a.addClass("hide"),
          (a = !1));
      }
    }
    var o,
      s = {
        sourceTitle: function (e) {
          return Lampa.Utils.capitalizeFirstLetter(e.split(".")[0]);
        },
        play: function (e) {
          var t = Lampa.Controller.enabled().name;
          if (e.json)
            (Lampa.Loading.start(function () {
              (n.clear(), Lampa.Loading.stop());
            }),
              l.qualitys(
                e.video,
                function (a) {
                  if (a.error)
                    return (
                      Lampa.Noty.show(
                        Lampa.Lang.translate("torrent_parser_nofiles"),
                      ),
                      void Lampa.Loading.stop()
                    );
                  var n = a.qualitys || a,
                    i = a.recomends || [];
                  Lampa.Loading.stop();
                  var o = {
                    title: e.name,
                    url: r(n),
                    url_reserve: !!a.qualitys_proxy && r(a.qualitys_proxy),
                    quality: n,
                    headers: a.headers_stream,
                  };
                  (Lampa.Player.play(o),
                    i.length
                      ? (i.forEach(function (e) {
                          ((e.title = Lampa.Utils.shortText(e.name, 50)),
                            (e.icon =
                              '<img class="size-youtube" src="' +
                              e.picture +
                              '" />'),
                            (e.template = "selectbox_icon"),
                            (e.url = function (t) {
                              e.json
                                ? l.qualitys(e.video, function (a) {
                                    ((e.quality = a.qualitys),
                                      (e.url = r(a.qualitys)),
                                      a.qualitys_proxy &&
                                        (e.url_reserve = r(a.qualitys_proxy)),
                                      t());
                                  })
                                : ((e.url = e.video), t());
                            }));
                        }),
                        Lampa.Player.playlist(i))
                      : Lampa.Player.playlist([o]),
                    Lampa.Player.callback(function () {
                      Lampa.Controller.toggle(t);
                    }));
                },
                function () {
                  (Lampa.Noty.show(
                    Lampa.Lang.translate("torrent_parser_nofiles"),
                  ),
                    Lampa.Loading.stop());
                },
              ));
          else {
            var a = {
              title: e.name,
              url: r(e.qualitys) || e.video,
              url_reserve: r(e.qualitys_proxy) || e.video_reserve || "",
              quality: e.qualitys,
            };
            (Lampa.Player.play(a),
              Lampa.Player.playlist([a]),
              Lampa.Player.callback(function () {
                Lampa.Controller.toggle(t);
              }));
          }
        },
        fixCards: function (e) {
          e.forEach(function (e) {
            ((e.background_image = e.picture),
              (e.poster = e.picture),
              (e.img = e.picture),
              (e.name = Lampa.Utils.capitalizeFirstLetter(e.name).replace(
                /\&(.*?);/g,
                "",
              )));
          });
        },
        preview: function (e, n) {
          (i(),
            (t = setTimeout(function () {
              if (n.preview && Lampa.Storage.field("sisi_preview")) {
                var t,
                  r = e.find("video"),
                  i = e.find(".sisi-video-preview");
                (r ||
                  ((r = document.createElement("video")),
                  (i = document.createElement("div")).addClass(
                    "sisi-video-preview",
                  ),
                  (i.style.position = "absolute"),
                  (i.style.width = "100%"),
                  (i.style.height = "100%"),
                  (i.style.left = "0"),
                  (i.style.top = "0"),
                  (i.style.overflow = "hidden"),
                  (i.style.borderRadius = "1em"),
                  (r.style.position = "absolute"),
                  (r.style.width = "100%"),
                  (r.style.height = "100%"),
                  (r.style.left = "0"),
                  (r.style.top = "0"),
                  (r.style.objectFit = "cover"),
                  i.append(r),
                  e.find(".card__view").append(i),
                  (r.src = n.preview),
                  r.addEventListener("ended", function () {
                    i.addClass("hide");
                  }),
                  r.load()),
                  (a = i));
                try {
                  t = r.play();
                } catch (e) {}
                (void 0 !== t && t.then(function () {}).catch(function (e) {}),
                  i.removeClass("hide"));
              }
            }, 1500)));
        },
        hidePreview: i,
        fixList: function (e) {
          return (
            e.forEach(function (e) {
              !e.quality && e.time && (e.quality = e.time);
            }),
            e
          );
        },
        menu: function (t, a) {
          var n = [];
          (a.related && n.push({ title: "Похожие", related: !0 }),
            a.model && n.push({ title: a.model.name, model: !0 }),
            Lampa.Select.show({
              title: "Меню",
              items: n,
              onSelect: function (t) {
                t.model
                  ? Lampa.Activity.push({
                      url: a.model.uri,
                      title: "Модель - " + a.model.name,
                      component: "sisi_view_" + e,
                      page: 1,
                    })
                  : t.related &&
                    Lampa.Activity.push({
                      url: a.video + "&related",
                      title: "Похожие - " + a.title,
                      component: "sisi_view_" + e,
                      page: 1,
                    });
              },
              onBack: function () {
                Lampa.Controller.toggle("content");
              },
            }));
        },
      };
    var l = new (function () {
      var e = this,
        t = new Lampa.Reguest();
      ((this.menu = function (e, t) {
        if (o) return e(o);
        var a = AdultJS.Menu();
        a ? e((o = a)) : t(a.msg);
      }),
        (this.view = function (e, t, a) {
          AdultJS.Invoke(
            Lampa.Utils.addUrlComponent(e.url, "pg=" + (e.page || 1)),
          )
            .then(function (e) {
              e.list
                ? ((e.results = s.fixList(e.list)),
                  (e.collection = !0),
                  (e.total_pages = e.total_pages || 30),
                  s.fixCards(e.results),
                  delete e.list,
                  t(e))
                : a();
            })
            .catch(function () {
              (console.log("AdultJS", "no load", e.url), a());
            });
        }),
        (this.playlist = function (t, a, n) {
          var r = function () {
            var e = new Lampa.Status(o.length);
            ((e.onComplite = function (e) {
              var t = [];
              (o.forEach(function (a) {
                e[a.playlist_url] &&
                  e[a.playlist_url].results.length &&
                  t.push(e[a.playlist_url]);
              }),
                t.length ? a(t) : n());
            }),
              o.forEach(function (a, n) {
                var r = -1 !== a.playlist_url.indexOf("?") ? "&" : "?",
                  i =
                    -1 !== t.indexOf("?") || -1 !== t.indexOf("&")
                      ? t.substring(1)
                      : t,
                  o = !1,
                  l = setTimeout(function () {
                    ((o = !0), e.error());
                  }, 8e3);
                AdultJS.Invoke(a.playlist_url + r + i)
                  .then(function (t) {
                    (clearTimeout(l),
                      o ||
                        (t.list
                          ? ((t.title = s.sourceTitle(a.title)),
                            (t.results = s.fixList(t.list)),
                            (t.url = a.playlist_url),
                            (t.collection = !0),
                            (t.line_type = "none"),
                            (t.card_events = {
                              onMenu: s.menu,
                              onEnter: function (e, t) {
                                (s.hidePreview(), s.play(t));
                              },
                            }),
                            s.fixCards(t.results),
                            delete t.list,
                            e.append(a.playlist_url, t))
                          : e.error()));
                  })
                  .catch(function () {
                    (console.log("AdultJS", "no load", a.playlist_url + r + i),
                      clearTimeout(l),
                      e.error());
                  });
              }));
          };
          o ? r() : e.menu(r, n);
        }),
        (this.main = function (e, t, a) {
          this.playlist("", t, a);
        }),
        (this.search = function (e, t, a) {
          this.playlist("?search=" + encodeURIComponent(e.query), t, a);
        }),
        (this.qualitys = function (e, t, a) {
          AdultJS.Invoke(e)
            .then(t)
            .catch(function (t) {
              (console.log("AdultJS", "no load", e), a());
            });
        }),
        (this.clear = function () {
          t.clear();
        }));
    })();

// ====================================================================
// КОМПОНЕНТЫ UI И ИНИЦИАЛИЗАЦИЯ ПЛАГИНА
// InteractionMain (c) — главная страница, InteractionCategory (u) — категории
// Создание пункта меню, кнопки настроек, регистрация компонента
// ====================================================================
    function c(t) {
      var a = new Lampa.InteractionMain(t);
      return (
        (a.create = function () {
          return (
            this.activity.loader(!0),
            l.main(t, this.build.bind(this), this.empty.bind(this)),
            this.render()
          );
        }),
        (a.empty = function (e) {
          var t = this,
            a = new Lampa.Empty({
              descr:
                "string" == typeof e
                  ? e
                  : Lampa.Lang.translate("empty_text_two"),
            });
          (Lampa.Activity.all().forEach(function (e) {
            t.activity == e.activity &&
              e.activity
                .render()
                .find(".activity__body > div")[0]
                .appendChild(a.render(!0));
          }),
            (this.start = a.start.bind(a)),
            this.activity.loader(!1),
            this.activity.toggle());
        }),
        (a.onMore = function (t) {
          Lampa.Activity.push({
            url: t.url,
            title: t.title,
            component: "sisi_view_" + e,
            page: 2,
          });
        }),
        (a.onAppend = function (e, t) {
          e.onAppend = function (e) {
            var t = e.onFocus;
            e.onFocus = function (e, a) {
              (t(e, a), s.preview(e, a));
            };
          };
        }),
        a
      );
    }
    function u(t) {
      var a,
        n = new Lampa.InteractionCategory(t);
      return (
        (n.create = function () {
          var e = this;
          (this.activity.loader(!0),
            l.view(
              t,
              function (t) {
                ((a = t.menu) &&
                  a.forEach(function (e) {
                    var t = e.title.split(":");
                    ((e.title = t[0].trim()),
                      t[1] &&
                        (e.subtitle = Lampa.Utils.capitalizeFirstLetter(
                          t[1].trim().replace(/all/i, "Любой"),
                        )),
                      e.submenu &&
                        e.submenu.forEach(function (e) {
                          e.title = Lampa.Utils.capitalizeFirstLetter(
                            e.title.trim().replace(/all/i, "Любой"),
                          );
                        }));
                  }),
                  e.build(t),
                  n
                    .render()
                    .find(".category-full")
                    .addClass("mapping--grid cols--3"));
              },
              this.empty.bind(this),
            ));
        }),
        (n.nextPageReuest = function (e, t, a) {
          l.view(e, t.bind(this), a.bind(this));
        }),
        (n.cardRender = function (e, t, a) {
          ((a.onMenu = function (e, t) {
            return s.menu(e, t);
          }),
            (a.onEnter = function () {
              (s.hidePreview(), s.play(t));
            }));
          var n = a.onFocus;
          a.onFocus = function (e, a) {
            (n(e, a), s.preview(e, t));
          };
        }),
        (n.filter = function () {
          if (a) {
            var r = a.filter(function (e) {
                return !e.search_on;
              }),
              i = a.find(function (e) {
                return e.search_on;
              });
            if ((i || (i = t.search_start), !r.length && !i)) return;
            (i &&
              Lampa.Arrays.insert(r, 0, {
                title: "Найти",
                onSelect: function () {
                  ($("body").addClass("ambience--enable"),
                    Lampa.Input.edit(
                      { title: "Поиск", value: "", free: !0, nosave: !0 },
                      function (t) {
                        if (
                          ($("body").removeClass("ambience--enable"),
                          Lampa.Controller.toggle("content"),
                          t)
                        ) {
                          var a =
                            -1 !== i.playlist_url.indexOf("?") ? "&" : "?";
                          Lampa.Activity.push({
                            url:
                              i.playlist_url +
                              a +
                              "search=" +
                              encodeURIComponent(t),
                            title: "Поиск - " + t,
                            component: "sisi_view_" + e,
                            search_start: i,
                            page: 1,
                          });
                        }
                      },
                    ));
                },
              }),
              Lampa.Select.show({
                title: "Фильтр",
                items: r,
                onBack: function () {
                  Lampa.Controller.toggle("content");
                },
                onSelect: function (r) {
                  (a.forEach(function (e) {
                    e.selected = e == r;
                  }),
                    r.submenu
                      ? Lampa.Select.show({
                          title: r.title,
                          items: r.submenu,
                          onBack: function () {
                            n.filter();
                          },
                          onSelect: function (a) {
                            Lampa.Activity.push({
                              title: t.title,
                              url: a.playlist_url,
                              component: "sisi_view_" + e,
                              page: 1,
                            });
                          },
                        })
                      : n.filter());
                },
              }));
          }
        }),
        (n.onRight = n.filter.bind(n)),
        n
      );
    }
    window["plugin_adultjs_" + e + "_ready"] ||
      (function () {
        function t() {
          var t = $(
              '<li class="menu__item selector" data-action="adultjs">\n            <div class="menu__ico">\n                <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" x="0" y="0" viewBox="0 0 29.461 29.461" style="enable-background:new 0 0 512 512" xml:space="preserve" class=""><g><path d="M28.855 13.134c-.479 0-.91-.197-1.371-.452-1.671 7.509-10.383 11.899-12.765 12.972-2.514-1.125-12.034-5.916-12.963-14.188-.043.029-.088.056-.132.084-.411.269-.797.523-1.299.523-.064 0-.121-.029-.184-.038C1.586 22.377 14.72 27.47 14.72 27.47s12.227-4.74 14.386-14.362a1.397 1.397 0 0 1-.251.026z" fill="currentColor" ></path><path d="M29.379 8.931C28.515-.733 16.628.933 14.721 6.432 12.814.932.928-.733.062 8.931c-.397 4.426 1.173.063 3.508 1.205 1.008.494 1.99 2.702 3.356 2.974 1.998.397 3.109-1.551 4.27-1.631 3.174-.222 2.394 6.596 5.424 5.586 1.961-.653 2.479-3.016 4.171-2.806 1.582.195 3.296-3.711 4.78-3.571 2.471.23 4.305 3.786 3.808-1.757z" fill="currentColor" ></path><path d="M14.894 21.534c2.286 0-.929-3.226-.588-4.511-1.994 1.276-1.697 4.511.588 4.511z" fill="currentColor"></path></g></svg>\n            </div>\n            <div class="menu__text">' +
                Lampa.Lang.translate("lampac_adultName") +
                "</div>\n        </li>",
            ),
            a = $("<div>JS</div>");
          (a.css({
            position: "absolute",
            right: "-0.4em",
            bottom: "-0.4em",
            color: "#fff",
            fontSize: "0.6em",
            borderRadius: "0.5em",
            fontWeight: 900,
            textTransform: "uppercase",
          }),
            t.find(".menu__ico").css("position", "relative").append(a),
            t.on("hover:enter", function () {
              (Lampa.ParentalControl ||
                (Lampa.ParentalControl = {
                  query: function (e, t) {
                    "function" == typeof e && e();
                  },
                }),
                Lampa.ParentalControl.query(
                  function () {
                    l.menu(
                      function (t) {
                        var a = [];
                        (t.forEach(function (e) {
                          e.title = s.sourceTitle(e.title);
                        }),
                          (a = a.concat(t)),
                          Lampa.Select.show({
                            title: "Сайты",
                            items: a,
                            onSelect: function (t) {
                              t.playlist_url
                                ? Lampa.Activity.push({
                                    url: t.playlist_url,
                                    title: t.title,
                                    component: "sisi_view_" + e,
                                    page: 1,
                                  })
                                : Lampa.Activity.push({
                                    url: "",
                                    title:
                                      Lampa.Lang.translate("lampac_adultName"),
                                    component: "sisi_" + e,
                                    page: 1,
                                  });
                            },
                            onBack: function () {
                              Lampa.Controller.toggle("menu");
                            },
                          }));
                      },
                      function () {},
                    );
                  },
                  function () {},
                ));
            }),
            $(".menu .menu__list").eq(0).append(t),
            (function () {
              var t,
                a,
                n = $(
                  '<div class="head__action head__settings selector">\n            <svg height="36" viewBox="0 0 38 36" fill="none" xmlns="http://www.w3.org/2000/svg">\n                <rect x="1.5" y="1.5" width="35" height="33" rx="1.5" stroke="currentColor" stroke-width="3"></rect>\n                <rect x="7" y="8" width="24" height="3" rx="1.5" fill="currentColor"></rect>\n                <rect x="7" y="16" width="24" height="3" rx="1.5" fill="currentColor"></rect>\n                <rect x="7" y="25" width="24" height="3" rx="1.5" fill="currentColor"></rect>\n                <circle cx="13.5" cy="17.5" r="3.5" fill="currentColor"></circle>\n                <circle cx="23.5" cy="26.5" r="3.5" fill="currentColor"></circle>\n                <circle cx="21.5" cy="9.5" r="3.5" fill="currentColor"></circle>\n            </svg>\n        </div>',
                );
              (n.hide().on("hover:enter", function () {
                t &&
                  (Lampa.Manifest.app_digital >= 300
                    ? t.activity.component.filter()
                    : t.activity.component().filter());
              }),
                $(".head .open--search").after(n),
                Lampa.Listener.follow("activity", function (r) {
                  ("start" == r.type && (t = r.object),
                    clearTimeout(a),
                    (a = setTimeout(function () {
                      t &&
                        t.component !== "sisi_view_" + e &&
                        (n.hide(), (t = !1));
                    }, 1e3)),
                    "start" == r.type &&
                      r.component == "sisi_view_" + e &&
                      (n.show(), (t = r.object)));
                }));
            })(),
            window.sisi_add_param_ready ||
              ((window.sisi_add_param_ready = !0),
              Lampa.SettingsApi.addComponent({
                component: "AdultJS",
                name: Lampa.Lang.translate("lampac_adultName"),
                icon: '<svg width="200" height="243" viewBox="0 0 200 243" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M187.714 130.727C206.862 90.1515 158.991 64.2019 100.983 64.2019C42.9759 64.2019 -4.33044 91.5669 10.875 130.727C26.0805 169.888 63.2501 235.469 100.983 234.997C138.716 234.526 168.566 171.303 187.714 130.727Z" stroke="currentColor" stroke-width="15"/><path d="M102.11 62.3146C109.995 39.6677 127.46 28.816 169.692 24.0979C172.514 56.1811 135.338 64.2018 102.11 62.3146Z" stroke="currentColor" stroke-width="15"/><path d="M90.8467 62.7863C90.2285 34.5178 66.0667 25.0419 31.7127 33.063C28.8904 65.1461 68.8826 62.7863 90.8467 62.7863Z" stroke="currentColor" stroke-width="15"/><path d="M100.421 58.5402C115.627 39.6677 127.447 13.7181 85.2149 9C82.3926 41.0832 83.5258 35.4214 100.421 58.5402Z" stroke="currentColor" stroke-width="15"/><rect x="39.0341" y="98.644" width="19.1481" height="30.1959" rx="9.57407" fill="currentColor"/><rect x="90.8467" y="92.0388" width="19.1481" height="30.1959" rx="9.57407" fill="currentColor"/><rect x="140.407" y="98.644" width="19.1481" height="30.1959" rx="9.57407" fill="currentColor"/><rect x="116.753" y="139.22" width="19.1481" height="30.1959" rx="9.57407" fill="currentColor"/><rect x="64.9404" y="139.22" width="19.1481" height="30.1959" rx="9.57407" fill="currentColor"/><rect x="93.0994" y="176.021" width="19.1481" height="30.1959" rx="9.57407" fill="currentColor"/></svg>',
              }),
              Lampa.SettingsApi.addParam({
                component: "AdultJS",
                param: {
                  name: "sisi_preview",
                  type: "trigger",
                  values: "",
                  default: !0,
                },
                field: {
                  name: "Предпросмотр",
                  description:
                    "Показывать предпросмотр при наведение на карточку",
                },
                onRender: function (e) {},
              })));
        }
        ((window["plugin_adultjs_" + e + "_ready"] = !0),
          Lampa.Component.add("sisi_" + e, c),
          Lampa.Component.add("sisi_view_" + e, u),
          window.appready
            ? t()
            : Lampa.Listener.follow("app", function (e) {
                "ready" == e.type && t();
              }));
      })();

// ====================================================================
// HTTP-КЛИЕНТ: Класс для выполнения HTTP-запросов
// ensureHeaders() — добавляет User-Agent, Get() — fetch/Native запрос,
// Native() — нативный HTTP через Lampa.Reguest (для Android)
// FIXME: fetch() блокируется CORS при запуске в браузере!
// ====================================================================
  var l =
      ((e = (function () {
        function e() {
          _classCallCheck(this, e);
        }
        return _createClass(e, null, [
          {
            key: "ensureHeaders",
            value: function (e) {
              var t = e ? _objectSpread({}, e) : {};
              return (
                t["user-agent"] ||
                  t["User-Agent"] ||
                  (t["User-Agent"] =
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"),
                t
              );
            },
          },
          {
            key: "Get",
            value:
              ((t = _asyncToGenerator(
                _regenerator().m(function t(a, n, r) {
                  var i, o, s, l, c;
                  return _regenerator().w(function (t) {
                    for (;;)
                      switch (t.n) {
                        case 0:
                          if (!e.isAndroid) {
                            t.n = 1;
                            break;
                          }
                          return t.a(2, e.Native(a));
                        case 1:
                          return (
                            (i = e.ensureHeaders(n)),
                            (o = { method: "GET", headers: i }),
                            (t.n = 2),
                            fetch(a, o)
                          );
                        case 2:
                          if (((s = t.v), null == r)) {
                            t.n = 4;
                            break;
                          }
                          return ((t.n = 3), s.arrayBuffer());
                        case 3:
                          return (
                            (l = t.v),
                            (c = new TextDecoder(r)),
                            t.a(2, c.decode(l))
                          );
                        case 4:
                          return ((t.n = 5), s.text());
                        case 5:
                          return t.a(2, t.v);
                      }
                  }, t);
                }),
              )),
              function (e, a, n) {
                return t.apply(this, arguments);
              }),
          },
          {
            key: "Native",
            value: function (t, a, n) {
              return new Promise(function (r, i) {
                var o = new window.Lampa.Reguest();
                o.native(
                  t,
                  function (e) {
                    ("object" === _typeof(e) ? r(JSON.stringify(e)) : r(e),
                      o.clear());
                  },
                  i,
                  a,
                  {
                    dataType: "text",
                    timeout: 8e3,
                    headers: e.ensureHeaders(n),
                  },
                );
              });
            },
          },
        ]);
        var t;
      })()),
      (e.isAndroid =
        "undefined" != typeof window &&
        void 0 !== window.Lampa &&
        void 0 !== window.Lampa.Platform &&
        "function" == typeof window.Lampa.Platform.is &&
        window.Lampa.Platform.is("android")),
      e),

// ====================================================================
// ВСПОМОГАТЕЛЬНЫЕ КЛАССЫ
// Extract (c) — утилита для извлечения данных по regex
// VideoItem (u) — модель видеоконтента (название, URL, постер, превью и т.д.)
// PlaylistItem (p) — элемент меню плейлиста
// QualityResult (h) — результат получения качеств видео
// StreamResult (m) — результат извлечения потоковых ссылок
// ====================================================================
    c = (function () {
      return _createClass(
        function e() {
          _classCallCheck(this, e);
        },
        null,
        [
          {
            key: "extract",
            value: function (e, t) {
              var a,
                n =
                  arguments.length > 2 && void 0 !== arguments[2]
                    ? arguments[2]
                    : 1,
                r =
                  (null === (a = e.match(t)) || void 0 === a ? void 0 : a[n]) ||
                  null;
              return r && "" !== r.trim() ? r.trim() : null;
            },
          },
        ],
      );
    })(),
    u = _createClass(function e(t, a, n, r, i, o, s, l, c) {
      (_classCallCheck(this, e),
        (this.name = t),
        (this.video = a),
        (this.picture = n),
        (this.preview = r),
        (this.time = i),
        (this.quality = o),
        (this.json = s),
        (this.related = l),
        (this.model = c));
    }),
    p = _createClass(function e(t, a, n, r) {
      (_classCallCheck(this, e),
        (this.title = t),
        (this.playlist_url = a),
        n && (this.search_on = n),
        r && (this.submenu = r));
    }),

// ====================================================================
// [УДАЛЕНО] Парсеры других сайтов (BongaCams, XVIDEOS, XNXX, SpankBang,
// Chaturbate, Eporner) — ~1400 строк удалено для экономии места.
// TrahKino обрабатывается через универсальную систему NextHub ниже.
// ====================================================================

// ====================================================================
// СИСТЕМА NEXTHUB: Универсальный конфигурируемый парсер сайтов
// k() — подстановка шаблонов URL, w() — объединение путей,
// _() — HTML-парсер, x() — XPath-оценка, C() — получение атрибутов
// Class S: buildListUrl, buildSearchUrl, buildModelUrl, buildMenu,
//   toPlaylist (XPath-based), extractStreams (iframe/eval/regex),
//   Invoke (главный диспетчер: list/search/model/view/related)
// ====================================================================
  function k(e, t) {
    return e.replace(/\{([^}]+)\}/g, function (e, a) {
      var n;
      return null !== (n = t[a]) && void 0 !== n ? n : "";
    });
  }
  function w(e, t) {
    var a = e.replace(/\/+$/, ""),
      n = t.replace(/^\/+/, "");
    return a + (n ? "/" + n : "");
  }
  function _(e) {
    return new DOMParser().parseFromString(e, "text/html");
  }
  function x(e, t, a) {
    return e.evaluate(
      t,
      a || e,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    ).singleNodeValue;
  }
  function C(e, t, a) {
    if (!e) return "";
    if (Array.isArray(t)) {
      var n,
        r = _createForOfIteratorHelper(t);
      try {
        for (r.s(); !(n = r.n()).done; ) {
          var i = n.value,
            o = e.getAttribute(i);
          if (o && "" !== o.trim()) return o;
        }
      } catch (e) {
        r.e(e);
      } finally {
        r.f();
      }
      return a || "";
    }
    return e.getAttribute(t || "src") || a || "";
  }
  var S =
      ((s = (function () {
        return _createClass(
          function e(t) {
            (_classCallCheck(this, e), (this.cfgs = t));
          },
          [
            {
              key: "buildListUrl",
              value: function (e, t, a, n) {
                var r,
                  i,
                  o,
                  s,
                  l,
                  c = n && "" !== n.trim(),
                  u = Object.keys(
                    (null === (r = e.menu) || void 0 === r ? void 0 : r.sort) ||
                      {},
                  ).find(function (t) {
                    var a,
                      n =
                        null === (a = e.menu) ||
                        void 0 === a ||
                        null === (a = a.sort) ||
                        void 0 === a
                          ? void 0
                          : a[t];
                    return !n || "" === n;
                  }),
                  p = a && "" !== a.trim() && a !== u;
                if (null !== (i = e.menu) && void 0 !== i && i.route)
                  if (c && p && e.menu.route.catsort) s = e.menu.route.catsort;
                  else if (c && p && !e.menu.route.catsort)
                    s = e.menu.route.cat;
                  else if (c && e.menu.route.cat) s = e.menu.route.cat;
                  else if (p && e.menu.route.sort) s = e.menu.route.sort;
                  else {
                    var d;
                    s =
                      1 === t &&
                      null !=
                        (null === (d = e.list) || void 0 === d
                          ? void 0
                          : d.firstpage)
                        ? e.list.firstpage
                        : e.list
                          ? e.list.uri
                          : "{host}";
                  }
                else
                  s =
                    1 === t &&
                    null !=
                      (null === (l = e.list) || void 0 === l
                        ? void 0
                        : l.firstpage)
                      ? e.list.firstpage
                      : e.list
                        ? e.list.uri
                        : "{host}";
                var h = (
                    p && null !== (o = e.menu) && void 0 !== o && o.sort
                      ? e.menu.sort[a]
                      : ""
                  ).replace(/\{page\}/g, String(t)),
                  m = k((s = s.replace(/\{page\}/g, String(t))), {
                    host: e.host,
                    sort: h || "",
                    cat: n || "",
                    page: String(t),
                  });
                return (
                  s.startsWith("{host}") ||
                    m.startsWith("http") ||
                    (m = w(e.host, m)),
                  m
                );
              },
            },
            {
              key: "buildSearchUrl",
              value: function (e, t, a) {
                if (!e.search) return e.host;
                var n = k(e.search.uri, {
                  search: encodeURIComponent(t),
                  page: String(a),
                });
                return w(e.host, n);
              },
            },
            {
              key: "buildModelUrl",
              value: function (e, t, a) {
                var n,
                  r =
                    null == e ||
                    null === (n = e.menu) ||
                    void 0 === n ||
                    null === (n = n.route) ||
                    void 0 === n
                      ? void 0
                      : n.model,
                  i = decodeURIComponent(t);
                return r
                  .replace("{host}", e.host)
                  .replace("{model}", i)
                  .replace("{page}", String(a));
              },
            },
            {
              key: "buildMenu",
              value: function (e, t, a) {
                var n,
                  r,
                  i,
                  o =
                    arguments.length > 3 &&
                    void 0 !== arguments[3] &&
                    arguments[3],
                  s = arguments.length > 4 ? arguments[4] : void 0,
                  l = [];
                if (
                  (o ||
                    l.push(
                      new p(
                        "Поиск",
                        "nexthub://".concat(e.displayname, "?mode=search"),
                        "search_on",
                      ),
                    ),
                  o && null !== (n = e.view) && void 0 !== n && n.related && s)
                ) {
                  var c,
                    u =
                      null === (c = s.split("/").pop()) ||
                      void 0 === c ||
                      null === (c = c.split("?")[0]) ||
                      void 0 === c
                        ? void 0
                        : c.split("&")[0],
                    d = "".concat(e.host, "/").concat(u),
                    h = "nexthub://"
                      .concat(e.displayname, "?mode=related&href=")
                      .concat(encodeURIComponent(d));
                  l.push(new p("Похожие", h));
                }
                if (null !== (r = e.menu) && void 0 !== r && r.sort) {
                  for (
                    var m = [], g = 0, y = Object.entries(e.menu.sort);
                    g < y.length;
                    g++
                  ) {
                    var v,
                      b = _slicedToArray(y[g], 2),
                      f = b[0],
                      k =
                        (b[1],
                        "nexthub://"
                          .concat(e.displayname, "?mode=list&sort=")
                          .concat(encodeURIComponent(f)));
                    (a &&
                      null !== (v = e.menu) &&
                      void 0 !== v &&
                      null !== (v = v.route) &&
                      void 0 !== v &&
                      v.catsort &&
                      (k += "&cat=".concat(encodeURIComponent(a))),
                      m.push(new p(f, k)));
                  }
                  var w =
                    m.find(function (e) {
                      return e.title === t;
                    }) || m[0];
                  l.push(new p("Сортировка: " + w.title, "submenu", void 0, m));
                }
                if (null !== (i = e.menu) && void 0 !== i && i.categories) {
                  for (
                    var _ = [], x = 0, C = Object.entries(e.menu.categories);
                    x < C.length;
                    x++
                  ) {
                    var S,
                      P = _slicedToArray(C[x], 2),
                      z = P[0],
                      L = P[1],
                      j = "nexthub://"
                        .concat(e.displayname, "?mode=list&cat=")
                        .concat(encodeURIComponent(L));
                    if (
                      null !== (S = e.menu) &&
                      void 0 !== S &&
                      null !== (S = S.route) &&
                      void 0 !== S &&
                      S.catsort
                    ) {
                      var M,
                        T = Object.keys(
                          (null === (M = e.menu) || void 0 === M
                            ? void 0
                            : M.sort) || {},
                        ).find(function (t) {
                          var a,
                            n =
                              null === (a = e.menu) ||
                              void 0 === a ||
                              null === (a = a.sort) ||
                              void 0 === a
                                ? void 0
                                : a[t];
                          return !n || "" === n;
                        });
                      t &&
                        t !== T &&
                        (j += "&sort=".concat(encodeURIComponent(t)));
                    }
                    _.push(new p(z, j));
                  }
                  var A = "Все";
                  if (a) {
                    var I = Object.entries(e.menu.categories).find(
                      function (e) {
                        var t = _slicedToArray(e, 2);
                        t[0];
                        return t[1] === a;
                      },
                    );
                    I && (A = I[0]);
                  }
                  l.push(new p("Категория: " + A, "submenu", void 0, _));
                }
                return l;
              },
            },
            {
              key: "toPlaylist",
              value: function (e, t) {
                var a,
                  n = t.contentParse,
                  r = (function (e, t, a) {
                    for (
                      var n = e.evaluate(
                          t,
                          a || e,
                          null,
                          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                          null,
                        ),
                        r = [],
                        i = 0;
                      i < n.snapshotLength;
                      i++
                    )
                      r.push(n.snapshotItem(i));
                    return r;
                  })(e, n.nodes),
                  i = [],
                  o = _createForOfIteratorHelper(r);
                try {
                  for (o.s(); !(a = o.n()).done; ) {
                    var s,
                      l = a.value,
                      c = n.name ? x(e, n.name.node, l) : null,
                      p = x(e, n.href.node, l),
                      d = n.img ? x(e, n.img.node, l) : null,
                      h = n.duration ? x(e, n.duration.node, l) : null,
                      m = n.preview ? x(e, n.preview.node, l) : null,
                      g = c
                        ? (c.textContent || "").trim()
                        : (null == p ? void 0 : p.getAttribute("title")) || "",
                      y =
                        (p && p.getAttribute(n.href.attribute || "href")) || "",
                      v = n.img
                        ? C(d, n.img.attributes || n.img.attribute || "src")
                        : "",
                      b = n.preview
                        ? C(m, n.preview.attribute || "data-preview")
                        : null,
                      f = h ? (h.textContent || "").trim() : null;
                    if (
                      (v &&
                        ((v = v
                          .replace(/&amp;/g, "&")
                          .replace(/\\/g, "")).startsWith("../")
                          ? (v = ""
                              .concat(t.host, "/")
                              .concat(v.replace("../", "")))
                          : v.startsWith("//")
                            ? (v = "https:".concat(v))
                            : v.startsWith("/")
                              ? (v = t.host + v)
                              : v.startsWith("http") ||
                                (v = "".concat(t.host, "/").concat(v))),
                      y && g && v)
                    ) {
                      var k = y.startsWith("http")
                          ? y
                          : t.host.replace(/\/?$/, "/") + y.replace(/^\/?/, ""),
                        w = null;
                      if (n.model) {
                        var _ = n.model.name
                            ? x(e, n.model.name.node, l)
                            : null,
                          S = n.model.href ? x(e, n.model.href.node, l) : null;
                        if (_ && S && n.model.href) {
                          var P = (_.textContent || "").trim(),
                            z =
                              S.getAttribute(
                                n.model.href.attribute || "href",
                              ) || "";
                          P &&
                            z &&
                            (w = {
                              uri: "nexthub://"
                                .concat(
                                  t.displayname.toLowerCase(),
                                  "?mode=model&model=",
                                )
                                .concat(encodeURIComponent(z)),
                              name: P,
                            });
                        }
                      }
                      i.push(
                        new u(
                          g,
                          k,
                          v,
                          b,
                          f,
                          null,
                          !0,
                          (null === (s = t.view) || void 0 === s
                            ? void 0
                            : s.related) || !1,
                          w,
                        ),
                      );
                    }
                  }
                } catch (e) {
                  o.e(e);
                } finally {
                  o.f();
                }
                return i;
              },
            },
            {
              key: "extractStreams",
              value:
                ((t = _asyncToGenerator(
                  _regenerator().m(function e(t, a) {
                    var n,
                      r,
                      i,
                      o,
                      s,
                      c,
                      u,
                      p,
                      d,
                      h,
                      g,
                      y,
                      v,
                      b,
                      f,
                      k,
                      w,
                      S,
                      P,
                      z,
                      L,
                      j,
                      M,
                      T,
                      A,
                      I,
                      B,
                      O;
                    return _regenerator().w(
                      function (e) {
                        for (;;)
                          switch (e.n) {
                            case 0:
                              if (
                                ((s = {}),
                                null === (n = a.view) ||
                                  void 0 === n ||
                                  null === (n = n.iframe) ||
                                  void 0 === n ||
                                  !n.pattern)
                              ) {
                                e.n = 2;
                                break;
                              }
                              if (
                                ((c = new RegExp(a.view.iframe.pattern, "g")),
                                !(u = c.exec(t)) || !u[1])
                              ) {
                                e.n = 2;
                                break;
                              }
                              return (
                                (p = u[1]),
                                (d = p.startsWith("http") ? p : a.host + p),
                                (e.n = 1),
                                l.Get(d, void 0, a.charset)
                              );
                            case 1:
                              t = e.v;
                            case 2:
                              if (
                                null === (r = a.view) ||
                                void 0 === r ||
                                !r.eval
                              ) {
                                e.n = 3;
                                break;
                              }
                              try {
                                ((h = new Function("html", a.view.eval)),
                                  (g = h(t)) &&
                                    (s.auto = g
                                      .replace(/&amp;/g, "&")
                                      .replace(/\\/g, "")));
                              } catch (e) {
                                console.error("Eval execution error:", e);
                              }
                              e.n = 15;
                              break;
                            case 3:
                              if (
                                null === (i = a.view) ||
                                void 0 === i ||
                                !i.nodeFile
                              ) {
                                e.n = 4;
                                break;
                              }
                              ((y = _(t)),
                                (v = x(y, a.view.nodeFile.node)) &&
                                  (b = C(v, a.view.nodeFile.attribute)) &&
                                  (s.auto = b
                                    .replace(/&amp;/g, "&")
                                    .replace(/\\/g, "")),
                                (e.n = 15));
                              break;
                            case 4:
                              if (
                                null !== (f = a.view) &&
                                void 0 !== f &&
                                null !== (f = f.regexMatch) &&
                                void 0 !== f &&
                                f.pattern
                              ) {
                                e.n = 5;
                                break;
                              }
                              return e.a(2, new m(s, []));
                            case 5:
                              ((k = a.view.regexMatch.matches || [""]),
                                (w = _createForOfIteratorHelper(k)),
                                (e.p = 6),
                                w.s());
                            case 7:
                              if ((S = w.n()).done) {
                                e.n = 12;
                                break;
                              }
                              ((P = S.value),
                                (z = a.view.regexMatch.pattern).includes(
                                  "{value}",
                                ) && (z = z.replace("{value}", P)),
                                (L = new RegExp(z, "g")),
                                (j = void 0),
                                (M = !1));
                            case 8:
                              if (!(j = L.exec(t))) {
                                e.n = 10;
                                break;
                              }
                              if ((T = j[1])) {
                                e.n = 9;
                                break;
                              }
                              return e.a(3, 8);
                            case 9:
                              ((A = T),
                                a.view.regexMatch.format &&
                                  (A = a.view.regexMatch.format
                                    .replace("{host}", a.host)
                                    .replace("{value}", T)),
                                (s.auto = A.replace(/&amp;/g, "&").replace(
                                  /\\/g,
                                  "",
                                )),
                                (M = !0),
                                (e.n = 8));
                              break;
                            case 10:
                              if (!M) {
                                e.n = 11;
                                break;
                              }
                              return e.a(3, 12);
                            case 11:
                              e.n = 7;
                              break;
                            case 12:
                              e.n = 14;
                              break;
                            case 13:
                              ((e.p = 13), (O = e.v), w.e(O));
                            case 14:
                              return ((e.p = 14), w.f(), e.f(14));
                            case 15:
                              return (
                                (I = []),
                                null !== (o = a.view) &&
                                  void 0 !== o &&
                                  o.related &&
                                  ((B = _(t)),
                                  I.push.apply(
                                    I,
                                    _toConsumableArray(this.toPlaylist(B, a)),
                                  )),
                                e.a(2, new m(s, I))
                              );
                          }
                      },
                      e,
                      this,
                      [[6, 13, 14, 15]],
                    );
                  }),
                )),
                function (e, a) {
                  return t.apply(this, arguments);
                }),
            },
            {
              key: "Invoke",
              value:
                ((e = _asyncToGenerator(
                  _regenerator().m(function e(t) {
                    var a,
                      n,
                      r,
                      i,
                      o,
                      s,
                      c,
                      u,
                      p,
                      d,
                      m,
                      g,
                      y,
                      v,
                      b,
                      f,
                      k,
                      w,
                      x,
                      C,
                      S,
                      P,
                      z,
                      L,
                      j,
                      M;
                    return _regenerator().w(
                      function (e) {
                        for (;;)
                          switch (e.n) {
                            case 0:
                              if (
                                ((a = new URL(t)),
                                (n =
                                  a.hostname ||
                                  a.pathname.replace(/^\//, "") ||
                                  t.replace("nexthub://", "").split("?")[0]),
                                (r = this.cfgs.find(function (e) {
                                  return (
                                    e.displayname.toLowerCase() ===
                                    n.toLowerCase()
                                  );
                                })))
                              ) {
                                e.n = 1;
                                break;
                              }
                              return e.a(2, "unknown nexthub site");
                            case 1:
                              if (
                                (console.log("NextHub: Invoke ".concat(t)),
                                "view" !==
                                  (i = a.searchParams.get("mode") || "list") &&
                                  "related" !== i)
                              ) {
                                e.n = 5;
                                break;
                              }
                              if ((o = a.searchParams.get("href"))) {
                                e.n = 2;
                                break;
                              }
                              return e.a(2, "no href param");
                            case 2:
                              return (
                                (s = decodeURIComponent(o)),
                                (c = s.replace("&related?pg=1", "")),
                                (e.n = 3),
                                l.Get(c, void 0, r.charset)
                              );
                            case 3:
                              return (
                                (u = e.v),
                                (e.n = 4),
                                this.extractStreams(u, r)
                              );
                            case 4:
                              return (
                                (p = e.v),
                                e.a(
                                  2,
                                  new h(
                                    p,
                                    "related" === i || s.includes("&related"),
                                  ),
                                )
                              );
                            case 5:
                              if ("model" !== i) {
                                e.n = 8;
                                break;
                              }
                              if ((d = a.searchParams.get("model"))) {
                                e.n = 6;
                                break;
                              }
                              return e.a(2, "no model param");
                            case 6:
                              return (
                                (m = Number(a.searchParams.get("pg") || "1")),
                                (g = this.buildModelUrl(r, d, m)),
                                (e.n = 7),
                                l.Get(g, void 0, r.charset)
                              );
                            case 7:
                              return (
                                (y = e.v),
                                (v = _(y)),
                                e.a(2, {
                                  menu: this.buildMenu(r, void 0, void 0, !1),
                                  list: this.toPlaylist(v, r),
                                })
                              );
                            case 8:
                              if ("search" !== i) {
                                e.n = 10;
                                break;
                              }
                              return (
                                (b = a.searchParams.getAll("search")),
                                (f =
                                  b.find(function (e) {
                                    return "" !== e.trim();
                                  }) || ""),
                                (k = Number(a.searchParams.get("pg") || "1")),
                                (w = this.buildSearchUrl(r, f, k)),
                                (e.n = 9),
                                l.Get(w, void 0, r.charset)
                              );
                            case 9:
                              return (
                                (x = e.v),
                                (C = _(x)),
                                e.a(2, {
                                  menu: this.buildMenu(r, void 0, void 0, !1),
                                  list: this.toPlaylist(C, r),
                                })
                              );
                            case 10:
                              return (
                                (S = a.searchParams.get("sort") || ""),
                                (P = a.searchParams.get("cat") || ""),
                                (z = Number(a.searchParams.get("pg") || "1")),
                                (L = this.buildListUrl(r, z, S, P)),
                                (e.n = 11),
                                l.Get(L, void 0, r.charset)
                              );
                            case 11:
                              return (
                                (j = e.v),
                                (M = _(j)),
                                e.a(2, {
                                  menu: this.buildMenu(r, S, P, !1),
                                  list: this.toPlaylist(M, r),
                                })
                              );
                            case 12:
                              return e.a(2);
                          }
                      },
                      e,
                      this,
                    );
                  }),
                )),
                function (t) {
                  return e.apply(this, arguments);
                }),
            },
          ],
        );
        var e, t;
      })()),
      (s.host = "nexthub://"),

// ====================================================================
// КОНФИГУРАЦИЯ САЙТА TRAHKINO.ME
// Единственный сайт в сокращённой версии. Обрабатывается через NextHub.
// contentParse — XPath-правила для парсинга списка видео со страницы
// view.regexMatch — паттерн для извлечения прямых ссылок на видео
// TODO: regexMatch-паттерн зависит от структуры URL и может сломаться
// при изменении CDN или формата ссылок на сайте.
// ====================================================================
        displayname: "TrahKino",
        host: "https://trahkino.me",
        menu: {
          route: {
            sort: "{host}/{sort}/{page}/",
            cat: "{host}/categories/{cat}/{page}/",
          },
          sort: {
            Новое: "latest-updates",
            Лучшее: "top-rated",
            Популярное: "most-popular",
          },
          categories: {
            Все: "",
            Любительское: "lyubitelskiy-seks",
            "Большие сиськи": "bolshie-siski",
            "Большие попки": "bolshie-popki",
            Минет: "minet",
            Блондинки: "blondinki",
            Брюнетки: "bryunetki",
            Хардкор: "hardkor",
            Милфы: "milfy",
            Красотки: "krasotki",
            "Большие члены": "bolshie-hui",
            Наездница: "naezdnica",
            "Маленькие сиськи": "malenkie-siski",
            "Бритые киски": "britye-kiski",
            Красивое: "krasivyy-seks",
            Азиатки: "aziatki",
            "Кончают внутрь": "konchayut-vnutr",
            Медсестра: "medsestra",
            Анал: "anal",
            МЖМ: "mjm",
            Раком: "rakom",
            "Дрочка члена": "drochka-chlena",
            Жесть: "jest",
            "На кровати": "na-krovati",
            Реальное: "realnyy-seks",
            "Женский оргазм": "jenskiy-orgazm",
            "В нижнем белье": "v-nijnem-bele",
            Японки: "yaponki",
            Домашнее: "domashka",
            "Full HD": "full-hd",
            Жёны: "jeny",
            "В чулках": "v-chulkah",
            "На каблуках": "na-kablukah",
            "В очках": "v-ochkah",
            Толстушки: "tolstye",
            "В ванной": "v-vannoy",
            "Ролевые игры": "rolevye-igry",
            Пьяные: "pyanye",
            Стриптиз: "striptiz",
            Мультики: "multiki",
            "В туалете": "v-tualete",
          },
        },
        list: { uri: "latest-updates/{page}/", firstpage: "{host}" },
        search: { uri: "search/{page}/?q={search}" },
        contentParse: {
          nodes: "//div[contains(@class,'item')]",
          name: { node: ".//strong[contains(@class,'title')]" },
          href: { node: ".//a", attribute: "href" },
          img: {
            node: ".//img",
            attributes: ["data-original", "data-src", "src"],
          },
          duration: { node: ".//div[contains(@class,'duration')]" },
        },
        view: {
          related: !0,
          regexMatch: {
            matches: ["1080p", "720p", "480p", "360p"],
            pattern: "function/0/(https://[^/]+/get_file/[^']+_{value}\\.mp4)/",
          },
        },
      },
    ],
    z = new d(),
    ],
    // Инстанс NextHub — единственный диспетчер для TrahKino
    I = new S(P);
  // ======================================================================
  // РОУТЕР: Направляет запросы к нужному парсеру
  // В сокращённой версии обрабатывает только nexthub:// URL
  // (к которым автоматически приводятся ссылки trahkino.me)
  // ======================================================================
  !(function () {
    function e() {
      return (e = _asyncToGenerator(
        _regenerator().m(function e(t) {
          var a, n, r;
          return _regenerator().w(function (e) {
            for (;;)
              switch (e.n) {
                case 0:
                  // Проверяем, является ли URL nexthub:// (для TrahKino)
                  if (!t.startsWith("nexthub://")) {
                    e.n = 2;
                    break;
                  }
                  return ((e.n = 1), I.Invoke(t));
                case 1:
                  return e.a(2, e.v);
                case 2:
                  // Если URL не nexthub://, проверяем, совпадает ли хост с trahkino.me
                  // и перенаправляем через nexthub://
                  if (
                    ((a = new URL(t)),
                    !(n = P.find(function (e) {
                      return (
                        e.enable && a.hostname === new URL(e.host).hostname
                      );
                    })))
                  ) {
                    e.n = 4;
                    break;
                  }
                  return (
                    (r = "nexthub://"
                      .concat(n.displayname, "?mode=view&href=")
                      .concat(encodeURIComponent(t))),
                    (e.n = 3),
                    I.Invoke(r)
                  );
                case 3:
                  return e.a(2, e.v);
                case 4:
                  return e.a(2, "unknown site");
              }
          }, e);
        }),
      )).apply(this, arguments);
    }
    // ======================================================================
    // ГЛОБАЛЬНЫЙ ОБЪЕКТ AdultJS — точка входа плагина
    // Menu() — возвращает список доступных сайтов для меню плагина
    // Invoke() — диспетчеризирует запрос к нужному парсеру
    // ======================================================================
    window.AdultJS = {
      Menu: function () {
        var e = [
          // Единственный сайт в сокращённой версии
          {
            title: "trahkino.me",
            playlist_url: "nexthub://TrahKino?mode=list",
          },
        ];
        return (
          P.filter(function (e) {
            return e.enable;
          }).forEach(function (t) {
            e.push({
              title: t.displayname.toLowerCase(),
              playlist_url: "nexthub://".concat(t.displayname, "?mode=list"),
            });
          }),
          // Кнопка лога
          e.push({
            title: "📝 Показать лог",
            onSelect: function () {
              const logs = logger.getLogs();
              if (logs.length === 0) {
                Lampa.Noty.show("Лог пуст");
                return;
              }
              Lampa.Dialog.show({
                title: "Лог работы плагина",
                html: `<pre style="white-space: pre-wrap; font-family: monospace;">${logs.map((log) => `[${log.timestamp}] ${log.message}${log.data ? `\n${log.data}` : ""}`).join("\n\n")}</pre>`,
                buttons: [
                  {
                    title: "Очистить лог",
                    onClick: () => {
                      logger.clearLogs();
                      Lampa.Noty.show("Лог очищен");
                    },
                  },
                  { title: "Закрыть", onClick: () => Lampa.Dialog.close() },
                ],
              });
            },
          }),
          e
        );
      },
      Invoke: function (t) {
        return e.apply(this, arguments);
      },
    };
  })();
})();
