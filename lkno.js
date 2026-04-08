// ─── LenkinoParser ────────────────────────────────────────────────────────────
var NK = (function () {
  function e() { _classCallCheck(this, e); }

  return _createClass(e, [
    /* ── Invoke ─────────────────────────────────────────────────────────── */
    {
      key: "Invoke",
      value: (
        (_nkT = _asyncToGenerator(
          _regenerator().m(function t(a) {
            var n, r, i, o, s, c, d, f, g2;
            return _regenerator().w(function (t) {
              for (;;) switch (t.n) {

                /* --- video-page / related --------------------------------- */
                case 0:
                  if (!e.isVideoPage(a)) { t.n = 2; break; }
                  return (t.n = 1),
                    l.Get(
                      a.replace("&related", "")
                       .replace(/[?&]pg=\d+/, "")
                    );
                case 1:
                  return (
                    (n = t.v),
                    t.a(2, new h(this.StreamLinks(n), a.includes("&related")))
                  );

                /* --- list / category / search ----------------------------- */
                case 2:
                  r  = new URL(a, e.host);
                  i  = r.searchParams.get("search") || "";
                  o  = r.searchParams.get("sort")   || "";
                  s  = r.searchParams.get("cat")    || "";
                  c  = r.searchParams.get("model")  || "";
                  d  = parseInt(r.searchParams.get("pg") || "1", 10);
                  f  = this.buildUrl(e.host, i, o, s, c, d);
                  return (t.n = 3), l.Get(f);
                case 3:
                  g2 = t.v;
                  return t.a(2, {
                    menu:        this.Menu(o, s),
                    list:        this.Playlist(g2),
                    total_pages: 50,
                  });

                case 4: return t.a(2);
              }
            }, t, this);
          })
        )),
        function (a) { return _nkT.apply(this, arguments); }
      ),
    },

    /* ── buildUrl ───────────────────────────────────────────────────────── */
    {
      key: "buildUrl",
      value: function (host, search, sort, cat, model, page) {
        if (search)
          return ""
            .concat(host, "/search/")
            .concat(encodeURIComponent(search), "/page/")
            .concat(page);

        if (model) {
          // model содержит полный URL модели (закодированный)
          var mUrl = decodeURIComponent(model);
          return mUrl.replace(/\/?$/, "") + "/page/" + page;
        }

        if (cat) {
          // catsort: только sort=top-porno применим к категориям
          if (sort === "top-porno")
            return "".concat(host, "/").concat(cat, "-top/page/").concat(page);
          return "".concat(host, "/").concat(cat, "/page/").concat(page);
        }

        if (sort)
          return "".concat(host, "/").concat(sort, "/page/").concat(page);

        if (page === 1) return host;
        return "".concat(host, "/page/").concat(page);
      },
    },

    /* ── Playlist ───────────────────────────────────────────────────────── */
    {
      key: "Playlist",
      value: function (html) {
        if (!html) return [];

        var doc   = _(html),
            items = [],
            nodes = (function (doc, xpath) {
              var res = doc.evaluate(
                xpath, doc, null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
              ), arr = [];
              for (var i = 0; i < res.snapshotLength; i++)
                arr.push(res.snapshotItem(i));
              return arr;
            })(doc, "//div[@class='item']");

        nodes.forEach(function (node) {
          var nameEl = x(doc, ".//div[@class='itm-tit']",         node),
              hrefEl = x(doc, ".//a",                              node),
              imgEl  = x(doc, ".//img[@class='lzy']",              node),
              durEl  = x(doc, ".//div[@class='itm-dur fnt-cs']",   node),
              modEl  = x(doc, ".//a[@class='itm-opt-mdl len_pucl']", node);

          var name = nameEl
                ? (nameEl.textContent || "").trim()
                : (hrefEl ? hrefEl.getAttribute("title") || "" : ""),
              href    = hrefEl ? hrefEl.getAttribute("href") || "" : "",
              imgSrc  = imgEl  ? C(imgEl, "data-srcset")          : "",
              preview = imgEl  ? C(imgEl, "data-preview") || null  : null,
              dur     = durEl  ? (durEl.textContent || "").trim()  : null;

          if (!name || !href) return;

          /* нормализация URL картинки */
          if (imgSrc) {
            imgSrc = imgSrc.replace(/&amp;/g, "&").replace(/\\/g, "");
            if      (imgSrc.startsWith("//"))   imgSrc = "https:" + imgSrc;
            else if (imgSrc.startsWith("/"))    imgSrc = e.host + imgSrc;
            else if (!imgSrc.startsWith("http"))imgSrc = e.host + "/" + imgSrc;
          }

          /* нормализация URL превью */
          if (preview) {
            preview = preview.replace(/&amp;/g, "&").replace(/\\/g, "");
            if      (preview.startsWith("//"))    preview = "https:" + preview;
            else if (preview.startsWith("/"))     preview = e.host + preview;
            else if (!preview.startsWith("http")) preview = e.host + "/" + preview;
          }

          var videoUrl = href.startsWith("http")
            ? href
            : e.host.replace(/\/?$/, "/") + href.replace(/^\/?/, "");

          /* информация о модели */
          var model = null;
          if (modEl) {
            var mName = (modEl.textContent || "").trim(),
                mHref =  modEl.getAttribute("href") || "";
            if (mName && mHref) {
              var fullModel = mHref.startsWith("http")
                ? mHref
                : e.host + mHref;
              model = {
                uri:  e.host + "?model=" + encodeURIComponent(fullModel),
                name: mName,
              };
            }
          }

          if (videoUrl && name && imgSrc)
            items.push(
              new u(name, videoUrl, imgSrc, preview, dur, null, !0, !0, model)
            );
        });

        return items;
      },
    },

    /* ── StreamLinks ────────────────────────────────────────────────────── */
    {
      key: "StreamLinks",
      value: function (html) {
        if (!html) return new m({}, []);

        var qualitys = {};

        /* Lenkino хранит два варианта ссылки:
           video_alt_url: 'URL'  → 1080p
           video_url:     'URL'  → 720p                                  */
        [["alt_url", "1080p"], ["url", "720p"]].forEach(function (pair) {
          var re    = new RegExp("video_" + pair[0] + ":[\\t ]+'([^']+)'"),
              match = re.exec(html);
          if (match && match[1]) qualitys[pair[1]] = match[1];
        });

        return new m(qualitys, this.Playlist(html));
      },
    },

    /* ── Menu ───────────────────────────────────────────────────────────── */
    {
      key: "Menu",
      value: function (currentSort, currentCat) {
        var r    = e.host,
            menu = [new p("Поиск", r, "search_on")];

        /* --- Сортировка ------------------------------------------------- */
        var sortItems = [
          new p("Новые",   r + "?sort="),
          new p("Лучшие",  r + "?sort=top-porno"),
          new p("Горячие", r + "?sort=hot-porno"),
        ];
        var activeSort = sortItems.find(function (s) {
          return (s.playlist_url.split("sort=")[1] || "") === currentSort;
        }) || sortItems[0];
        menu.push(
          new p("Сортировка: " + activeSort.title, "submenu", void 0, sortItems)
        );

        /* --- Категории -------------------------------------------------- */
        var catData = [
          ["Все",                   ""],
          ["Русское порно",         "a1-russian"],
          ["Порно зрелых",          "milf-porn"],
          ["Красивый секс",         "beautiful"],
          ["Мачеха",                "stepmom"],
          ["Анал",                  "anal-porno"],
          ["Большие сиськи",        "big-tits"],
          ["Эротика",               "erotic"],
          ["Лесби",                 "lesbi-porno"],
          ["Групповуха",            "group-videos"],
          ["POV",                   "pov"],
          ["БДСМ",                  "bdsm"],
          ["Вебкамера",             "webcam"],
          ["Ганг банг",             "gangbang"],
          ["Домашнее порно",        "amateur"],
          ["ЖМЖ",                   "threesome-ffm"],
          ["Кастинг",               "casting"],
          ["Куни",                  "cunnilingus"],
          ["Массаж",                "massage"],
          ["Мастурбация",           "masturbation"],
          ["Минет",                 "blowjob"],
          ["Соло",                  "solo"],
          ["Хардкор",               "hardcore"],
          ["МЖМ",                   "threesome-mmf"],
          ["Чешское порно",         "czech"],
          ["Русское домашнее",      "russian-amateur"],
          ["Молодые",               "teen"],
          ["Старые с молодыми",     "old-young"],
          ["Студенты",              "student"],
          ["Азиатки",               "asian"],
          ["Латинки",               "latina"],
          ["Медсестра",             "nurse"],
          ["Секретарша",            "secretary"],
          ["Няня",                  "babysitter"],
          ["Черлидерша",            "cheerleader"],
          ["Студентка",             "schoolgirl"],
          ["Горничная",             "maid"],
          ["Учительница",           "teacher"],
          ["Блондинки",             "blonde"],
          ["Брюнетки",              "brunette"],
          ["Рыжие",                 "redhead"],
          ["Короткие волосы",       "short-hair"],
          ["Длинные волосы",        "long-hair"],
          ["Косички",               "pigtails"],
          ["В ванной",              "bathroom"],
          ["В машине",              "car"],
          ["В офисе",               "office"],
          ["В спальне",             "bedroom"],
          ["В спортзале",           "gym"],
          ["На кухне",              "kitchen"],
          ["На пляже",              "beach"],
          ["На природе",            "outdoor"],
          ["На диване",             "sofa"],
          ["На столе",              "table"],
          ["Двойное проникновение", "double-penetration"],
          ["Крупным планом",        "close-up"],
          ["Лижет попу",            "rimjob"],
          ["Между сисек",           "titjob"],
          ["Наездница",             "cowgirl"],
          ["Оргазмы",               "orgasm"],
          ["Поза 69",               "69"],
          ["Раком",                 "doggy-style"],
          ["Сквирт",                "squirt"],
          ["Стриптиз",              "striptease"],
          ["Большие жопы",          "big-ass"],
          ["Большой чёрный член",   "bbc"],
          ["Большие члены",         "big-cock"],
          ["Гибкие",                "flexible"],
          ["Красивая грудь",        "nice-tits"],
          ["Маленькие сиськи",      "small-tits"],
          ["Натуральные сиськи",    "natural-tits"],
          ["Красивые попки",        "nice-ass"],
          ["Бритые письки",         "shaved"],
          ["Волосатая пизда",       "hairy"],
          ["Толстые",               "bbw"],
          ["Худые",                 "skinny"],
          ["Силиконовые сиськи",    "fake-tits"],
          ["Интимные стрижки",      "trimmed"],
          ["Загорелые",             "tanned"],
          ["Босс",                  "boss"],
          ["Доктор",                "doctor"],
          ["Тренер",                "trainer"],
          ["В красивом белье",      "lingerie"],
          ["В чулках",              "stockings"],
          ["На каблуках",           "heels"],
          ["В гольфах",             "socks"],
          ["Латекс",                "latex"],
          ["С вибратором",          "vibrator"],
          ["Дилдо",                 "dildo"],
          ["Евро",                  "european"],
          ["Йога",                  "yoga"],
          ["Куколд",                "cuckold"],
          ["Межрассовое",           "interracial"],
          ["На публике",            "public"],
          ["Пикап",                 "pickup"],
          ["Свингеры",              "swingers"],
          ["Секс-игрушки",          "sex-toys"],
          ["Страпон",               "strapon"],
          ["Анальная пробка",       "buttplug"],
          ["Бондаж",                "bondage"],
          ["Женское доминирование", "femdom"],
          ["Подчинение",            "submissive"],
          ["Фистинг",               "fisting"],
          ["Футфетиш",              "footjob"],
          ["Негры",                 "black"],
          ["Негритянки",            "ebony"],
          ["Негры с блондинками",   "black-blonde"],
          ["Буккаке",               "bukkake"],
          ["Сперма",                "cumshot"],
          ["Сперма вытекает",       "creampie"],
          ["Сперма на груди",       "cum-on-tits"],
          ["Сперма на лице",        "facial"],
          ["Глотает сперму",        "cum-swallow"],
          ["Сперма на попе",        "cum-on-ass"],
          ["Сперма на пизде",       "cum-on-pussy"],
        ];

        var catItems = catData.map(function (pair) {
          return new p(pair[0], pair[1] ? r + "?cat=" + pair[1] : r);
        });

        var activeCat = catItems.find(function (ci) {
          return (ci.playlist_url.split("cat=")[1] || "") === currentCat;
        });
        menu.push(
          new p(
            "Категория: " + (activeCat ? activeCat.title : "все"),
            "submenu", void 0, catItems
          )
        );

        return menu;
      },
    },
  ]);

  var _nkT;
  return e;
})();

/* статические поля */
NK.host = "https://wes.lenkino.adult";

/**
 * Определяет, является ли URL страницей видео (а не списком).
 * Логика:
 *   &related  → всегда страница видео (режим похожих)
 *   pg=       → страница списка
 *   иначе     → видео-страница, если путь не пустой
 */
NK.isVideoPage = function (url) {
  if (!url) return false;
  if (url.includes("&related")) return true;
  try {
    var u = new URL(url);
    if (
      u.searchParams.get("pg")     ||
      u.searchParams.get("search") ||
      u.searchParams.get("sort")   ||
      u.searchParams.get("cat")    ||
      u.searchParams.get("model")
    ) return false;
    var path = u.pathname.replace(/\/$/, "");
    return path.length > 0;
  } catch (_) { return false; }
};
// ─── END LenkinoParser ────────────────────────────────────────────────────────
