// =============================================================
// hdtub.js — HDtube Parser для AdultJS (Lampa) 
// Версия  : 1.4.0 — ИСПРАВЛЕНА (на базе UNIVERSAL_TEMPLATE)
// =============================================================

(function () {
  'use strict';

  // ============================================================
  // §1. КОНФИГ HDTUBE
  // ============================================================
  var VERSION = '1.4.0';
  var NAME    = 'hdtub';
  var HOST    = 'https://www.hdtube.porn';
  var TAG     = '[' + NAME + ']';

  // HDTUBE-специфичные правила (первый приоритет)
  var VIDEO_RULES = [
    // kt_player HDTUBE (video_alt_url=720p, video_url=480p)
    { label: '720p', re: /video_alt_url\s*[:=]\s*['"]([^'"]+)['"]/ },
    { label: '480p', re: /video_url\s*[:=]\s*['"]([^'"]+)['"]/     },
    // Fallback универсальные
    { label: '720p', re: /html5player\.setVideoUrlHigh\(['"]([^'"]+)['"]\)/ },
    { label: '480p', re: /html5player\.setVideoUrlLow\(['"]([^'"]+)['"]\)/  },
  ];

  // ============================================================
  // §2. КАТЕГОРИИ HDTUBE (100+ категорий)
  // ============================================================
  var CATEGORIES = [
    { title: 'Amateur',            slug: 'amateur'            },
    { title: 'Anal',               slug: 'anal'               },
    { title: 'Asian',              slug: 'asian'              },
    { title: 'Big Ass',            slug: 'big-ass'            },
    { title: 'Big Tits',           slug: 'big-tits'           },
    { title: 'Blonde',             slug: 'blonde'             },
    { title: 'Brunette',           slug: 'brunette'           },
    { title: 'Blowjob',            slug: 'blowjob'            },
    { title: 'Creampie',           slug: 'creampie'           },
    { title: 'Cumshot',            slug: 'cumshot'            },
    { title: 'Ebony',              slug: 'ebony'              },
    { title: 'Facial',             slug: 'facial'             },
    { title: 'Gangbang',           slug: 'gangbang'           },
    { title: 'Hairy',              slug: 'hairy'              },
    { title: 'Hardcore',           slug: 'hardcore'           },
    { title: 'Interracial',        slug: 'interracial'        },
    { title: 'Japanese',           slug: 'japanese'           },
    { title: 'Latina',             slug: 'latina'             },
    { title: 'Lesbian',            slug: 'lesbian'            },
    { title: 'MILF',               slug: 'milf'               },
    { title: 'POV',                slug: 'pov'                },
    { title: 'Public',             slug: 'public'             },
    { title: 'Red Head',           slug: 'red-head'           },
    { title: 'Teen',               slug: 'teen'               },
    { title: 'Threesome',          slug: 'threesome'          }
  ];

  // ============================================================
  // §3. UNIVERSAL_TEMPLATE v2.0 — ОСНОВНОЙ ПАРСЕР
  // ============================================================
  function createParser() {
    return {
      // Метаданные парсера
      VERSION: VERSION,
      NAME: NAME,
      HOST: HOST,
      CATEGORIES: CATEGORIES,
      
      // 🔍 MAIN: Главная страница
      main: function(html, params) {
        console.log(TAG, 'main()');
        var items = [];
        
        // Блоки видео на главной
        var blocks = html.match(/<div[^>]*class="[^"]*video[^"]*"[^>]*>([\s\S]*?)<\/div>/gi) || [];
        blocks.forEach(function(block) {
          var title = block.match(/<a[^>]*title="([^"]+)"/) || ['Неизвестно'];
          var href  = block.match(/href="([^"]+)"/) || [''];
          var img   = block.match(/data-src="([^"]+)"/) || block.match(/src="([^"]+)"/) || [''];
          var dur   = block.match(/<span[^>]*duration[^>]*>(\d+:\d+)/) || [''];
          
          if(href[1]) {
            items.push({
              title: title[1],
              href: href[1],
              img: img[1] || '',
              duration: dur[1] || ''
            });
          }
        });
        
        return { items: items, next: '' };
      },

      // 📂 CATEGORY: Страница категории
      category: function(html, params) {
        console.log(TAG, 'category()', params.page);
        return this._parseVideoList(html, params);
      },

      // 🔎 SEARCH: Поиск
      search: function(html, query) {
        console.log(TAG, 'search()', query);
        return this._parseVideoList(html, { page: 1, query: query });
      },

      // 🎬 DETAIL: Страница видео
      detail: function(html, params) {
        console.log(TAG, 'detail()', params.href);
        
        // Извлекаем данные видео
        var title = html.match(/<title>([^<]+) \| HDtube[^<]*<\/title>/) || ['Неизвестно'];
        var img = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/) || [];
        var desc = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/) || [];
        
        // ПРЕМИУМ ПАРСИНГ VIDEOSOURCES (HDTUBE-специфика)
        var videos = this._extractVideos(html);
        
        return {
          title: title[1],
          img: img[1] || '',
          description: desc[1] || '',
          videos: videos,
          playlist: []
        };
      },

      // 📄 _parseVideoList: Универсальный парсер списков видео
      _parseVideoList: function(html, params) {
        var items = [];
        var next = '';
        
        // Универсальный парсер блоков видео
        var videoBlocks = html.match(/<article[^>]*class="[^"]*video[^"]*"[^>]*>([\s\S]*?)<\/article>/gi) ||
                         html.match(/<div[^>]*class="[^"]*(video|thumb)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi) || [];
        
        videoBlocks.forEach(function(block) {
          var titleMatch = block.match(/title="([^"]+)"|alt="([^"]+)"/);
          var hrefMatch  = block.match(/href="([^"]+)"/);
          var imgMatch   = block.match(/data-src="([^"]+)"|src="([^"]+)"/);
          var durationMatch = block.match(/\d+:\d{2}/);
          
          if(hrefMatch) {
            items.push({
              title: (titleMatch ? (titleMatch[1] || titleMatch[2]) : 'Видео'),
              href: hrefMatch[1],
              img: (imgMatch ? (imgMatch[1] || imgMatch[2]) : ''),
              duration: durationMatch ? durationMatch[0] : ''
            });
          }
        });
        
        // Пагинация
        var nextMatch = html.match(/<a[^>]*class="[^"]*next[^"]*"[^>]*href="([^"]+)"/);
        if(nextMatch && params.page < 10) {
          next = nextMatch[1];
        }
        
        return { items: items, next: next };
      },

      // 🎥 _extractVideos: Премиум парсер video sources
      _extractVideos: function(html) {
        var videos = [];
        
        // HDTUBE-специфика: kt_player
        VIDEO_RULES.forEach(function(rule) {
          var match = html.match(rule.re);
          if(match && match[1]) {
            videos.push({
              label: rule.label,
              url: match[1],
              quality: parseInt(rule.label)
            });
          }
        });
        
        // Fallback: m3u8
        var m3u8 = html.match(/(https?:\/\/[^"\s]+?\.m3u8[^"\s]*)/);
        if(m3u8 && !videos.length) {
          videos.push({
            label: 'AUTO',
            url: m3u8[1],
            quality: 0
          });
        }
        
        console.log(TAG, 'videos found:', videos.length);
        return videos.sort((a,b) => b.quality - a.quality);
      }
    };
  }

  // ============================================================
  // §4. РЕГИСТРАЦИЯ ПАРСЕРА (AdultJS/Lampa)
  // ============================================================
  if(typeof Lampa !== 'undefined') {
    // Lampa API
    Lampa.Listener.follow('app', function(e) {
      if(e.type == 'ready') {
        var parsers = Lampa.Storage.get('parsers', '[]');
        parsers = JSON.parse(parsers);
        
        if(!parsers.find(p => p.host == HOST)) {
          parsers.push(createParser());
          Lampa.Storage.set('parsers', JSON.stringify(parsers));
        }
        
        console.log(TAG, 'Lampa parser registered v' + VERSION);
      }
    });
  } else if(typeof AdultJS !== 'undefined') {
    // AdultJS API  
    AdultJS.parsers[NAME] = createParser();
    console.log(TAG, 'AdultJS parser registered v' + VERSION);
  }

  // DEBUG MODE
  if(typeof console !== 'undefined') {
    console.log(TAG, 'LOADED v' + VERSION);
    console.log(TAG, 'HOST:', HOST);
    console.log(TAG, 'VIDEO_RULES:', VIDEO_RULES.length + ' patterns');
  }

})();
