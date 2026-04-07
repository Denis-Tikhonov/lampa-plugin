"use strict";

// ================================================================
//  AdultJS  v3.0.0
// ================================================================
//  Changelog:
//    v3.0.0 — Код разделён на логические секции для удобства
//             редактирования. Настройки плагина: один пункт —
//             «Предпросмотр при наведении».
// ================================================================


// ================================================================
//  РАЗДЕЛ 2 · СЛУЖЕБНЫЙ КОД (ПОЛИФИЛЫ) — не редактировать
// ================================================================

function _toConsumableArray(e) {
  return _arrayWithoutHoles(e) || _iterableToArray(e) || _unsupportedIterableToArray(e) || _nonIterableSpread()
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")
}

function _iterableToArray(e) {
  if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e)
}

function _arrayWithoutHoles(e) {
  if (Array.isArray(e)) return _arrayLikeToArray(e)
}

function _slicedToArray(e, t) {
  return _arrayWithHoles(e) || _iterableToArrayLimit(e, t) || _unsupportedIterableToArray(e, t) || _nonIterableRest()
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")
}

function _iterableToArrayLimit(e, t) {
  var a = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
  if (null != a) {
    var n, r, i, o, s = [], l = !0, c = !1;
    try {
      if (i = (a = a.call(e)).next, 0 === t) {
        if (Object(a) !== a) return;
        l = !1
      } else
        for (; !(l = (n = i.call(a)).done) && (s.push(n.value), s.length !== t); l = !0);
    } catch (e) { c = !0, r = e }
    finally {
      try {
        if (!l && null != a.return && (o = a.return(), Object(o) !== o)) return
      } finally { if (c) throw r }
    }
    return s
  }
}

function _arrayWithHoles(e) {
  if (Array.isArray(e)) return e
}

function _createForOfIteratorHelper(e, t) {
  var a = "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
  if (!a) {
    if (Array.isArray(e) || (a = _unsupportedIterableToArray(e)) || t && e && "number" == typeof e.length) {
      a && (e = a);
      var n = 0, r = function() {};
      return {
        s: r,
        n: function() { return n >= e.length ? { done: !0 } : { done: !1, value: e[n++] } },
        e: function(e) { throw e },
        f: r
      }
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")
  }
  var i, o = !0, s = !1;
  return {
    s: function() { a = a.call(e) },
    n: function() { var e = a.next(); return o = e.done, e },
    e: function(e) { s = !0, i = e },
    f: function() { try { o || null == a.return || a.return() } finally { if (s) throw i } }
  }
}

function _unsupportedIterableToArray(e, t) {
  if (e) {
    if ("string" == typeof e) return _arrayLikeToArray(e, t);
    var a = {}.toString.call(e).slice(8, -1);
    return "Object" === a && e.constructor && (a = e.constructor.name),
      "Map" === a || "Set" === a ? Array.from(e) :
      "Arguments" === a || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(a) ? _arrayLikeToArray(e, t) : void 0
  }
}

function _arrayLikeToArray(e, t) {
  (null == t || t > e.length) && (t = e.length);
  for (var a = 0, n = Array(t); a < t; a++) n[a] = e[a];
  return n
}

function _typeof(e) {
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
    ? function(e) { return typeof e }
    : function(e) { return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e },
    _typeof(e)
}

function _regenerator() {
  /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */
  var e, t, a = "function" == typeof Symbol ? Symbol : {},
    n = a.iterator || "@@iterator",
    r = a.toStringTag || "@@toStringTag";

  function i(a, n, r, i) {
    var l = n && n.prototype instanceof s ? n : s,
      c = Object.create(l.prototype);
    return _regeneratorDefine2(c, "_invoke", function(a, n, r) {
      var i, s, l, c = 0, u = r || [], p = !1,
        d = {
          p: 0, n: 0, v: e, a: h, f: h.bind(e, 4),
          d: function(t, a) { return i = t, s = 0, l = e, d.n = a, o }
        };

      function h(a, n) {
        for (s = a, l = n, t = 0; !p && c && !r && t < u.length; t++) {
          var r, i = u[t], h = d.p, m = i[2];
          a > 3 ? (r = m === n) && (l = i[(s = i[4]) ? 5 : (s = 3, 3)], i[4] = i[5] = e) :
            i[0] <= h && ((r = a < 2 && h < i[1]) ? (s = 0, d.v = n, d.n = i[1]) :
              h < m && (r = a < 3 || i[0] > n || n > m) && (i[4] = a, i[5] = n, d.n = m, s = 0))
        }
        if (r || a > 1) return o;
        throw p = !0, n
      }
      return function(r, u, m) {
        if (c > 1) throw TypeError("Generator is already running");
        for (p && 1 === u && h(u, m), s = u, l = m; (t = s < 2 ? e : l) || !p;) {
          i || (s ? s < 3 ? (s > 1 && (d.n = -1), h(s, l)) : d.n = l : d.v = l);
          try {
            if (c = 2, i) {
              if (s || (r = "next"), t = i[r]) {
                if (!(t = t.call(i, l))) throw TypeError("iterator result is not an object");
                if (!t.done) return t;
                l = t.value, s < 2 && (s = 0)
              } else 1 === s && (t = i.return) && t.call(i),
                s < 2 && (l = TypeError("The iterator does not provide a '" + r + "' method"), s = 1);
              i = e
            } else if ((t = (p = d.n < 0) ? l : a.call(n, d)) !== o) break
          } catch (t) { i = e, s = 1, l = t }
          finally { c = 1 }
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
    return Object.setPrototypeOf ? Object.setPrototypeOf(e, c) : (e.__proto__ = c, _regeneratorDefine2(e, r, "GeneratorFunction")),
      e.prototype = Object.create(p), e
  }
  return l.prototype = c,
    _regeneratorDefine2(p, "constructor", c),
    _regeneratorDefine2(c, "constructor", l),
    l.displayName = "GeneratorFunction",
    _regeneratorDefine2(c, r, "GeneratorFunction"),
    _regeneratorDefine2(p),
    _regeneratorDefine2(p, r, "Generator"),
    _regeneratorDefine2(p, n, (function() { return this })),
    _regeneratorDefine2(p, "toString", (function() { return "[object Generator]" })),
    (_regenerator = function() { return { w: i, m: d } })()
}

function _regeneratorDefine2(e, t, a, n) {
  var r = Object.defineProperty;
  try { r({}, "", {}) } catch (e) { r = 0 }
  _regeneratorDefine2 = function(e, t, a, n) {
    if (t) r ? r(e, t, { value: a, enumerable: !n, configurable: !n, writable: !n }) : e[t] = a;
    else {
      var i = function(t, a) {
        _regeneratorDefine2(e, t, (function(e) { return this._invoke(t, a, e) }))
      };
      i("next", 0), i("throw", 1), i("return", 2)
    }
  }, _regeneratorDefine2(e, t, a, n)
}

function asyncGeneratorStep(e, t, a, n, r, i, o) {
  try { var s = e[i](o), l = s.value } catch (e) { return void a(e) }
  s.done ? t(l) : Promise.resolve(l).then(n, r)
}

function _asyncToGenerator(e) {
  return function() {
    var t = this, a = arguments;
    return new Promise((function(n, r) {
      var i = e.apply(t, a);
      function o(e) { asyncGeneratorStep(i, n, r, o, s, "next", e) }
      function s(e) { asyncGeneratorStep(i, n, r, o, s, "throw", e) }
      o(void 0)
    }))
  }
}

function ownKeys(e, t) {
  var a = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter((function(t) { return Object.getOwnPropertyDescriptor(e, t).enumerable }))),
      a.push.apply(a, n)
  }
  return a
}

function _objectSpread(e) {
  for (var t = 1; t < arguments.length; t++) {
    var a = null != arguments[t] ? arguments[t] : {};
    t % 2
      ? ownKeys(Object(a), !0).forEach((function(t) { _defineProperty(e, t, a[t]) }))
      : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(a))
        : ownKeys(Object(a)).forEach((function(t) { Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(a, t)) }))
  }
  return e
}

function _defineProperty(e, t, a) {
  return (t = _toPropertyKey(t)) in e
    ? Object.defineProperty(e, t, { value: a, enumerable: !0, configurable: !0, writable: !0 })
    : e[t] = a, e
}

function _classCallCheck(e, t) {
  if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
}

function _defineProperties(e, t) {
  for (var a = 0; a < t.length; a++) {
    var n = t[a];
    n.enumerable = n.enumerable || !1, n.configurable = !0,
      "value" in n && (n.writable = !0),
      Object.defineProperty(e, _toPropertyKey(n.key), n)
  }
}

function _createClass(e, t, a) {
  return t && _defineProperties(e.prototype, t),
    a && _defineProperties(e, a),
    Object.defineProperty(e, "prototype", { writable: !1 }), e
}

function _toPropertyKey(e) {
  var t = _toPrimitive(e, "string");
  return "symbol" == _typeof(t) ? t : t + ""
}

function _toPrimitive(e, t) {
  if ("object" != _typeof(e) || !e) return e;
  var a = e[Symbol.toPrimitive];
  if (void 0 !== a) {
    var n = a.call(e, t || "default");
    if ("object" != _typeof(n)) return n;
    throw new TypeError("@@toPrimitive must return a primitive value.")
  }
  return ("string" === t ? String : Number)(e)
}


// ================================================================
//  ОСНОВНОЙ МОДУЛЬ
// ================================================================
!function () {

  // --------------------------------------------------------------
  //  СЛУЖЕБНЫЕ КЛАССЫ — не редактировать
  // --------------------------------------------------------------

  // HTTP-клиент
  var l = (
    _HttpClass = function () {
      function e() { _classCallCheck(this, e) }
      return _createClass(e, null, [{
        key: "ensureHeaders",
        value: function (e) {
          var t = e ? _objectSpread({}, e) : {};
          return t["user-agent"] || t["User-Agent"] ||
            (t["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"),
            t
        }
      }, {
        key: "Get",
        value: (_getMethod = _asyncToGenerator(_regenerator().m((function t(a, n, r) {
          var i, o, s, l, c;
          return _regenerator().w((function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (!e.isAndroid) { t.n = 1; break }
                return t.a(2, e.Native(a));
              case 1:
                return i = e.ensureHeaders(n), o = { method: "GET", headers: i }, t.n = 2, fetch(a, o);
              case 2:
                if (s = t.v, null == r) { t.n = 4; break }
                return t.n = 3, s.arrayBuffer();
              case 3:
                return l = t.v, c = new TextDecoder(r), t.a(2, c.decode(l));
              case 4:
                return t.n = 5, s.text();
              case 5:
                return t.a(2, t.v)
            }
          }), t)
        }))), function (e, a, n) { return _getMethod.apply(this, arguments) })
      }, {
        key: "Native",
        value: function (t, a, n) {
          return new Promise((function (r, i) {
            var o = new window.Lampa.Reguest;
            o.native(t, (function (e) {
              "object" === _typeof(e) ? r(JSON.stringify(e)) : r(e), o.clear()
            }), i, a, { dataType: "text", timeout: 8e3, headers: e.ensureHeaders(n) })
          }))
        }
      }]);
      var _getMethod
    }(),
    _HttpClass.isAndroid = "undefined" != typeof window && void 0 !== window.Lampa &&
      void 0 !== window.Lampa.Platform && "function" == typeof window.Lampa.Platform.is &&
      window.Lampa.Platform.is("android"),
    _HttpClass
  );
  var _HttpClass;

  // Утилита извлечения текста по regex
  var c = function () {
    return _createClass((function e() { _classCallCheck(this, e) }), null, [{
      key: "extract",
      value: function (e, t) {
        var a, n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 1,
          r = (null === (a = e.match(t)) || void 0 === a ? void 0 : a[n]) || null;
        return r && "" !== r.trim() ? r.trim() : null
      }
    }])
  }();

  // Модель видео-элемента
  var u = _createClass((function e(t, a, n, r, i, o, s, l, c) {
    _classCallCheck(this, e),
      this.name = t, this.video = a, this.picture = n, this.preview = r,
      this.time = i, this.quality = o, this.json = s, this.related = l, this.model = c
  }));

  // Модель пункта меню
  var p = _createClass((function e(t, a, n, r) {
    _classCallCheck(this, e),
      this.title = t, this.playlist_url = a,
      n && (this.search_on = n),
      r && (this.submenu = r)
  }));

  // Модель результата с похожими / с качествами
  var h = _createClass((function e(t, a) {
    _classCallCheck(this, e),
      a ? (this.total_pages = 1, this.list = t.recomends)
        : (this.qualitys = t.qualitys, this.recomends = t.recomends)
  }));

  var m = _createClass((function e(t, a) {
    _classCallCheck(this, e), this.qualitys = t, this.recomends = a
  }));

  // NextHub: вспомогательные функции
  function k(e, t) {
    return e.replace(/\{([^}]+)\}/g, (function (e, a) {
      var n;
      return null !== (n = t[a]) && void 0 !== n ? n : ""
    }))
  }

  function w(e, t) {
    var a = e.replace(/\/+$/, ""), n = t.replace(/^\/+/, "");
    return a + (n ? "/" + n : "")
  }

  function _(e) { return (new DOMParser).parseFromString(e, "text/html") }

  function x(e, t, a) {
    return e.evaluate(t, a || e, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
  }

  function C(e, t, a) {
    if (!e) return "";
    if (Array.isArray(t)) {
      var n, r = _createForOfIteratorHelper(t);
      try {
        for (r.s(); !(n = r.n()).done;) {
          var i = n.value, o = e.getAttribute(i);
          if (o && "" !== o.trim()) return o
        }
      } catch (e) { r.e(e) } finally { r.f() }
      return a || ""
    }
    return e.getAttribute(t || "src") || a || ""
  }

  // NextHub движок
  var S = (
    _NHCls = function () {
      return _createClass((function e(t) {
        _classCallCheck(this, e), this.cfgs = t
      }), [{
        key: "buildListUrl",
        value: function (e, t, a, n) {
          var r, i, o, s, l, c = n && "" !== n.trim(),
            u = Object.keys((null === (r = e.menu) || void 0 === r ? void 0 : r.sort) || {}).find((function (t) {
              var a, n = null === (a = e.menu) || void 0 === a || null === (a = a.sort) || void 0 === a ? void 0 : a[t];
              return !n || "" === n
            })),
            p = a && "" !== a.trim() && a !== u;
          if (null !== (i = e.menu) && void 0 !== i && i.route)
            if (c && p && e.menu.route.catsort) s = e.menu.route.catsort;
            else if (c && p && !e.menu.route.catsort) s = e.menu.route.cat;
            else if (c && e.menu.route.cat) s = e.menu.route.cat;
            else if (p && e.menu.route.sort) s = e.menu.route.sort;
            else {
              var d;
              s = 1 === t && null != (null === (d = e.list) || void 0 === d ? void 0 : d.firstpage)
                ? e.list.firstpage : e.list ? e.list.uri : "{host}"
            }
          else
            s = 1 === t && null != (null === (l = e.list) || void 0 === l ? void 0 : l.firstpage)
              ? e.list.firstpage : e.list ? e.list.uri : "{host}";
          var h = (p && null !== (o = e.menu) && void 0 !== o && o.sort ? e.menu.sort[a] : "").replace(/\{page\}/g, String(t)),
            m = k(s = s.replace(/\{page\}/g, String(t)), { host: e.host, sort: h || "", cat: n || "", page: String(t) });
          return s.startsWith("{host}") || m.startsWith("http") || (m = w(e.host, m)), m
        }
      }, {
        key: "buildSearchUrl",
        value: function (e, t, a) {
          if (!e.search) return e.host;
          var n = k(e.search.uri, { search: encodeURIComponent(t), page: String(a) });
          return w(e.host, n)
        }
      }, {
        key: "buildModelUrl",
        value: function (e, t, a) {
          var n, r = null == e || null === (n = e.menu) || void 0 === n || null === (n = n.route) || void 0 === n ? void 0 : n.model,
            i = decodeURIComponent(t);
          return r.replace("{host}", e.host).replace("{model}", i).replace("{page}", String(a))
        }
      }, {
        key: "buildMenu",
        value: function (e, t, a) {
          var n, r, i,
            o = arguments.length > 3 && void 0 !== arguments[3] && arguments[3],
            s = arguments.length > 4 ? arguments[4] : void 0,
            l = [];
          if (o || l.push(new p("Поиск", "nexthub://".concat(e.displayname, "?mode=search"), "search_on")));
          if (o && null !== (n = e.view) && void 0 !== n && n.related && s) {
            var c, u = null === (c = s.split("/").pop()) || void 0 === c || null === (c = c.split("?")[0]) || void 0 === c ? void 0 : c.split("&")[0],
              d = "".concat(e.host, "/").concat(u),
              h = "nexthub://".concat(e.displayname, "?mode=related&href=").concat(encodeURIComponent(d));
            l.push(new p("Похожие", h))
          }
          if (null !== (r = e.menu) && void 0 !== r && r.sort) {
            for (var m = [], g = 0, y = Object.entries(e.menu.sort); g < y.length; g++) {
              var v, b = _slicedToArray(y[g], 2), f = b[0],
                k_ = (b[1], "nexthub://".concat(e.displayname, "?mode=list&sort=").concat(encodeURIComponent(f)));
              a && null !== (v = e.menu) && void 0 !== v && null !== (v = v.route) && void 0 !== v && v.catsort && (k_ += "&cat=".concat(encodeURIComponent(a)));
              m.push(new p(f, k_))
            }
            var w_ = m.find((function (e) { return e.title === t })) || m[0];
            l.push(new p("Сортировка: " + w_.title, "submenu", void 0, m))
          }
          if (null !== (i = e.menu) && void 0 !== i && i.categories) {
            for (var _ = [], x_ = 0, C_ = Object.entries(e.menu.categories); x_ < C_.length; x_++) {
              var S_, P_ = _slicedToArray(C_[x_], 2), z_ = P_[0], L_ = P_[1],
                j_ = "nexthub://".concat(e.displayname, "?mode=list&cat=").concat(encodeURIComponent(L_));
              if (null !== (S_ = e.menu) && void 0 !== S_ && null !== (S_ = S_.route) && void 0 !== S_ && S_.catsort) {
                var M_, T_ = Object.keys((null === (M_ = e.menu) || void 0 === M_ ? void 0 : M_.sort) || {}).find((function (t) {
                  var a, n = null === (a = e.menu) || void 0 === a || null === (a = a.sort) || void 0 === a ? void 0 : a[t];
                  return !n || "" === n
                }));
                t && t !== T_ && (j_ += "&sort=".concat(encodeURIComponent(t)))
              }
              _.push(new p(z_, j_))
            }
            var A_ = "Все";
            if (a) {
              var I_ = Object.entries(e.menu.categories).find((function (e) {
                var t = _slicedToArray(e, 2); t[0]; return t[1] === a
              }));
              I_ && (A_ = I_[0])
            }
            l.push(new p("Категория: " + A_, "submenu", void 0, _))
          }
          return l
        }
      }, {
        key: "toPlaylist",
        value: function (e, t) {
          var a, n = t.contentParse,
            r = function (e, t, a) {
              for (var n = e.evaluate(t, a || e, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null), r = [], i = 0; i < n.snapshotLength; i++) r.push(n.snapshotItem(i));
              return r
            }(e, n.nodes),
            i = [], o = _createForOfIteratorHelper(r);
          try {
            for (o.s(); !(a = o.n()).done;) {
              var s, l = a.value,
                c_ = n.name ? x(e, n.name.node, l) : null,
                p_ = x(e, n.href.node, l),
                d_ = n.img ? x(e, n.img.node, l) : null,
                h_ = n.duration ? x(e, n.duration.node, l) : null,
                m_ = n.preview ? x(e, n.preview.node, l) : null,
                g_ = c_ ? (c_.textContent || "").trim() : (null == p_ ? void 0 : p_.getAttribute("title")) || "",
                y_ = p_ && p_.getAttribute(n.href.attribute || "href") || "",
                v_ = n.img ? C(d_, n.img.attributes || n.img.attribute || "src") : "",
                b_ = n.preview ? C(m_, n.preview.attribute || "data-preview") : null,
                f_ = h_ ? (h_.textContent || "").trim() : null;
              if (v_ && ((v_ = v_.replace(/&amp;/g, "&").replace(/\\/g, "")).startsWith("../")
                ? v_ = "".concat(t.host, "/").concat(v_.replace("../", ""))
                : v_.startsWith("//") ? v_ = "https:".concat(v_)
                : v_.startsWith("/") ? v_ = t.host + v_
                : v_.startsWith("http") || (v_ = "".concat(t.host, "/").concat(v_))), y_ && g_ && v_) {
                var k_ = y_.startsWith("http") ? y_ : t.host.replace(/\/?$/, "/") + y_.replace(/^\/?/, ""),
                  w_ = null;
                if (n.model) {
                  var __ = n.model.name ? x(e, n.model.name.node, l) : null,
                    x_ = n.model.href ? x(e, n.model.href.node, l) : null;
                  if (__ && x_ && n.model.href) {
                    var C_ = (__.textContent || "").trim(),
                      S_ = x_.getAttribute(n.model.href.attribute || "href") || "";
                    C_ && S_ && (w_ = {
                      uri: "nexthub://".concat(t.displayname.toLowerCase(), "?mode=model&model=").concat(encodeURIComponent(S_)),
                      name: C_
                    })
                  }
                }
                i.push(new u(g_, k_, v_, b_, f_, null, !0, (null === (s = t.view) || void 0 === s ? void 0 : s.related) || !1, w_))
              }
            }
          } catch (e) { o.e(e) } finally { o.f() }
          return i
        }
      }, {
        key: "extractStreams",
        value: (_extractStreams = _asyncToGenerator(_regenerator().m((function e(t, a) {
          var n, r, i, o, s, c, u, p, d, h_, g, y, v, b, f, k_, w_, S_, P_, z_, L_, j_, M_, T_, A_, I_, B_, O_;
          return _regenerator().w((function (e) {
            for (;;) switch (e.n) {
              case 0:
                if (s = {}, null === (n = a.view) || void 0 === n || null === (n = n.iframe) || void 0 === n || !n.pattern) { e.n = 2; break }
                if (c = new RegExp(a.view.iframe.pattern, "g"), !(u = c.exec(t)) || !u[1]) { e.n = 2; break }
                return p = u[1], d = p.startsWith("http") ? p : a.host + p, e.n = 1, l.Get(d, void 0, a.charset);
              case 1: t = e.v;
              case 2:
                if (null === (r = a.view) || void 0 === r || !r.eval) { e.n = 3; break }
                try {
                  h_ = new Function("html", a.view.eval),
                    (g = h_(t)) && (s.auto = g.replace(/&amp;/g, "&").replace(/\\/g, ""))
                } catch (e) { console.error("Eval execution error:", e) }
                e.n = 15; break;
              case 3:
                if (null === (i = a.view) || void 0 === i || !i.nodeFile) { e.n = 4; break }
                y = _(t), (v = x(y, a.view.nodeFile.node)) && (b = C(v, a.view.nodeFile.attribute)) && (s.auto = b.replace(/&amp;/g, "&").replace(/\\/g, "")),
                  e.n = 15; break;
              case 4:
                if (null !== (f = a.view) && void 0 !== f && null !== (f = f.regexMatch) && void 0 !== f && f.pattern) { e.n = 5; break }
                return e.a(2, new m(s, []));
              case 5:
                k_ = a.view.regexMatch.matches || [""], w_ = _createForOfIteratorHelper(k_), e.p = 6, w_.s();
              case 7:
                if ((S_ = w_.n()).done) { e.n = 12; break }
                P_ = S_.value, (z_ = a.view.regexMatch.pattern).includes("{value}") && (z_ = z_.replace("{value}", P_)),
                  L_ = new RegExp(z_, "g"), j_ = void 0, M_ = !1;
              case 8:
                if (!(j_ = L_.exec(t))) { e.n = 10; break }
                if (T_ = j_[1]) { e.n = 9; break }
                return e.a(3, 8);
              case 9:
                A_ = T_, a.view.regexMatch.format && (A_ = a.view.regexMatch.format.replace("{host}", a.host).replace("{value}", T_)),
                  s.auto = A_.replace(/&amp;/g, "&").replace(/\\/g, ""), M_ = !0, e.n = 8; break;
              case 10:
                if (!M_) { e.n = 11; break }
                return e.a(3, 12);
              case 11: e.n = 7; break;
              case 12: e.n = 14; break;
              case 13: e.p = 13, O_ = e.v, w_.e(O_);
              case 14: return e.p = 14, w_.f(), e.f(14);
              case 15:
                return I_ = [], null !== (o = a.view) && void 0 !== o && o.related && (B_ = _(t), I_.push.apply(I_, _toConsumableArray(this.toPlaylist(B_, a)))),
                  e.a(2, new m(s, I_))
            }
          }), e, this, [[6, 13, 14, 15]])
        }))), function (e, a) { return _extractStreams.apply(this, arguments) })
      }, {
        key: "Invoke",
        value: (_invoke = _asyncToGenerator(_regenerator().m((function e(t) {
          var a, n, r, i, o, s, c, u, p, d, g, y, v, b, f, k_, w_, S_, P_, z_, L_;
          return _regenerator().w((function (e) {
            for (;;) switch (e.n) {
              case 0:
                if (a = new URL(t),
                  n = a.hostname || a.pathname.replace(/^\//, "") || t.replace("nexthub://", "").split("?")[0],
                  r = this.cfgs.find((function (e) { return e.displayname.toLowerCase() === n.toLowerCase() }))) { e.n = 1; break }
                return e.a(2, "unknown nexthub site");
              case 1:
                if (console.log("NextHub: Invoke ".concat(t)),
                  "view" !== (i = a.searchParams.get("mode") || "list") && "related" !== i) { e.n = 5; break }
                if (o = a.searchParams.get("href")) { e.n = 2; break }
                return e.a(2, "no href param");
              case 2:
                return s = decodeURIComponent(o), c = s.replace("&related?pg=1", ""),
                  e.n = 3, l.Get(c, void 0, r.charset);
              case 3:
                return u = e.v, e.n = 4, this.extractStreams(u, r);
              case 4:
                return p = e.v, e.a(2, new h(p, "related" === i || s.includes("&related")));
              case 5:
                if ("model" !== i) { e.n = 8; break }
                if (d = a.searchParams.get("model")) { e.n = 6; break }
                return e.a(2, "no model param");
              case 6:
                return g = Number(a.searchParams.get("pg") || "1"), y = this.buildModelUrl(r, d, g),
                  e.n = 7, l.Get(y, void 0, r.charset);
              case 7:
                return v = e.v, b = _(v), e.a(2, { menu: this.buildMenu(r, void 0, void 0, !1), list: this.toPlaylist(b, r) });
              case 8:
                if ("search" !== i) { e.n = 10; break }
                return f = a.searchParams.getAll("search"),
                  k_ = f.find((function (e) { return "" !== e.trim() })) || "",
                  w_ = Number(a.searchParams.get("pg") || "1"),
                  S_ = this.buildSearchUrl(r, k_, w_),
                  e.n = 9, l.Get(S_, void 0, r.charset);
              case 9:
                return P_ = e.v, z_ = _(P_), e.a(2, { menu: this.buildMenu(r, void 0, void 0, !1), list: this.toPlaylist(z_, r) });
              case 10:
                return L_ = a.searchParams.get("sort") || "",
                  j_ = a.searchParams.get("cat") || "",
                  M_ = Number(a.searchParams.get("pg") || "1"),
                  T_ = this.buildListUrl(r, M_, L_, j_),
                  e.n = 11, l.Get(T_, void 0, r.charset);
              case 11:
                return A_ = e.v, I_ = _(A_), e.a(2, { menu: this.buildMenu(r, L_, j_, !1), list: this.toPlaylist(I_, r) });
              case 12:
                return e.a(2)
            }
            var j_, M_, T_, A_, I_
          }), e, this)
        }))), function (t) { return _invoke.apply(this, arguments) })
      }]);
      var _extractStreams, _invoke
    }(),
    _NHCls.host = "nexthub://",
    _NHCls
  );
  var _NHCls;


  // ================================================================
  //  РАЗДЕЛ 3 · РЕДАКТИРУЕМЫЕ ИСТОЧНИКИ — HARDCODED
  // ================================================================

  // --- bongacams.com ---
  var d = (
    _BongaCams = function () {
      function e() { _classCallCheck(this, e) }
      return _createClass(e, [{
        key: "Invoke",
        value: (_bngInvoke = _asyncToGenerator(_regenerator().m((function t(a) {
          var n, r, i, o, s, c, u;
          return _regenerator().w((function (t) {
            for (;;) switch (t.n) {
              case 0:
                return n = new URL(a, e.host), !a.includes("baba=") ? (t.n = 2) : (c = h, t.n = 1, this.StreamLinks(n.searchParams.get("baba")));
              case 1:
                return u = t.v, t.a(2, new c(u, !1));
              case 2:
                return r = n.searchParams.get("sort") || "",
                  i = parseInt(n.searchParams.get("pg") || "1", 10),
                  o = this.buildUrl(e.host, r, i),
                  t.n = 3, l.Get(o);
              case 3:
                return s = t.v, t.a(2, { menu: this.Menu(r), list: this.Playlist(s) });
              case 4: return t.a(2)
            }
          }), t, this)
        }))), function (e) { return _bngInvoke.apply(this, arguments) })
      }, {
        key: "buildUrl",
        value: function (e, t, a) {
          var n = e + "/api/ts/roomlist/room-list/?enable_recommendations=false&limit=90";
          return t && (n += "&genders=".concat(t)), a > 1 && (n += "&offset=".concat(90 * a)), n
        }
      }, {
        key: "Playlist",
        value: function (t) {
          if (!t) return [];
          for (var a = t.split("display_age"), n = [], r = 1; r < a.length; r++) {
            var i = a[r];
            if (i.includes('"current_show":"public"')) {
              var o = c.extract(i, /"username":"([^"]+)"/);
              if (o) {
                var s = c.extract(i, /"img":"([^"]+)"/);
                s && (s = s.replace(/\\/g, ""), n.push(new u(o.trim(), "".concat(e.host, "?baba=").concat(o.trim()), s, null, null, null, !0, !1, null)))
              }
            }
          }
          return n
        }
      }, {
        key: "Menu",
        value: function (t) {
          var a, n = e.host + "/chu",
            r = [new p("Лучшие", n), new p("Девушки", n + "?sort=f"), new p("Пары", n + "?sort=c"), new p("Парни", n + "?sort=m"), new p("Транссексуалы", n + "?sort=t")],
            i = (null === (a = r.find((function (e) { return e.playlist_url.endsWith("=".concat(t)) }))) || void 0 === a ? void 0 : a.title) || "Лучшие";
          return [new p("Сортировка: ".concat(i), "submenu", void 0, r)]
        }
      }, {
        key: "StreamLinks",
        value: (_bngStreams = _asyncToGenerator(_regenerator().m((function t(a) {
          var n, r;
          return _regenerator().w((function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (a) { t.n = 1; break }
                return t.a(2, new m({}, []));
              case 1:
                return t.n = 2, l.Get("".concat(e.host, "/").concat(a, "/"));
              case 2:
                if (n = t.v, r = c.extract(n, /(https?:\/\/[^ ]+\/playlist\.m3u8)/)) { t.n = 3; break }
                return t.a(2, new m({}, []));
              case 3:
                return t.a(2, new m({ auto: r.replace(/\\u002D/g, "-").replace(/\\/g, "") }, []))
            }
          }), t)
        }))), function (e) { return _bngStreams.apply(this, arguments) })
      }]);
      var _bngInvoke, _bngStreams
    }(),
    _BongaCams.host = "https://chaturbate.com",
    _BongaCams
  );
  var _BongaCams;

  // --- xv-ru.com (xvideos) ---
  var g = (
    _XVideos = function () {
      function e() { _classCallCheck(this, e) }
      return _createClass(e, [{
        key: "Invoke",
        value: (_xvInvoke = _asyncToGenerator(_regenerator().m((function t(a) {
          var n, r, i, o, s, c, u, p;
          return _regenerator().w((function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (!a.includes("/video")) { t.n = 2; break }
                return t.n = 1, l.Get(a);
              case 1:
                return n = t.v, t.a(2, new h(this.StreamLinks(n), a.includes("&related")));
              case 2:
                return r = new URL(a, e.host),
                  i = r.searchParams.get("search") || "",
                  o = r.searchParams.get("sort") || "",
                  s = r.searchParams.get("c") || "",
                  c = parseInt(r.searchParams.get("pg") || "1", 10),
                  u = this.buildUrl(e.host, i, o, s, c),
                  t.n = 3, l.Get(u);
              case 3:
                return p = t.v, t.a(2, { menu: this.Menu(o, s), list: this.Playlist(p) });
              case 4: return t.a(2)
            }
          }), t, this)
        }))), function (e) { return _xvInvoke.apply(this, arguments) })
      }, {
        key: "buildUrl",
        value: function (e, t, a, n, r) {
          return t
            ? "".concat(e, "/?k=").concat(encodeURIComponent(t), "&p=").concat(r)
            : n
              ? "".concat(e, "/c/s:").concat("top" === a ? "rating" : "uploaddate", "/").concat(n, "/").concat(r)
              : "top" === a
                ? "".concat(e, "/best/").concat(this.getLastMonth(), "/").concat(r)
                : "".concat(e, "/new/").concat(r)
        }
      }, {
        key: "getLastMonth",
        value: function () {
          var e = new Date; e.setMonth(e.getMonth() - 1); return e.toISOString().slice(0, 7)
        }
      }, {
        key: "Playlist",
        value: function (t) {
          if (!t) return [];
          for (var a = t.split('<div id="video'), n = [], r = 1; r < a.length; r++) {
            var i = a[r],
              o = /<a href="\/(video[^"]+|search-video\/[^"]+)" title="([^"]+)"/.exec(i);
            if (o && o[1] && o[2] || (o = /<a href="\/(video[^"]+)"[^>]+>([^<]+)/.exec(i)) && o[1] && o[2]) {
              var s = c.extract(i, /<span class="video-hd-mark">([^<]+)<\/span>/),
                k_ = c.extract(i, /<span class="duration">([^<]+)<\/span>/),
                p_ = c.extract(i, /data-src="([^"]+)"/),
                d_ = (p_ = p_ ? (p_ = (p_ = p_.replace(/\/videos\/thumbs([0-9]+)\//, "/videos/thumbs$1lll/")).replace(/\.THUMBNUM\.(jpg|png)$/i, ".1.$1")).replace("thumbs169l/", "thumbs169lll/").replace("thumbs169ll/", "thumbs169lll/") : "").replace(/\/thumbs[^/]+\//, "/videopreview/");
              d_ = (d_ = d_.replace(/\/[^/]+$/, "")).replace(/-[0-9]+$/, "");
              n.push(new u(o[2], "".concat(e.host, "/").concat(o[1]), p_, d_ + "_169.mp4", k_ || null, s || null, !0, !0, null))
            }
          }
          return n
        }
      }, {
        key: "Menu",
        value: function (t, a) {
          var n, r = e.host,
            i = [new p("Поиск", r, "search_on")],
            o = new p("Сортировка: ".concat("like" === t ? "Понравившиеся" : "top" === t ? "Лучшие" : "Новое"), "submenu", void 0,
              [new p("Новое", r + "?c=".concat(a)), new p("Лучшие", r + "?sort=top&c=".concat(a))]);
          i.push(o);
          var s = [new p("Все", r + "?sort=".concat(t)), new p("Азиат", r + "?sort=".concat(t, "&c=Asian_Woman-32")), new p("Анал", r + "?sort=".concat(t, "&c=Anal-12")), new p("Арабки", r + "?sort=".concat(t, "&c=Arab-159")), new p("Бисексуалы", r + "?sort=".concat(t, "&c=Bi_Sexual-62")), new p("Блондинки", r + "?sort=".concat(t, "&c=Blonde-20")), new p("Большие Попы", r + "?sort=".concat(t, "&c=Big_Ass-24")), new p("Большие Сиськи", r + "?sort=".concat(t, "&c=Big_Tits-23")), new p("Большие яйца", r + "?sort=".concat(t, "&c=Big_Cock-34")), new p("Брюнетки", r + "?sort=".concat(t, "&c=Brunette-25")), new p("В масле", r + "?sort=".concat(t, "&c=Oiled-22")), new p("Веб камеры", r + "?sort=".concat(t, "&c=Cam_Porn-58")), new p("Гэнгбэнг", r + "?sort=".concat(t, "&c=Gangbang-69")), new p("Зияющие отверстия", r + "?sort=".concat(t, "&c=Gapes-167")), new p("Зрелые", r + "?sort=".concat(t, "&c=Mature-38")), new p("Индийский", r + "?sort=".concat(t, "&c=Indian-89")), new p("Испорченная семья", r + "?sort=".concat(t, "&c=Fucked_Up_Family-81")), new p("Кончает внутрь", r + "?sort=".concat(t, "&c=Creampie-40")), new p("Куколд / Горячая Жена", r + "?sort=".concat(t, "&c=Cuckold-237")), new p("Латинки", r + "?sort=".concat(t, "&c=Latina-16")), new p("Лесбиянки", r + "?sort=".concat(t, "&c=Lesbian-26")), new p("Любительское порно", r + "?sort=".concat(t, "&c=Amateur-65")), new p("Мамочки. МИЛФ", r + "?sort=".concat(t, "&c=Milf-19")), new p("Межрассовые", r + "?sort=".concat(t, "&c=Interracial-27")), new p("Минет", r + "?sort=".concat(t, "&c=Blowjob-15")), new p("Нижнее бельё", r + "?sort=".concat(t, "&c=Lingerie-83")), new p("Попки", r + "?sort=".concat(t, "&c=Ass-14")), new p("Рыжие", r + "?sort=".concat(t, "&c=Redhead-31")), new p("Сквиртинг", r + "?sort=".concat(t, "&c=Squirting-56")), new p("Соло", r + "?sort=".concat(t, "&c=Solo_and_Masturbation-33")), new p("Сперма", r + "?sort=".concat(t, "&c=Cumshot-18")), new p("Тинейджеры", r + "?sort=".concat(t, "&c=Teen-13")), new p("Фемдом", r + "?sort=".concat(t, "&c=Femdom-235")), new p("Фистинг", r + "?sort=".concat(t, "&c=Fisting-165")), new p("Черные Женщины", r + "?sort=".concat(t, "&c=bbw-51")), new p("Черный", r + "?sort=".concat(t, "&c=Black_Woman-30")), new p("Чулки,колготки", r + "?sort=".concat(t, "&c=Stockings-28")), new p("ASMR", r + "?sort=".concat(t, "&c=ASMR-229"))];
          return i.push(new p("Категория: ".concat((null === (n = s.find((function (e) { return e.playlist_url.endsWith("c=".concat(a)) }))) || void 0 === n ? void 0 : n.title) || "все"), "submenu", void 0, s)), i
        }
      }, {
        key: "StreamLinks",
        value: function (t) {
          var a = c.extract(t, /html5player\.setVideoHLS$'([^']+)'$;/);
          if (!a) return new m({}, []);
          var n = [], r = c.extract(t, /video_related=([^\n\r]+);window/);
          if (r && r.startsWith("[") && r.endsWith("]")) try {
            var i, o = _createForOfIteratorHelper(JSON.parse(r));
            try {
              for (o.s(); !(i = o.n()).done;) {
                var s = i.value;
                if (s.tf && s.u && s.if) {
                  var k_ = s.if.replace(/\/thumbs[^/]+\//, "/videopreview/");
                  k_ = (k_ = k_.replace(/\/[^/]+$/, "")).replace(/-[0-9]+$/, "");
                  n.push(new u(s.tf, "".concat(e.host).concat(s.u), s.if, k_ + "_169.mp4", s.d || "", null, !0, !0, null))
                }
              }
            } catch (e) { o.e(e) } finally { o.f() }
          } catch (e) {}
          return new m({ auto: a }, n)
        }
      }]);
      var _xvInvoke
    }(),
    _XVideos.host = "https://www.xv-ru.com",
    _XVideos
  );
  var _XVideos;

  // --- xnxx-ru.com ---
  var y = (
    _XNXX = function () {
      function e() { _classCallCheck(this, e) }
      return _createClass(e, [{
        key: "Invoke",
        value: (_xnxxInvoke = _asyncToGenerator(_regenerator().m((function t(a) {
          var n, r, i, o, s, c;
          return _regenerator().w((function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (!a.includes("/video-")) { t.n = 2; break }
                return t.n = 1, l.Get(a);
              case 1:
                return n = t.v, t.a(2, new h(this.StreamLinks(n), a.includes("&related")));
              case 2:
                return r = new URL(a, e.host),
                  i = r.searchParams.get("search") || "",
                  o = parseInt(r.searchParams.get("pg") || "1", 10),
                  s = this.buildUrl(e.host, i, o),
                  t.n = 3, l.Get(s);
              case 3:
                return c = t.v, t.a(2, { menu: this.Menu(), list: this.Playlist(c) });
              case 4: return t.a(2)
            }
          }), t, this)
        }))), function (e) { return _xnxxInvoke.apply(this, arguments) })
      }, {
        key: "buildUrl",
        value: function (e, t, a) {
          if (t) return "".concat(e, "/search/").concat(encodeURIComponent(t), "/").concat(a);
          var n = new Date; n.setMonth(n.getMonth() - 1);
          return "".concat(e, "/best/").concat(n.toISOString().slice(0, 7), "/").concat(a)
        }
      }, {
        key: "Playlist",
        value: function (t) {
          if (!t) return [];
          for (var a = t.split('<div id="video_'), n = [], r = 1; r < a.length; r++) {
            var i = a[r],
              o = /<a href="\/(video-[^"]+)" title="([^"]+)"/.exec(i),
              s = c.extract(i, /<span class="superfluous"> - <\/span>([^<]+)<\/span>/);
            if (o && o[1] && o[2]) {
              var k_ = c.extract(i, /<\/span>([^<]+)<span class="video-hd">/),
                p_ = c.extract(i, /data-src="([^"]+)"/),
                d_ = (p_ = p_ ? p_.replace(".THUMBNUM.", ".1.") : "").replace(/\/thumbs[^/]+\//, "/videopreview/");
              d_ = (d_ = d_.replace(/\/[^/]+$/, "")).replace(/-[0-9]+$/, "");
              n.push(new u(o[2], "".concat(e.host, "/").concat(o[1]), p_, d_ + "_169.mp4", k_ || null, s || null, !0, !0, null))
            }
          }
          return n
        }
      }, {
        key: "Menu",
        value: function () {
          var t = e.host + "/xnx";
          return [new p("Поиск", t, "search_on")]
        }
      }, {
        key: "StreamLinks",
        value: function (t) {
          var a = c.extract(t, /html5player\.setVideoHLS$'([^']+)'$;/);
          if (!a) return new m({}, []);
          var n = [], r = c.extract(t, /video_related=([^\n\r]+);window/);
          if (r && r.startsWith("[") && r.endsWith("]")) try {
            var i, o = _createForOfIteratorHelper(JSON.parse(r));
            try {
              for (o.s(); !(i = o.n()).done;) {
                var s = i.value;
                s.tf && s.u && s.i && n.push(new u(s.tf, "".concat(e.host).concat(s.u), s.i, null, "", null, !0, !0, null))
              }
            } catch (e) { o.e(e) } finally { o.f() }
          } catch (e) {}
          return new m({ auto: a }, n)
        }
      }]);
      var _xnxxInvoke
    }(),
    _XNXX.host = "https://www.xnxx-ru.com",
    _XNXX
  );
  var _XNXX;

  // --- ru.spankbang.com ---
  var v = (
    _SpankBang = function () {
      function e() { _classCallCheck(this, e) }
      return _createClass(e, [{
        key: "Invoke",
        value: (_sbInvoke = _asyncToGenerator(_regenerator().m((function t(a) {
          var n, r, i, o, s, c, u;
          return _regenerator().w((function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (!/\/video\//.test(a)) { t.n = 2; break }
                return t.n = 1, l.Get(a);
              case 1:
                return n = t.v, t.a(2, new h(this.StreamLinks(n), a.includes("&related")));
              case 2:
                return r = new URL(a, e.host),
                  i = r.searchParams.get("search") || "",
                  o = r.searchParams.get("sort") || "",
                  s = parseInt(r.searchParams.get("pg") || "1", 10),
                  c = this.buildUrl(e.host, i, o, s),
                  t.n = 3, l.Get(c);
              case 3:
                return u = t.v, t.a(2, { menu: this.Menu(o), list: this.Playlist(u) });
              case 4: return t.a(2)
            }
          }), t, this)
        }))), function (e) { return _sbInvoke.apply(this, arguments) })
      }, {
        key: "buildUrl",
        value: function (e, t, a, n) {
          var r = "".concat(e, "/");
          return t
            ? r += "s/".concat(encodeURIComponent(t), "/").concat(n, "/")
            : (r += "".concat(a || "new_videos", "/").concat(n, "/"), "most_popular" === a && (r += "?p=m")),
            r
        }
      }, {
        key: "Playlist",
        value: function (t) {
          if (!t) return [];
          for (var a = t.split('class="video-item responsive-page"'), n = [], r = 1; r < a.length; r++) {
            var i = a[r],
              o = /<a href="\/([^\"]+)" title="([^"]+)"/.exec(i);
            if (o && o[1] && o[2]) {
              var s = c.extract(i, /<span class="video-badge h">([^<]+)<\/span>/),
                k_ = c.extract(i, /<span class="video-badge l">([^<]+)<\/span>/),
                p_ = c.extract(i, /data-src="([^"]+)"/);
              p_ = p_ ? p_.replace(/\/w:[0-9]00\//, "/w:300/") : "";
              var d_ = c.extract(i, /data-preview="([^"]+)"/);
              n.push(new u(o[2], "".concat(e.host, "/").concat(o[1]), p_, d_ || null, k_ || null, s || null, !0, !0, null))
            }
          }
          return n
        }
      }, {
        key: "Menu",
        value: function (t) {
          var a = e.host + "/sbg";
          return [
            new p("Поиск", a, "search_on"),
            new p("Сортировка: ".concat(t || "новое"), "submenu", void 0,
              [new p("Новое", a), new p("Трендовое", a + "?sort=trending_videos"), new p("Популярное", a + "?sort=most_popular")])
          ]
        }
      }, {
        key: "StreamLinks",
        value: function (e) {
          for (var t, a = {}, n = /'([0-9]+)(p|k)': ?$'(https?:\/\/[^']+)'/g; null !== (t = n.exec(e));) {
            var r = "k" === t[2] ? 2160 : parseInt(t[1], 10);
            a["".concat(r, "p")] = t[3]
          }
          return new m(a, this.Playlist(e))
        }
      }]);
      var _sbInvoke
    }(),
    _SpankBang.host = "https://ru.spankbang.com",
    _SpankBang
  );
  var _SpankBang;

  // --- chaturbate.com ---
  var b = (
    _Chaturbate = function () {
      function e() { _classCallCheck(this, e) }
      return _createClass(e, [{
        key: "Invoke",
        value: (_cbInvoke = _asyncToGenerator(_regenerator().m((function t(a) {
          var n, r, i, o, s, c, u;
          return _regenerator().w((function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (n = new URL(a, e.host), !a.includes("baba=")) { t.n = 2; break }
                return c = h, t.n = 1, this.StreamLinks(n.searchParams.get("baba"));
              case 1:
                return u = t.v, t.a(2, new c(u, !1));
              case 2:
                return r = n.searchParams.get("sort") || "",
                  i = parseInt(n.searchParams.get("pg") || "1", 10),
                  o = this.buildUrl(e.host, r, i),
                  t.n = 3, l.Get(o);
              case 3:
                return s = t.v, t.a(2, { menu: this.Menu(r), list: this.Playlist(s) });
              case 4: return t.a(2)
            }
          }), t, this)
        }))), function (e) { return _cbInvoke.apply(this, arguments) })
      }, {
        key: "buildUrl",
        value: function (e, t, a) {
          var n = e + "/api/ts/roomlist/room-list/?enable_recommendations=false&limit=90";
          return t && (n += "&genders=".concat(t)), a > 1 && (n += "&offset=".concat(90 * a)), n
        }
      }, {
        key: "Playlist",
        value: function (t) {
          if (!t) return [];
          for (var a = t.split("display_age"), n = [], r = 1; r < a.length; r++) {
            var i = a[r];
            if (i.includes('"current_show":"public"')) {
              var o = c.extract(i, /"username":"([^"]+)"/);
              if (o) {
                var s = c.extract(i, /"img":"([^"]+)"/);
                s && (s = s.replace(/\\/g, ""), n.push(new u(o.trim(), "".concat(e.host, "?baba=").concat(o.trim()), s, null, null, null, !0, !1, null)))
              }
            }
          }
          return n
        }
      }, {
        key: "Menu",
        value: function (t) {
          var a, n = e.host + "/chu",
            r = [new p("Лучшие", n), new p("Девушки", n + "?sort=f"), new p("Пары", n + "?sort=c"), new p("Парни", n + "?sort=m"), new p("Транссексуалы", n + "?sort=t")],
            i = (null === (a = r.find((function (e) { return e.playlist_url.endsWith("=".concat(t)) }))) || void 0 === a ? void 0 : a.title) || "Лучшие";
          return [new p("Сортировка: ".concat(i), "submenu", void 0, r)]
        }
      }, {
        key: "StreamLinks",
        value: (_cbStreams = _asyncToGenerator(_regenerator().m((function t(a) {
          var n, r;
          return _regenerator().w((function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (a) { t.n = 1; break }
                return t.a(2, new m({}, []));
              case 1:
                return t.n = 2, l.Get("".concat(e.host, "/").concat(a, "/"));
              case 2:
                if (n = t.v, r = c.extract(n, /(https?:\/\/[^ ]+\/playlist\.m3u8)/)) { t.n = 3; break }
                return t.a(2, new m({}, []));
              case 3:
                return t.a(2, new m({ auto: r.replace(/\\u002D/g, "-").replace(/\\/g, "") }, []))
            }
          }), t)
        }))), function (e) { return _cbStreams.apply(this, arguments) })
      }]);
      var _cbInvoke, _cbStreams
    }(),
    _Chaturbate.host = "https://chaturbate.com",
    _Chaturbate
  );
  var _Chaturbate;

  // --- eporner.com ---
  var f = (
    _Eporner = function () {
      function e() { _classCallCheck(this, e) }
      return _createClass(e, [{
        key: "Invoke",
        value: (_epInvoke = _asyncToGenerator(_regenerator().m((function t(a) {
          var n, r, i, o, s, c, u, p, d, m_;
          return _regenerator().w((function (t) {
            for (;;) switch (t.n) {
              case 0:
                if (!a.includes("/video")) { t.n = 2; break }
                return p = h, t.n = 1, this.StreamLinks(e.host, a);
              case 1:
                return d = t.v, m_ = a.includes("&related"), t.a(2, new p(d, m_));
              case 2:
                return n = new URL(a, e.host),
                  r = n.searchParams.get("search") || "",
                  i = n.searchParams.get("sort") || "",
                  o = n.searchParams.get("c") || "",
                  s = parseInt(n.searchParams.get("pg") || "1", 10),
                  c = this.buildUrl(e.host, r, i, o, s),
                  t.n = 3, l.Get(c);
              case 3:
                return u = t.v, t.a(2, { menu: this.Menu(r, i, o), list: this.Playlist(u) });
              case 4: return t.a(2)
            }
          }), t, this)
        }))), function (e) { return _epInvoke.apply(this, arguments) })
      }, {
        key: "buildUrl",
        value: function (e, t, a, n, r) {
          var i = "".concat(e, "/");
          return t
            ? (i += "search/".concat(encodeURIComponent(t), "/"), r > 1 && (i += "".concat(r, "/")), a && (i += "".concat(a, "/")))
            : n
              ? (i += "cat/".concat(n, "/"), r > 1 && (i += "".concat(r, "/")))
              : (r > 1 && (i += "".concat(r, "/")), a && (i += "".concat(a, "/"))),
            i
        }
      }, {
        key: "Playlist",
        value: function (t) {
          if (!t) return [];
          var a = t;
          a.includes('class="toptopbelinset"') && (a = a.split('class="toptopbelinset"')[1]);
          a.includes('class="relatedtext"') && (a = a.split('class="relatedtext"')[1]);
          for (var n = a.split(/<div class="mb (hdy)?"/), r = [], i = 1; i < n.length; i++) {
            var o = n[i],
              s = /<p class="mbtit">\s*<a href="\/([^"]+)">([^<]+)<\/a>/i.exec(o);
            if (s && s[1] && s[2]) {
              var k_ = c.extract(o, /<div class="mvhdico"([^>]+)?><span>([^"<]+)/, 2),
                p_ = c.extract(o, / data-src="([^"]+)"/);
              p_ || (p_ = c.extract(o, /<img src="([^"]+)"/));
              var d_ = c.extract(o, /data-id="([^"]+)"/),
                h_ = p_ && d_ ? p_.replace(/\/[^/]+$/, "") + "/".concat(d_, "-preview.webm") : null,
                m_ = c.extract(o, /<span class="mbtim"([^>]+)?>([^<]+)<\/span>/, 2);
              r.push(new u(s[2], "".concat(e.host, "/").concat(s[1]), p_ || "", h_, m_ || null, k_ || null, !0, !0, null))
            }
          }
          return r
        }
      }, {
        key: "Menu",
        value: function (t, a, n) {
          var r, i = e.host,
            o = [new p("Поиск", i, "search_on")];
          if (t) return o.push(new p("Сортировка: ".concat(a || "новинки"), "submenu", void 0, [new p("Новинки", i + "?search=".concat(encodeURIComponent(t))), new p("Топ просмотра", i + "?sort=most-viewed&search=".concat(encodeURIComponent(t))), new p("Топ рейтинга", i + "?sort=top-rated&search=".concat(encodeURIComponent(t))), new p("Длинные ролики", i + "?sort=longest&search=".concat(encodeURIComponent(t))), new p("Короткие ролики", i + "?sort=shortest&search=".concat(encodeURIComponent(t)))])), o;
          n || o.push(new p("Сортировка: ".concat(a || "новинки"), "submenu", void 0, [new p("Новинки", i), new p("Топ просмотра", i + "?sort=most-viewed"), new p("Топ рейтинга", i + "?sort=top-rated"), new p("Длинные ролики", i + "?sort=longest"), new p("Короткие ролики", i + "?sort=shortest")]));
          var s = [new p("Все", i), new p("4K UHD", i + "?c=4k-porn"), new p("60 FPS", i + "?c=60fps"), new p("Amateur", i + "?c=amateur"), new p("Anal", i + "?c=anal"), new p("Asian", i + "?c=asian"), new p("ASMR", i + "?c=asmr"), new p("BBW", i + "?c=bbw"), new p("BDSM", i + "?c=bdsm"), new p("Big Ass", i + "?c=big-ass"), new p("Big Dick", i + "?c=big-dick"), new p("Big Tits", i + "?c=big-tits"), new p("Bisexual", i + "?c=bisexual"), new p("Blonde", i + "?c=blonde"), new p("Blowjob", i + "?c=blowjob"), new p("Bondage", i + "?c=bondage"), new p("Brunette", i + "?c=brunette"), new p("Bukkake", i + "?c=bukkake"), new p("Creampie", i + "?c=creampie"), new p("Cumshot", i + "?c=cumshot"), new p("Double Penetration", i + "?c=double-penetration"), new p("Ebony", i + "?c=ebony"), new p("Fat", i + "?c=fat"), new p("Fetish", i + "?c=fetish"), new p("Fisting", i + "?c=fisting"), new p("Footjob", i + "?c=footjob"), new p("For Women", i + "?c=for-women"), new p("Gay", i + "?c=gay"), new p("Group Sex", i + "?c=group-sex"), new p("Handjob", i + "?c=handjob"), new p("Hardcore", i + "?c=hardcore"), new p("Hentai", i + "?c=hentai"), new p("Homemade", i + "?c=homemade"), new p("Hotel", i + "?c=hotel"), new p("Housewives", i + "?c=housewives"), new p("Indian", i + "?c=indian"), new p("Interracial", i + "?c=interracial"), new p("Japanese", i + "?c=japanese"), new p("Latina", i + "?c=latina"), new p("Lesbian", i + "?c=lesbians"), new p("Lingerie", i + "?c=lingerie"), new p("Massage", i + "?c=massage"), new p("Masturbation", i + "?c=masturbation"), new p("Mature", i + "?c=mature"), new p("MILF", i + "?c=milf"), new p("Nurses", i + "?c=nurse"), new p("Office", i + "?c=office"), new p("Older Men", i + "?c=old-man"), new p("Orgy", i + "?c=orgy"), new p("Outdoor", i + "?c=outdoor"), new p("Petite", i + "?c=petite"), new p("Pornstar", i + "?c=pornstar"), new p("POV", i + "?c=pov-porn"), new p("Public", i + "?c=public"), new p("Redhead", i + "?c=redhead"), new p("Shemale", i + "?c=shemale"), new p("Sleep", i + "?c=sleep"), new p("Small Tits", i + "?c=small-tits"), new p("Squirt", i + "?c=squirt"), new p("Striptease", i + "?c=striptease"), new p("Students", i + "?c=students"), new p("Swinger", i + "?c=swingers"), new p("Teen", i + "?c=teens"), new p("Threesome", i + "?c=threesome"), new p("Toys", i + "?c=toys"), new p("Uncategorized", i + "?c=uncategorized"), new p("Uniform", i + "?c=uniform"), new p("Vintage", i + "?c=vintage"), new p("Webcam", i + "?c=webcam")];
          return o.push(new p("Категория: ".concat((null === (r = s.find((function (e) { return e.playlist_url.endsWith("c=".concat(n)) }))) || void 0 === r ? void 0 : r.title) || "все"), "submenu", void 0, s)), o
        }
      }, {
        key: "StreamLinks",
        value: (_epStreams = _asyncToGenerator(_regenerator().m((function e(t, a) {
          var n, r, i, o, s, u, p, d;
          return _regenerator().w((function (e) {
            for (;;) switch (e.n) {
              case 0:
                if (a) { e.n = 1; break }
                return e.a(2, new m({}, []));
              case 1:
                return e.n = 2, l.Get(a);
              case 2:
                if (n = e.v) { e.n = 3; break }
                return e.a(2, new m({}, []));
              case 3:
                if (r = c.extract(n, /vid ?= ?'([^']+)'/), i = c.extract(n, /hash ?= ?'([^']+)'/), r && i) { e.n = 4; break }
                return e.a(2, new m({}, []));
              case 4:
                return o = "".concat(t, "/xhr/video/").concat(r, "?hash=").concat(this.convertHash(i), "&domain=").concat(t.replace(/^https?:\/\//, ""), "&fallback=false&embed=false&supportedFormats=dash,mp4&_=").concat(Math.floor(Date.now() / 1e3)),
                  e.n = 5, l.Get(o);
              case 5:
                if (s = e.v) { e.n = 6; break }
                return e.a(2, new m({}, []));
              case 6:
                for (u = {}, p = /"src":\s*"(https?:\/\/[^/]+\/[^"]+-([0-9]+p)\.mp4)",/g; null !== (d = p.exec(s));) u[d[2]] = d[1];
                return e.a(2, new m(u, this.Playlist(n)))
            }
          }), e, this)
        }))), function (e, a) { return _epStreams.apply(this, arguments) })
      }, {
        key: "convertHash",
        value: function (e) {
          return this.base36(e.substring(0, 8)) + this.base36(e.substring(8, 16)) + this.base36(e.substring(16, 24)) + this.base36(e.substring(24, 32))
        }
      }, {
        key: "base36",
        value: function (e) {
          for (var t = "", a = parseInt(e, 16); a > 0;) t = "0123456789abcdefghijklmnopqrstuvwxyz"[a % 36] + t, a = Math.floor(a / 36);
          return t || "0"
        }
      }]);
      var _epInvoke, _epStreams
    }(),
    _Eporner.host = "https://www.eporner.com",
    _Eporner
  );
  var _Eporner;

  // Экземпляры hardcoded источников
  var z = new d,  // bongacams
      L = new g,  // xvideos
      j = new y,  // xnxx
      M = new v,  // spankbang
      T = new b,  // chaturbate
      A = new f;  // eporner


  // ================================================================
  //  РАЗДЕЛ 4 · РЕДАКТИРУЕМЫЕ ИСТОЧНИКИ — NEXTHUB P[]
  //  Каждый объект — отдельный сайт. enable: false — отключить.
  // ================================================================
  var P = [

    // --- rt.pornhub.com ---
    {
      enable: !0,
      displayname: "PornHub",
      host: "https://rt.pornhub.com",
      menu: {
        route: {
          sort: "{host}/video?o={sort}&page={page}",
          model: "{host}{model}/videos?page={page}",
          cat: "{host}/video?c={cat}&page={page}",
          catsort: "{host}/video?c={cat}&o={sort}&page={page}"
        },
        sort: {
          "Недавно в Избранном": "",
          "Новые": "cm",
          "Популярные": "mv",
          "Лучшие": "tr",
          "Горячие": "ht"
        },
        categories: {
          "Все": "", "Азиатки": "1", "Анальный секс": "35", "Арабское": "98", "БДСМ": "10",
          "Бисексуалы": "76", "Блондинки": "9", "Большая грудь": "8", "Большие члены": "7",
          "Бразильское": "102", "Британское": "96", "Брызги": "69", "Брюнетки": "11",
          "Буккаке": "14", "В школе": "88", "Веб-камера": "61", "Вечеринки": "53",
          "Гонзо": "41", "Грубый секс": "67", "Групповуха": "80", "Девушки (соло)": "492",
          "Двойное проникновение": "72", "Дрочит": "20", "Европейцы": "55", "Жесткий секс": "21",
          "Женский оргазм": "502", "За кадром": "141", "Звезды": "12", "Золотой дождь": "211",
          "Зрелые": "28", "Игрушки": "23", "Индийское": "101", "Итальянское": "97",
          "Кастинги": "90", "Кончают": "16", "Корейское": "103", "Косплей": "241",
          "Кунилингус": "131", "Курящие": "91", "Латинки": "26", "Лесбиянки": "27",
          "Любительское": "3", "Маленькая грудь": "59", "Мамочки": "29", "Массаж": "78",
          "Мастурбация": "22", "Межрассовый Секс": "25", "Минет": "13", "Музыка": "121",
          "Мулаты": "17", "Мультики": "86", "Мускулистые Мужчины": "512", "На публике": "24",
          "Немецкое": "95", "Ноги": "93", "Няни": "89", "Парни (соло)": "92",
          "Пародия": "201", "Попки": "4", "Приколы": "32", "Проверенное Любительское": "138",
          "Проверенные Модели": "139", "Проверенные Пары": "482", "Реальный секс": "31",
          "Ретро": "43", "Рогоносцы": "242", "Ролевые Игры": "81", "Русское": "99",
          "Секс втроем": "65", "60FPS": "105", "Closed Captions": "732", "Gaming": "881",
          "Podcast": "891"
        }
      },
      list: { uri: "video?page={page}" },
      search: { uri: "video/search?search={search}&page={page}" },
      contentParse: {
        nodes: "//li[contains(@class,'videoblock')] | //div[contains(@class,'video-list') or contains(@class,'videos')]//li[contains(@class,'videoblock')] | //ul[@id='videoCategory']//li[contains(@class,'videoblock')]",
        name: { node: ".//a[@data-event='thumb_click'] | .//a[@class='gtm-event-thumb-click'] | .//span[@class='title']//a" },
        href: { node: ".//a[contains(@class,'linkVideoThumb')] | .//a[contains(@class,'title')]", attribute: "href" },
        img: { node: ".//img | .//a[contains(@class,'linkVideoThumb')]//img", attributes: ["data-mediumthumb", "data-thumb_url", "data-image", "src"] },
        preview: { node: ".//img | .//a[contains(@class,'linkVideoThumb')]//img", attribute: "data-mediabook" },
        duration: { node: ".//*[contains(@class,'duration')]" },
        model: {
          name: { node: ".//a[contains(@href,'/model/')]" },
          href: { node: ".//a[contains(@href,'/model/')]", attribute: "href" }
        }
      },
      view: {
        related: !0,
        regexMatch: {
          matches: ["1080", "720", "480", "360", "240"],
          pattern: '"videoUrl":"([^"]+)","quality":"{value}"'
        }
      }
    },

    // --- ru.xhamster.com ---
    {
      enable: !0,
      displayname: "Xhamster",
      host: "https://ru.xhamster.com",
      menu: {
        route: {
          sort: "{host}/{sort}/{page}",
          cat: "{host}/categories/{cat}/{page}",
          catsort: "{host}/categories/{cat}/{sort}/{page}"
        },
        sort: { "В тренде": "", "Новейшее": "newest", "Лучшие": "best/weekly" },
        categories: {
          "Все": "", "Русское": "russian", "Секс втроем": "threesome", "Азиатское": "asian",
          "Анал": "anal", "Арабское": "arab", "АСМР": "asmr", "Бабки": "granny",
          "БДСМ": "bdsm", "Би": "bisexual", "Большие жопы": "big-ass", "Большие задницы": "pawg",
          "Большие сиськи": "big-tits", "Большой член": "big-cock", "Британское": "british",
          "В возрасте": "mature", "Вебкамера": "webcam", "Винтаж": "vintage",
          "Волосатые": "hairy", "Голые мужчины одетые женщины": "cfnm",
          "Групповой секс": "group-sex", "Гэнгбэнг": "gangbang", "Дилдо": "dildo",
          "Домашнее порно": "homemade", "Дрочка ступнями": "footjob",
          "Женское доминирование": "femdom", "Жиробасина": "ssbbw", "Жопа": "ass",
          "Застряла": "stuck", "Знаменитость": "celebrity", "Игра": "game",
          "История": "story", "Кастинг": "casting", "Комический": "comic",
          "Кончина": "cumshot", "Кремовый пирог": "creampie", "Латина": "latina",
          "Лесбиянка": "lesbian", "Лизать киску": "eating-pussy",
          "Любительское порно": "amateur", "Массаж": "massage", "Медсестра": "nurse",
          "Межрасовый секс": "interracial", "МИЛФ": "milf", "Милые": "cute",
          "Минет": "blowjob", "Миниатюрная": "petite", "Миссионерская поза": "missionary",
          "Монахиня": "nun", "Мультфильмы": "cartoon", "Негритянки": "black",
          "Немецкое": "german", "Офис": "office", "Первый раз": "first-time",
          "Пляж": "beach", "Порно для женщин": "porn-for-women", "Реслинг": "wrestling",
          "Рогоносцы": "cuckold", "Романтический": "romantic", "Свингеры": "swingers",
          "Сквирт": "squirting", "Старик": "old-man", "Старые с молодыми": "old-young",
          "Тинейджеры (18+)": "teen", "Толстушки": "bbw", "Тренажерный зал": "gym",
          "Узкая киска": "tight-pussy", "Французское": "french", "Футанари": "futanari",
          "Хардкор": "hardcore", "Хенджоб": "handjob", "Хентай": "hentai",
          "Японское": "japanese"
        }
      },
      list: { uri: "{host}/{page}", firstpage: "{host}" },
      search: { uri: "search/{search}/{page}" },
      contentParse: {
        nodes: "//div[contains(@class,'thumb-list__item')] | //div[contains(@class,'thumb-list-mobile-item')]",
        name: { node: ".//a[contains(@class,'video-thumb-info__name')]" },
        href: { node: ".//a[contains(@class,'video-thumb-info__name')]", attribute: "href" },
        img: { node: ".//img", attributes: ["srcset", "src"] },
        preview: { node: ".//a", attribute: "data-previewvideo" },
        duration: { node: ".//div[@data-role='video-duration'] | .//time[contains(@class,'video-thumb__time')]" }
      },
      view: {
        related: !0,
        nodeFile: { node: "//link[@rel='preload']", attribute: "href" }
      }
    },

    // --- wes.lenkino.adult ---
    {
      enable: !0,
      displayname: "Lenkino",
      host: "https://wes.lenkino.adult",
      menu: {
        route: {
          cat: "{host}/{cat}/page/{page}",
          sort: "{host}/{sort}/page/{page}",
          catsort: "{host}/{cat}-top/page/{page}",
          model: "{model}/page/{page}"
        },
        sort: { "Новые": "", "Лучшие": "top-porno", "Горячие": "hot-porno" },
        categories: {
          "Русское порно": "a1-russian", "Порно зрелых": "milf-porn", "Красивый секс": "beautiful",
          "Мачеха": "stepmom", "Анал": "anal-porno", "Большие сиськи": "big-tits",
          "Эротика": "erotic", "Лесби": "lesbi-porno", "Групповуха": "group-videos",
          "POV": "pov", "БДСМ": "bdsm", "Вебкамера": "webcam", "Ганг банг": "gangbang",
          "Домашнее порно": "amateur", "ЖМЖ": "threesome-ffm", "Кастинг": "casting",
          "Куни": "cunnilingus", "Массаж": "massage", "Мастурбация": "masturbation",
          "Минет": "blowjob", "Соло": "solo", "Хардкор": "hardcore", "МЖМ": "threesome-mmf",
          "Чешское порно": "czech", "Русское домашнее": "russian-amateur", "Молодые": "teen",
          "Старые с молодыми": "old-young", "Студенты": "student", "Азиатки": "asian",
          "Латинки": "latina", "Медсестра": "nurse", "Секретарша": "secretary",
          "Няня": "babysitter", "Черлидерша": "cheerleader", "Студентка": "schoolgirl",
          "Горничная": "maid", "Учительница": "teacher", "Блондинки": "blonde",
          "Брюнетки": "brunette", "Рыжие": "redhead", "Короткие волосы": "short-hair",
          "Длинные волосы": "long-hair", "Косички": "pigtails", "В ванной": "bathroom",
          "В машине": "car", "В офисе": "office", "В спальне": "bedroom",
          "В спортзале": "gym", "На кухне": "kitchen", "На пляже": "beach",
          "На природе": "outdoor", "На диване": "sofa", "На столе": "table",
          "Двойное проникновение": "double-penetration", "Крупным планом": "close-up",
          "Лижет попу": "rimjob", "Между сисек": "titjob", "Наездница": "cowgirl",
          "Оргазмы": "orgasm", "Поза 69": "69", "Раком": "doggy-style",
          "Сквирт": "squirt", "Стриптиз": "striptease", "Большие жопы": "big-ass",
          "Большой чёрный член": "bbc", "Большие члены": "big-cock", "Гибкие": "flexible",
          "Красивая грудь": "nice-tits", "Маленькие сиськи": "small-tits",
          "Натуральные сиськи": "natural-tits", "Красивые попки": "nice-ass",
          "Красивые": "beautiful", "Бритые письки": "shaved", "Волосатая пизда": "hairy",
          "Толстые": "bbw", "Худые": "skinny", "Силиконовые сиськи": "fake-tits",
          "Интимные стрижки": "trimmed", "Загорелые": "tanned", "Босс": "boss",
          "Доктор": "doctor", "Тренер": "trainer", "В красивом белье": "lingerie",
          "В чулках": "stockings", "На каблуках": "heels", "В гольфах": "socks",
          "Латекс": "latex", "С вибратором": "vibrator", "Дилдо": "dildo",
          "Евро": "european", "Йога": "yoga", "Куколд": "cuckold",
          "Межрассовое": "interracial", "На публике": "public", "Пикап": "pickup",
          "Свингеры": "swingers", "Секс-игрушки": "sex-toys", "Страпон": "strapon",
          "Анальная пробка": "buttplug", "Бондаж": "bondage",
          "Женское доминирование": "femdom", "Подчинение": "submissive",
          "Фистинг": "fisting", "Футфетиш": "footjob", "Негры": "black",
          "Негритянки": "ebony", "Негры с блондинками": "black-blonde",
          "Буккаке": "bukkake", "Сперма": "cumshot", "Сперма вытекает": "creampie",
          "Сперма на груди": "cum-on-tits", "Сперма на лице": "facial",
          "Глотает сперму": "cum-swallow", "Сперма на попе": "cum-on-ass",
          "Сперма на пизде": "cum-on-pussy"
        }
      },
      list: { uri: "page/{page}" },
      search: { uri: "search/{search}/page/{page}" },
      contentParse: {
        nodes: "//div[@class='item']",
        name: { node: ".//div[@class='itm-tit']" },
        href: { node: ".//a", attribute: "href" },
        img: { node: ".//img[@class='lzy']", attribute: "data-srcset" },
        duration: { node: ".//div[@class='itm-dur fnt-cs']" },
        preview: { node: ".//img[@class='lzy']", attribute: "data-preview" },
        model: {
          name: { node: ".//a[@class='itm-opt-mdl len_pucl']" },
          href: { node: ".//a[@class='itm-opt-mdl len_pucl']", attribute: "href" }
        }
      },
      view: {
        related: !0,
        regexMatch: { matches: ["alt_url", "url"], pattern: "video_{value}:[\\t ]+'([^']+)'" }
      }
    },

    // --- pepa.lenporno.xyz ---
    {
      enable: !0,
      displayname: "Lenporno",
      host: "https://pepa.lenporno.xyz",
      menu: {
        route: {
          cat: "{host}/{cat}/{page}/",
          sort: "{host}/{sort}/{page}/"
        },
        sort: { "Новинки": "", "Лучшее": "the-best", "Популярнаe": "most-popular" },
        categories: {
          "Азиатское": "aziatskoye", "Анальное": "analnoye", "БДСМ": "bdsm",
          "Блондинки": "blondinki", "Большие дойки": "bolshiye-dojki",
          "Большие попки": "bolshiye-popki", "Большие члены": "bolshiye-chleny",
          "Брюнетки": "bryunetki", "В ванной": "v-vannoy", "В латексе": "v-latekse",
          "В лосинах": "v-losinakh", "В машине": "v-mashine", "В офисе": "v-ofise",
          "В чулках": "v-chulkakh", "Волосатые": "volosatyye", "Групповое": "gruppovoye",
          "Двойное проникновение": "dvoynoye-proniknoveniye", "Домашнее": "domashneye",
          "Доминирование": "dominirovaniye", "Дрочка": "drochka", "Жены": "gheny",
          "Жесткое": "zhestkoye", "Зрелые": "zrelyye", "Измена": "izmena",
          "Кастинг": "kasting", "Красотки": "krasotki", "Крупным планом": "krupnym-planom",
          "Лесбиянки": "lesbiyanki", "Мамки": "mamki", "Массаж": "massazh",
          "Мастурбация": "masturbatsiya", "МЖМ": "mzhm", "Минет": "minet",
          "Молодые": "molodyye", "Мулатки": "mulatki", "На природе": "na-prirode",
          "На публике": "na-publike", "Негры": "blacked", "Нежное": "nezhnoye",
          "Оргазмы": "orgazmy", "Оргии": "orgii", "От первого лица": "ot-pervogo-litsa",
          "Пародии": "parodii", "Пикап": "pikap", "Премиум": "premium",
          "Пьяные": "pyanyye", "Раком": "rakom", "Русское": "russkoye",
          "Рыжие": "ryzhiye", "Свингеры": "svingery", "Секретарши": "sekretarshi",
          "Секс игрушки": "seks-igrushki", "Сперма": "sperma", "Спящие": "spyashchiye",
          "Страпон": "strapon", "Студенты": "studenty", "Татуированные": "tatuirovannyye",
          "Толстушки": "tolstushki", "Фистинг": "fisting", "Худые": "khudyye",
          "Японское": "yaponskoye", "Brazzers": "brazzers", "Full HD": "full-hd"
        }
      },
      list: { uri: "new-update/{page}/" },
      search: { uri: "search/{search}/{page}/" },
      contentParse: {
        nodes: "//div[@class='innercont']",
        name: { node: ".//a[@class='preview_link']" },
        href: { node: ".//a[@class='preview_link']", attribute: "href" },
        img: { node: ".//img", attribute: "src" },
        duration: { node: ".//div[@class='duration']" }
      },
      view: {
        related: !0,
        regexMatch: {
          matches: ["1080p", "720p", "480p", "360p"],
          pattern: '(https?://[^\\t" ]+_{value}.mp4)'
        }
      }
    },

    // --- sex.24videos.space ---
    {
      enable: !0,
      displayname: "24video",
      host: "https://sex.24videos.space",
      menu: {
        route: {
          cat: "{host}/{cat}/page-{page}/",
          sort: "{host}/{sort}/page-{page}/"
        },
        sort: { "Новинки": "", "Рейтинговое": "top-rated-porn", "Популярнаe": "most-popular-porn" },
        categories: {
          "Азиатское": "porno-aziatskoye", "Анальное": "porno-analnoye", "БДСМ": "porno-bdsm",
          "Блондинки": "porno-blondinki", "Большие дойки": "porno-bolshiye-dojki",
          "Большие попки": "porno-bolshiye-popki", "Большие члены": "porno-bolshiye-chleny",
          "Брюнетки": "porno-bryunetki", "В ванной": "porno-v-vannoy",
          "В латексе": "porno-v-latekse", "В лосинах": "porno-v-losinakh",
          "В машине": "porno-v-mashine", "В офисе": "porno-v-ofise",
          "В чулках": "porno-v-chulkakh", "Волосатые": "porno-volosatyye",
          "Групповое": "porno-gruppovoye", "Двойное проникнове": "porno-dvoynoye-proniknoveniye",
          "Домашнее": "porno-domashneye", "Доминирование": "porno-dominirovaniye",
          "Дрочка": "porno-drochka", "Жены": "porno-gheny", "Жесткое": "porno-zhestkoye",
          "Зрелые": "porno-zrelyye", "Измена": "porno-izmena", "Кастинг": "porno-kasting",
          "Красотки": "porno-krasotki", "Крупным планом": "porno-krupnym-planom",
          "Лесбиянки": "porno-lesbiyanki", "Мамки": "porno-mamki", "Массаж": "porno-massazh",
          "Мастурбация": "porno-masturbatsiya", "МЖМ": "porno-mzhm", "Минет": "porno-minet",
          "Молодые": "porno-molodyye", "Мулатки": "porno-mulatki",
          "На природе": "porno-na-prirode", "На публике": "porno-na-publike",
          "Негры": "porno-blacked", "Нежное": "porno-nezhnoye", "Оргазмы": "porno-orgazmy",
          "Оргии": "porno-orgii", "От первого лица": "porno-ot-pervogo-litsa",
          "Пародии": "porno-parodii", "Пикап": "porno-pikap", "Премиум": "porno-premium",
          "Пьяные": "porno-pyanyye", "Раком": "porno-rakom", "Русское": "porno-russkoye",
          "Рыжие": "porno-ryzhiye", "Свингеры": "porno-svingery",
          "Секретарши": "porno-sekretarshi", "Секс игрушки": "porno-seks-igrushki",
          "Сперма": "porno-sperma", "Спящие": "porno-spyashchiye",
          "Страпон": "porno-strapon", "Студенты": "porno-studenty",
          "Татуированные": "porno-tatuirovannyye", "Толстушки": "porno-tolstushki",
          "Фистинг": "porno-fisting", "Худые": "porno-khudyye"
        }
      },
      list: { uri: "page-{page}/" },
      search: { uri: "search/{search}/page-{page}/" },
      contentParse: {
        nodes: "//div[@class='item video-block']",
        name: { node: ".//div[@class='title']" },
        href: { node: ".//a", attribute: "href" },
        img: { node: ".//img", attribute: "data-original" },
        duration: { node: ".//span[@class='duration']" }
      },
      view: {
        related: !0,
        regexMatch: {
          matches: ["1080p", "720p", "480p", "360p"],
          pattern: '(https://[^",\\n\\r\\t ]+/JOPORN_NET_[0-9]+_{value}.mp4)'
        }
      }
    },

    // --- bigboss.video ---
    {
      enable: !0,
      displayname: "BigBoss",
      host: "https://bigboss.video",
      menu: {
        route: {
          cat: "{host}/category/{cat}_page-{page}.html",
          sort: "{host}/videos/{sort}_page-{page}.htm"
        },
        sort: { "Новинки": "", "Популярное": "popular" },
        categories: {
          "Азиатки": "aziatki", "Анальный секс": "anal", "Анилингус": "anilingys",
          "Аниме и Хентай": "hentai", "БДСМ": "bd-sm", "Беременные": "beremennie",
          "Бисексуалы": "bisexual", "Большие жопы": "big-butt", "Большие сиськи": "boooobs",
          "Большие члены": "big-penis", "Брат и сестра": "brat-i-sestra",
          "Вирт.Реальность (VR)": "vrporn", "Волосатая пизда": "hairy",
          "Всяко-разное": "other", "Гей порно": "hotgays", "Групповуха": "orgia",
          "Для женщин": "nice-sex", "Домашнее (любительское)": "domashka",
          "Дрочка девушкам": "drochka-telkam", "Дрочка парням": "drochka",
          "Жесткое (хардкор)": "hard-sex", "Записи приватов (Вебкам)": "webcam",
          "Знаменитости": "stars", "Зрелые": "zrelue", "Измены (муж куколд)": "cucold",
          "Инцест": "hot-incest", "Кастинг": "kasting", "Куннилингус": "kunilingus",
          "Лесбиянки": "lesbiyanka", "Мамки (МИЛФ)": "milf", "Межрасовый секс": "blackman",
          "Минет": "minet-video", "Молодые": "molodue", "Мультики": "sex-mult",
          "На лицо (камшоты)": "kamshotu", "От первого лица": "pov-sex",
          "Пародии и косплей": "parodii-i-kosplei", "Приколы (смешное)": "humor",
          "Ретро, старое": "retro-video", "Русское порно": "rus", "С неграми": "bbc",
          "Свингеры": "svingeru", "Секретарши": "sekretarshi", "Секс Вайф": "seks-vaif",
          "Скрытая камера": "spygazm", "Служанки, горничные": "slyzhanki",
          "Соло девушек": "solo-telki", "Соло парней": "solomen", "Студенты": "stydenti",
          "Толстые (толстушки)": "bbw", "Трансвеститы (трансы)": "lady-boy",
          "Фетиш": "fetish", "Фистинг": "fisting", "Эротика": "classic-sex"
        }
      },
      list: { uri: "latest/{page}/" },
      search: { uri: "search/{search}/page/{page}/" },
      contentParse: {
        nodes: "//div[contains(@class,'main__ct-items')]//div[contains(@class,'main__ct-item')]",
        name: { node: ".//div[contains(@class,'video-unit__caption')]" },
        href: { node: ".//a[contains(@class,'video-unit')]", attribute: "href" },
        img: { node: ".//img", attributes: ["data-src", "src"] }
      },
      view: {
        related: !0,
        regexMatch: {
          matches: ["1080", "720", "480", "360"],
          pattern: '/(common/getvideo/video.mp4\\?q={value}&[^", ]+)',
          format: "{host}/{value}"
        }
      }
    },

    // --- wel.ebasos.club ---
    {
      enable: !0,
      displayname: "Ebasos",
      host: "https://wel.ebasos.club",
      menu: {
        route: {
          sort: "{host}/{sort}/{page}/",
          cat: "{host}/categories/{cat}/{page}/",
          catsort: "{host}/categories/{cat}/top/{page}/"
        },
        sort: { "Новое": "", "Лучшее": "top-rated" },
        categories: {
          "HD": "hd", "Азиатки": "aziatki", "Анал": "anal", "Блондинки": "blondinki",
          "Большие сиськи": "bolshie-siski", "Большие члены": "chleny-bolshie",
          "Волосатые": "volosatye", "Глубокая глотка": "glubokaya-glotka",
          "Групповое": "gruppovoe", "Девушка с девушкой": "lesbos", "Зрелые": "zrelye",
          "Инцест порно": "incest-porno", "Кастинг": "kasting", "Кремпай": "krempay",
          "Любительское": "lyubitelskoe", "Межрасовое": "mejrasovoe", "Минет": "minet",
          "Молодые": "molodenkie", "Ретро порно": "istoricheskoe",
          "Русское порно": "ruporno", "Толстые": "tolstye"
        }
      },
      list: { uri: "latest-updates/{page}/" },
      search: { uri: "search/{search}/{page}/" },
      contentParse: {
        nodes: "//div[@id='list_videos_common_videos_list_items']//div[contains(@class, 'item')]",
        name: { node: ".//span[contains(@class, 'title')]" },
        href: { node: ".//a", attribute: "href" },
        img: { node: ".//img[contains(@class,'thumb')]", attribute: "data-original" },
        duration: { node: ".//div[contains(@class, 'duration')]" }
      },
      view: {
        iframe: { pattern: '<iframe[^>]+ src="([^"]+)"' },
        regexMatch: { matches: ["video_alt_url", "video_url"], pattern: "{value}:[\\t ]+'([^']+)'" }
      }
    },

    // --- www1.ebun.tv ---
    {
      enable: !0,
      displayname: "Ebun",
      host: "https://www1.ebun.tv",
      menu: {
        route: {
          sort: "{host}/{sort}/{page}/",
          cat: "{host}/categories/{cat}/{page}/",
          catsort: "{host}/categories/{cat}/{sort}/{page}/"
        },
        sort: { "Новинки": "", "Топ рейтинга": "top-rated", "Популярнаe": "most-popular" },
        categories: {
          "Азиатки": "aziatki", "Американское": "amerikanskoe", "Анал": "anal",
          "Анилингус": "anilingus", "Арабское порно": "arabskoe-porno", "БДСМ": "bdsm",
          "Блондинки": "blondinki", "Большие сиськи": "bolshie-siski",
          "Большие члены": "bolshie-chleny", "Бондаж": "bondaj", "Брюнетки": "bryunetki",
          "В ванной": "v-vannoy", "В машине": "v-mashine", "Веб камера": "veb-kamera",
          "Вечеринки и вписки": "vecherinki-i-vpiski", "Волосатые": "volosatye",
          "Врачи и медсестры": "vrachi-i-medsestry", "Ганг банг": "gang-bang",
          "Гетры": "getry", "Глубокая глотка": "glubokaya-glotka",
          "Групповое": "gruppovoe", "Двойное проникновение": "dvoynoe-proniknovenie",
          "Дедушки": "dedushki", "Дилдо": "dildo", "Для женщин": "dlya-jenshchin",
          "Домашнее": "domashnee", "Дрочка": "drochka", "Ебля": "eblya",
          "Женское доминирование": "jenskoe-dominirovanie", "Жены": "jeny",
          "Жесткое": "jestkoe", "ЖМЖ": "jmj", "Жопы": "jopy", "За деньги": "za-dengi",
          "Зрелые": "zrelye", "Зрелые с молодыми": "zrelye-s-molodymi",
          "Игрушки": "igrushki", "Измена": "izmena", "Кастинг": "kasting",
          "Кастинг Вудмана": "kasting-vudmana", "Кончил в рот": "konchil-v-rot",
          "Красивые девушки": "krasivye-devushki", "Красивые сиськи": "krasivye-siski",
          "Кремпай": "krempay", "Крупным планом": "krupnym-planom",
          "Кунилингус": "kunilingus", "Латинки": "latinki",
          "Маленькие сиськи": "malenkie-siski", "Мамки": "mamki", "Массаж": "massaj",
          "Мастурбация": "masturbaciya", "Межрассовое": "mejrassovoe", "МЖМ": "mjm",
          "Минет": "minet", "Молодые": "molodye", "Мулатки": "mulatki",
          "На кухне": "na-kuhne", "На природе": "na-prirode", "На телефон": "na-telefon",
          "Негритянки": "negrityanki", "Негры": "negry", "Нежное": "nejnoe",
          "Немецкое": "nemeckoe", "Оргазмы": "orgazmy", "Оргия": "orgiya",
          "От первого лица": "ot-pervogo-lica", "Офис": "ofis", "Пизда крупно": "pizda-krupno",
          "Пикап": "pikap", "Подчинение": "podchinenie", "Порно ВК": "porno-vk",
          "Порно подборка": "porno-podborka", "Порно с разговорами": "porno-s-razgovorami",
          "Презерватив": "prezervativ", "Пьяные": "pyanye", "Раком": "rakom",
          "Русское": "russkoe", "Рыжие": "ryjie", "Свингеры": "svingery",
          "Секретарши": "sekretarshi", "Секс втроем": "seks-vtroem",
          "Сексвайф и куколд": "seksvayf-i-kukold", "Сквиртинг": "skvirting",
          "Скрытая камера": "skrytaya-kamera", "Сперма": "sperma",
          "Спящие": "spyashchie", "Страпон": "strapon", "Студенты": "studenty",
          "Татуировки": "tatuirovki", "Толстые": "tolstye", "Тренер": "trener",
          "Учитель": "uchitel", "Фетиш": "fetish", "Фильмы": "porno-filmy",
          "Фитоняшки": "fitonyashki", "Фут-фетиш": "fut-fetish", "Худые": "hudye",
          "Чешское": "cheshskoe", "Чулки и колготки": "chulki-i-kolgotki",
          "Эротика": "erotika", "Японское": "yaponskoe"
        }
      },
      list: { uri: "latest-updates/{page}/" },
      search: { uri: "search/{search}/{page}/" },
      contentParse: {
        nodes: "//div[contains(@class, 'item th-item item_new')]",
        name: { node: ".//div[@class='item-title']" },
        href: { node: ".//a", attribute: "href" },
        img: { node: ".//img", attribute: "data-src" },
        duration: { node: ".//div[@class='meta-time']" }
      },
      view: {
        iframe: { pattern: '<iframe[^>]+ src="([^"]+)"' },
        regexMatch: { matches: ["video_alt_url", "video_url"], pattern: "{value}:[\\t ]+'([^']+)'" }
      }
    },

    // --- jopaonline.mobi ---
    {
      enable: !0,
      displayname: "JopaOnline",
      host: "https://jopaonline.mobi",
      menu: {
        route: {
          sort: "{host}/{sort}/{page}",
          cat: "{host}/categories/{cat}/{page}",
          catsort: "{host}/categories/{cat}/{sort}/{page}"
        },
        sort: { "Новинки": "", "Топ рейтинга": "toprated", "Популярнаe": "popular" },
        categories: {
          "Мамки": "mamki", "Русское": "russkoe", "Жесткое": "zhestkoe",
          "Зрелые": "zrelye", "Измена": "izmena", "Красотки": "krasotki",
          "Домашнее": "domashnee", "Большие члены": "big-cock", "Групповое": "gruppovoe",
          "Анал": "anal", "Студенты": "studenty", "Азиатки": "asian",
          "Красивый секс": "krasiviy-seks", "Большие сиськи": "bolshie-siski",
          "Лесбиянки": "lesbiyanki", "Жопы": "zhopy",
          "Двойное проникновение": "dvoynoe-proniknovenie", "Молодые": "molodye",
          "Пикап": "pickap", "Мастурбация": "masturbation", "В ванной": "v-vannoi",
          "Негры": "s-negrami", "Мулатки": "mulatki", "Худые": "hudenkie",
          "Чулки": "stockings", "Раком": "rakom", "Минет": "minet",
          "Рыжие": "redhead", "Блондинки": "blonde", "Брюнетки": "bryunetki",
          "Межрасовое": "mejrassovyy"
        }
      },
      list: { uri: "{page}" },
      search: { uri: "search/{search}/{page}" },
      contentParse: {
        nodes: "//div[@class='th']",
        name: { node: ".//p" },
        href: { node: ".//a", attribute: "href" },
        img: { node: ".//img", attribute: "src" },
        duration: { node: ".//div[@class='th-duration']" },
        preview: { node: ".//img", attribute: "data-preview" }
      },
      view: {
        related: !0,
        regexMatch: { matches: ["url3", "url2", "url"], pattern: "video_alt_{value}:[\\t ]+'([^']+)'" }
      }
    },

    // --- adult.noodlemagazine.com ---
    {
      enable: !0,
      displayname: "NoodleMagazine",
      host: "https://adult.noodlemagazine.com",
      menu: {
        route: { sort: "{host}/{sort}/week?p={page}" },
        sort: { "Новинки": "", "Популярное": "popular" }
      },
      list: { uri: "now?p={page}" },
      search: { uri: "video/{search}?p={page}" },
      contentParse: {
        nodes: "//div[contains(@class, 'item')]",
        name: { node: ".//div[@class='title']" },
        href: { node: ".//a", attribute: "href" },
        img: { node: ".//img", attribute: "data-src" },
        duration: { node: ".//div[@class='m_time']" },
        preview: { node: ".//div", attribute: "data-trailer_url" }
      },
      view: {
        related: !0,
        regexMatch: { pattern: '"file":"([^"]+)"' }
      }
    },

    // --- www.porndig.com ---
    {
      enable: !0,
      displayname: "Porndig",
      host: "https://www.porndig.com",
      menu: {
        route: { cat: "{host}/channels/{cat}/page/{page}" },
        categories: {
          "4K": "1172/uhd-4k", "Анал": "33/anal", "Анал Вирджины": "89/anal-virgins",
          "Арабки": "91/arab", "Азиатки": "38/asian", "BBW": "46/bbw",
          "БДСМ": "55/bondage-bdsm", "Пляжное порно": "1240/beach-porn",
          "Большие попы": "1198/big-ass", "Большие сиськи": "43/big-boobs",
          "Большие члены": "802/big-dick", "Черные": "45/black",
          "Черные попы": "878/black-booty", "Блондинки": "36/blonde",
          "Минет": "52/blowjob", "Бокеп": "1241/bokep", "Брюнетки": "63/brunette",
          "Буккаке": "59/bukkake", "CFNM": "1226/cfnm", "Кастинг": "87/casting-porno",
          "Компиляция": "1127/compilation", "Косплей": "1233/cosplay",
          "Кримпай": "47/creampie", "Куколд": "1236/cuckold",
          "Глотание спермы": "35/cum-swallowing", "Сперма": "799/cumshot",
          "Кунилингус": "1173/cunnilingus", "Глубокий минет": "80/deep-throat",
          "Доминирование": "73/domination", "Двойное проникновение": "64/double-penetration",
          "Эмо Готика": "83/emo-gothic", "Европейское": "1117/european",
          "Бывшая девушка": "820/ex-girlfriend", "Эксгибиционизм": "803/exhibitionist",
          "Экстрим": "807/extreme", "Факал": "50/facial-ejaculation",
          "Женское": "65/female-friendly", "Фемдом": "1225/femdom",
          "Фетиш": "57/fetish", "Фистинг": "66/fist-fucking",
          "Фут фетиш": "875/foot-fetish", "Full HD": "882/full-hd",
          "Гангбанг": "82/gangbang", "Глорихол": "1199/gloryhole",
          "Золотой дождь": "85/golden-shower", "Бабушки": "814/grandma",
          "Волосатая пизда": "855/hairy-pussy", "Хардкор": "1235/hardcore",
          "Хентай": "51/hentai", "Хентай 3D": "1230/hentai-3d",
          "Хентай без цензуры": "1231/hentai-uncensored", "Межрасовое": "53/interracial",
          "Латинки": "54/latina", "Лесби": "40/lesbian", "МИЛФ": "39/milf",
          "Массаж": "74/massage", "Мастурбация": "48/masturbation", "Зрелые": "41/mature",
          "Зрелые и молодые": "77/mature-and-young-guy", "Карлики": "87/midgets",
          "Натуральные большие сиськи": "93/natural-big-tits", "Медсестра": "1234/nurse",
          "Масло": "1175/oil", "Старик и подростки": "76/old-man-young-girl",
          "Оргия": "42/orgy", "На природе": "884/outdoor", "POV": "58/pov",
          "Порнозвезды": "879/pornstar", "Беременные": "860/pregnant",
          "Рыжие": "60/redhead", "Римминг": "1125/rimming",
          "Секретарша": "115/secretary", "Секс игрушки": "856/sextoys",
          "Сексуальное белье": "75/sexy-lingerie", "Маленькие сиськи": "67/small-tits",
          "Курение": "822/smoking", "Мягкое": "805/soft", "Соло": "178/solo",
          "Подглядывание": "810/spying", "Сквирт": "68/squirters",
          "Сводная семья": "1197/step-family", "Чулки": "816/stockings",
          "Страпон": "819/strapon", "Студентки": "79/student", "Трое": "1043/threesome",
          "Титфак": "86/tit-wank", "Униформа": "84/uniforms", "Апскирт": "1227/upskirt",
          "Винтаж": "850/vintage", "Жесткий секс": "1042/violent-sex",
          "Девственницы": "88/virgin", "Вебкамера": "70/webcam",
          "XXX Сценарии": "90/xxx-scenario", "Молодые": "34/young",
          "Молодые черные": "812/young-black"
        }
      },
      list: { uri: "video/page/{page}" },
      search: { uri: "channels/33/{search}/page/{page}" },
      contentParse: {
        nodes: "//section[contains(@class, 'video_item_wrapper even_item video_item_medium')]",
        name: { node: ".//a" },
        href: { node: ".//a", attribute: "href" },
        img: { node: ".//img[@class='thumb_preview hidden']", attribute: "data-src" },
        duration: { node: ".//div[@class='bubble bubble_duration']//span" },
        preview: { node: ".//img[contains(@class, 'js_video_preview')]", attribute: "data-vid" }
      },
      view: {
        related: !0,
        iframe: { pattern: '<link rel="prefetch" as="document" href="([^"]+)"' },
        regexMatch: {
          matches: ["/master.mpd", "_2160.mp4", "_1080.mp4", "_720.mp4", "_540.mp4", "_468.mp4", "_360.mp4"],
          pattern: '"src":"([^"]+{value})"'
        }
      }
    },

    // --- ps.pornk.top ---
    {
      enable: !0,
      displayname: "Pornk",
      host: "https://ps.pornk.top",
      menu: {
        route: {
          sort: "{host}/{sort}/week/{page}/",
          cat: "{host}/categories/{cat}/{page}/"
        },
        sort: { "Новинки": "", "Топ рейтинга": "top-rated", "Популярное": "most-popular" },
        categories: {
          "Красотки": "krasotki", "БДСМ": "bdsm", "Гангбанг": "gangbang",
          "Сквиртинг": "skvirting", "Нижнее белье": "nijnee-bele", "Куколд": "kukold",
          "Толстые": "tolstye", "Зрелые": "zrelye", "Ретро": "retro",
          "Групповуха": "gruppovuha", "Дрочка": "drochka", "Игрушки": "igrushki",
          "Выстрелы спермы": "vystrely-spermy", "На природе": "na-prirode",
          "Мастурбация": "masturbatsiya", "Двойное проникновение": "dvoiynoe-proniknovenie",
          "Лесби": "lesbi", "Любительское": "lyubitelskoe", "Блондинки": "blondinki"
        }
      },
      list: { uri: "latest-updates/{page}/" },
      search: { uri: "search/{search}/{page}/" },
      contentParse: {
        nodes: "//a[contains(@class, 'preview')]",
        name: { node: ".//span[@class='preview-title']" },
        href: { node: ".", attribute: "href" },
        img: { node: ".//img", attribute: "src" },
        duration: { node: ".//span[@class='preview-duration']" }
      },
      view: {
        related: !0,
        regexMatch: {
          matches: ["1080p", "720p", "480p", "360p"],
          pattern: "/(get_file/[^', ]+_{value}.mp4)",
          format: "{host}/{value}"
        }
      }
    },

    // --- porno365x.me ---
    {
      enable: !0,
      displayname: "Porno365",
      host: "https://porno365x.me",
      menu: {
        route: {
          cat: "{host}/{cat}/{page}/",
          sort: "{host}/{sort}/{page}/",
          catsort: "{host}/{cat}/{sort}/{page}/"
        },
        sort: { "Новинки": "", "Топ рейтинга": "toprated", "Топ просмотров": "popular" },
        categories: {
          "Азиатки": "aziatki", "Анал": "anal", "БДСМ": "bdsm", "Блондинки": "blondinki",
          "Большие дойки": "bolshiye-doyki", "Большие попки": "bolshiye-popki",
          "Большие члены": "bolshiye-chleny", "Брюнетки": "bryunetki",
          "В ванной": "v-vannoy", "В латексе": "v-latekse", "В лосинах": "v-losinakh",
          "В машине": "v-mashine", "В офисе": "v-ofise", "В чулках": "v-chulkakh",
          "Волосатые": "volosatyye", "Групповое": "gruppovoye",
          "Двойное проникновение": "dvoynoye-proniknoveniye", "Домашнее": "domashneye",
          "Доминирование": "dominirovaniye", "Дрочка": "drochka", "Жены": "zheny",
          "Жесткое": "zhestkoye", "Зрелые": "zrelyye", "Измена": "izmena",
          "Кастинг": "kasting", "Красотки": "krasotki", "Крупным планом": "krupnym-planom",
          "Лесбиянки": "lesbiyanki", "Мамки": "mamki", "Массаж": "massazh",
          "Мастурбация": "masturbatsiya", "МЖМ": "mzhm", "Минет": "minet",
          "Молодые": "molodyye", "Мулатки": "mulatki", "На природе": "na-prirode",
          "На публике": "na-publike", "Негры": "negry", "Нежное": "nezhnoye",
          "Оргазмы": "orgazmy", "Оргии": "orgii", "От первого лица": "ot-pervogo-litsa",
          "Пародии": "parodii", "Пикап": "pikap", "Премиум": "premium",
          "Пьяные": "pyanyye", "Раком": "rakom", "Русское": "russkoye",
          "Рыжие": "ryzhiye", "Свингеры": "svingery", "Секретарши": "sekretarshi",
          "Секс игрушки": "seks-igrushki", "Сперма": "sperma", "Спящие": "spyashchiye",
          "Страпон": "strapon", "Студенты": "studenty", "Татуированные": "tatuirovannyy",
          "Толстушки": "tolstushki", "Фистинг": "fisting", "Худые": "khudyye",
          "Японки": "yaponki", "Full HD": "porno-hd"
        }
      },
      list: { uri: "{page}/" },
      search: { uri: "search/{search}/{page}/" },
      contentParse: {
        nodes: "//li[contains(@class, ' trailer')]",
        name: { node: ".//p" },
        href: { node: ".//a[@class='image']", attribute: "href" },
        img: { node: ".//img", attribute: "src" },
        duration: { node: ".//span[@class='duration']" }
      },
      view: {
        related: !0,
        regexMatch: { pattern: 'file:[\\t ]+"([^"]+)"' }
      }
    },

    // --- wwwp.porno666.news ---
    {
      enable: !0,
      displayname: "Porno666",
      host: "https://wwwp.porno666.news",
      menu: {
        route: {
          cat: "{host}/categories/{cat}/{page}/",
          sort: "{host}/{sort}"
        },
        sort: { "Новинки": "", "Лучшее": "top-rated/{page}/", "Популярнаe": "most-popular/{page}/" },
        categories: {
          "Азиатки": "aziatki", "Анал": "analnyy-seks", "БДСМ": "bdsm",
          "Блондинки": "blondinki", "Большие сиськи": "bolshie-siski",
          "Большие члены": "bolshie-chleny", "Брюнетки": "bryunetki",
          "Волосатые": "volosatye", "Групповое": "gruppovoe",
          "Домашнее порно": "domashnee-i-chastnoe", "Жены": "jeny", "Жесткое": "jestkoe",
          "Жопы": "jopy", "Зрелые": "zrelye", "Игрушки": "igrushki",
          "Измена": "izmena", "Кастинг": "kasting", "Мамки": "mamki",
          "Массаж": "massaj", "Мастурбация": "masturbaciya", "Минет": "minet",
          "Молодые": "molodye", "Не постановочное": "ne-postanovochnoe",
          "Негры": "negry", "Оргазмы": "orgazmy", "Пикап": "pikap",
          "Порно ВК": "porno-vk", "Порно фильмы": "porno-film", "Пьяные": "pyanye",
          "Раком": "rakom", "Русское порно": "russkoe", "Рыжие": "ryjie",
          "Свингеры": "svingery", "Секс втроем": "seks-vtroem", "Сперма": "sperma",
          "Спящие": "spyashchie", "Страпон": "strapon", "Студенты": "studenty",
          "Толстые": "tolstye", "Худые": "hudye", "Чулки и колготки": "chulki-i-kolgotki",
          "Японское": "yaponskoe"
        }
      },
      list: { uri: "latest-updates/{page}/" },
      search: { uri: "search/{search}/{page}/" },
      contentParse: {
        nodes: "//div[@class='item trailer']",
        name: { node: ".//strong" },
        href: { node: ".//a", attribute: "href" },
        img: { node: ".//img", attribute: "data-original" },
        duration: { node: ".//div[@class='duration']" },
        preview: { node: ".//img", attribute: "data-preview" }
      },
      view: {
        related: !0,
        regexMatch: { matches: ["url3", "url2", "url"], pattern: "video_alt_{value}:[\\t ]+'([^']+)'" }
      }
    },

    // --- pornobriz.com ---
    {
      enable: !0,
      displayname: "PornoBriz",
      host: "https://pornobriz.com",
      menu: {
        route: {
          cat: "{host}/{cat}/page{page}/",
          sort: "{host}/{sort}"
        },
        sort: { "Новинки": "", "Топ рейтинга": "top/page{page}/", "Популярнаe": "best/page{page}/" },
        categories: {
          "Азиатки": "asian", "Анальный секс": "anal", "БДСМ": "bdsm",
          "Блондинки": "blonde", "Большая жопа": "big_ass", "Большие сиськи": "big_tits",
          "Большой член": "big_dick", "Бритая киска": "shaved", "Брюнетки": "brunette",
          "В одежде": "clothes", "Волосатые киски": "hairy", "Глотают сперму": "swallow",
          "Глубокая глотка": "deepthroat", "Групповой секс": "group",
          "Двойное проникновение": "double_penetration", "Длинноволосые девушки": "long_hair",
          "Дрочат": "wanking", "Жесткий секс": "hardcore", "ЖМЖ порно": "ffm",
          "Игрушки": "toys", "Казашки": "kazakh", "Камшот": "cumshot",
          "Кончают в рот": "cum_in_mouth", "Красивая задница": "perfect_ass",
          "Красивое белье": "lingerine", "Красивые девушки": "beautiful",
          "Красивые сиськи": "beautiful_tits", "Крупным планом": "close_up",
          "Кунилингус": "pussy_licking", "Лесбиянки": "lesbian",
          "Любительское порно": "amateur", "Маленькие девушки": "petite",
          "Маленькие сиськи": "small_tits", "Мамочки": "milf",
          "Мастурбация": "masturbation", "Межрасовое": "interracial",
          "МЖМ порно": "mfm", "Милашки": "cute", "Минет": "blowjob",
          "Молодые": "seks-molodye", "На природе": "outdoor", "На публике": "public",
          "Наездницы": "riding", "Негритянки": "ebony", "Оргазм": "orgasm",
          "От первого лица": "pov", "Писают": "peeing", "Поцелуи": "kissing",
          "Рвотные позывы": "gagging", "Реальный секс": "reality", "Римминг": "rimming",
          "Романтическое": "romantic", "Русское порно": "russian", "Рыжие": "redhead",
          "С японками": "japanese", "Секс втроем": "threesome", "Секс раком": "doggystyle",
          "Симпатичные": "babe", "Сквиртинг": "squirting", "Соло девушек": "solo_girl",
          "Сперма в жопе": "creampie", "Сперма на груди": "cum_on_tits",
          "Сперма на лице": "facial", "Страпон": "strap-on", "Стриптиз": "striptease",
          "Темноволосые": "black-haired", "Фетиш": "fetish", "Фингеринг": "fingering",
          "Фистинг": "fisting", "Худые девушки": "skinny", "Чулки": "stockings",
          "Эротика": "erotika"
        }
      },
      list: { uri: "new/page{page}/" },
      search: { uri: "search/{search}/page{page}/" },
      contentParse: {
        nodes: "//div[contains(@class, 'thumb_main')]",
        name: { node: ".//div[@class='th-title']" },
        href: { node: ".//a", attribute: "href" },
        img: { node: ".//img", attribute: "data-original" },
        duration: { node: ".//div[@class='duration']" },
        preview: { node: ".//video", attribute: "data-preview" }
      },
      view: {
        regexMatch: {
          matches: ["720", "480", "240"],
          pattern: 'src="([^"]+)" type="video/mp4" size="{value}"'
        }
      }
    },

    // --- sem.batsa.pro --- (отключён)
    {
      enable: !1,
      displayname: "SemBatsa",
      host: "https://sem.batsa.pro",
      menu: {
        route: {
          sort: "{host}/{sort}/monthly?page={page}",
          cat: "{host}/{cat}?page={page}"
        },
        sort: { "Новое": "", "Топ рейтинга": "top-rated", "Топ просмотров": "most-popular" },
        categories: {
          "Разговоры на русском": "razgovory-na-russkom", "Порно молодых": "porno-molodyih",
          "Русское порно": "russkoe-porno", "Порно мамки": "porno-mamki",
          "Анальное порно": "analnoe-porno", "Измены": "izmenyi", "Эротика": "erotic",
          "Украинское порно": "ukrainskoe-porno", "Групповуха": "gruppovuha",
          "Большие сиськи": "bolshie-siski", "Семейное": "semeynoe",
          "Жесткое порно": "jestkoe-porno", "Учителя": "uchitelya", "Массаж": "massaj",
          "Большие члены": "bolshie-chleny", "Бабули и дедули": "babuli-i-deduli",
          "Азиатки": "aziatki", "Зрелые дамы": "zrelyie-damy",
          "Домашнее порно": "domashnee-porno", "Сперма на лицо": "sperma-na-litso",
          "Секс по принуждению": "seks-po-prinujdeniyu",
          "Лишение невинности": "lishenie-nevinnosti",
          "В публичных местах": "v-publichnyih-mestah",
          "Трах в два члена": "trah-v-dva-chlena",
          "Порно от первого лица": "porno-ot-pervogo-litsa", "Сквирт": "skvirt",
          "Арабское порно": "arabskoe-porno", "Негры": "negryi",
          "Волосатые киски": "volosaty-kiski", "Глубокий минет": "glubokiy-minet",
          "Нежное порно": "nejnoe-porno", "Пьяные": "pyany", "Толстухи": "tolstuhi",
          "Мастурбация": "masturbatsiya", "БДСМ порно": "bdsm-porno",
          "Короткие видео": "korotkie-video", "Порно фильмы": "porno-filmy",
          "Порнозвезды": "pornozvedyi", "Секс игрушки": "seks-igrushki",
          "Трах на работе": "trah-na-rabote", "Порно вечеринки": "porno-vecherinki",
          "Порно кастинги": "porno-kastingi", "Свингеры": "svingery",
          "Фистинг": "fisting", "Женское доминирование": "jenskoe-dominirovanie",
          "Латиночки": "latinochki", "Рыжие малышки": "ryijie-malyishki",
          "Маленькие сиськи": "malenkie-siski", "Брюнетки": "bryunetki",
          "Секс на улице": "seks-na-ulitse", "Татуировки": "tatuirovki",
          "Блондинки": "blondinki", "Студенты": "studenty", "Фетиш секс": "fetish-seks",
          "Межрассовое порно": "mejrassovoe-porno", "Лесбухи": "lesbuhi",
          "Секс втроем": "seks-vtroem", "Вылизывание писек": "vyilizyivanie-pisek",
          "Крупным планом": "krupnyim-planom", "Дрочка": "drochka"
        }
      },
      list: { uri: "?page={page}" },
      search: { uri: "search?q={search}" },
      contentParse: {
        nodes: "//div[@class='grid-item aspect-ratio-16x9']",
        name: { node: ".//div[@class='grid-item-description']//a" },
        href: { node: ".//a[1]", attribute: "href" },
        img: { node: ".//img", attribute: "src" },
        duration: { node: ".//span[contains(@class,'grid-item-dur')]" },
        preview: { node: ".//video//source", attribute: "src" }
      },
      view: {
        related: !0,
        regexMatch: {
          matches: ["1080", "720", "480", "400", "360"],
          pattern: 'src="([^"]+)" type="video/mp4" label="{value}"'
        }
      }
    },

    // --- gi.sosushka.vip ---
    {
      enable: !0,
      displayname: "Sosushka",
      host: "https://gi.sosushka.vip",
      menu: {
        route: {
          sort: "{host}/{sort}/all/month/page{page}/",
          cat: "{host}/{cat}/page{page}/"
        },
        sort: { "Новинки": "", "Популярное": "top", "Лучшие": "bests" },
        categories: {
          "Азиатки": "asian", "Анальный секс": "anal", "БДСМ": "bdsm",
          "Блондинки": "blonde", "Большие жопы": "big_ass", "Большие сиськи": "big_tits",
          "Большие члены": "big_dick", "Бритые письки": "shaved", "Брюнетки": "brunette",
          "Волосатые письки": "hairy", "Групповуха": "group", "Домашнее порно": "amateur",
          "Жесткий секс": "hardcore", "Игрушки": "toys", "Камшот": "cumshot",
          "Красивые девушки": "beautiful", "Куннилингус": "pussy_licking",
          "Лесбиянки": "lesbiyki", "Маленькие девушки": "petite",
          "Маленькие сиськи": "small_tits", "Мамочки": "milf",
          "Мастурбация": "masturbation", "Межрасовое": "interracial",
          "Минет": "blowjob", "Молодые": "teen", "Наездницы": "riding",
          "Натуральные сиськи": "natural_tits", "Раком": "doggystyle",
          "Русское порно": "russian", "Рыжие": "redhead", "Секс втроем": "threesome",
          "Соло девушек": "solo_girl", "Сперма на лице": "facial",
          "Фистинг": "fisting", "Худые девушки": "skinny", "Черноволосые": "black-haired"
        }
      },
      list: { uri: "new/page{page}/" },
      search: { uri: "search/{search}/" },
      contentParse: {
        nodes: "//div[@class='thumb']",
        name: { node: ".//p" },
        href: { node: ".//a", attribute: "href" },
        img: { node: ".//img", attribute: "data-src" },
        duration: { node: ".//span[@class='right']" },
        preview: { node: ".//div", attribute: "data-preview-src" }
      },
      view: {
        iframe: { pattern: 'property="ya:ovs:embed_url" content="([^"]+)"' },
        regexMatch: {
          matches: ["720", "480", "240"],
          pattern: '<source src="([^"]+)" type="video/mp4" size="{value}"'
        }
      }
    },

    // --- www.youjizz.com ---
    {
      enable: !0,
      displayname: "Youjizz",
      host: "https://www.youjizz.com",
      menu: {
        route: { sort: "{host}/{sort}/{page}.html" },
        sort: {
          "Новинки": "newest-clips",
          "Популярные": "most-popular",
          "Топ рейтинга": "top-rated-week",
          "В тренде": "trending"
        }
      },
      list: { uri: "newest-clips/{page}.html" },
      search: { uri: "search/{search}-{page}.html" },
      contentParse: {
        nodes: "//div[@class='video-thumb']",
        name: { node: ".//div[@class='video-title']//a" },
        href: { node: ".//a[contains(@class, 'frame video')]", attribute: "href" },
        img: { node: ".//img", attribute: "data-original" },
        duration: { node: ".//span[@class='time']" },
        preview: { node: ".//a", attribute: "data-clip" }
      },
      view: {
        related: !0,
        regexMatch: {
          format: "https:{value}",
          pattern: '"quality":"Auto","filename":"([^"]+)"'
        }
      }
    },

    // --- vv.vporno.video ---
    {
      enable: !0,
      displayname: "Vporno",
      host: "https://vv.vporno.video",
      menu: {
        route: { cat: "{host}/{cat}&{page}" },
        categories: {
          "Кастинг": "kasting", "Итальянки": "italqyanki",
          "Зрелые с молодыми": "zrelyee_s_molodymi", "Игрушки": "igrushki",
          "Кончает внутрь": "konchaet_vnutrq", "Кореянки": "koreyanki",
          "Сборник": "sbornik", "Большие члены": "bolqshie_chleny",
          "Милашки": "milashki", "Сквиртинг": "skvirting", "Хентай": "hentaj",
          "Англичанки": "anglichanki", "Девушка дрочит парню": "devushka_drochit_parnyu",
          "Азиатки": "aziatki", "Лижут письку": "lizhut_pisqku",
          "Чернокожие": "chernokozhie", "Жесткое": "zhestkoe", "Звезды": "zvezdy",
          "Мультфильмы": "mulqtfilqmy", "Вечеринки": "vecherinki",
          "Транссексуалы": "transseksualy", "HD порно": "hd_porno",
          "Смешные": "smeshnyee", "Косплей": "kosplej", "Мастурбация": "masturbaciya",
          "Чешки": "cheshki", "Курящие": "kuryawie", "Приколы": "prikoly",
          "Зрелые": "zrelyee", "Минет": "minet"
        }
      },
      list: { uri: "page/{page}" },
      search: { uri: "search/?word={search}&page={page}" },
      contentParse: {
        nodes: "//div[@class='col-xs-6 col-sm-6 col-md-4 col-lg-4']",
        name: { node: ".//h3" },
        href: { node: ".//a", attribute: "href" },
        img: { node: ".//img", attribute: "src" },
        duration: { node: ".//span[@class='time']" }
      },
      view: {
        related: !0,
        regexMatch: {
          matches: ["720", "480", "360", "240"],
          pattern: 'href="(/down/{value}/[^"]+)"',
          format: "{host}{value}"
        }
      }
    },

    // --- ru.pornobolt.li ---
    {
      enable: !0,
      displayname: "Pornobolt",
      host: "https://ru.pornobolt.li",
      menu: {
        route: {
          sort: "{host}/{page}?sort={sort}",
          cat: "{host}/{cat}/{page}"
        },
        sort: { "Новинки": "", "Популярнаe": "mv" },
        categories: {
          "Русские": "russkoe-porno", "Инцест": "incest", "Зрелые": "zrelye",
          "Пикап": "pickup", "Кастинг": "kasting",
          "Взрослые с молодыми": "vzroslye-s-molodymi", "Молоденькие": "molodenkie",
          "Любительское": "lyubitelskoe", "Групповуха": "gruppovuha", "Анал": "anal",
          "Азиатки": "aziatki", "Латинки": "latinki",
          "Межрассовый секс": "mezhrassovyj-seks", "Толстые": "tolstye",
          "Сперма": "sperma", "Игрушки": "igrushki", "Красотки": "krasotki",
          "Лесбиянки": "lesbiyanki", "Минет": "minet", "Блондинки": "blondinki",
          "Брюнетки": "bryunetki", "Рыжие": "ryzhie", "Фетиш и БДСМ": "fetish-i-bdsm",
          "Большие сиськи": "bolshie-siski", "Большой член": "bolshoj-chlen",
          "Мастурбация": "masturbaciya", "Волосатые": "volosatye",
          "Двойное проникновение": "dvojnoe-proniknovenie", "На улице": "na-ulice",
          "Жесткий секс": "zhestkij-seks"
        }
      },
      list: { uri: "{page}/" },
      search: { uri: "search/{search}/{page}" },
      contentParse: {
        nodes: "//div[@class='media-obj widethumb']",
        name: { node: ".//p" },
        href: { node: ".//a", attribute: "href" },
        img: { node: ".//img", attributes: ["data-original", "src"] },
        duration: { node: ".//span[@itemprop='duration']" },
        preview: { node: ".//img", attribute: "data-video" }
      },
      view: {
        related: !0,
        nodeFile: { node: "//meta[@property='ya:ovs:content_url']", attribute: "content" }
      }
    },

    // --- a.pornoakt.club ---
    {
      enable: !0,
      displayname: "PornoAkt",
      host: "https://a.pornoakt.club",
      menu: {
        route: { cat: "{host}/{cat}/page/{page}/" },
        categories: {
          "Порно в HD": "hd", "Анальный секс": "anal", "Азиаты": "aziaty",
          "БДСМ": "bdsm", "Большая грудь": "bolshaja-grud",
          "Большие члены": "bolshie-chleny", "Групповое порно": "gruppovoe-porno",
          "Домашнее порно": "domashnee-porno", "Задницы": "zadnicy",
          "Зрелые": "zrelye", "Изнасилование": "iznasilovanie", "Инцест": "incest",
          "Мамаши": "mamashi", "Массаж": "massazh", "Мастурбация": "masturbacija",
          "Межрассовое порно": "mezhrassovoe-porno", "Минет": "minet",
          "На природе": "na-prirode", "Русское порно": "russkoe-porno",
          "Скрытая камера": "skrytaja-kamera", "Сквирт": "skvirt",
          "Стриптиз": "striptiz", "Трансвеститы": "transvestity",
          "Хентай": "hentai", "Фистинг": "fisting", "Черные": "chernye"
        }
      },
      list: { uri: "page/{page}/" },
      search: { uri: "index.php?do=search&subaction=search&search_start={page}&full_search=0&result_from=25&story={search}" },
      contentParse: {
        nodes: "//article[contains(@class, 'shortstory')]",
        name: { node: ".//h2//a" },
        href: { node: ".//a", attribute: "href" },
        img: { node: ".//img", attribute: "src" },
        duration: { node: ".//div[@class='video_time']" }
      },
      view: {
        related: !0,
        nodeFile: { node: "//li[@data-type='m4v']", attribute: "data-url" }
      }
    },

    // --- pornone.com ---
    {
      enable: !0,
      displayname: "PornOne",
      host: "https://pornone.com",
      menu: {
        route: {
          sort: "{host}/{sort}/week/{page}/",
          cat: "{host}/{cat}/{page}/",
          catsort: "{host}/{cat}/{sort}/{page}/"
        },
        sort: { "Новинки": "", "Популярные": "rating" },
        categories: {
          "Amateur": "amateur", "Anal": "anal", "Asain": "asian", "Ass": "ass",
          "Afghan": "afghan", "Albanian": "albanian", "Algerian": "algerian",
          "American": "american", "Anime": "anime", "Ass Licking": "ass-licking",
          "Arab": "arab", "Argentinian": "argentinian", "Argentine": "argentine",
          "Army": "army", "Ass To Mouth": "ass-to-mouth", "Artistic": "artistic",
          "Athletic": "athletic", "Audition": "audition", "Aussie": "aussie",
          "Australian": "australian", "Austrian": "austrian", "Bbc": "bbc",
          "BBW": "bbw", "Big Boobs": "big-boobs", "Big Dick": "big-dick",
          "Black": "black", "Blowjob": "blowjob", "Behind The Scenes": "behind-the-scenes",
          "Backroom": "backroom", "Bound": "bound", "Birthday": "birthday",
          "Butthole": "butthole", "Braces": "braces", "Bus": "bus", "Boss": "boss",
          "Babysitter": "babysitter", "Babes": "babes", "Bath": "bath",
          "Bathroom": "bathroom", "Bangladeshi": "bangladeshi", "Bar": "bar",
          "Boat": "boat", "Batswana": "batswana", "Bdsm": "bdsm", "Beach": "beach",
          "Beautiful": "beautiful", "Bedroom": "bedroom", "Belgian": "belgian",
          "Bra": "bra", "Big Clit": "big-clit", "Bikini": "bikini", "Blonde": "blonde",
          "Bizarre": "bizarre", "Bisexual": "bisexual", "Blowbang": "blowbang",
          "Bodybuilder": "bodybuilder", "Bolivian": "bolivian", "Bondage": "bondage",
          "Boots": "boots", "Bottle": "bottle", "Boy": "boy", "Brazilian": "brazilian",
          "Bride": "bride", "British": "british", "Brunette": "brunette",
          "Brutal": "brutal", "Bukkake": "bukkake", "Bulgarian": "bulgarian",
          "Busty": "busty", "Cartoon": "cartoon", "Cheating": "cheating",
          "Compilation": "compilation", "Cougar": "cougar", "Creampie": "creampie",
          "Cuckold": "cuckold", "Cumshot": "cumshot", "Cop": "cop", "Cowgirl": "cowgirl",
          "Cheerleader": "cheerleader", "Caught": "caught", "Classroom": "classroom",
          "Car": "car", "Caning": "caning", "Comics": "comics", "Clothed": "clothed",
          "Celebrities": "celebrity", "Cinema": "cinema", "Curvy": "curvy",
          "Cute": "cute", "Cameroonian": "cameroonian", "Cambodian": "cambodian",
          "Cameltoe": "cameltoe", "Canadian": "canadian", "Couch": "couch",
          "Couple": "couple", "Cbt": "cbt", "Czech": "czech", "Cucumber": "cucumber",
          "Cfnm": "cfnm", "Chilean": "chilean", "Chinese": "chinese", "Crying": "crying",
          "Chubby": "chubby", "Classic": "classic", "Cleavage": "cleavage",
          "Closeup": "closeup", "Club": "club", "College": "college",
          "Colombian": "colombian", "Cum": "cum", "Condom": "condom", "Corset": "corset",
          "Cosplay": "cosplay", "Costa Rican": "costa-rican", "Crack": "crack",
          "Crazy": "crazy", "Criminal": "criminal", "Croatian": "croatian",
          "Crossdresser": "crossdresser", "Cuban": "cuban", "Cum In Mouth": "cum-in-mouth",
          "Dad": "dad", "Daughter": "daughter", "Doctor": "doctor",
          "Double Anal": "double-anal", "Dance": "dance", "Doggystyle": "doggystyle",
          "Doll": "doll", "Dildo": "dildo", "Dirty Talk": "dirty-talk", "Dirty": "dirty",
          "Danish": "danish", "Deepthroat": "deepthroat",
          "Double Penetration": "double-penetration", "Domination": "domination",
          "Dominican": "dominican", "Dorm": "dorm", "Dress": "dress", "Dutch": "dutch",
          "Ebony": "ebony", "Erotic": "erotic", "Egyptian": "egyptian",
          "English": "english", "Ethiopian": "ethiopian", "Exploited": "exploited",
          "Enema": "enema", "Ecuadorian": "ecuadorian", "Emirati": "emirati",
          "Emo": "emo", "Exclusive": "exclusive", "Exotic": "exotic",
          "Estonian": "estonian", "Extreme": "extreme", "European": "european",
          "Family": "family", "Female": "female", "Fetish": "fetish",
          "Fisting": "fisting", "Foursome": "foursome", "Fishnet": "fishnet",
          "Food": "food", "Friend": "friend", "Facial": "facial",
          "Facesitting": "facesitting", "Fucking": "fucking", "Fight": "fight",
          "Flash": "flash", "Forest": "forest", "Footjob": "footjob", "Forced": "forced",
          "Fingering": "fingering", "Freckles": "freckles", "Funny": "funny",
          "Femdom": "femdom", "First Time": "first-time", "Fake Tits": "fake-tits",
          "Fantasy": "fantasy", "Fat": "fat", "Feet": "feet", "Ffm": "ffm",
          "Fijian": "fijian", "Full Movie": "full-movie", "Finnish": "finnish",
          "Flexible": "flexible", "French": "french", "Gangbang": "gangbang",
          "Gloryhole": "gloryhole", "Granny": "granny", "Group Sex": "group-sex",
          "Groping": "groping", "Grandma": "grandma", "Grandpa": "grandpa",
          "German": "german", "Gagging": "gagging", "Gorgeous": "gorgeous",
          "Glasses": "glasses", "Girlfriend": "girlfriend", "Gym": "gym",
          "Game": "game", "Ghanaian": "ghanaian", "Gloves": "gloves", "Gape": "gape",
          "Gay": "gay", "Ghetto": "ghetto", "Gyno": "gyno", "Goth": "goth",
          "Greek": "greek", "Guatemalan": "guatemalan", "Hairy": "hairy",
          "Handjob": "handjob", "Hentai": "hentai", "Homemade": "homemade",
          "Housewife": "housewife", "Hogtied": "hogtied", "Hazing": "hazing",
          "Hidden": "hidden", "Hidden Cam": "hidden-cam", "Hat": "hat", "Home": "home",
          "Hospital": "hospital", "Husband": "husband", "Hermaphrodite": "hermaphrodite",
          "Heels": "heels", "Haitian": "haitian", "Hardcore": "hardcore",
          "Honduran": "honduran", "Hungarian": "hungarian", "Hotel": "hotel",
          "Interracial": "interracial", "Instruction": "instruction",
          "Interview": "interview", "Insertion": "insertion", "Icelandic": "icelandic",
          "Irish": "irish", "Indian": "indian", "Indonesian": "indonesian",
          "Innocent": "innocent", "Internal": "internal", "Interactive": "interactive",
          "Iranian": "iranian", "Iraqi": "iraqi", "Israeli": "israeli",
          "Italian": "italian", "Jerking": "jerking", "Jeans": "jeans", "Jizz": "jizz",
          "Jamaican": "jamaican", "Japanese": "japanese", "Jordanian": "jordanian",
          "Kissing": "kissing", "Kitchen": "kitchen", "Korean": "korean",
          "Kenyan": "kenyan", "Kinky": "kinky", "Knockers": "knockers",
          "Kuwaiti": "kuwaiti", "Latin": "latin", "Lesbian": "lesbian", "Love": "love",
          "Lactating": "lactating", "Legs": "legs", "Leather": "leather",
          "Ladyboys": "ladyboys", "Lingerie": "lingerie", "Licking pussy": "licking-pussy",
          "Lao": "lao", "Latex": "latex", "Latvian": "latvian", "Lebanese": "lebanese",
          "Libyan": "libyan", "Lithuanian": "lithuanian", "Maid": "maid",
          "Massage": "massage", "Masturbation": "masturbation", "Mature": "mature",
          "MILF": "milf", "Mom": "mom", "Mistress": "mistress", "Midget": "midget",
          "Money": "money", "Model": "model", "Muscle": "muscle", "Machine": "machine",
          "Malaysian": "malaysian", "Malian": "malian", "Maltese": "maltese",
          "Moroccan": "moroccan", "Masseuse": "masseuse", "Masochism": "masochism",
          "Milking": "milking", "Mexican": "mexican", "Mmf": "mmf",
          "Mozambican": "mozambican", "Mongolian": "mongolian", "Monster": "monster",
          "Motel": "motel", "Music": "music", "Nasty": "nasty", "Nipples": "nipples",
          "Neighbour": "neighbour", "Nerd": "nerd", "Nurse": "nurse", "Nun": "nun",
          "Nylon": "nylon", "Namibian": "namibian", "Natural Tits": "natural-tits",
          "Nepalese": "nepalese", "New Zealand": "new-zealand",
          "Nicaraguan": "nicaraguan", "Nigerian": "nigerian", "Norwegian": "norwegian",
          "Nudist": "nudist", "Orgy": "orgy", "Outdoor": "outdoor", "Oil": "oil",
          "Old and Young": "old-and-young", "Old Man": "old-man", "Office": "office",
          "Oriental": "oriental", "Oral": "oral", "Orgasm": "orgasm", "Pawg": "pawg",
          "POV": "pov", "Pregnant": "pregnant", "Public": "public",
          "Piercing": "piercing", "Passion": "passion", "Punish": "punish",
          "Pale": "pale", "Pump": "pump", "Pussy": "pussy",
          "Porn Shorts": "porn-shorts", "Puffy Nipples": "puffy-nipples",
          "Petite": "petite", "Pigtails": "pigtails", "Pantyhose": "pantyhose",
          "Prison": "prison", "Party": "party", "Philippine": "philippine",
          "Penis": "penis", "Prolapse": "prolapse", "Plump": "plump",
          "Pissing": "pissing", "Prostitute": "prostitute", "Pakistani": "pakistani",
          "Panamanian": "panamanian", "Paraguayan": "paraguayan", "Park": "park",
          "Parody": "parody", "Private": "private", "Peruvian": "peruvian",
          "Pool": "pool", "Polish": "polish", "Portuguese": "portuguese",
          "Prostate": "prostate", "Punk": "punk", "Riding": "riding", "Rim": "rim",
          "Rough": "rough", "Rubber": "rubber", "Rope": "rope", "Role Play": "role-play",
          "Revenge": "revenge", "Redhead": "redhead", "Reality": "reality",
          "Robot": "robot", "Romanian": "romanian", "Romantic": "romantic",
          "Russian": "russian", "Sister": "sister", "Squirting": "squirting",
          "Ssbbw": "ssbbw", "Stepmom": "stepmom", "Spreading": "spreading",
          "Stroking": "stroking", "Shaved": "shaved", "Shaving": "shaving",
          "Strapon": "strapon", "Selfsuck": "selfsuck", "Swallowing": "swallowing",
          "Spanking": "spanking", "Swimsuit": "swimsuit", "Stockings": "stockings",
          "Sauna": "sauna", "Story": "story", "Shy": "shy", "Shiny": "shiny",
          "Short Hair": "short-hair", "Short Pants": "short-pants", "Socks": "socks",
          "Street": "street", "Small Cock": "small-cock", "Satin": "satin",
          "Sissy": "sissy", "Suck": "suck", "Shower": "shower", "School": "school",
          "Share": "share", "Screaming": "screaming", "Stripping": "stripping",
          "Sport": "sport", "Shoes": "shoes", "Sunglasses": "sunglasses",
          "Stranger": "stranger", "Saggy Tits": "saggy-tits", "Sleeping": "sleeping",
          "Sexy": "sexy", "Swing": "swing", "Scottish": "scottish", "Slim": "slim",
          "Scandal": "scandal", "Scandinavian": "scandinavian", "Slave": "slave",
          "Sex slave": "sex-slave", "Slovak": "slovak", "Spanish": "spanish",
          "Spy": "spy", "Sri Lankan": "sri-lankan", "Spa": "spa",
          "Striptease": "striptease", "Student": "student", "Skirt": "skirt",
          "Skinny": "skinny", "Sorority": "sorority", "Seduce": "seduce",
          "Smoking": "smoking", "Slut": "slut", "Small Tits": "small-tits",
          "Shoejob": "shoejob", "Submissive": "submissive", "Surprise": "surprise",
          "Salvadorian": "salvadorian", "Saudi": "saudi", "Swedish": "swedish",
          "Swiss": "swiss", "Secretary": "secretary", "Senegalese": "senegalese",
          "Sensual": "sensual", "Serbian": "serbian", "Shemale": "shemale",
          "Singaporean": "singaporean", "Syrian": "syrian", "Sudanese": "sudanese",
          "Solarium": "solarium", "Solo": "solo", "South African": "south-african",
          "Sybian": "sybian", "Teen": "teen", "Threesome": "threesome", "Tall": "tall",
          "Tied": "tied", "Tight": "tight", "Tricked": "tricked", "Topless": "topless",
          "Tit fuck": "tit-fuck", "Toys": "toys", "Train": "train", "Toes": "toes",
          "Thin": "thin", "Toon": "toon", "Tiny": "tiny", "Throat": "throat",
          "Twins": "twins", "Tease": "tease", "Toilet": "toilet", "Teacher": "teacher",
          "Taboo": "taboo", "Tajikistani": "tajikistani", "Thai": "thai",
          "Taiwanese": "taiwanese", "Tattoo": "tattoo", "Tongan": "tongan",
          "Tunisian": "tunisian", "Turkish": "turkish", "Underwater": "underwater",
          "Ugly": "ugly", "Uniform": "uniform", "Upskirt": "upskirt",
          "Uncensored": "uncensored", "Ukrainian": "ukrainian", "Uruguayan": "uruguayan",
          "Vintage": "vintage", "Voyeur": "voyeur", "Vagina": "vagina",
          "Vacation": "vacation", "Virgin": "virgin", "Virtual Reality": "virtual-reality",
          "Vampire": "vampire", "Venezuelan": "venezuelan", "Vibrator": "vibrator",
          "Vietnamese": "vietnamese", "Weebcams": "webcams", "Workout": "workout",
          "Work": "work", "Wet": "wet", "White": "white", "Wedding": "wedding",
          "Wrestling": "wrestling", "Wanking": "wanking", "Wife": "wife",
          "Whipping": "whipping", "Welsh": "welsh", "Whore": "whore", "Wild": "wild",
          "Young": "young", "Yoga": "yoga", "Zambian": "zambian",
          "Zimbabwean": "zimbabwean"
        }
      },
      list: { uri: "{page}/" },
      search: { uri: "search?q={search}&sort=relevance&page={page}" },
      contentParse: {
        nodes: "//a[@class='popbop vidLinkFX  videocard linkage']",
        name: { node: ".//div[@class='videotitle ']" },
        href: { node: ".", attribute: "href" },
        img: { node: ".//img[contains(@class, 'lazy-loading')]", attribute: "data-src" },
        duration: { node: ".//span[@class='durlabel']" }
      },
      view: {
        related: !0,
        nodeFile: { node: "//source", attribute: "src" }
      }
    },

    // --- sex.rusvideos.art ---
    {
      enable: !0,
      displayname: "Rusvideos",
      host: "https://sex.rusvideos.art",
      menu: {
        route: {
          sort: "{host}/{page}?sortirovka={sort}",
          cat: "{host}/{cat}/{page}"
        },
        sort: { "Новинки": "", "Популярнаe": "popularnoe" },
        categories: {
          "Зрелые": "zrelye", "Молодые": "molodye", "Бабули": "babuli",
          "Зрелые с молодыми": "zrelye-s-molodymi", "Инцест": "incest",
          "Мама и сын": "mama-i-syn", "Анал": "anal", "Минет": "minet",
          "Кунилингус": "kunilingus", "Двойное проникновение": "dvoynoe-proniknovenie",
          "Толстые": "tolstye", "Худенькие": "xudenkie",
          "Крупным планом": "krupnym-planom", "Лесбиянки": "lesbians",
          "Мастурбация": "masturbaciya", "Секс-игрушки": "seks-igrushki",
          "Соло": "solo", "Групповухи": "gruppovuxi", "Пикап": "pikap",
          "Кастинги": "kastingi", "На улице": "na-ulice",
          "Рогоносцы": "rogonoscy-izmena", "Спящие": "spyashhie",
          "Большие сиськи": "bolshie-siski", "Большие члены": "bolshoj-chlen",
          "Большие жопы": "bolshie-zhopy", "Сперма и камшоты": "sperma-i-kamshoty",
          "Блондинки": "blondinki", "Брюнетки": "bryunetki", "Рыжие": "redhead",
          "Целки": "celki", "В чулках": "v-chulkax-kolgotkax",
          "Нижнее белье": "nizhnee-bele", "В униформе": "v-uniforme",
          "Фетиш ногами": "fetish-nogami", "БДСМ и извращения": "bdsm-i-izvrashheniya",
          "Любительское": "chastnoe-lyubitelskoe", "От первого лица": "ot-pervogo-lica",
          "Волосатые щели": "volosatye-shheli", "Бритая пизда": "britaya-pizda",
          "Вебкам": "vebkam", "Красивое порно": "krasivoe-porno",
          "Пьяный секс": "pyanyj-seks", "Жесткое": "zhestkoe",
          "По принуждению": "po-prinuzhdeniyu", "Русские заграницей": "russkie-zagranicej"
        }
      },
      list: { uri: "{page}/" },
      search: { uri: "poisk/{page}?q={search}" },
      contentParse: {
        nodes: "//div[@class='thumb wide']",
        name: { node: ".//div[@class='thumb-title']" },
        href: { node: ".//a", attribute: "href" },
        img: { node: ".//img", attributes: ["data-original", "src"] },
        duration: { node: ".//span[@class='ttime']" },
        preview: { node: ".//img", attribute: "data-video" }
      },
      view: {
        related: !0,
        nodeFile: { node: "//meta[@property='ya:ovs:content_url']", attribute: "content" }
      }
    },

    // --- veporn.com ---
    {
      enable: !0,
      displayname: "Veporn",
      host: "https://veporn.com",
      menu: {
        route: { cat: "{host}/{cat}/page/{page}/" },
        categories: {
          "4k porn": "4k-porn", "60fps": "60fps", "amateur": "amateur",
          "anal": "anal", "asian": "asian", "babe": "babe", "bdsm": "bdsm",
          "beach": "beach", "big ass": "big-ass", "big dick": "big-dick",
          "big tits": "big-tits", "bisexual": "bisexual", "blonde": "blonde",
          "blowjob": "blowjob", "bondage": "bondage", "brunette": "brunette",
          "cartoon": "cartoon", "casting": "casting", "creampie": "creampie",
          "cumshot": "cumshot", "deepthroat": "deepthroat", "ebony": "ebony",
          "fetish": "fetish", "fingering": "fingering", "fisting": "fisting",
          "gangbang": "gangbang", "group sex": "group-sex", "hairy": "hairy",
          "handjob": "handjob", "interracial": "interracial", "japanese": "japanese",
          "latina": "latina", "lesbians": "lesbians", "long hair": "long-hair",
          "massage": "massage", "masturbation": "masturbation", "mature": "mature",
          "milf": "milf", "moaning": "moaning", "old and young": "old-and-young",
          "orgasm": "orgasm", "orgy": "orgy", "outdoor": "outdoor",
          "pickup": "pickup", "pov": "pov", "public": "public",
          "pussy licking": "pussy-licking", "redhead": "redhead", "russian": "russian",
          "sex party": "sex-party", "shaved pussy": "shaved-pussy",
          "shemales": "shemales", "small tits": "small-tits",
          "squeezing tits": "squeezing-tits", "squirt": "squirt",
          "stockings": "stockings", "tattooed": "tattooed", "teen": "teen",
          "threesome": "threesome", "Uncategorized": "uncategorized",
          "undressing": "undressing", "uniforms": "uniforms", "vibrator": "vibrator"
        }
      },
      list: { uri: "page/{page}/" },
      search: { uri: "page/{page}/?s={search}" },
      contentParse: {
        nodes: "//article[contains(@class, 'loop-post vdeo')]",
        name: { node: ".//h2" },
        href: { node: ".//a", attribute: "href" },
        img: { node: ".//img", attribute: "src" },
        duration: { node: ".//p//span[2]" }
      },
      view: {
        related: !0,
        nodeFile: { node: "//source", attribute: "src" }
      }
    },

    // --- www.porntrex.com ---
    {
      enable: !0,
      displayname: "Porntrex",
      host: "https://www.porntrex.com",
      menu: {
        route: {
          sort: "{host}/{sort}/{page}/",
          cat: "{host}/categories/{cat}/{page}/"
        },
        sort: { "Новинки": "", "Популярное": "most-popular", "Топ рейтинга": "top-rated", "Длинные": "longest" },
        categories: {
          "3D": "3d", "Аматорское": "amateur", "Анальное": "anal", "Азиатки": "asian",
          "BBW": "bbw", "Большие попы": "big-ass", "Большие члены": "big-dick",
          "Большие сиськи": "big-tits", "Блондинки": "blonde", "Минет": "blowjob",
          "Брюнетки": "brunette", "Кримпай": "creampie", "Сперма": "cumshot",
          "Эбони": "ebony", "Фетиш": "fetish", "Гангбанг": "gangbang",
          "Ручная работа": "handjob", "Хардкор": "hardcore",
          "Межрасовое": "interracial", "Латинки": "latina", "Лесби": "lesbian",
          "МИЛФ": "milf", "Оргия": "orgy", "POV": "pov", "Публичное": "public",
          "Рыжие": "redhead", "Транс": "shemale", "Тин": "teen",
          "Трое": "threesome", "Винтаж": "vintage"
        }
      },
      list: { uri: "latest-updates/{page}/" },
      search: { uri: "search/{search}/latest-updates/{page}/" },
      contentParse: {
        nodes: "//div[contains(@class,'video-preview-screen')]",
        name: { node: ".//p[@class='inf']//a" },
        href: { node: ".//a", attribute: "href" },
        img: { node: ".//img", attributes: ["data-src", "src"] },
        duration: { node: ".//div[@class='durations']" }
      },
      view: {
        related: !0,
        regexMatch: {
          matches: ["2160p", "1440p", "1080p", "720p", "480p", "360p"],
          pattern: "'(https?://[^/]+/get_file/[^']+_{value}.mp4/)'"
        }
      }
    },

    // --- www.gayporntube.com ---
    {
      enable: !0,
      displayname: "GayPornTube",
      host: "https://www.gayporntube.com",
      menu: {
        route: { sort: "{host}/{sort}/page{page}.html" },
        sort: {
          "Новые": "most-recent", "Сейчас смотрят": "random",
          "Топ по рейтингу": "top-rated", "Избранные": "top-favorites",
          "Просматриваемые": "most-viewed", "Обсуждаемые": "most-discussed",
          "Длинные": "longest"
        }
      },
      list: { uri: "page{page}.html" },
      search: { uri: "search/videos/{search}/page{page}.html" },
      contentParse: {
        nodes: "//div[contains(@class,'item') and contains(@class,'item-col')]",
        name: { node: ".//a[contains(@class,'title')]" },
        href: { node: ".//a[contains(@class,'title')]", attribute: "href" },
        img: { node: ".//img", attributes: ["data-src", "src"] },
        preview: { node: ".//img", attribute: "data-preview" },
        duration: { node: ".//div[contains(@class,'duration')]" }
      },
      view: {
        related: !0,
        regexMatch: { pattern: 'src="([^"]+)" type="video/mp4"' }
      }
    },

    // --- site.vtrahehd.tv (windows-1251) ---
    {
      enable: !0,
      displayname: "Vtrahe",
      host: "https://site.vtrahehd.tv",
      charset: "windows-1251",
      menu: {
        route: {
          sort: "{host}/{sort}/page/{page}/",
          cat: "{host}/{cat}/page/{page}/"
        },
        sort: { "Новинки": "", "Рейтинговое": "top", "Популярнаe": "most-popular" },
        categories: {
          "Full HD": "fullhd", "Азиатки": "aziatskoe-porno",
          "Анал": "analnoe-porno", "Большие сиськи": "bolshie-siski",
          "Большие члены": "bolshie-chleny", "Групповое": "gruppovoe-porno",
          "Домашнее": "domashnee-porno", "Зрелые": "zrelye-zhenshhiny",
          "Кастинг": "kastingi", "Кончающие": "konchayushhie",
          "Мастурбация": "drochka-i-masturbaciya", "Минет": "minet-i-oralnyj-seks",
          "Негры": "porno-s-negrami-i-mulatkami", "Вечеринки": "porno-vecherinki",
          "Звезды": "porno-zvyozdy", "До 35 лет": "porno-35",
          "Пародии": "porno-parodies", "Пьяные": "seks-po-pyani",
          "Русское": "russkoe-porno", "Секс на улице": "seks-na-ulice-i-nudisty",
          "Скрытая камера": "skrytaya-kamera", "Сперма": "sperma",
          "Толстые": "tolstushki", "Фетиш": "fetish-i-prochee",
          "Лучшее порно": "sorts", "3D": "3d-porno"
        }
      },
      list: { uri: "latest-updates/page/{page}/", firstpage: "" },
      search: { uri: "?do=search&subaction=search&search_start={page}&full_search=0&result_from=25&story={search}" },
      contentParse: {
        nodes: "//div[@class='innercont']",
        name: { node: ".//div[@class='preview_title']//a" },
        href: { node: ".//a", attribute: "href" },
        img: { node: ".//img", attribute: "src" },
        duration: { node: ".//div[@class='dlit']" }
      },
      view: {
        related: !0,
        eval: 'const match = html.match(/data-c="([^"]+)"/);\nif (!match) return null;\nconst e = match[1].split(\';\');\nconst videoId = parseInt(e[4]) || 0;\nconst folder = 1000 * Math.floor(videoId / 1000);\nconst qualitySuffix = e[1] === "720p" ? "" : "_" + e[1];\nreturn `https://${e[7]}.vstor.top/whlvid/${e[5]}/${e[6]}/${folder}/${videoId}/${videoId}${qualitySuffix}.mp4/${videoId}${qualitySuffix}.mp4`;'
      }
    },

    // --- my.vtrahe.work ---
    {
      enable: !0,
      displayname: "VtraheTV",
      host: "https://my.vtrahe.work",
      menu: {
        route: {
          sort: "{host}/{sort}/page/{page}/",
          cat: "{host}/{cat}/page/{page}/"
        },
        sort: { "Новинки": "", "Рейтинговое": "top", "Популярнаe": "most-popular" },
        categories: {
          "Азиатки": "aziatki", "Анал": "anal", "Блондинки": "blondinki",
          "Большие дойки": "bolshiye-doyki", "Большие попки": "bolshiye-popki",
          "Большие члены": "bolshiye-chleny", "Брюнетки": "bryunetki",
          "В ванной": "v-vannoy", "В латексе": "v-latekse", "В лосинах": "v-losinakh",
          "В машине": "v-mashine", "В офисе": "v-ofise", "В чулках": "v-chulkakh",
          "Волосатые": "volosatyye", "Групповое": "gruppovoye",
          "Двойное проникновение": "dvoynoye-proniknoveniye", "Домашнее": "domashneye",
          "Доминирование": "dominirovaniye", "Дрочка": "drochka", "Жены": "zheny",
          "Жесткое": "zhestkoye", "Зрелые": "zrelyye", "Измена": "izmena",
          "Кастинг": "kasting", "Красотки": "krasotki", "Крупным планом": "krupnym-planom",
          "Лесбиянки": "lesbiyanki", "Мамки": "mamki", "Массаж": "massazh",
          "Мастурбация": "masturbatsiya", "МЖМ": "mzhm", "Минет": "minet",
          "Молодые": "molodyye", "Мулатки": "mulatki", "На природе": "na-prirode",
          "На публике": "na-publike", "Негры": "negry", "Нежное": "nezhnoye",
          "Оргазмы": "orgazmy", "Оргии": "orgii", "От первого лица": "ot-pervogo-litsa",
          "Пародии": "parodii", "Пикап": "pikap", "Премиум": "premium",
          "Brazzers": "brazzers", "Full HD": "porno-hd", "Пьяные": "pyanyye",
          "Раком": "rakom", "Русское": "russkoye", "Рыжие": "ryzhiye",
          "Свингеры": "svingery", "Секретарши": "sekretarshi",
          "Секс игрушки": "seks-igrushki", "Сперма": "sperma",
          "Спящие": "spyashchiye", "Страпон": "strapon", "Студенты": "studenty",
          "Татуированные": "tatuirovannyy", "Толстушки": "tolstushki",
          "Фистинг": "fisting", "Худые": "khudyye", "Японки": "yaponki"
        }
      },
      list: { uri: "page/{page}/" },
      search: { uri: "search/{search}/page/{page}/" },
      contentParse: {
        nodes: "//div[@class='innercont']",
        name: { node: ".//div[@class='preview_title']//a" },
        href: { node: ".//a", attribute: "href" },
        img: { node: ".//img", attribute: "src" },
        duration: { node: ".//div[@class='dlit']" }
      },
      view: {
        related: !0,
        eval: "const match = html.match(/data-c=\"([^\"]+)\"/);\nif (!match) return null;\nconst e = match[1].split(';');\nreturn `https://v${e[7]}.cdnde.com/x${e[7]}/upload_${e[0].replace(/^_/, '')}/${e[4]}/JOPORN_NET_${e[4]}_${e[1]}.mp4?time=${e[5]}`;"
      }
    }

  ]; // конец P[]


  // ================================================================
  //  РАЗДЕЛ 5 · РОУТИНГ — не редактировать
  // ================================================================

  var I = new S(P);

  !function () {
    function route() {
      return (route = _asyncToGenerator(_regenerator().m((function route(t) {
        var a, n, r;
        return _regenerator().w((function (e) {
          for (;;) switch (e.n) {
            case 0:
              if (!t.startsWith(d.host)) { e.n = 2; break }
              return e.n = 1, z.Invoke(t);
            case 1:
            case 3:
            case 5:
            case 7:
            case 9:
            case 11:
            case 13:
            case 15:
              return e.a(2, e.v);
            case 2:
              if (!t.startsWith(g.host)) { e.n = 4; break }
              return e.n = 3, L.Invoke(t);
            case 4:
              if (!t.startsWith(y.host)) { e.n = 6; break }
              return e.n = 5, j.Invoke(t);
            case 6:
              if (!t.startsWith(v.host)) { e.n = 8; break }
              return e.n = 7, M.Invoke(t);
            case 8:
              if (!t.startsWith(b.host)) { e.n = 10; break }
              return e.n = 9, T.Invoke(t);
            case 10:
              if (!t.startsWith(f.host)) { e.n = 12; break }
              return e.n = 11, A.Invoke(t);
            case 12:
              if (!t.startsWith("nexthub://")) { e.n = 14; break }
              return e.n = 13, I.Invoke(t);
            case 14:
              if (a = new URL(t), !(n = P.find((function (e) {
                return e.enable && a.hostname === new URL(e.host).hostname
              })))) { e.n = 16; break }
              return r = "nexthub://".concat(n.displayname, "?mode=view&href=").concat(encodeURIComponent(t)),
                e.n = 15, I.Invoke(r);
            case 16:
              return e.a(2, "unknown site")
          }
        }), route)
      })))).apply(this, arguments)
    }

    window.AdultJS = {
      Menu: function () {
        var e = [
          { title: "xvideos.com",    playlist_url: g.host },
          { title: "spankbang.com",  playlist_url: v.host },
          { title: "eporner.com",    playlist_url: f.host },
          { title: "xnxx.com",       playlist_url: j.host },
          { title: "bongacams.com",  playlist_url: z.host },
          { title: "chaturbate.com", playlist_url: T.host }
        ];
        return P.filter((function (e) { return e.enable })).forEach((function (t) {
          e.push({ title: t.displayname.toLowerCase(), playlist_url: "nexthub://".concat(t.displayname, "?mode=list") })
        })), e
      },
      Invoke: function (t) { return route.apply(this, arguments) }
    }
  }();


  // ================================================================
  //  РАЗДЕЛ 6 · ИНИЦИАЛИЗАЦИЯ ПЛАГИНА
  // ================================================================

  !function () {
    var PLUGIN_NAME = "AdultJS";

    Lampa.Lang.add({
      lampac_adultName: {
        ru: "Для взрослых", en: "Adult 18+", uk: "Для взрослых", zh: "Adult 18+"
      }
    });

    var _timer, _previewEl, _req = new Lampa.Reguest;

    function getQuality(e) {
      var t, a = Lampa.Storage.get("video_quality_default", "1080") + "p";
      if (e) {
        for (var n in e) 0 == n.indexOf(a) && (t = e[n]);
        t || (t = e[Lampa.Arrays.getKeys(e)[0]])
      }
      return t
    }

    function hidePreview() {
      if (clearTimeout(_timer), _previewEl) {
        var e, n = _previewEl.find("video");
        try { e = n.pause() } catch (e) {}
        void 0 !== e && e.then((function () {})).catch((function (e) {}));
        _previewEl.addClass("hide"), _previewEl = !1
      }
    }

    var sisi = {
      sourceTitle: function (e) {
        return Lampa.Utils.capitalizeFirstLetter(e.split(".")[0])
      },
      play: function (e) {
        var t = Lampa.Controller.enabled().name;
        if (e.json) {
          Lampa.Loading.start((function () { _req.clear(), Lampa.Loading.stop() }));
          nexthubHandler.qualitys(e.video, (function (a) {
            if (a.error) return Lampa.Noty.show(Lampa.Lang.translate("torrent_parser_nofiles")), void Lampa.Loading.stop();
            var n = a.qualitys || a, i = a.recomends || [];
            Lampa.Loading.stop();
            var o = {
              title: e.name, url: getQuality(n),
              url_reserve: !!a.qualitys_proxy && getQuality(a.qualitys_proxy),
              quality: n, headers: a.headers_stream
            };
            Lampa.Player.play(o);
            i.length ? (i.forEach((function (e) {
              e.title = Lampa.Utils.shortText(e.name, 50),
                e.icon = '<img class="size-youtube" src="' + e.picture + '" />',
                e.template = "selectbox_icon",
                e.url = function (t) {
                  e.json ? nexthubHandler.qualitys(e.video, (function (a) {
                    e.quality = a.qualitys, e.url = getQuality(a.qualitys),
                      a.qualitys_proxy && (e.url_reserve = getQuality(a.qualitys_proxy)), t()
                  })) : (e.url = e.video, t

## Ошибка max_tokens пересоздайте чат
