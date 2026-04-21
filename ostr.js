// =============================================================
// ostr.js — OstroePorno Parser для AdultJS (Lampa)
// Version  : 1.5.0
// Changed  :
//   [1.5.0] Полная адаптация под UNIVERSAL_TEMPLATE
//           mainPagePath → /top
//           CARD_SELECTORS совместимость
//           Улучшенный parseVideoJs + uppod обработка
//           Оптимизация под worker W170 + Adult ядро
//           Чистый код, расширенная диагностика
// =============================================================

(function () {
  'use strict';

  var VERSION = '1.5.0';
  var NAME    = 'ostr';
  var HOST    = 'http://ostroeporno.com';
  var TAG     = '[' + NAME + ']';

  var CATEGORIES = [
    { title: '🇷🇺 Русское', slug: 'russkoe' },
    { title: '🏠 Домашнее', slug: 'domashnee' },
    { title: '🏠 Русское домашнее', slug: 'russkoe_domashnee' },
    { title: '👧 Молодые', slug: 'molodyee' },
    { title: '👅 Минет', slug: 'minet' },
    { title: '🍑 Брюнетки', slug: 'bryunetki' },
    { title: '👠 Чулки и колготки', slug: 'chulki_i_kolgotki' },
    { title: '👵 Зрелые', slug: 'zrelyee' },
    { title: '👪 Инцесты', slug: 'incesty' },
    { title: '💦 Анал', slug: 'anal' },
    { title: '💎 HD видео', slug: 'hd_video' },
    { title: '🍒 Большие сиськи', slug: 'bolqshie_sisqki' },
    { title: '🍑 Большие задницы', slug: 'bolqshie_zadnicy' },
    { title: '🍆 Большим членом', slug: 'bolqshim_chlenom' },
    { title: '💛 Блондинки', slug: 'blondinki' },
    { title: '🌏 Азиатки', slug: 'aziatki' },
    { title: '🔗 БДСМ', slug: 'bdsm' },
    { title: '👫 Брат с сестрой', slug: 'brat_s_sestroj' },
    { title: '🌸 Армянское', slug: 'armyanskoe' },
    { title: '👥 Групповой секс', slug: 'gruppovoj_seks' },
    { title: '👫 ЖМЖ', slug: 'zhmzh' },
    { title: '👫 МЖМ', slug: 'mzhm' },
    { title: '👥 Толпой', slug: 'tolpoj' },
    { title: '🔀 Двойное проникнов.', slug: 'dvojnoe_proniknovenie' },
    { title: '💕 Лесбиянки', slug: 'lesbiyanki' },
    { title: '👩 Мамки', slug: 'mamki' },
    { title: '👩 Мать и сын', slug: 'matq_i_syn' },
    { title: '👨 Отец и дочь', slug: 'otec_i_dochq' },
    { title: '🌿 Жен. мастурбация', slug: 'zhenskaya_masturbaciya' },
    { title: '🌹 Измена', slug: 'izmena' },
    { title: '🏔️ Кавказ', slug: 'kavkaz' },
    { title: '🌺 Красивое', slug: 'krasivoe' },
    { title: '🔍 Крупный план', slug: 'krupnyj_plan' },
    { title: '👅 Кунилингус', slug: 'kunilingus' },
    { title: '🚶 На улице', slug: 'na_ulice' },
    { title: '🌸 Нежное', slug: 'nezhnoe' },
    { title: '🎭 Кастинг', slug: 'kasting' },
    { title: '🍸 Пьяные', slug: 'pqyanyee' },
    { title: '🦊 Рыжие', slug: 'ryzhie' },
    { title: '⚫ Негры', slug: 'negry' },
    { title: '⚫ Негритянки', slug: 'negrityanki' },
    { title: '💆 Секс массаж', slug: 'seks_massazh' },
    { title: '💍 С женой', slug: 's_zhenoj' },
    { title: '💦 Сквирт', slug: 'skvirt' },
    { title: '🎓 Студенты', slug: 'studenty' },
    { title: '🍩 Толстушки', slug: 'tolstushki' },
    { title: '💃 Трансы', slug: 'transy' },
    { title: '🔥 Жёсткое', slug: 'zhestkoe' },
    { title: '🌿 Худые', slug: 'hudyee' },
    { title: '🇺🇿 Uzbeki', slug: 'uzbeki' },
    { title: '💦 Глотает сперму', slug: 'glotaet_spermu' },
    { title: '👁️ От первого лица', slug: 'ot_pervogo_lica' },
    { title: '⏱️ Короткие ролики', slug: 'korotkie_roliki' },
    { title: '📷 Скрытая камера', slug: 'skrytaya_kamera' },
    { title: '🌸 Бритая киска', slug: 'britaya_kiska' },
    { title: '💧 Кончают внутрь', slug: 'konchayut_vnutrq' },
    { title: '🌊 Мощный оргазм', slug: 'mownyj_orgazm' },
    { title: '🌿 Волосатые вагины', slug: 'volosatyee_vaginy' },
    { title: '🎭 Извращения', slug: 'izvraweniya' },
    { title: '👠 На каблуках', slug: 'na_kablukah' },
    { title: '🍳 Секс на кухне', slug: 'seks_na_kuhne' },
    { title: '🎉 Оргии', slug: 'orgii' },
    { title: '👔 Униформа', slug: 'uniforma' }
  ];

  function networkRequest(url, success, error) {
    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, success, error);
    } else {
      fetch(url).then(r => r.text()).then(success).catch(error);
    }
  }

  function cleanUrl(url) {
    if (!url) return '';
    let u = url.replace(/\\/g, '').trim();
    u = u.replace(/^['"`]+|['"`]+$/g, '');
    if (u.indexOf('//') === 0) u = 'http:' + u;
    if (u.charAt(0) === '/' && u.charAt(1) !== '/') u = HOST + u;
    return u;
  }

  function parseCards(html) {
    let results = [];
    let doc = new DOMParser().parseFromString(html, 'text/html');

    let containers = doc.querySelectorAll('.thumb, .video-item, .item, article.video, .video-block, div.video');
    if (!containers.length) {
      let links = doc.querySelectorAll('a[href*="/video/"]');
      for (let link of links) {
        let href = cleanUrl(link.getAttribute('href'));
        if (!href || !href.includes('/video/')) continue;
        let img = link.querySelector('img');
        let pic = img ? cleanUrl(img.getAttribute('data-src') || img.getAttribute('src')) : '';
        let title = (link.getAttribute('title') || link.textContent || '').replace(/\s+/g, ' ').trim();
        if (!title) title = 'Video';
        results.push({
          name: title,
          video: href,
          picture: pic,
          img: pic,
          poster: pic,
          background_image: pic,
          time: '',
          quality: 'HD',
          json: true,
          source: NAME
        });
      }
      console.log(TAG, 'parseCards fallback links:', results.length);
      return results;
    }

    for (let container of containers) {
      let linkEl = container.querySelector('a[href*="/video/"]');
      if (!linkEl) continue;
      let href = cleanUrl(linkEl.getAttribute('href'));
      if (!href) continue;

      let imgEl = container.querySelector('img');
      let pic = imgEl ? cleanUrl(imgEl.getAttribute('data-src') || imgEl.getAttribute('src')) : '';

      let titleEl = container.querySelector('.title, .name, h2, h3, a[title]');
      let name = titleEl 
        ? (titleEl.getAttribute('title') || titleEl.textContent || '').replace(/\s+/g, ' ').trim()
        : (linkEl.getAttribute('title') || 'Video');

      let durationEl = container.querySelector('.duration, .time, .length, .durs');
      let time = durationEl ? durationEl.textContent.trim() : '';

      results.push({
        name: name,
        video: href,
        picture: pic,
        img: pic,
        poster: pic,
        background_image: pic,
        time: time,
        quality: 'HD',
        json: true,
        source: NAME
      });
    }

    console.log(TAG, 'parseCards found:', results.length);
    return results;
  }

  function parseVideoJs(jsContent) {
    let qualities = {};
    console.log(TAG, 'parseVideoJs content length:', jsContent.length);

    const patterns = [
      { key: 'filehd', label: '720p' },
      { key: 'file2hd', label: '720p' },
      { key: 'file_hd', label: '720p' },
      { key: 'video_alt_url', label: '720p' },
      { key: 'file', label: '480p' },
      { key: 'file2', label: '480p' },
      { key: 'video_url', label: '480p' },
      { key: 'url', label: '1080p' },
      { key: 'original', label: '1080p' }
    ];

    patterns.forEach(p => {
      if (qualities[p.label]) return;
      let regex = new RegExp(p.key + '\\s*[:=]\\s*[\'"`]([^\'"`\\s]+)[\'"`]', 'i');
      let match = jsContent.match(regex);
      if (match && match[1]) {
        let url = cleanUrl(match[1]);
        if (url && !url.includes('{') && (url.includes('.mp4') || url.includes('.m3u8') || url.startsWith('http'))) {
          qualities[p.label] = url;
          console.log(TAG, 'extracted', p.key, '→', p.label, ':', url.substring(0, 80));
        }
      }
    });

    if (Object.keys(qualities).length === 0) {
      let mp4Matches = jsContent.match(/https?:\/\/[^"'\s,;)]+\.mp4[^"'\s,;)]*/gi);
      if (mp4Matches) {
        mp4Matches.forEach((u, index) => {
          if (u.includes('{')) return;
          let qMatch = u.match(/_(\d+)p?\.mp4/i);
          let label = qMatch ? qMatch[1] + 'p' : (index === 0 ? '1080p' : '720p');
          if (!qualities[label]) {
            qualities[label] = cleanUrl(u);
            console.log(TAG, 'mp4 fallback →', label, cleanUrl(u).substring(0, 70));
          }
        });
      }
    }

    return qualities;
  }

  function extractQualities(videoPageUrl, success, error) {
    console.log(TAG, 'extractQualities →', videoPageUrl);

    networkRequest(videoPageUrl, function (html) {
      console.log(TAG, 'video page length:', html.length);

      let jsMatch = html.match(/<script[^>]+src=["']?(\/js\/video[^"'\s>]+?\.js)["']?/i);
      if (jsMatch) {
        let jsUrl = HOST + jsMatch[1];
        console.log(TAG, 'loading video JS:', jsUrl);

        networkRequest(jsUrl, function (jsContent) {
          let qualities = parseVideoJs(jsContent);
          if (Object.keys(qualities).length > 0) {
            console.log(TAG, 'successfully extracted qualities:', Object.keys(qualities).join(', '));
            success({ qualities: qualities });
            return;
          }
          console.warn(TAG, 'no qualities in JS, trying fallback');
          fallbackExtract(html, success, error);
        }, function (e) {
          console.warn(TAG, 'failed to load JS file:', e);
          fallbackExtract(html, success, error);
        });
        return;
      }

      console.warn(TAG, 'video JS not found, using fallback');
      fallbackExtract(html, success, error);
    }, error);
  }

  function fallbackExtract(html, success, error) {
    let qualities = {};

    const patterns = [
      { re: /filehd["']?\s*[:=]\s*["']([^"']+\.mp4[^"']*)/i, label: '720p' },
      { re: /video_alt_url["']?\s*[:=]\s*["']([^"']+\.mp4[^"']*)/i, label: '720p' },
      { re: /file["']?\s*[:=]\s*["']([^"']+\.mp4[^"']*)/i, label: '480p' },
      { re: /video_url["']?\s*[:=]\s*["']([^"']+\.mp4[^"']*)/i, label: '480p' }
    ];

    patterns.forEach(p => {
      if (qualities[p.label]) return;
      let m = html.match(p.re);
      if (m && m[1]) {
        let url = cleanUrl(m[1]);
        if (url && !url.includes('{')) qualities[p.label] = url;
      }
    });

    if (Object.keys(qualities).length === 0) {
      let mp4s = html.match(/https?:\/\/[^"'\s<>()]+\.mp4[^"'\s<>()]*/gi);
      if (mp4s) {
        mp4s.forEach(u => {
          if (u.includes('{')) return;
          let qm = u.match(/_(\d+)p?\.mp4/i);
          let label = qm ? qm[1] + 'p' : '1080p';
          if (!qualities[label]) qualities[label] = cleanUrl(u);
        });
      }
    }

    if (Object.keys(qualities).length > 0) {
      console.log(TAG, 'fallback extracted:', Object.keys(qualities).join(', '));
      success({ qualities: qualities });
    } else {
      error('Видео ссылки не найдены');
    }
  }

  function buildMenu() {
    return [
      { title: '🔍 Поиск', search_on: true, playlist_url: NAME + '/search/' },
      { title: '🆕 Новинки', playlist_url: NAME + '/main' },
      {
        title: '📂 Категории',
        playlist_url: 'submenu',
        submenu: CATEGORIES.map(cat => ({
          title: cat.title,
          playlist_url: NAME + '/cat/' + cat.slug
        }))
      }
    ];
  }

  function buildUrl(type, value, page) {
    page = parseInt(page, 10) || 1;
    let url = HOST;
    if (type === 'search') {
      url += '/?search=' + encodeURIComponent(value);
      if (page > 1) url += '&page=' + page;
    } else if (type === 'cat') {
      url += '/category/' + value;
      if (page > 1) url += '?page=' + page;
    } else {
      url += '/top';
      if (page > 1) url += '?page=' + page;
    }
    return url;
  }

  function routeCatalog(url, page, success, error) {
    let fetchUrl;
    let searchMatch = url.match(/[?&]search=([^&]+)/);
    if (searchMatch) {
      fetchUrl = buildUrl('search', decodeURIComponent(searchMatch[1]), page);
    } else if (url.indexOf(NAME + '/cat/') === 0) {
      let slug = url.replace(NAME + '/cat/', '').split('?')[0];
      fetchUrl = buildUrl('cat', slug, page);
    } else if (url.indexOf(NAME + '/search/') === 0) {
      let q = decodeURIComponent(url.replace(NAME + '/search/', '').split('?')[0]).trim();
      fetchUrl = buildUrl('search', q, page);
    } else {
      fetchUrl = buildUrl('main', null, page);
    }

    console.log(TAG, 'loading catalog →', fetchUrl);
    networkRequest(fetchUrl, function (html) {
      let cards = parseCards(html);
      if (cards.length === 0) {
        error('Карточки не найдены');
        return;
      }
      success({
        results: cards,
        collection: true,
        total_pages: page + 2,
        menu: buildMenu()
      });
    }, error);
  }

  var OstrParser = {
    main: function (params, success, error) {
      routeCatalog('main', 1, success, error);
    },
    view: function (params, success, error) {
      if (params.url && params.url.includes('/video/')) {
        extractQualities(params.url, success, error);
      } else {
        routeCatalog(params.url || 'main', params.page || 1, success, error);
      }
    },
    search: function (params, success, error) {
      let query = (params.query || '').trim();
      if (!query) return error('Пустой запрос');
      networkRequest(buildUrl('search', query, 1), function (html) {
        let cards = parseCards(html);
        success({
          title: 'OstroePorno: ' + query,
          results: cards,
          collection: true,
          total_pages: 3
        });
      }, error);
    },
    qualities: function (videoPageUrl, success, error) {
      extractQualities(videoPageUrl, success, error);
    }
  };

  function register() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, OstrParser);
      console.log(TAG, 'v' + VERSION + ' успешно зарегистрирован в Adult ядре');
      return true;
    }
    return false;
  }

  if (!register()) {
    let interval = setInterval(() => {
      if (register()) clearInterval(interval);
    }, 350);
    setTimeout(() => clearInterval(interval), 10000);
  }
})();
