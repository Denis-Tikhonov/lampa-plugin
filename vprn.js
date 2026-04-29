// Version: 1.0.0
// Автор: AI Chat

(function () {
  'use strict';

  const VERSION = '1.0.0';

  const TAG = '[VPRN]';

  // Конфиг сайта (vprn.json)
  const CONFIG = {
    HOST: "https://www.winporn.com",
    NAME: "winpo",
    SITE_NAME: "winporn.com",
    VIDEO_PAGE: {
      strategies: [
        {
          "priority": 0,
          "method": "mp4-brute"
        }
      ]
    },
    JSON_ENCODINGS: [],
    VIDEO_URL_TEMPLATES: [
      {
        "template": "https://g5.wppsn.com/media/videos/tmb/{id}/353791.mp4",
        "domain": "g5.wppsn.com",
        "variables": ["{id}"]
      },
      {
        "template": "https://g5.wppsn.com/media/videos/tmb/{id}/404053.mp4",
        "domain": "g5.wppsn.com",
        "variables": ["{id}"]
      },
      {
        "template": "https://g5.wppsn.com/media/videos/tmb/{id}/391369.mp4",
        "domain": "g5.wppsn.com",
        "variables": ["{id}"]
      }
    ],
    "debugReport": {
      "source_tag": 0,
      "og_video": 0,
      "mp4": 19,
      "m3u8": 0,
      "video_url": 0,
      "flowplayer": 0,
      "html5player": 0,
      "dataEncodings": 0,
      "get_file": 0,
      "kt_player": 0,
      "function_0": 0,
      "Plyr": 0,
      "Flashvars": 0,
      "JSON_LD": 0
    }
  };

  // Стратегия парсинга
  function parseVideo(html) {
    const result = { qualities: {}, checked: [] };

    // 1. Метаданные og:video
    const ogMatch = html.match(/<meta[^>]+property="og:video"[^>]+content="([^"]+\.mp4[^"]*)"/i);
    if (ogMatch && ogMatch[1]) {
      result.qualities['HD'] = ogMatch[1];
      result.checked.push({ s: 3, name: 'og:video', found: true, detail: '1 match' });
    } else {
      result.checked.push({ s: 3, name: 'og:video', found: false, detail: 'none' });
    }

    // 2. JSON-LD schema
    const jsonldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonldMatch && jsonldMatch[1]) {
      try {
        const ld = JSON.parse(jsonldMatch[1]);
        if (ld.video && ld.video.contentUrl) {
          result.qualities['HD'] = ld.video.contentUrl;
          result.checked.push({ s: 4, name: 'JSON-LD', found: true, detail: 'video.contentUrl' });
        } else {
          result.checked.push({ s: 4, name: 'JSON-LD', found: false, detail: 'no video.contentUrl' });
        }
      } catch (e) {
        result.checked.push({ s: 4, name: 'JSON-LD', found: false, detail: 'json parse error' });
      }
    } else {
      result.checked.push({ s: 4, name: 'JSON-LD', found: false, detail: 'none' });
    }

    // 3. Используем URL-шаблоны
    if (Object.keys(result.qualities).length === 0) {
      // Тут можно расширять под шаблоны, но для минимализма — пропускаем
      result.checked.push({ s: 5, name: 'URL templates', found: false, detail: 'none' });
    } else {
      result.checked.push({ s: 5, name: 'URL templates', found: true, detail: 'used' });
    }

    // 4. Детальный отчет
    if (CONFIG.debugReport) {
      console.log('─'.repeat(60));
      console.log('%c' + '=== DEBUG REPORT ===', 'color:#44aaff;font-weight:bold');
      console.log('URL: ' + (html.url || ''));
      console.log('HTML size: ' + html.length + ' bytes');
      Object.keys(result.checked).forEach(k => {
        const item = result.checked[k];
        const color = item.found ? 'color:#44ff44' : 'color:#888';
        console.log('%c' + item.name + ': ' + item.detail, color);
      });
      console.log('─'.repeat(60));
    }

    return result;
  }

  // API для системы
  const MyParser = {
    name: 'winpo',
    version: '1.0.0',
    main: function (params, success, error) {
      const url = params.url;
      // Получение HTML страницы
      fetch(url).then(r => r.text()).then(html => {
        const data = parseVideo(html);
        if (Object.keys(data.qualities).length === 0) {
          error('Видео не найдено');
        } else {
          success({ qualities: data.qualities });
        }
      }).catch(e => {
        error('Ошибка парсинга: ' + e.message);
      });
    },

    view: function (params, success, error) {
      // Аналогично главному
      this.main(params, success, error);
    },

    search: function (params, success, error) {
      // Для простоты — ищем по URL шаблона
      this.main(params, success, error);
    },

    qualities: function (videoUrl, success, error) {
      // Предварительно можно делать отдельный запрос или использовать кеш
      // Но для минимализма — просто вызываем main
      fetch(videoUrl).then(r => r.text()).then(html => {
        const data = parseVideo(html);
        if (Object.keys(data.qualities).length === 0) {
          error('Качество не найдено');
        } else {
          success({ qualities: data.qualities });
        }
      }).catch(e => error('Ошибка: ' + e.message));
    },
  };

  // Регистрация
  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser('winpo', MyParser);
      console.log(TAG, 'v' + VERSION + ' зарегистрирован');
      return true;
    }
    return false;
  }

  if (!tryRegister()) {
    const poll = setInterval(() => {
      if (tryRegister()) clearInterval(poll);
    }, 200);
  }

})();
