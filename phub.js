// =============================================================
// phub.js — Парсер PornHub для AdultJS (Lampa)
// Version  : 2.1.0
// [MOD] Адаптирован под универсальный движок экстракции
// [FIX] Исправлено воспроизведение (глубокая очистка ссылок)
// =============================================================

(function () {
  'use strict';

  var NAME = 'phub';
  var HOST = 'https://rt.pornhub.com';

  var SORTS = [
    { title: 'Горячие', val: 'ht' },
    { title: 'Популярные', val: 'mv' },
    { title: 'Лучшие', val: 'tr' },
    { title: 'Новые', val: 'cm' }
  ];

  var CATS = [
    { title: 'Зрелые', val: '28' },
    { title: 'Мамочки', val: '29' },
    { title: 'Анальный секс', val: '35' },
    { title: 'Лесбиянки', val: '27' },
    { title: 'Секс втроем', val: '65' },
    { title: 'Мулаты', val: '17' },
    { title: 'Японцы', val: '111' },
    { title: 'Хентай', val: 'hentai' },
    { title: 'БДСМ', val: '10' },
    { title: 'Кремпай', val: '15' }
  ];

  // ===========================================================
  // УНИВЕРСАЛЬНЫЙ ДВИЖОК ОЧИСТКИ И ЭКСТРАКЦИИ
  // ===========================================================

  var VIDEO_CONFIG = {
    // Правила для PornHub сложнее, так как данные часто зашиты в JSON flashvars
    rules: [
      { label: 'HLS', re: /["'](https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)["']/ },
      { label: 'MP4', re: /["'](https?:\/\/[^"'\s]+\.mp4[^"'\s]*)["']/ }
    ],
    // Резервный поиск для PH (поиск по CDN домену)
    fallback: /https?:\/\/[^"'\s]+phncdn[^"'\s]+\.(mp4|m3u8)[^"'\s]*/g
  };

  /**
   * Универсальная очистка URL (Критично для ТВ-плееров)
   */
  function cleanUrl(url) {
    if (!url) return '';
    
    // 1. Убираем экранирование слешей (бывает в JSON: https:\/\/...)
    var clean = url.replace(/\\/g, '');
    
    // 2. Убираем лишние кавычки, если они попали из regex
    clean = clean.replace(/["']/g, '');

    // 3. Добавляем протокол
    if (clean.indexOf('//') === 0) clean = 'https:' + clean;
    
    // 4. Добавляем хост для относительных путей
    if (clean.indexOf('/') === 0 && clean.indexOf('//') !== 0) clean = HOST + clean;

    return clean;
  }

  /**
   * Модуль извлечения качеств (специфичный для PH + универсальный)
   */
  function extractQualities(html) {
    var q = {};

    // 1. Специфика PH: Поиск JSON конфигурации (flashvars)
    var flashvarsMatch = html.match(/flashvars_\d+\s*=\s*({.+?});/);
    if (flashvarsMatch) {
      try {
        var data = JSON.parse(flashvarsMatch[1]);
        if (data.mediaDefinitions) {
          data.mediaDefinitions.forEach(function(m) {
            if (m.videoUrl && m.remote) {
              var label = m.quality + 'p';
              q[label] = cleanUrl(m.videoUrl);
            }
          });
        }
      } catch(e) {
        console.warn('[PHUB] Flashvars JSON parse error');
      }
    }

    // 2. Универсальный поиск (если JSON не найден или пуст)
    if (Object.keys(q).length === 0) {
      VIDEO_CONFIG.rules.forEach(function(rule) {
        var m = html.match(rule.re);
        if (m && m[1]) q[rule.label] = cleanUrl(m[1]);
      });
    }

    // 3. Крайний случай (Fallback)
    if (Object.keys(q).length === 0) {
      var any = html.match(VIDEO_CONFIG.fallback);
      if (any) {
        any.forEach(function(url, i) {
          q['Link ' + (i + 1)] = cleanUrl(url);
        });
      }
    }

    return q;
  }

  // ===========================================================
  // СЕТЕВЫЕ ЗАПРОСЫ И ПАРСИНГ КАТАЛОГА
  // ===========================================================

  function httpGet(url, success, error) {
    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, success, error);
    } else {
      error('AdultPlugin.networkRequest not found');
    }
  }

  function parseCards(html) {
    if (!html) return [];
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var results = [];
    var items = doc.querySelectorAll('.video, li.videoblock, li.pcVideoListItem');
    
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      var a = el.querySelector('a[href*="/view_video"], a[href*="/video/show"]');
      if (!a) continue;

      var href = a.getAttribute('href');
      if (href.indexOf('http') !== 0) href = HOST + href;

      var img = el.querySelector('img');
      var pic = '';
      if (img) {
        pic = img.getAttribute('data-mediumthumb') || img.getAttribute('data-thumb_url') || img.getAttribute('src') || '';
        pic = cleanUrl(pic);
      }

      var title = el.querySelector('strong, .title, img[alt]');
      var name = title ? (title.textContent || title.getAttribute('alt') || '').trim() : 'Video';
      
      var dur = el.querySelector('.duration, var.duration');
      var time = dur ? dur.textContent.trim() : '';

      results.push({
        name: name,
        video: href,
        picture: pic,
        img: pic,
        poster: pic,
        background_image: pic,
        time: time,
        quality: el.querySelector('.hd-thumbnail, .hd-badge') ? 'HD' : '',
        json: true,
        source: NAME
      });
    }
    returnВ данный момент модель gemini-3-flash-preview перегружена или недоступна (503), попробуйте позже или смените модель.
