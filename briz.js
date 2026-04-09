/**
 * Парсер для pornobriz.com
 * Тип сайта: Статический HTML (Type A)
 * Сложность: Элементарная
 * Дата анализа: 2026-04-09
 */

(function (api) {
  const plugin = {
    name: 'pornobriz',
    version: '1.0.0',
    nicename: 'Pornobriz',
    icon: 'https://pornobriz.com/img/logo.png',
    baseUrl: 'https://pornobriz.com',
    
    // ============================================
    // КОНФИГ СЕЛЕКТОРОВ
    // ============================================
    config: {
      // Основные селекторы для карточек видео
      selectors: {
        // Контейнер карточки видео
        card: 'div.item, div.video-item, article[data-id], div[class*="thumb"]',
        
        // Заголовок видео
        title: [
          'a[href*="/video/"] h2',
          'a[href*="/video/"] .title',
          'a[href*="/video/"]',
          '.item-title',
          'h3.video-title'
        ],
        
        // Ссылка на видео
        link: 'a[href*="/video/"]',
        
        // Миниатюра
        thumbnail: [
          'img[src*="/content/screen/"]',
          'img[data-src*="/content/screen/"]',
          'img.video-thumb',
          'img'
        ],
        
        // Длительность
        duration: [
          'span.duration',
          '.video-duration',
          'span[class*="duration"]',
          'span:contains(":")'
        ],
        
        // Качество
        quality: [
          'span.quality',
          'span[class*="quality"]',
          'span[class*="hd"]',
          '.video-quality'
        ]
      },
      
      // Атрибуты
      attributes: {
        linkAttr: 'href',
        thumbnailAttr: 'src',
        thumbnailDataAttr: 'data-src'
      },
      
      // URL паттерны
      patterns: {
        videoUrl: /\/video\/[a-z0-9_-]+\//,
        screenshotUrl: /\/content\/screen\/\d+\/\d+_\d+\.jpg/,
        previewUrl: /\/preview\/[a-z0-9_-]+\.mp4/
      },
      
      // Пагинация (отсутствует)
      pagination: {
        enabled: false,
        pattern: null
      },
      
      // Timeout для запросов
      timeout: 15000,
      
      // User-Agent
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },

    // ============================================
    // КАТЕГОРИИ И СОРТИРОВКА
    // ============================================
    categories: [
      { name: 'Главная', url: '/'},
      { name: 'Рейтинговое', url: '/top/' },
      { name: 'Азиатки', url: '/asian/' },
      { name: 'Анальный секс', url: '/anal/' },
      { name: 'БДСМ', url: '/bdsm/' },
      { name: 'Блондинки', url: '/blonde/' },
      { name: 'Большая жопа', url: '/big_ass/' },
      { name: 'Большие сиськи', url: '/big_tits/' },
      { name: 'Большой член', url: '/big_dick/' },
      { name: 'Бритая киска', url: '/shaved/' },
      { name: 'Брюнетки', url: '/brunette/' },
      { name: 'В одежде', url: '/clothes/' },
      { name: 'Волосатые киски', url: '/hairy/' },
      { name: 'Глотают сперму', url: '/swallow/' },
      { name: 'Глубокая глотка', url: '/deepthroat/' },
      { name: 'Групповой секс', url: '/group/' },
      { name: 'Двойное проникновение', url: '/double_penetration/' },
      { name: 'Длинноволосые девушки', url: '/long_hair/' },
      { name: 'Дрочат', url: '/wanking/' },
      { name: 'Жесткий секс', url: '/hardcore/' },
      { name: 'ЖМЖ порно', url: '/ffm/' },
      { name: 'Игрушки', url: '/toys/' },
      { name: 'Казашки', url: '/kazakh/' },
      { name: 'Камшот', url: '/cumshot/' },
      { name: 'Кончают в рот', url: '/cum_in_mouth/' },
      { name: 'Красивая задница', url: '/perfect_ass/' },
      { name: 'Красивое белье', url: '/lingerie/' },
      { name: 'Красивые девушки', url: '/beautiful/' },
      { name: 'Красивые сиськи', url: '/beautiful_tits/' },
      { name: 'Крупным планом', url: '/close_up/' },
      { name: 'Кунилингус', url: '/pussy_licking/' },
      { name: 'Лесбиянки', url: '/lesbian/' },
      { name: 'Любительское порно', url: '/amateur/' },
      { name: 'Маленькие девушки', url: '/petite/' },
      { name: 'Маленькие сиськи', url: '/small_tits/' },
      { name: 'Мамочки', url: '/milf/' },
      { name: 'Мастурбация', url: '/masturbation/' },
      { name: 'Межрасовое', url: '/interracial/' },
      { name: 'МЖМ порно', url: '/mfm/' },
      { name: 'Милашки', url: '/cute/' },
      { name: 'Минет', url: '/blowjob/' },
      { name: 'Молодые', url: '/seks-molodye/' },
      { name: 'На природе', url: '/outdoor/' },
      { name: 'На публике', url: '/public/' },
      { name: 'Наездницы', url: '/riding/' },
      { name: 'Негритянки', url: '/ebony/' },
      { name: 'Оргазм', url: '/orgasm/' },
      { name: 'От первого лица', url: '/pov/' },
      { name: 'Писают', url: '/peeing/' },
      { name: 'Поцелуи', url: '/kissing/' },
      { name: 'Рвотные позывы', url: '/gagging/' },
      { name: 'Реальный секс', url: '/reality/' }
    ],

    // ============================================
    // ОСНОВНЫЕ МЕТОДЫ
    // ============================================

    /**
     * Инициализация плагина
     */
    init: function () {
      const self = this;
      console.log('[Pornobriz] Plugin initialized');
      
      // Регистрация категорий
      this.categories.forEach(cat => {
        api.catalog.addCategory(this, {
          name: cat.name,
          url: this.baseUrl + cat.url
        });
      });
    },

    /**
     * Получение списка видео со страницы каталога
     */
    getItems: function (page, onSuccess, onError) {
      const self = this;
      const url = typeof page === 'string' ? page : this.baseUrl;

      console.log('[Pornobriz] getItems - Loading URL:', url);

      // Используем встроенный HTTP клиент Lampa
      api.http.get(url, {
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9'
        },
        timeout: this.config.timeout,
        crossDomain: true
      }, function (html) {
        try {
          const items = self._parseListPage(html);
          console.log('[Pornobriz] Found items:', items.length);
          onSuccess(items);
        } catch (error) {
          console.error('[Pornobriz] Parse error:', error);
          onError(error);
        }
      }, function (error) {
        console.error('[Pornobriz] HTTP error:', error);
        onError(error);
      });
    },

    /**
     * Парсинг списка видео из HTML
     */
    _parseListPage: function (html) {
      const items = [];
      
      try {
        // Используем jQuery для парсинга (встроена в Lampa)
        const $ = api.jquery;
        const $html = $(html);

        // Попытка 1: Поиск по основному селектору
        let $cards = $html.find(this.config.selectors.card);
        
        // Попытка 2: Если ничего не найдено, ищем все a с /video/
        if ($cards.length === 0) {
          $cards = $html.find('a[href*="/video/"]').closest('div').filter(function() {
            return $(this).find('img').length > 0;
          });
        }

        // Попытка 3: Самый общий поиск
        if ($cards.length === 0) {
          $cards = $html.find('div').has('a[href*="/video/"]').has('img');
        }

        console.log('[Pornobriz] Cards found:', $cards.length);

        $cards.each(function (index) {
          const $card = $(this);
          
          try {
            const item = {};

            // Получаем ссылку на видео
            let $link = $card.find(self.config.selectors.link).first();
            if (!$link.length && !$link.attr('href')) {
              $link = $card.find('a[href*="/video/"]').first();
            }
            
            if ($link.length && $link.attr('href')) {
              item.url = self._resolveUrl($link.attr('href'));
            } else {
              return; // Пропускаем если нет ссылки
            }

            // Получаем название
            let title = null;
            for (let selector of self.config.selectors.title) {
              const $title = $card.find(selector);
              if ($title.length) {
                title = $title.attr('title') || $title.text();
                if (title) break;
              }
            }
            item.title = title || 'Unknown';

            // Получаем миниатюру
            let thumbnail = null;
            for (let selector of self.config.selectors.thumbnail) {
              const $img = $card.find(selector);
              if ($img.length) {
                // Проверяем src сначала, потом data-src
                thumbnail = $img.attr('src') || $img.attr('data-src');
                if (thumbnail) break;
              }
            }
            if (thumbnail) {
              item.poster = self._resolveUrl(thumbnail);
            }

            // Получаем длительность
            for (let selector of self.config.selectors.duration) {
              const $dur = $card.find(selector);
              if ($dur.length) {
                item.duration = $dur.text().trim();
                if (item.duration) break;
              }
            }

            // Получаем качество
            for (let selector of self.config.selectors.quality) {
              const $qual = $card.find(selector);
              if ($qual.length) {
                item.quality = $qual.text().trim();
                if (item.quality) break;
              }
            }

            if (item.url && item.title) {
              items.push(item);
            }
          } catch (e) {
            console.warn('[Pornobriz] Error parsing card:', e);
          }
        });

      } catch (error) {
        console.error('[Pornobriz] Parse list error:', error);
        throw error;
      }

      return items;
    },

    /**
     * Получение информации о видео и источников
     */
    getStream: function (data, onSuccess, onError) {
      const self = this;
      const videoUrl = data.url || data;

      console.log('[Pornobriz] getStream - Loading:', videoUrl);

      api.http.get(videoUrl, {
        headers: {
          'User-Agent': this.config.userAgent,
          'Referer': this.baseUrl + '/'
        },
        timeout: this.config.timeout,
        crossDomain: true
      }, function (html) {
        try {
          const sources = self._parseVideoPage(html, videoUrl);
          console.log('[Pornobriz] Sources found:', sources.length);
          
          if (sources.length > 0) {
            onSuccess({ url: sources[0].url });
          } else {
            onError('No video sources found');
          }
        } catch (error) {
          console.error('[Pornobriz] Stream parse error:', error);
          onError(error);
        }
      }, function (error) {
        console.error('[Pornobriz] Stream HTTP error:', error);
        onError(error);
      });
    },

    /**
     * Парсинг видео-страницы
     */
    _parseVideoPage: function (html, videoUrl) {
      const sources = [];
      const $ = api.jquery;
      const $html = $(html);

      try {
        // Способ 1: Поиск в тегах video/source
        const $videoSources = $html.find('video source[src*=".mp4"], video source[src*="preview"]');
        if ($videoSources.length > 0) {
          $videoSources.each(function () {
            const url = $(this).attr('src');
            if (url) {
              sources.push({
                url: this._resolveUrl(url),
                quality: $(this).attr('res') || '720p',
                type: 'mp4'
              });
            }
          });
        }

        // Способ 2: Поиск в iframe
        const $iframes = $html.find('iframe[src*="pornobriz"], iframe[src*="preview"]');
        if ($iframes.length > 0) {
          $iframes.each(function () {
            const iframeSrc = $(this).attr('src');
            if (iframeSrc) {
              sources.push({
                url: this._resolveUrl(iframeSrc),
                quality: '720p',
                type: 'embed'
              });
            }
          });
        }

        // Способ 3: Поиск по регулярному выражению в HTML
        const videoMatch = html.match(/https?:\/\/[^"\s<>]*preview[^"\s<>]*\.mp4/gi);
        if (videoMatch) {
          videoMatch.forEach(url => {
            if (!sources.find(s => s.url === url)) {
              sources.push({
                url: url,
                quality: '720p',
                type: 'mp4'
              });
            }
          });
        }

        // Способ 4: Поиск в JavaScript переменных
        const jsMatch = html.match(/['"]url['"]?\s*:\s*['"]([^'"]*\.mp4)/gi);
        if (jsMatch) {
          jsMatch.forEach(match => {
            const url = match.split(':')[1].replace(/['"]/g, '').trim();
            if (url && !sources.find(s => s.url === url)) {
              sources.push({
                url: this._resolveUrl(url),
                quality: '720p',
                type: 'mp4'
              });
            }
          });
        }

        // Если ничего не найдено, генерируем URL по паттерну
        if (sources.length === 0) {
          const titleMatch = videoUrl.match(/\/video\/([a-z0-9_-]+)\/?/);
          if (titleMatch) {
            const preview = '/preview/' + titleMatch[1] + '.mp4';
            sources.push({
              url: this.baseUrl + preview,
              quality: '720p',
              type: 'mp4'
            });
          }
        }

      } catch (error) {
        console.error('[Pornobriz] Video parse error:', error);
      }

      return sources;
    },

    /**
     * Вспомогательный метод - разрешение URL
     */
    _resolveUrl: function (url) {
      if (!url) return null;
      
      // Если уже полный URL
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      
      // Если начинается с //
      if (url.startsWith('//')) {
        return 'https:' + url;
      }
      
      // Если относительный URL
      if (url.startsWith('/')) {
        return this.baseUrl + url;
      }
      
      // Остальное - относительный путь
      return this.baseUrl + '/' + url;
    },

    /**
     * Поиск (не поддерживается сайтом)
     */
    search: function (query, onSuccess, onError) {
      console.log('[Pornobriz] Search not supported');
      onError('Search is not supported');
    }
  };

  // Регистрируем плагин в Lampa
  api.plugins.register(plugin);

})(typeof api !== 'undefined' ? api : window);
