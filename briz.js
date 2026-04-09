/**
 * Pornobriz.js - Парсер для AdultJS плагина Lampa
 * Совместим с AdultJS v1.2.0+
 * Поддержка Android TV 5.0+
 */

(function () {
    'use strict';

    // ============================================
    // ОБЪЕКТ ПАРСЕРА
    // ============================================
    
    var PornoBrizParser = {
        
        // === ОСНОВНАЯ ИНФОРМАЦИЯ ===
        name: 'pornobriz',
        title: 'Pornobriz',
        description: 'Парсер для pornobriz.com',
        icon: 'https://pornobriz.com/favicon.ico',
        author: 'Your Name',
        version: '1.0.0',
        
        // === КОНФИГУРАЦИЯ ===
        baseUrl: 'https://pornobriz.com',
        timeout: 15000,
        
        // === МЕНЮ КАТЕГОРИЙ ===
        categories: [
            { title: 'Главная',              url: 'https://pornobriz.com/' },
            { title: 'Рейтинговое',         url: 'https://pornobriz.com/top/' },
            { title: 'Азиатки',             url: 'https://pornobriz.com/asian/' },
            { title: 'Анальный секс',       url: 'https://pornobriz.com/anal/' },
            { title: 'БДСМ',                url: 'https://pornobriz.com/bdsm/' },
            { title: 'Блондинки',           url: 'https://pornobriz.com/blonde/' },
            { title: 'Большая жопа',        url: 'https://pornobriz.com/big_ass/' },
            { title: 'Большие сиськи',      url: 'https://pornobriz.com/big_tits/' },
            { title: 'Бритая киска',        url: 'https://pornobriz.com/shaved/' },
            { title: 'Брюнетки',            url: 'https://pornobriz.com/brunette/' },
            { title: 'Глотают сперму',      url: 'https://pornobriz.com/swallow/' },
            { title: 'Глубокая глотка',     url: 'https://pornobriz.com/deepthroat/' },
            { title: 'Групповой секс',      url: 'https://pornobriz.com/group/' },
            { title: 'Жесткий секс',        url: 'https://pornobriz.com/hardcore/' },
            { title: 'Лесбиянки',           url: 'https://pornobriz.com/lesbian/' },
            { title: 'Любительское',        url: 'https://pornobriz.com/amateur/' },
            { title: 'Милфы',               url: 'https://pornobriz.com/milf/' },
            { title: 'Минет',               url: 'https://pornobriz.com/blowjob/' },
            { title: 'Молодые',             url: 'https://pornobriz.com/seks-molodye/' },
            { title: 'На публике',          url: 'https://pornobriz.com/public/' },
            { title: 'От первого лица',     url: 'https://pornobriz.com/pov/' }
        ],

        // ============================================
        // ПОЛУЧЕНИЕ МЕНЮ (вызывает AdultJS при инициализации)
        // ============================================
        
        main: function (params, success, error) {
            console.log('[Pornobriz] main() called with params:', params);
            
            var self = this;
            
            // Загружаем главную страницу
            this._request(params.url || this.baseUrl, function (html) {
                try {
                    var items = self._parseListPage(html);
                    
                    success({
                        results: items,
                        menu: self.categories,
                        collection: false,
                        total_pages: 1
                    });
                } catch (e) {
                    console.error('[Pornobriz] main() parse error:', e);
                    error(e);
                }
            }, error);
        },

        // ============================================
        // ПОЛУЧЕНИЕ СПИСКА ВИДЕО ПО URL (Каталог)
        // ============================================
        
        view: function (params, success, error) {
            console.log('[Pornobriz] view() called with URL:', params.url);
            
            var self = this;
            var url = params.url;
            
            // Определяем номер страницы (если есть пагинация)
            if (params.page && params.page > 1) {
                url = this._addPageToUrl(url, params.page);
            }

            this._request(url, function (html) {
                try {
                    var items = self._parseListPage(html);
                    
                    success({
                        results: items,
                        menu: self.categories,
                        collection: false,
                        total_pages: 1  // Сайт не поддерживает пагинацию через API
                    });
                } catch (e) {
                    console.error('[Pornobriz] view() parse error:', e);
                    error(e);
                }
            }, error);
        },

        // ============================================
        // ПОЛУЧЕНИЕ ПОТОКА ВИДЕО (Плеер)
        // ============================================
        
        qualitys: function (url, success, error) {
            console.log('[Pornobriz] qualitys() called with URL:', url);
            
            var self = this;
            
            this._request(url, function (html) {
                try {
                    var videoUrl = self._extractVideoUrl(html, url);
                    
                    if (videoUrl) {
                        // AdultJS ожидает объект с ключами качества
                        var qualityObj = {};
                        qualityObj['720p'] = videoUrl;
                        
                        success({
                            qualitys: qualityObj
                        });
                    } else {
                        error('Video URL not found');
                    }
                } catch (e) {
                    console.error('[Pornobriz] qualitys() error:', e);
                    error(e);
                }
            }, error);
        },

        // ============================================
        // ПОИСК (не поддерживается сайтом)
        // ============================================
        
        search: function (params, success, error) {
            console.log('[Pornobriz] search() - Not supported');
            error('Search not supported for this source');
        },

        // ============================================
        // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
        // ============================================

        /**
         * HTTP запрос с обработкой ошибок
         */
        _request: function (url, success, error) {
            var self = this;
            console.log('[Pornobriz] _request() URL:', url);

            // Используем встроенный Lampa.Reguest если доступен
            if (typeof Lampa !== 'undefined' && Lampa.Reguest) {
                var net = new Lampa.Reguest();
                
                net.silent(
                    url,
                    function (html) {
                        console.log('[Pornobriz] _request() success, size:', html.length);
                        success(html);
                    },
                    function (e) {
                        console.error('[Pornobriz] _request() Lampa.Reguest error:', e);
                        error(e);
                    }
                );
                return;
            }

            // Fallback на XMLHttpRequest
            this._requestXHR(url, success, error);
        },

        /**
         * XMLHttpRequest для старых Android TV
         */
        _requestXHR: function (url, success, error) {
            var xhr = new XMLHttpRequest();
            
            xhr.timeout = this.timeout;
            
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    console.log('[Pornobriz] XHR success, status:', xhr.status);
                    success(xhr.responseText);
                } else {
                    console.error('[Pornobriz] XHR error, status:', xhr.status);
                    error(new Error('HTTP ' + xhr.status));
                }
            };

            xhr.onerror = function () {
                console.error('[Pornobriz] XHR network error');
                error(new Error('Network error'));
            };

            xhr.ontimeout = function () {
                console.error('[Pornobriz] XHR timeout');
                error(new Error('Timeout'));
            };

            try {
                xhr.open('GET', url, true);
                xhr.setRequestHeader('User-Agent', 'Mozilla/5.0 (Linux; Android 9) AppleWebKit/537.36');
                xhr.setRequestHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
                xhr.send();
            } catch (e) {
                console.error('[Pornobriz] XHR open error:', e);
                error(e);
            }
        },

        /**
         * Парсинг списка видео
         */
        _parseListPage: function (html) {
            var items = [];

            if (!html) {
                console.warn('[Pornobriz] Empty HTML input');
                return items;
            }

            try {
                // Способ 1: Используем регулярные выражения (самый надежный для Android TV)
                var cardRegex = /<div[^>]*class="[^"]*item[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
                var match;
                var seenUrls = {};

                while ((match = cardRegex.exec(html)) !== null) {
                    var cardHtml = match[1];
                    var item = this._parseCard(cardHtml);
                    
                    if (item && item.video && !seenUrls[item.video]) {
                        seenUrls[item.video] = true;
                        items.push(item);
                    }
                }

                console.log('[Pornobriz] _parseListPage() found items:', items.length);

            } catch (e) {
                console.error('[Pornobriz] _parseListPage() error:', e);
            }

            return items;
        },

        /**
         * Парсинг одной карточки видео
         */
        _parseCard: function (html) {
            try {
                var item = {
                    video: '',
                    name: '',
                    picture: '',
                    source: 'pornobriz',
                    json: true  // Флаг для AdultJS: требуется запрос qualitys()
                };

                // Ищем ссылку на видео
                var linkMatch = html.match(/href=["']([^"']*\/video\/[^"']*?)["']/);
                if (linkMatch && linkMatch[1]) {
                    var url = linkMatch[1];
                    item.video = url.indexOf('http') === 0 ? url : this.baseUrl + (url[0] === '/' ? url : '/' + url);
                } else {
                    return null;
                }

                // Ищем название
                var titleMatch = html.match(/title=["']([^"']+)["']/);
                if (titleMatch && titleMatch[1]) {
                    item.name = titleMatch[1];
                } else {
                    var textMatch = html.match(/<a[^>]*>[^<]*<\/a>/);
                    if (textMatch) {
                        item.name = textMatch[0].replace(/<[^>]+>/g, '').trim();
                    }
                }

                if (!item.name) {
                    item.name = 'Video';
                }

                // Ищем миниатюру
                var imgMatch = html.match(/src=["']([^"']*(?:content\/screen|preview)[^"']*?)["']/);
                if (imgMatch && imgMatch[1]) {
                    var imgUrl = imgMatch[1];
                    item.picture = imgUrl.indexOf('http') === 0 ? imgUrl : this.baseUrl + (imgUrl[0] === '/' ? imgUrl : '/' + imgUrl);
                } else {
                    item.picture = this.icon;
                }

                // Ищем длительность
                var durationMatch = html.match(/<span[^>]*class="[^"]*duration[^"]*"[^>]*>([^<]+)<\/span>/);
                if (durationMatch && durationMatch[1]) {
                    item.duration = durationMatch[1].trim();
                }

                // Ищем качество
                var qualityMatch = html.match(/<span[^>]*class="[^"]*quality[^"]*"[^>]*>([^<]+)<\/span>/);
                if (qualityMatch && qualityMatch[1]) {
                    item.quality = qualityMatch[1].trim();
                } else {
                    item.quality = '720p';
                }

                return item;

            } catch (e) {
                console.error('[Pornobriz] _parseCard() error:', e);
                return null;
            }
        },

        /**
         * Извлечение прямой ссылки на видео со страницы
         */
        _extractVideoUrl: function (html, pageUrl) {
            try {
                // Способ 1: Поиск в тегах video/source
                var sourceMatch = html.match(/<source[^>]*src=["']([^"']*\.mp4[^"']*)["']/i);
                if (sourceMatch && sourceMatch[1]) {
                    return this._resolveUrl(sourceMatch[1]);
                }

                // Способ 2: Поиск в iframe src
                var iframeMatch = html.match(/<iframe[^>]*src=["']([^"']*\.mp4[^"']*)["']/i);
                if (iframeMatch && iframeMatch[1]) {
                    return this._resolveUrl(iframeMatch[1]);
                }

                // Способ 3: Поиск в JavaScript переменных
                var jsMatch = html.match(/(?:src|url|video)\s*:\s*["']([^"']*\.mp4[^"']*)["']/i);
                if (jsMatch && jsMatch[1]) {
                    return this._resolveUrl(jsMatch[1]);
                }

                // Способ 4: Поиск любых .mp4 ссылок
                var allMatch = html.match(/https?:\/\/[^\s"'<>]*\.mp4[^\s"'<>]*/i);
                if (allMatch) {
                    return allMatch[0];
                }

                // Способ 5: Генерируем по ID видео
                var idMatch = pageUrl.match(/\/video\/([a-z0-9_-]+)\/?/i);
                if (idMatch && idMatch[1]) {
                    return this.baseUrl + '/preview/' + idMatch[1] + '.mp4';
                }

                return null;

            } catch (e) {
                console.error('[Pornobriz] _extractVideoUrl() error:', e);
                return null;
            }
        },

        /**
         * Разрешение относительного URL
         */
        _resolveUrl: function (url) {
            if (!url) return null;
            if (url.indexOf('http') === 0) return url;
            if (url.indexOf('//') === 0) return 'https:' + url;
            return this.baseUrl + (url[0] === '/' ? url : '/' + url);
        },

        /**
         * Добавление номера страницы к URL (если сайт поддерживает)
         */
        _addPageToUrl: function (url, page) {
            if (page <= 1) return url;
            
            // Pornobriz не поддерживает очевидную пагинацию через URL
            // Возвращаем тот же URL (в реальности нужно проверить структуру сайта)
            return url;
        }
    };

    // ============================================
    // РЕГИСТРАЦИЯ В ADULTJS
    // ============================================

    try {
        // Проверяем, доступен ли API AdultJS
        if (typeof window !== 'undefined' && typeof window.AdultPlugin !== 'undefined') {
            
            console.log('[Pornobriz] Registering parser with AdultPlugin.registerParser()');
            
            // Используем стандартный метод регистрации AdultJS
            window.AdultPlugin.registerParser('pornobriz', PornoBrizParser);
            
        } else {
            console.warn('[Pornobriz] AdultPlugin not found, trying alternative registration');
            
            // Fallback: прямое присвоение
            window.PornoBrizParser = PornoBrizParser;
        }

        console.log('[Pornobriz] Parser loaded successfully v' + PornoBrizParser.version);

    } catch (e) {
        console.error('[Pornobriz] Registration failed:', e);
    }

})();
