// =============================================================
// p365.js — Парсер Porno365Tube для AdultJS / AdultPlugin (Lampa)
// Version  : 1.0.0
//
// Сайт     : https://top.porno365tube.win/
// Тип      : Статический HTML, данные в разметке
//
// Структура карточки каталога:
//   <div class="item video-block">
//     <a href="/videos/{slug}" class="link">
//       <div class="img-holder">
//         <img data-src="/contents/.../426x240/5.jpg"
//              data-preview="https://top.porno365tube.win/get_file/.../preview.mp4"
//              alt="Название" />
//         <span class="duration">24:27</span>
//       </div>
//       <div class="title-holder">
//         <div class="title">Название</div>
//       </div>
//     </a>
//   </div>
//
// Структура страницы видео:
//   <video src="https://.../1601_480.mp4">
//     <source src=".../1601_preview.mp4" size="preview">
//     <source src=".../1601_480.mp4"     size="480">
//   </video>
//   og:video → HD mp4 (внешний CDN)
//
// URL-схема:
//   Главная    : https://top.porno365tube.win/
//   Категория  : https://top.porno365tube.win/categories/{slug}
//   Поиск      : https://top.porno365tube.win/?q={query}
//   Пагинация  : добавляем &page={N} к любому URL
//   Видео      : https://top.porno365tube.win/videos/{slug}
//
// Категорий   : 80 (полный список из анализа)
// =============================================================

(function () {
  'use strict';

  var HOST = 'https://top.porno365tube.win';
  var NAME = 'p365';
  var TAG  = '[p365]';

  // ----------------------------------------------------------
  // ПОЛИФИЛЛЫ
  // ----------------------------------------------------------
  if (!Array.prototype.find) {
    Array.prototype.find = function (fn) {
      for (var i = 0; i < this.length; i++) {
        if (fn(this[i], i, this)) return this[i];
      }
    };
  }

  function forEachNode(list, fn) {
    if (!list) return;
    for (var i = 0; i < list.length; i++) fn(list[i], i);
  }

  function arrayFind(arr, fn) {
    if (!arr) return undefined;
    for (var i = 0; i < arr.length; i++) if (fn(arr[i], i)) return arr[i];
  }

  // ----------------------------------------------------------
  // ЛОГИРОВАНИЕ
  // ----------------------------------------------------------
  function log(m, d)  { console.log(TAG,   m, d !== undefined ? d : ''); }
  function warn(m, d) { console.warn(TAG,  m, d !== undefined ? d : ''); }
  function err(m, d)  { console.error(TAG, m, d !== undefined ? d : ''); }

  function notyErr(msg) {
    try { Lampa.Noty.show(TAG + ' ⛔ ' + msg, { time: 3000, style: 'error' }); } catch(e) {}
  }
  function notyOk(msg) {
    try { Lampa.Noty.show(TAG + ' ✅ ' + msg, { time: 2500 }); } catch(e) {}
  }

  // ----------------------------------------------------------
  // СЕТЕВОЙ СЛОЙ — делегируем AdultPlugin.networkRequest
  // ----------------------------------------------------------
  function httpGet(url, ok, fail) {
    log('GET →', url);
    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, ok, fail, { type: 'html' });
    } else {
      // Fallback: Lampa.Reguest
      try {
        new Lampa.Reguest().silent(url,
          function (d) {
            var t = (typeof d === 'string') ? d : '';
            if (t.length > 50) ok(t); else fail('empty');
          },
          function (e) { fail(e || 'req_err'); },
          false, { dataType: 'text', timeout: 15000 }
        );
      } catch(ex) { fail(ex.message); }
    }
  }

  // ----------------------------------------------------------
  // 80 КАТЕГОРИЙ (из анализа сайта)
  // ----------------------------------------------------------
  var CATS = [
    { title: 'HD порно',              slug: 'hd-porno'              },
    { title: 'Азиатки',               slug: 'aziatki'               },
    { title: 'Анал',                  slug: 'anal'                  },
    { title: 'Анилингус',             slug: 'anilingus'             },
    { title: 'БДСМ',                  slug: 'bdsm'                  },
    { title: 'Блондинки',             slug: 'blondinki'             },
    { title: 'Большие жопы',          slug: 'bolshie-jopy'          },
    { title: 'Большие сиськи',        slug: 'bolshie-siski'         },
    { title: 'Большие члены',         slug: 'bolshie-chleny'        },
    { title: 'Брат и сестра',         slug: 'brat-i-sestra'         },
    { title: 'Бритые киски',          slug: 'britye-kiski'          },
    { title: 'Брюнетки',              slug: 'bryunetki'             },
    { title: 'Буккаке',               slug: 'bukkake'               },
    { title: 'В ванной',              slug: 'v-vannoy'              },
    { title: 'В лосинах',             slug: 'v-losinah'             },
    { title: 'В машине',              slug: 'v-mashine'             },
    { title: 'В офисе',               slug: 'v-ofise'               },
    { title: 'Вечеринки',             slug: 'vecherinki'            },
    { title: 'Волосатые',             slug: 'volosatye'             },
    { title: 'Групповое',             slug: 'gruppovoe'             },
    { title: 'Двойное проникновение', slug: 'dvoynoe-proniknovenie' },
    { title: 'Домашнее',              slug: 'domashnee'             },
    { title: 'Доминирование',         slug: 'dominirovanie'         },
    { title: 'Дрочка',                slug: 'drochka'               },
    { title: 'Женское доминирование', slug: 'jenskoe-dominirovanie' },
    { title: 'Жёсткое',               slug: 'jestkoe'               },
    { title: 'ЖМЖ',                   slug: 'jmj'                   },
    { title: 'Зрелые',                slug: 'zrelye'                },
    { title: 'Игрушки',               slug: 'igrushki'              },
    { title: 'Измена',                slug: 'izmena'                },
    { title: 'Инцест',                slug: 'incest'                },
    { title: 'Камшот',                slug: 'sperma'                },
    { title: 'Кастинг',               slug: 'kasting'               },
    { title: 'Красивое порно',        slug: 'krasivoe-porno'        },
    { title: 'Кремпай',               slug: 'krempay'               },
    { title: 'Крупным планом',        slug: 'krupnym-planom'        },
    { title: 'Куни',                  slug: 'kuni'                  },
    { title: 'Любительское',          slug: 'lyubitelskoe-porno'    },
    { title: 'Маленькие сиськи',      slug: 'malenkie-siski'        },
    { title: 'Мамки',                 slug: 'mamki'                 },
    { title: 'Массаж',                slug: 'massaj'                },
    { title: 'Мастурбация',           slug: 'masturbaciya'          },
    { title: 'Медсёстры',             slug: 'medsestry'             },
    { title: 'Межрасовое',            slug: 'mejrassovoe'           },
    { title: 'МЖМ',                   slug: 'mjm'                   },
    { title: 'Минет',                 slug: 'minet'                 },
    { title: 'Молодые',               slug: 'molodye'               },
    { title: 'Мулатки',               slug: 'mulatki'               },
    { title: 'На природе',            slug: 'na-prirode'            },
    { title: 'На публике',            slug: 'na-publike'            },
    { title: 'Негры',                 slug: 'negry'                 },
    { title: 'Оргазмы',               slug: 'orgazmy'               },
    { title: 'Оргии',                 slug: 'orgii'                 },
    { title: 'Пикап',                 slug: 'pikap'                 },
    { title: 'Порно Full HD',         slug: 'porno-onlayn-hd'       },
    { title: 'Порно звёзды',          slug: 'porno-zvezdy'          },
    { title: 'Ретро',                 slug: 'retro-porno'           },
    { title: 'Русское',               slug: 'russkoe'               },
    { title: 'Русское домашнее',      slug: 'russkoe-domashnee-porno'},
    { title: 'Рыжие',                 slug: 'ryjie'                 },
    { title: 'Свингеры',              slug: 'svingery'              },
    { title: 'Секс втроём',           slug: 'seks-vtroem'           },
    { title: 'Страпон',               slug: 'strapon'               },
    { title: 'Студенты',              slug: 'studenty'              },
    { title: 'Сын и мать',            slug: 'syn-i-mat'             },
    { title: 'Толстые',               slug: 'tolstye'               },
    { title: 'Фистинг',               slug: 'fisting'               },
    { title: 'Худые',                 slug: 'hudye'                 },
    { title: 'Частное',               slug: 'chastnoe-porno'        },
    { title: 'Чулки',                 slug: 'chulki'                },
    { title: 'Шатенки',               slug: 'shatenki'              },
    { title: 'Японское',              slug: 'yaponskoe'             },
  ];

  // ----------------------------------------------------------
  // ПОСТРОЕНИЕ URL
  //
  // Главная    : HOST + '/'
  // Категория  : HOST + '/categories/' + slug + (page>1 ? '?page=N' : '')
  // Поиск      : HOST + '/?q=' + query  (+ &page=N)
  // ----------------------------------------------------------
  function buildUrl(cat, search, page) {
    page = parseInt(page, 10) || 1;
    var base, sep;

    if (search) {
      base = HOST + '/?q=' + encodeURIComponent(search);
      sep  = '&';
    } else if (cat) {
      base = HOST + '/categories/' + cat;
      sep  = '?';
    } else {
      base = HOST + '/';
      sep  = '?';
    }

    if (page > 1) base = base + sep + 'page=' + page;
    log('buildUrl →', base);
    return base;
  }

  // Разобрать URL обратно в {cat, search}
  function parseUrl(url) {
    var s = url || '';

    // Имя парсера без слэша — главная
    if (s.indexOf('/') === -1 && s.indexOf('http') === -1) {
      return { cat: '', search: '' };
    }

    // ?q= или ?search=
    var qm = s.match(/[?&](?:q|search)=([^&]+)/);
    if (qm) return { cat: '', search: decodeURIComponent(qm[1] || '') };

    // /categories/{slug}
    var cm = s.match(/\/categories\/([^/?&#]+)/);
    if (cm) return { cat: cm[1], search: '' };

    return { cat: '', search: '' };
  }

  // Меню фильтра
  function buildMenu(url) {
    var state     = parseUrl(url || '');
    var activeCat = arrayFind(CATS, function (c) { return c.slug === state.cat; });

    var catSubmenu = CATS.map(function (c) {
      return { title: c.title, playlist_url: HOST + '/categories/' + c.slug };
    });

    return [
      { title: 'Поиск', playlist_url: HOST, search_on: true },
      {
        title:   'Категория: ' + (activeCat ? activeCat.title : 'Все'),
        submenu: catSubmenu,
        // НЕТ playlist_url у группы — иначе AdultJS грузит 'submenu' → Script error
      },
    ];
  }

  // ----------------------------------------------------------
  // ПАРСИНГ КАТАЛОГА
  //
  // Реальная разметка карточки:
  //   <div class="item video-block">
  //     <a href="/videos/{slug}" class="link">
  //       <img data-src="/contents/.../426x240/5.jpg"
  //            data-preview="https://.../preview.mp4"
  //            src="/contents/.../426x240/5.jpg"   ← уже загружен
  //            alt="Название" />
  //       <span class="duration">24:27</span>
  //       <div class="title">Название</div>
  //     </a>
  //   </div>
  //
  // Постер: img[data-src] → img[src] (если уже загружен)
  // Превью: img[data-preview] — готовый mp4
  // ----------------------------------------------------------
  function parsePlaylist(html) {
    if (!html || html.length < 100) { warn('html пустой'); return []; }
    log('parsePlaylist → длина:', html.length);

    var doc;
    try { doc = new DOMParser().parseFromString(html, 'text/html'); }
    catch(e) { err('DOMParser:', e.message); return []; }

    var cards = [];

    // Стратегия 1: div.item.video-block (точный селектор из анализа)
    var blocks = doc.querySelectorAll('div.item.video-block');
    log('parsePlaylist → div.item.video-block:', blocks.length);

    // Fallback: просто .video-block
    if (!blocks.length) {
      blocks = doc.querySelectorAll('div.video-block');
      log('parsePlaylist → div.video-block:', blocks.length);
    }

    forEachNode(blocks, function (el) {
      try {
        var aEl  = el.querySelector('a[href]');
        if (!aEl) return;

        var href = aEl.getAttribute('href') || '';
        if (!href) return;
        if (href.indexOf('http') !== 0) href = HOST + href;
        // Только страницы видео
        if (href.indexOf('/videos/') === -1) return;

        var imgEl = el.querySelector('img');

        // Постер: data-src приоритетнее src (src может быть плейсхолдером)
        var picture = '';
        if (imgEl) {
          picture = imgEl.getAttribute('data-src') ||
                    imgEl.getAttribute('src')       || '';
          // Относительный путь → добавляем хост
          if (picture && picture.indexOf('http') !== 0) picture = HOST + picture;
          // Отсекаем base64 плейсхолдеры
          if (picture.indexOf('data:image') === 0) picture = '';
        }

        // Превью: img[data-preview] — прямой mp4 URL
        var preview = imgEl ? (imgEl.getAttribute('data-preview') || null) : null;

        // Название: .title → img[alt]
        var titleEl = el.querySelector('.title');
        var name    = (titleEl ? (titleEl.textContent || '').trim() : '') ||
                      (imgEl   ? (imgEl.getAttribute('alt') || '')   : '');
        name = name.replace(/\s+/g, ' ').trim();
        if (!name || name.length < 3) return;

        // Длительность: span.duration
        var durEl = el.querySelector('.duration, span.duration');
        var time  = durEl ? (durEl.textContent || '').trim() : '';

        // Дедупликация
        for (var ci = 0; ci < cards.length; ci++) {
          if (cards[ci].video === href) return;
        }

        cards.push({
          name:    name,
          video:   href,      // HTML-страница → qualitys() найдёт mp4
          picture: picture,
          preview: preview,
          time:    time,
          quality: 'HD',
          json:    true,      // нужен qualitys() для получения реального mp4
          source:  NAME,
        });
      } catch(ex) { warn('card ex:', ex.message); }
    });

    if (!cards.length) {
      warn('parsePlaylist → карточки не найдены');
      if (doc.body) {
        warn('body[0:400]:', (doc.body.innerHTML || '').substring(0, 400));
        warn('.video-block найдено:', doc.querySelectorAll('.video-block').length);
        warn('a[/videos/] найдено:', doc.querySelectorAll('a[href*="/videos/"]').length);
      }
    } else {
      log('parsePlaylist → ИТОГО:', cards.length);
      log('  первая:', cards[0].name);
      log('  picture:', cards[0].picture || '(пусто)');
      log('  preview:', cards[0].preview || '(нет)');
      notyOk('Найдено ' + cards.length + ' видео');
    }
    return cards;
  }

  // ----------------------------------------------------------
  // ПОЛУЧЕНИЕ ПРЯМЫХ ССЫЛОК (qualitys)
  //
  // На странице видео:
  //   <video src="https://.../1601_480.mp4">
  //     <source src=".../preview.mp4" size="preview">
  //     <source src=".../1601_480.mp4" size="480">
  //   </video>
  //   <meta property="og:video" content="https://uch3.vids69.com/.../10147_720.mp4">
  //
  // Ищем все source с size != "preview" + og:video для HD
  // ----------------------------------------------------------
  function getStreamLinks(videoUrl, ok, fail) {
    log('qualitys →', videoUrl);

    httpGet(videoUrl, function (html) {
      var q = {};

      // 1. <source src="..." size="N"> — пропускаем preview
      var srcRe = /<source[^>]+src="([^"]+)"[^>]+size="([^"]+)"/gi;
      var m;
      while ((m = srcRe.exec(html)) !== null) {
        var src  = m[1];
        var size = m[2];
        if (size === 'preview') continue;
        if (src.indexOf('http') !== 0) src = HOST + src;
        q[size + 'p'] = src;
        log('source size=' + size + ':', src.substring(0, 80));
      }

      // Порядок атрибутов может быть обратным: size="N" src="..."
      if (!Object.keys(q).length) {
        var srcRe2 = /<source[^>]+size="([^"]+)"[^>]+src="([^"]+)"/gi;
        while ((m = srcRe2.exec(html)) !== null) {
          var size2 = m[1];
          var src2  = m[2];
          if (size2 === 'preview') continue;
          if (src2.indexOf('http') !== 0) src2 = HOST + src2;
          q[size2 + 'p'] = src2;
        }
      }

      // 2. og:video meta-тег — обычно HD с внешнего CDN
      if (!Object.keys(q).length || !q['720p']) {
        var ogm = html.match(/<meta[^>]+property="og:video"[^>]+content="([^"]+\.mp4[^"]*)"/i) ||
                  html.match(/<meta[^>]+content="([^"]+\.mp4[^"]*)"[^>]+property="og:video"/i);
        if (ogm && ogm[1]) {
          // Определяем качество из имени файла
          var ogUrl = ogm[1];
          var qLabel = ogUrl.match(/_(\d+)\.mp4/) ? ogUrl.match(/_(\d+)\.mp4/)[1] + 'p' : 'HD';
          if (!q[qLabel]) q[qLabel] = ogUrl;
          log('og:video ' + qLabel + ':', ogUrl.substring(0, 80));
        }
      }

      // 3. video[src] — прямой атрибут src тега video
      if (!Object.keys(q).length) {
        var vsm = html.match(/<video[^>]+src="([^"]+\.mp4[^"]*)"/i);
        if (vsm && vsm[1]) {
          var vsUrl = vsm[1];
          if (vsUrl.indexOf('http') !== 0) vsUrl = HOST + vsUrl;
          var vsLabel = vsUrl.match(/_(\d+)\.mp4/) ? vsUrl.match(/_(\d+)\.mp4/)[1] + 'p' : 'auto';
          q[vsLabel] = vsUrl;
          log('video src:', vsUrl.substring(0, 80));
        }
      }

      // 4. Любые mp4 (последний резерв)
      if (!Object.keys(q).length) {
        var re4 = /["'](https?:\/\/[^"'\s]+\.mp4[^"'\s]*)/g;
        var mx; var i4 = 0;
        while ((mx = re4.exec(html)) !== null && i4 < 5) {
          if (mx[1].indexOf('preview') === -1) {
            q['auto' + (i4 || '')] = mx[1]; i4++;
          }
        }
      }

      if (!Object.keys(q).length) {
        notyErr('Нет ссылок на видео');
        fail('no_links');
        return;
      }

      log('qualitys → найдено:', Object.keys(q).length, JSON.stringify(Object.keys(q)));
      notyOk('Качеств: ' + Object.keys(q).length);
      ok({ qualitys: q });
    }, function(e) {
      notyErr('Ошибка страницы видео');
      fail(e);
    });
  }

  // ----------------------------------------------------------
  // ПУБЛИЧНЫЙ ИНТЕРФЕЙС
  // ----------------------------------------------------------
  var P365Parser = {

    main: function (params, ok, fail) {
      log('main()');
      try {
        httpGet(HOST + '/', function (html) {
          try {
            var r = parsePlaylist(html);
            if (!r.length) { fail('no_cards'); return; }
            ok({ results: r, collection: true, total_pages: 30, menu: buildMenu(HOST) });
          } catch(e) { err('main cb:', e.message); fail(e.message); }
        }, fail);
      } catch(e) { err('main:', e.message); fail(e.message); }
    },

    view: function (params, ok, fail) {
      log('view()', JSON.stringify({ url: params.url, page: params.page }));
      try {
        var rawUrl = (params.url || HOST).replace(/[?&]page=\d+/, '');
        var page   = parseInt(params.page, 10) || 1;
        var state  = parseUrl(rawUrl);
        var url    = buildUrl(state.cat, state.search, page);

        httpGet(url, function (html) {
          try {
            var r = parsePlaylist(html);
            if (!r.length) { fail('no_cards'); return; }
            ok({
              results:     r,
              collection:  true,
              total_pages: r.length >= 20 ? page + 5 : page,
              menu:        buildMenu(rawUrl),
            });
          } catch(e) { err('view cb:', e.message); fail(e.message); }
        }, fail);
      } catch(e) { err('view:', e.message); fail(e.message); }
    },

    search: function (params, ok, fail) {
      var query = (params.query || '').trim();
      log('search() "' + query + '"');
      try {
        httpGet(HOST + '/?q=' + encodeURIComponent(query), function (html) {
          try {
            var r = parsePlaylist(html);
            ok({
              title:       'p365: ' + query,
              results:     r,
              url:         HOST + '/?q=' + encodeURIComponent(query),
              collection:  true,
              total_pages: r.length >= 20 ? 6 : 1,
            });
          } catch(e) {
            ok({ title: 'p365', results: [], collection: true, total_pages: 1 });
          }
        }, function () {
          ok({ title: 'p365', results: [], collection: true, total_pages: 1 });
        });
      } catch(e) { err('search:', e.message); fail(e.message); }
    },

    qualitys: function (videoUrl, ok, fail) {
      log('qualitys()', videoUrl);
      try { getStreamLinks(videoUrl, ok, fail); }
      catch(e) { err('qualitys:', e.message); fail(e.message); }
    },
  };

  // ----------------------------------------------------------
  // РЕГИСТРАЦИЯ
  // ----------------------------------------------------------
  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, P365Parser);
      log('v1.0.0 зарегистрирован');
      notyOk('Porno365Tube v1.0.0');
      return true;
    }
    return false;
  }

  if (!tryRegister()) {
    var _e = 0;
    var _t = setInterval(function () {
      _e += 100;
      if (tryRegister()) clearInterval(_t);
      else if (_e >= 10000) { clearInterval(_t); notyErr('Таймаут регистрации'); }
    }, 100);
  }

})();
