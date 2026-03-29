/**
 * ============================================================
 *  LAMPA PLUGIN — ZonaFilm v2.0.0 (с реальным парсингом API)
 * ============================================================
 *
 *  ШАГ 2: Реальный парсинг данных с zonafilm.ru
 *  - API: /api/movies?page=N
 *  - Парсинг JSON из __NEXT_DATA__ или чистого API-ответа
 *  - Пагинация с догрузкой
 *  - Отладочный модуль
 *
 *  GitHub Pages: https://[username].github.io/lampa-zonafilm/plugin.js
 * ============================================================
 */

(function () {
    'use strict';

    /* ==========================================================
     *  БЛОК 1: КОНФИГУРАЦИЯ
     * ========================================================== */
    var CONFIG = {
        debug: true,                    // Режим отладки
        ver: '2.0.0',                   // Версия плагина
        site: 'https://zonafilm.ru',    // Целевой сайт
        
        // CORS-proxy серверы (по порядку приоритета)
        proxy: [
            'https://corsproxy.io/?{u}',
            'https://api.allorigins.win/raw?url={u}',
            'https://api.codetabs.com/v1/proxy?quest={u}'
        ],
        proxyIndex: 0,                  // Текущий proxy
        timeout: 15000,                 // Таймаут запроса (мс)
        
        // API endpoints
        api: {
            movies: '/api/movies',
            embed: '/movies/embed/'
        }
    };

    /* ==========================================================
     *  БЛОК 2: ОТЛАДКА И ДИАГНОСТИКА
     * ========================================================== */
    var D = {
        // Базовое логирование
        log: function(t, m) { 
            if(CONFIG.debug) console.log('[ZF]['+t+']', m); 
        },
        err: function(t, m) { 
            console.error('[ZF][ERR]['+t+']', m); 
        },
        noty: function(m) { 
            try { Lampa.Noty.show(m); } catch(e) {} 
        },
        
        // ==========================================
        // ОТЛАДОЧНЫЕ ИНСТРУМЕНТЫ
        // ==========================================
        
        /**
         * Тестирование API — проверка доступности endpoints
         */
        testAPI: function() {
            var self = this;
            this.log('TEST', '=== Тестирование API ===');
            this.noty('🧪 Тест API...');
            
            var tests = [
                { name: 'Список фильмов', url: CONFIG.site + CONFIG.api.movies + '?page=1' }
            ];
            
            var completed = 0;
            
            tests.forEach(function(test) {
                self.log('TEST', 'Проверка: ' + test.name);
                
                Net.get(test.url, function(html) {
                    completed++;
                    self.log('TEST', '✓ ' + test.name + ' — OK (' + html.length + ' байт)');
                    
                    // Пробуем извлечь JSON
                    try {
                        var json = Src._extractJSON(html);
                        if (json) {
                            self.log('TEST', '✓ JSON извлечён');
                            if (json.data && Array.isArray(json.data)) {
                                self.log('TEST', '✓ Фильмов найдено: ' + json.data.length);
                                self.noty('✓ API работает! Найдено ' + json.data.length + ' фильмов');
                            } else if (json.props && json.props.pageProps) {
                                self.log('TEST', '✓ Данные в pageProps');
                                self.noty('✓ API работает (Next.js SSR)');
                            }
                        } else {
                            self.err('TEST', '✗ JSON не найден');
                            self.noty('⚠ JSON не найден в ответе');
                        }
                    } catch(e) {
                        self.err('TEST', '✗ Ошибка парсинга: ' + e.message);
                        self.noty('⚠ Ошибка парсинга JSON');
                    }
                    
                    if (completed === tests.length) {
                        self.log('TEST', '=== Тестирование завершено ===');
                    }
                    
                }, function() {
                    completed++;
                    self.err('TEST', '✗ ' + test.name + ' — Ошибка загрузки');
                    self.noty('✗ Ошибка загрузки API');
                });
            });
        },
        
        /**
         * Информация о конфигурации
         */
        info: function() {
            this.log('INFO', '=== ZonaFilm Plugin v' + CONFIG.ver + ' ===');
            this.log('INFO', 'Сайт: ' + CONFIG.site);
            this.log('INFO', 'Debug: ' + CONFIG.debug);
            this.log('INFO', 'Proxy: ' + CONFIG.proxy[CONFIG.proxyIndex]);
            this.log('INFO', '================================');
        }
    };

    D.log('Boot', 'Старт v' + CONFIG.ver);

    /* ==========================================================
     *  БЛОК 3: СЕТЬ (с перебором proxy)
     * ========================================================== */
    var Net = {
        /**
         * GET-запрос с fallback на другие proxy
         */
        get: function(url, onSuccess, onError, proxyIdx) {
            var idx = (typeof proxyIdx === 'number') ? proxyIdx : CONFIG.proxyIndex;
            
            if (idx >= CONFIG.proxy.length) {
                D.err('Net', 'Все proxy исчерпаны');
                if (onError) onError();
                return;
            }
            
            var proxyUrl = CONFIG.proxy[idx].replace('{u}', encodeURIComponent(url));
            
            D.log('Net', 'Запрос через proxy[' + idx + ']: ' + proxyUrl.substring(0, 80) + '...');
            
            $.ajax({
                url: proxyUrl,
                timeout: CONFIG.timeout,
                success: function(data) {
                    // Запоминаем рабочий proxy
                    CONFIG.proxyIndex = idx;
                    D.log('Net', 'Успех через proxy[' + idx + ']');
                    if (onSuccess) onSuccess(data);
                },
                error: function(xhr, status, error) {
                    D.log('Net', 'Ошибка proxy[' + idx + ']: ' + status);
                    // Пробуем следующий proxy
                    Net.get(url, onSuccess, onError, idx + 1);
                }
            });
        }
    };

    /* ==========================================================
     *  БЛОК 4: ИСТОЧНИК ZONAFILM — ПАРСИНГ API
     * ========================================================== */
    var Src = {
        /**
         * Извлечь JSON из HTML или распарсить чистый JSON
         */
        _extractJSON: function(html) {
            // Пробуем найти __NEXT_DATA__ (Next.js SSR)
            var match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
            if (match && match[1]) {
                try {
                    var nextData = JSON.parse(match[1]);
                    if (nextData.props && nextData.props.pageProps) {
                        return nextData.props.pageProps;
                    }
                    return nextData;
                } catch(e) {
                    D.err('JSON', 'Ошибка парсинга __NEXT_DATA__: ' + e.message);
                }
            }
            
            // Пробуем распарсить как чистый JSON (API-ответ)
            try {
                return JSON.parse(html);
            } catch(e) {}
            
            return null;
        },

        /**
         * Парсинг списка фильмов из API-данных
         */
        _parseMoviesList: function(moviesData) {
            if (!Array.isArray(moviesData)) {
                D.err('Parse', 'moviesData не массив: ' + typeof moviesData);
                return [];
            }
            
            return moviesData.map(function(m) {
                // Преобразуем качество
                var quality = m.best_quality || '';
                var qualityLabel = '';
                if (quality === 'lq') qualityLabel = 'CAM';
                else if (quality === 'mq') qualityLabel = 'HD';
                else if (quality === 'hq') qualityLabel = 'FullHD';
                
                return {
                    title: m.title || '',
                    slug: m.slug || '',
                    year: m.year || 0,
                    poster: m.cover_url || '',
                    backdrop: m.backdrop_url || '',
                    rating: m.rating || 0,
                    ratingKP: m.rating_kp || 0,
                    ratingIMDB: m.rating_imdb || 0,
                    quality: qualityLabel,
                    duration: m.duration || 0,
                    description: m.description || '',
                    directors: m.directors || '',
                    writers: m.writers || '',
                    ageLimit: m.age_limit || 0,
                    kpId: m.kp_id || 0
                };
            });
        },

        /**
         * Получить список фильмов (с пагинацией)
         */
        main: function(page, callback) {
            var self = this;
            var url = CONFIG.site + CONFIG.api.movies + '?page=' + (page || 1);
            
            D.log('API', 'Загрузка страницы ' + (page || 1));
            
            Net.get(url, function(html) {
                try {
                    var data = self._extractJSON(html);
                    
                    if (!data) {
                        D.err('API', 'Не удалось извлечь JSON');
                        callback([], false);
                        return;
                    }
                    
                    // API может возвращать данные напрямую или в data.data
                    var moviesArray = data.data || data;
                    if (!Array.isArray(moviesArray)) {
                        D.err('API', 'Нет массива фильмов в ответе');
                        D.log('API', 'Ключи ответа: ' + Object.keys(data).join(', '));
                        callback([], false);
                        return;
                    }
                    
                    var items = self._parseMoviesList(moviesArray);
                    var hasMore = false;
                    
                    // Проверяем наличие следующей страницы
                    if (data.links && data.links.next) {
                        hasMore = true;
                    } else if (items.length >= 60) { // Стандартный размер страницы
                        hasMore = true;
                    }
                    
                    D.log('API', 'Загружено: ' + items.length + ', есть ещё: ' + hasMore);
                    callback(items, hasMore);
                    
                } catch(e) {
                    D.err('API', 'Ошибка обработки: ' + e.message);
                    callback([], false);
                }
            }, function() {
                D.err('API', 'Не удалось загрузить данные');
                callback([], false);
            });
        },

        /**
         * Получить детали фильма (со страницы embed)
         */
        getDetails: function(slug, callback) {
            var self = this;
            var url = CONFIG.site + CONFIG.api.embed + slug;
            
            D.log('Detail', 'Загрузка: ' + slug);
            
            Net.get(url, function(html) {
                try {
                    var data = self._extractJSON(html);
                    
                    if (!data || !data.data) {
                        D.err('Detail', 'Нет данных о фильме');
                        callback(null);
                        return;
                    }
                    
                    var m = data.data;
                    var details = self._parseMovieDetails(m, data);
                    
                    D.log('Detail', 'OK: ' + details.title);
                    callback(details);
                    
                } catch(e) {
                    D.err('Detail', 'Ошибка: ' + e.message);
                    callback(null);
                }
            }, function() {
                D.err('Detail', 'Ошибка загрузки');
                callback(null);
            });
        },

        /**
         * Парсинг детальной информации
         */
        _parseMovieDetails: function(m, pageData) {
            var genres = [], countries = [], actors = [];
            
            // Жанры и страны из meta.tags
            if (m.meta && m.meta.tags && Array.isArray(m.meta.tags)) {
                m.meta.tags.forEach(function(tag) {
                    if (tag.type === 'genre') genres.push(tag.title);
                    if (tag.type === 'country') countries.push(tag.title);
                });
            }
            
            // Актёры
            if (m.meta && m.meta.actors && Array.isArray(m.meta.actors)) {
                actors = m.meta.actors.map(function(a) {
                    return a.name || '';
                }).filter(function(n) { return n; });
            }
            
            // URL для просмотра
            var embedUrl = CONFIG.site + CONFIG.api.embed + m.slug;
            
            return {
                title: m.title || '',
                originalTitle: m.title_original || '',
                slug: m.slug || '',
                year: m.year || 0,
                description: m.description || '',
                poster: m.cover_url || '',
                backdrop: m.backdrop_url || (pageData.backdropUrl || ''),
                duration: m.duration || 0,
                rating: m.rating || 0,
                ratingKP: m.rating_kp || 0,
                ratingIMDB: m.rating_imdb || 0,
                quality: m.best_quality || '',
                genres: genres,
                countries: countries,
                directors: m.directors || '',
                writers: m.writers || '',
                actors: actors,
                ageLimit: m.age_limit || 0,
                kpId: m.kp_id || 0,
                embedUrl: embedUrl
            };
        },

        /**
         * Поиск (клиентский на первой странице)
         */
        search: function(query, callback) {
            var self = this;
            query = query.toLowerCase().trim();
            
            D.log('Search', 'Поиск: "' + query + '"');
            
            this.main(1, function(items, hasMore) {
                var results = items.filter(function(m) {
                    var inTitle = m.title.toLowerCase().indexOf(query) !== -1;
                    var inOriginal = m.originalTitle && 
                        m.originalTitle.toLowerCase().indexOf(query) !== -1;
                    return inTitle || inOriginal;
                });
                
                D.log('Search', 'Найдено: ' + results.length + ' из ' + items.length);
                callback(results);
            });
        },

        /**
         * Список жанров (статический)
         */
        cats: function() {
            return [
                {title:'Боевик',slug:'boevik'},
                {title:'Комедия',slug:'komediia'},
                {title:'Драма',slug:'drama'},
                {title:'Ужасы',slug:'uzhasy'},
                {title:'Фантастика',slug:'fantastika'},
                {title:'Триллер',slug:'triller'},
                {title:'Мелодрама',slug:'melodrama'},
                {title:'Детектив',slug:'detektiv'},
                {title:'Криминал',slug:'kriminal'},
                {title:'Приключения',slug:'prikliucheniia'},
                {title:'Фэнтези',slug:'fentezi'},
                {title:'Мультфильм',slug:'multfilm'},
                {title:'Семейный',slug:'semeinyi'},
                {title:'Военный',slug:'voennyi'}
            ];
        },

        /**
         * Фильмы по жанру (через API фильтра)
         */
        byGenre: function(genreSlug, page, callback) {
            var self = this;
            // API фильтра: /api/movies?genre=slug&page=N
            var url = CONFIG.site + CONFIG.api.movies + 
                      '?genre=' + genreSlug + 
                      '&page=' + (page || 1);
            
            D.log('Genre', 'Жанр ' + genreSlug + ', страница ' + (page || 1));
            
            // Используем тот же парсер
            Net.get(url, function(html) {
                try {
                    var data = self._extractJSON(html);
                    var moviesArray = data.data || data;
                    
                    if (!Array.isArray(moviesArray)) {
                        callback([], false);
                        return;
                    }
                    
                    var items = self._parseMoviesList(moviesArray);
                    var hasMore = (data.links && data.links.next) || items.length >= 60;
                    
                    callback(items, hasMore);
                    
                } catch(e) {
                    D.err('Genre', 'Ошибка: ' + e.message);
                    callback([], false);
                }
            }, function() {
                callback([], false);
            });
        }
    };

    /* ==========================================================
     *  БЛОК 5: CSS СТИЛИ
     * ========================================================== */
    var CSS = '\
        .zf-card-wrap{padding:1em}\
        .zf-card-grid{display:flex;flex-wrap:wrap;gap:.6em;justify-content:flex-start}\
        .zf-card{width:10.5em;position:relative;transition:transform .15s;cursor:pointer}\
        .zf-card.focus{transform:scale(1.08);z-index:10}\
        .zf-card-poster{width:100%;height:15em;border-radius:.4em;overflow:hidden;background:#1a1a1a;position:relative}\
        .zf-card-poster img{width:100%;height:100%;object-fit:cover}\
        .zf-card-badge{position:absolute;top:.3em;left:.3em;background:rgba(0,0,0,.8);\
            padding:.15em .4em;border-radius:.2em;font-size:.75em;font-weight:700;color:#fff}\
        .zf-card-bg{background:rgba(102,187,106,.9)}\
        .zf-card-by{background:rgba(255,167,38,.9)}\
        .zf-card-br{background:rgba(239,83,80,.9)}\
        .zf-card-ql{position:absolute;top:.3em;right:.3em;background:#E65100;color:#fff;\
            padding:.1em .35em;border-radius:.2em;font-size:.65em;font-weight:700;text-transform:uppercase}\
        .zf-card-name{color:#eee;font-size:.78em;margin-top:.4em;overflow:hidden;\
            text-overflow:ellipsis;white-space:nowrap;line-height:1.3}\
        .zf-card-year{color:#888;font-size:.7em;margin-top:.15em}\
        .zf-card-info{display:flex;justify-content:space-between;align-items:center;margin-top:.2em}\
        .zf-loading{display:flex;align-items:center;justify-content:center;padding:3em;color:#888}\
        .zf-spinner{display:inline-block;width:1.5em;height:1.5em;border:3px solid #333;\
            border-top-color:#4FC3F7;border-radius:50%;margin-right:.6em;\
            animation:zf-spin .7s linear infinite}\
        @keyframes zf-spin{to{transform:rotate(360deg)}}\
        .zf-more-btn{width:100%;text-align:center;padding:1em;color:#888;cursor:pointer}\
        .zf-more-btn:hover{color:#fff}\
    ';
    
    // Добавляем стили
    $('#zf-css').remove();
    $('<style>').attr('id','zf-css').text(CSS).appendTo('head');

    /* ==========================================================
     *  БЛОК 6: ГЛАВНОЕ МЕНЮ
     * ========================================================== */
    function showMainMenu() {
        D.log('Menu', 'Открываю меню');

        var items = [];

        /* Поиск */
        items.push({
            title: '🔍 Поиск фильмов',
            subtitle: 'Найти по названию',
            action: 'search'
        });

        /* Все фильмы */
        items.push({
            title: '📽 Все фильмы',
            subtitle: 'Популярные и новые',
            action: 'all'
        });

        /* Отладка (только в debug-режиме) */
        if (CONFIG.debug) {
            items.push({
                title: '🐛 Тест API',
                subtitle: 'Проверить парсер',
                action: 'test'
            });
        }

        /* Разделитель */
        items.push({
            title: '━━━ Жанры ━━━',
            subtitle: '',
            action: 'none',
            disabled: true
        });

        /* Жанры */
        Src.cats().forEach(function(c) {
            items.push({
                title: '📂 ' + c.title,
                subtitle: '',
                action: 'genre',
                genre: c.slug
            });
        });

        /* Выход */
        items.push({
            title: '━━━━━━━━━━━',
            subtitle: '',
            action: 'none',
            disabled: true
        });

        items.push({
            title: '← Назад',
            subtitle: 'Вернуться в Lampa',
            action: 'back'
        });

        Lampa.Select.show({
            title: '🎬 ZonaFilm',
            items: items,

            onBack: function() {
                Lampa.Controller.toggle('content');
            },

            onSelect: function(item) {
                if (item.action === 'back' || item.action === 'none') {
                    Lampa.Controller.toggle('content');
                    return;
                }

                if (item.action === 'search') {
                    doSearch();
                    return;
                }

                if (item.action === 'all') {
                    loadMoviesWithPagination('Все фильмы', function(page, cb) {
                        Src.main(page, cb);
                    });
                    return;
                }

                if (item.action === 'test') {
                    D.testAPI();
                    return;
                }

                if (item.action === 'genre') {
                    loadMoviesWithPagination('📂 ' + item.title.replace('📂 ', ''), 
                        function(page, cb) {
                            Src.byGenre(item.genre, page, cb);
                        }
                    );
                    return;
                }
            }
        });
    }

    /* ==========================================================
     *  БЛОК 7: ПОИСК
     * ========================================================== */
    function doSearch() {
        Lampa.Input.edit({
            title: 'Поиск фильмов',
            value: '',
            free: true,
            nosave: true
        }, function(val) {
            if (val && val.trim()) {
                var q = val.trim();
                
                D.noty('🔍 Ищем: ' + q);
                
                Src.search(q, function(results) {
                    if (!results.length) {
                        D.noty('📭 Ничего не найдено');
                        // Возвращаемся в меню
                        setTimeout(showMainMenu, 1500);
                        return;
                    }
                    
                    // Показываем результаты без пагинации
                    Lampa.Activity.push({
                        url: '',
                        title: '🔍 ' + q,
                        component: 'zf_cards',
                        page: 1,
                        movie_items: results,
                        is_search: true
                    });
                });
            } else {
                // Отмена — возвращаемся в меню
                showMainMenu();
            }
        });
    }

    /* ==========================================================
     *  БЛОК 8: ЗАГРУЗКА С ПАГИНАЦИЕЙ
     * ========================================================== */
    function loadMoviesWithPagination(title, loader) {
        D.noty('⏳ Загрузка...');
        
        loader(1, function(items, hasMore) {
            if (!items || !items.length) {
                D.noty('📭 Ничего не найдено');
                showMainMenu();
                return;
            }

            D.log('Load', 'Загружено: ' + items.length + ', ещё: ' + hasMore);
            
            Lampa.Activity.push({
                url: '',
                title: title,
                component: 'zf_pagination',
                page: 1,
                movie_items: items,
                has_more: hasMore,
                loader: loader  // функция для загрузки следующих страниц
            });
        });
    }

    /* ==========================================================
     *  БЛОК 9: КОМПОНЕНТ КАРТОЧЕК (простой, без пагинации)
     * ========================================================== */
    function CardsComp(object) {
        var self = this;
        var scroll = new Lampa.Scroll({mask:true, over:true, step:250});
        var body = $('<div class="zf-card-wrap"></div>');
        var grid = $('<div class="zf-card-grid"></div>');
        var items = object.movie_items || [];

        this.create = function() {
            body.append(grid);
            scroll.append(body);

            if (!items.length) {
                grid.html('<div class="zf-loading">📭 Нет данных</div>');
                this.activate();
                return;
            }

            this.renderCards(items);
            this.activate();
        };

        this.renderCards = function(cardsData) {
            cardsData.forEach(function(m) {
                // Цвет рейтинга
                var rc = 'zf-card-br';
                if (m.rating >= 7) rc = 'zf-card-bg';
                else if (m.rating >= 5) rc = 'zf-card-by';

                var card = $([
                    '<div class="zf-card selector">',
                        '<div class="zf-card-poster">',
                            m.poster ? 
                                '<img src="' + m.poster + '" loading="lazy" alt="' + m.title + '"/>' :
                                '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#444;font-size:3em">🎬</div>',
                        '</div>',
                        m.rating > 0 ? '<div class="zf-card-badge ' + rc + '">★ ' + m.rating.toFixed(1) + '</div>' : '',
                        m.quality ? '<div class="zf-card-ql">' + m.quality + '</div>' : '',
                        '<div class="zf-card-name">' + m.title + '</div>',
                        '<div class="zf-card-year">' + (m.year || '') + (m.duration ? ' • ' + m.duration + ' мин' : '') + '</div>',
                    '</div>'
                ].join(''));

                // Клик — открыть детали
                card.on('hover:enter', function() {
                    showMovieDetails(m.slug, m.title);
                });

                // Фокус — скролл
                card.on('hover:focus', function() {
                    scroll.update($(this));
                });

                grid.append(card);
            });
        };

        this.activate = function() {
            Lampa.Controller.add('content', {
                back: function() {
                    Lampa.Activity.backward();
                    setTimeout(showMainMenu, 300);
                }
            });

            Lampa.Controller.enable('content');
            Lampa.Controller.collectionSet(scroll.render());
            Lampa.Controller.collectionFocus(false, scroll.render());
        };

        this.start = function() {
            this.activate();
        };

        this.pause = function() {};
        this.stop = function() {};
        this.render = function() { return scroll.render(); };
        this.destroy = function() { scroll.destroy(); };
    }

    /* ==========================================================
     *  БЛОК 10: КОМПОНЕНТ С ПАГИНАЦИЕЙ
     * ========================================================== */
    function PaginationComp(object) {
        var self = this;
        var scroll = new Lampa.Scroll({mask:true, over:true, step:250});
        var body = $('<div class="zf-card-wrap"></div>');
        var grid = $('<div class="zf-card-grid"></div>');
        
        var items = object.movie_items || [];
        var currentPage = object.page || 1;
        var hasMore = object.has_more || false;
        var isLoading = false;
        var loader = object.loader;

        this.create = function() {
            body.append(grid);
            scroll.append(body);
            
            // Добавляем индикатор загрузки внизу
            this.moreIndicator = $('<div class="zf-more-btn" style="display:none">⏳ Загрузка...</div>');
            body.append(this.moreIndicator);

            this.renderCards(items);
            this.setupScroll();
            this.activate();
        };

        this.renderCards = function(cardsData) {
            cardsData.forEach(function(m) {
                var rc = m.rating >= 7 ? 'zf-card-bg' : (m.rating >= 5 ? 'zf-card-by' : 'zf-card-br');

                var card = $([
                    '<div class="zf-card selector">',
                        '<div class="zf-card-poster">',
                            m.poster ? 
                                '<img src="' + m.poster + '" loading="lazy" alt="' + m.title + '"/>' :
                                '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#444;font-size:3em">🎬</div>',
                        '</div>',
                        m.rating > 0 ? '<div class="zf-card-badge ' + rc + '">★ ' + m.rating.toFixed(1) + '</div>' : '',
                        m.quality ? '<div class="zf-card-ql">' + m.quality + '</div>' : '',
                        '<div class="zf-card-name">' + m.title + '</div>',
                        '<div class="zf-card-year">' + (m.year || '') + (m.duration ? ' • ' + m.duration + ' мин' : '') + '</div>',
                    '</div>'
                ].join(''));

                card.on('hover:enter', function() {
                    showMovieDetails(m.slug, m.title);
                });

                card.on('hover:focus', function() {
                    scroll.update($(this));
                });

                grid.append(card);
            });
        };

        this.setupScroll = function() {
            var scrollEl = scroll.render();
            
            scrollEl.on('scroll', function() {
                if (!hasMore || isLoading) return;
                
                var el = scrollEl[0];
                var scrollBottom = el.scrollTop + el.clientHeight;
                var threshold = el.scrollHeight - 300; // 300px до конца
                
                if (scrollBottom >= threshold) {
                    self.loadMore();
                }
            });
        };

        this.loadMore = function() {
            if (isLoading || !hasMore) return;
            
            isLoading = true;
            currentPage++;
            
            D.log('Page', 'Загрузка страницы ' + currentPage);
            self.moreIndicator.show().text('⏳ Загрузка...');
            
            loader(currentPage, function(newItems, more) {
                isLoading = false;
                
                if (newItems && newItems.length > 0) {
                    self.renderCards(newItems);
                    hasMore = more;
                    D.log('Page', 'Добавлено: ' + newItems.length);
                } else {
                    hasMore = false;
                }
                
                if (!hasMore) {
                    self.moreIndicator.text('✓ Все фильмы загружены');
                    setTimeout(function() {
                        self.moreIndicator.hide();
                    }, 2000);
                } else {
                    self.moreIndicator.hide();
                }
            });
        };

        this.activate = function() {
            Lampa.Controller.add('content', {
                back: function() {
                    Lampa.Activity.backward();
                    setTimeout(showMainMenu, 300);
                }
            });

            Lampa.Controller.enable('content');
            Lampa.Controller.collectionSet(scroll.render());
            Lampa.Controller.collectionFocus(false, scroll.render());
        };

        this.start = function() {
            this.activate();
        };

        this.pause = function() {};
        this.stop = function() {};
        this.render = function() { return scroll.render(); };
        this.destroy = function() { scroll.destroy(); };
    }

    /* ==========================================================
     *  БЛОК 11: ДЕТАЛИ ФИЛЬМА
     * ========================================================== */
    function showMovieDetails(slug, title) {
        D.log('Detail', 'Открываю: ' + slug);
        D.noty('⏳ ' + title);

        Src.getDetails(slug, function(m) {
            if (!m) {
                D.noty('⚠ Ошибка загрузки');
                return;
            }

            // Формируем рейтинг
            var ratingText = '';
            if (m.rating > 0) ratingText += '★ ' + m.rating.toFixed(1);
            if (m.ratingKP > 0) ratingText += '  КП: ' + m.ratingKP.toFixed(1);
            if (m.ratingIMDB > 0) ratingText += '  IMDb: ' + m.ratingIMDB.toFixed(1);

            // Качество
            var ql = m.quality || '';
            if (ql === 'lq') ql = 'CAM';
            else if (ql === 'mq') ql = 'HD';
            else if (ql === 'hq') ql = 'FullHD';

            var detailItems = [];

            // Кнопка Смотреть
            detailItems.push({
                title: '▶ Смотреть',
                subtitle: m.title + (m.year ? ' (' + m.year + ')' : ''),
                action: 'play',
                data: m
            });

            // Информация
            if (ratingText) {
                detailItems.push({
                    title: '⭐ Рейтинг',
                    subtitle: ratingText,
                    action: 'info'
                });
            }

            if (m.year || m.duration) {
                var info = [];
                if (m.year) info.push(m.year);
                if (m.duration) info.push(m.duration + ' мин');
                if (ql) info.push(ql);
                if (m.ageLimit) info.push(m.ageLimit + '+');
                
                detailItems.push({
                    title: '📅 Информация',
                    subtitle: info.join(' • '),
                    action: 'info'
                });
            }

            if (m.genres.length) {
                detailItems.push({
                    title: '🎭 Жанры',
                    subtitle: m.genres.join(', '),
                    action: 'info'
                });
            }

            if (m.countries.length) {
                detailItems.push({
                    title: '🌍 Страна',
                    subtitle: m.countries.join(', '),
                    action: 'info'
                });
            }

            if (m.directors) {
                detailItems.push({
                    title: '🎬 Режиссёр',
                    subtitle: m.directors,
                    action: 'info'
                });
            }

            if (m.actors.length) {
                detailItems.push({
                    title: '👥 Актёры',
                    subtitle: m.actors.slice(0, 5).join(', '),
                    action: 'info'
                });
            }

            if (m.description) {
                var desc = m.description.length > 150 ? 
                    m.description.substring(0, 150) + '...' : 
                    m.description;
                detailItems.push({
                    title: '📝 Описание',
                    subtitle: desc,
                    action: 'info'
                });
            }

            detailItems.push({
                title: '← Назад',
                subtitle: '',
                action: 'back'
            });

            Lampa.Select.show({
                title: '🎬 ' + m.title,
                items: detailItems,

                onBack: function() {
                    Lampa.Controller.toggle('content');
                },

                onSelect: function(item) {
                    if (item.action === 'play') {
                        playMovie(item.data);
                    } else if (item.action === 'back') {
                        Lampa.Controller.toggle('content');
                    }
                }
            });
        });
    }

    /* ==========================================================
     *  БЛОК 12: ВОСПРОИЗВЕДЕНИЕ
     * ========================================================== */
    function playMovie(m) {
        var url = m.embedUrl || (CONFIG.site + CONFIG.api.embed + m.slug);
        
        D.log('Play', 'URL: ' + url);
        D.noty('▶ Открываю: ' + m.title);

        // Пробуем открыть в системном плеере (Android)
        try {
            if (typeof Lampa.Android !== 'undefined' && Lampa.Android.openUrl) {
                Lampa.Android.openUrl(url);
                return;
            }
        } catch(e) {}

        // Fallback — открываем в браузере
        try {
            window.open(url, '_blank');
        } catch(e) {
            D.noty('🔗 Скопируйте ссылку: ' + url);
        }
    }

    /* ==========================================================
     *  БЛОК 13: РЕГИСТРАЦИЯ И ЗАПУСК
     * ========================================================== */
    
    // Регистрируем компоненты
    Lampa.Component.add('zf_cards', CardsComp);
    Lampa.Component.add('zf_pagination', PaginationComp);

    // Иконка для меню
    var ICO = '<svg viewBox="0 0 24 24" fill="currentColor">' +
        '<path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2z' +
        'M8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2z' +
        'm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>';

    // Добавить кнопку в боковое меню
    function addMenuButton() {
        if ($('[data-action="zonafilm"]').length) return;

        var li = $('<li class="menu__item selector" data-action="zonafilm">' +
            '<div class="menu__ico">' + ICO + '</div>' +
            '<div class="menu__text">ZonaFilm</div></li>');

        li.on('hover:enter', function() {
            D.log('Menu', 'Клик по кнопке');
            showMainMenu();
        });

        // Вставляем в меню
        var menuList = $('.menu .menu__list');
        if (menuList.length) {
            menuList.eq(0).append(li);
            D.log('Menu', 'Кнопка добавлена в .menu__list');
        } else {
            var ul = $('.menu ul');
            if (ul.length) {
                ul.eq(0).append(li);
                D.log('Menu', 'Кнопка добавлена в ul');
            }
        }
    }

    // Инициализация
    function init() {
        try {
            D.info();
            addMenuButton();
            D.noty('🎬 ZonaFilm v' + CONFIG.ver + ' готов');
            D.log('Boot', '✅ Плагин загружен');
        } catch(e) {
            D.err('Boot', e.message);
        }
    }

    // Запускаем когда Lampa готова
    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') init();
        });
    }

})();
