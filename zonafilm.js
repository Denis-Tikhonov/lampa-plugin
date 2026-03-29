/**
 * ============================================================
 *  LAMPA PLUGIN — ZonaFilm v2.1.0 (исправленный парсинг)
 * ============================================================
 *
 *  ИСПРАВЛЕНИЯ:
 *  - Правильный парсинг __NEXT_DATA__ (не #NEXT_DATA, а #__NEXT_DATA__)
 *  - Извлечение buildId для API-запросов
 *  - Поддержка Next.js SSR данных
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
        debug: true,
        ver: '2.1.0',
        site: 'https://zonafilm.ru',
        
        // CORS-proxy
        proxy: [
            'https://corsproxy.io/?{u}',
            'https://api.allorigins.win/raw?url={u}',
            'https://api.codetabs.com/v1/proxy?quest={u}'
        ],
        proxyIndex: 0,
        timeout: 15000,
        
        // API endpoints (Next.js)
        api: {
            movies: '/_next/data/',  // + buildId + /movies.json
            embed: '/movies/embed/'
        },
        
        // Сохраняем buildId после первого запроса
        buildId: null
    };

    /* ==========================================================
     *  БЛОК 2: ОТЛАДКА
     * ========================================================== */
    var D = {
        log: function(t, m) { 
            if(CONFIG.debug) console.log('[ZF]['+t+']', m); 
        },
        err: function(t, m) { 
            console.error('[ZF][ERR]['+t+']', m); 
        },
        noty: function(m) { 
            try { Lampa.Noty.show(m); } catch(e) {} 
        },
        
        testAPI: function() {
            var self = this;
            this.log('TEST', '=== Тестирование API ===');
            this.noty('🧪 Тест API...');
            
            // Тест 1: Получаем buildId с главной страницы
            Net.get(CONFIG.site + '/movies', function(html) {
                self.log('TEST', 'HTML получен: ' + html.length + ' байт');
                
                // Ищем buildId
                var buildId = Src._extractBuildId(html);
                self.log('TEST', 'buildId: ' + buildId);
                
                // Ищем __NEXT_DATA__
                var nextData = Src._extractNextData(html);
                if (nextData) {
                    self.log('TEST', '✓ __NEXT_DATA__ найден');
                    self.log('TEST', 'Ключи: ' + Object.keys(nextData).join(', '));
                    
                    if (nextData.props && nextData.props.pageProps) {
                        var pp = nextData.props.pageProps;
                        self.log('TEST', 'pageProps ключи: ' + Object.keys(pp).join(', '));
                        
                        if (pp.data && Array.isArray(pp.data)) {
                            self.log('TEST', '✓ Найдено фильмов: ' + pp.data.length);
                            self.noty('✓ API работает! ' + pp.data.length + ' фильмов');
                        } else {
                            self.err('TEST', '✗ pp.data не найден или не массив');
                            self.noty('⚠ Нет данных в pageProps.data');
                        }
                    } else {
                        self.err('TEST', '✗ Нет props.pageProps');
                    }
                } else {
                    self.err('TEST', '✗ __NEXT_DATA__ не найден');
                    self.noty('✗ JSON не найден');
                    
                    // Показываем фрагмент HTML для диагностики
                    var fragment = html.substring(0, 500);
                    self.log('TEST', 'Фрагмент HTML: ' + fragment);
                }
            }, function() {
                self.err('TEST', '✗ Ошибка загрузки');
                self.noty('✗ Нет соединения');
            });
        },
        
        info: function() {
            this.log('INFO', '=== ZonaFilm v' + CONFIG.ver + ' ===');
            this.log('INFO', 'buildId: ' + CONFIG.buildId);
        }
    };

    D.log('Boot', 'Старт v' + CONFIG.ver);

    /* ==========================================================
     *  БЛОК 3: СЕТЬ
     * ========================================================== */
    var Net = {
        get: function(url, onSuccess, onError, proxyIdx) {
            var idx = (typeof proxyIdx === 'number') ? proxyIdx : CONFIG.proxyIndex;
            
            if (idx >= CONFIG.proxy.length) {
                D.err('Net', 'Все proxy исчерпаны');
                if (onError) onError();
                return;
            }
            
            var proxyUrl = CONFIG.proxy[idx].replace('{u}', encodeURIComponent(url));
            
            D.log('Net', 'proxy[' + idx + ']: ' + url.substring(0, 60) + '...');
            
            $.ajax({
                url: proxyUrl,
                timeout: CONFIG.timeout,
                success: function(data) {
                    CONFIG.proxyIndex = idx;
                    if (onSuccess) onSuccess(data);
                },
                error: function(xhr, status, error) {
                    D.log('Net', 'Ошибка proxy[' + idx + ']: ' + status);
                    Net.get(url, onSuccess, onError, idx + 1);
                }
            });
        }
    };

    /* ==========================================================
     *  БЛОК 4: ИСТОЧНИК ZONAFILM
     * ========================================================== */
    var Src = {
        /**
         * Извлечь buildId из HTML
         */
        _extractBuildId: function(html) {
            // Вариант 1: Из __NEXT_DATA__
            var match = html.match(/"buildId"\s*:\s*"([^"]+)"/);
            if (match && match[1]) {
                CONFIG.buildId = match[1];
                return match[1];
            }
            
            // Вариант 2: Из ссылки на _next/static
            match = html.match(/\/_next\/static\/([^\/]+)\/_buildManifest\.js/);
            if (match && match[1]) {
                CONFIG.buildId = match[1];
                return match[1];
            }
            
            return null;
        },

        /**
         * Извлечь __NEXT_DATA__ из HTML
         */
        _extractNextData: function(html) {
            var match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
            if (match && match[1]) {
                try {
                    return JSON.parse(match[1]);
                } catch(e) {
                    D.err('JSON', 'Ошибка парсинга: ' + e.message);
                }
            }
            return null;
        },

        /**
         * Получить данные (с авто-определением формата)
         */
        _extractData: function(html) {
            // Пробуем __NEXT_DATA__ (Next.js SSR)
            var nextData = this._extractNextData(html);
            if (nextData) {
                if (nextData.props && nextData.props.pageProps) {
                    return nextData.props.pageProps;
                }
                return nextData;
            }
            
            // Пробуем чистый JSON (прямой API-ответ)
            try {
                return JSON.parse(html);
            } catch(e) {}
            
            return null;
        },

        /**
         * Парсинг списка фильмов
         */
        _parseMoviesList: function(data) {
            // Данные могут быть в data или напрямую в массиве
            var moviesArray = null;
            
            if (Array.isArray(data)) {
                moviesArray = data;
            } else if (data.data && Array.isArray(data.data)) {
                moviesArray = data.data;
            } else if (typeof data === 'object') {
                // Ищем любое поле с массивом
                for (var key in data) {
                    if (Array.isArray(data[key]) && data[key].length > 0 && data[key][0].title) {
                        moviesArray = data[key];
                        break;
                    }
                }
            }
            
            if (!moviesArray) {
                D.err('Parse', 'Не найден массив фильмов');
                return [];
            }
            
            return moviesArray.map(function(m) {
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
         * Загрузить список фильмов
         */
        main: function(page, callback) {
            var self = this;
            page = page || 1;
            
            // Если нет buildId — сначала получаем его
            if (!CONFIG.buildId) {
                D.log('API', 'Получаем buildId...');
                
                Net.get(CONFIG.site + '/movies', function(html) {
                    var buildId = self._extractBuildId(html);
                    if (!buildId) {
                        D.err('API', 'buildId не найден');
                        callback([], false);
                        return;
                    }
                    
                    D.log('API', 'buildId: ' + buildId);
                    // Теперь загружаем данные
                    self._loadMoviesData(buildId, page, callback);
                    
                }, function() {
                    D.err('API', 'Не удалось получить buildId');
                    callback([], false);
                });
                
            } else {
                // buildId уже есть
                this._loadMoviesData(CONFIG.buildId, page, callback);
            }
        },

        /**
         * Загрузка данных фильмов через Next.js API
         */
        _loadMoviesData: function(buildId, page, callback) {
            var self = this;
            
            // Формируем URL Next.js data API
            var url = CONFIG.site + CONFIG.api.movies + buildId + '/movies.json';
            if (page > 1) {
                url += '?page=' + page;
            }
            
            D.log('API', 'URL: ' + url);
            
            Net.get(url, function(html) {
                var data = self._extractData(html);
                
                if (!data) {
                    D.err('API', 'Не удалось извлечь данные');
                    callback([], false);
                    return;
                }
                
                var items = self._parseMoviesList(data);
                
                // Проверяем пагинацию
                var hasMore = false;
                if (data.links && data.links.next) hasMore = true;
                else if (items.length >= 60) hasMore = true;
                
                D.log('API', 'Страница ' + page + ': ' + items.length + ' фильмов, ещё: ' + hasMore);
                callback(items, hasMore);
                
            }, function() {
                D.err('API', 'Ошибка загрузки данных');
                callback([], false);
            });
        },

        /**
         * Детали фильма
         */
        getDetails: function(slug, callback) {
            var self = this;
            
            // Сначала проверяем buildId
            if (!CONFIG.buildId) {
                Net.get(CONFIG.site + '/movies', function(html) {
                    self._extractBuildId(html);
                    self._loadDetails(slug, callback);
                }, function() {
                    callback(null);
                });
            } else {
                this._loadDetails(slug, callback);
            }
        },

        /**
         * Загрузка деталей
         */
        _loadDetails: function(slug, callback) {
            var self = this;
            var url = CONFIG.site + CONFIG.api.movies + CONFIG.buildId + 
                      '/movies/' + slug + '.json';
            
            D.log('Detail', 'URL: ' + url);
            
            Net.get(url, function(html) {
                var data = self._extractData(html);
                
                if (!data || !data.data) {
                    D.err('Detail', 'Нет данных');
                    callback(null);
                    return;
                }
                
                var m = data.data;
                var details = self._parseMovieDetails(m, data);
                callback(details);
                
            }, function() {
                D.err('Detail', 'Ошибка загрузки');
                callback(null);
            });
        },

        /**
         * Парсинг деталей
         */
        _parseMovieDetails: function(m, pageData) {
            var genres = [], countries = [], actors = [];
            
            if (m.meta && m.meta.tags) {
                m.meta.tags.forEach(function(tag) {
                    if (tag.type === 'genre') genres.push(tag.title);
                    if (tag.type === 'country') countries.push(tag.tag);
                });
            }
            
            if (m.meta && m.meta.actors) {
                actors = m.meta.actors.map(function(a) { return a.name; });
            }
            
            var embedUrl = CONFIG.site + CONFIG.api.embed + m.slug;
            
            return {
                title: m.title || '',
                originalTitle: m.title_original || '',
                slug: m.slug || '',
                year: m.year || 0,
                description: m.description || '',
                poster: m.cover_url || '',
                backdrop: m.backdrop_url || '',
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
                embedUrl: embedUrl
            };
        },

        /**
         * Поиск
         */
        search: function(query, callback) {
            var self = this;
            query = query.toLowerCase().trim();
            
            D.log('Search', 'Поиск: ' + query);
            
            this.main(1, function(items, hasMore) {
                var results = items.filter(function(m) {
                    return m.title.toLowerCase().indexOf(query) !== -1 ||
                           (m.originalTitle && m.originalTitle.toLowerCase().indexOf(query) !== -1);
                });
                
                D.log('Search', 'Найдено: ' + results.length);
                callback(results);
            });
        },

        /**
         * Жанры
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
         * Фильмы по жанру
         */
        byGenre: function(genreSlug, page, callback) {
            var self = this;
            page = page || 1;
            
            // Next.js фильтр: /_next/data/{buildId}/movies/filter/genre-{slug}.json
            var doLoad = function() {
                var url = CONFIG.site + CONFIG.api.movies + CONFIG.buildId + 
                          '/movies/filter/genre-' + genreSlug + '.json';
                if (page > 1) url += '?page=' + page;
                
                D.log('Genre', 'URL: ' + url);
                
                Net.get(url, function(html) {
                    var data = self._extractData(html);
                    var items = self._parseMoviesList(data);
                    var hasMore = (data && data.links && data.links.next) || items.length >= 60;
                    
                    callback(items, hasMore);
                }, function() {
                    callback([], false);
                });
            };
            
            if (!CONFIG.buildId) {
                Net.get(CONFIG.site + '/movies', function(html) {
                    self._extractBuildId(html);
                    doLoad();
                }, function() {
                    callback([], false);
                });
            } else {
                doLoad();
            }
        }
    };

    /* ==========================================================
     *  БЛОК 5: CSS
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
        .zf-loading{display:flex;align-items:center;justify-content:center;padding:3em;color:#888}\
        .zf-more-btn{width:100%;text-align:center;padding:1em;color:#888}\
    ';
    
    $('#zf-css').remove();
    $('<style>').attr('id','zf-css').text(CSS).appendTo('head');

    /* ==========================================================
     *  БЛОК 6-12: МЕНЮ, КОМПОНЕНТЫ, ПЛЕЕР (без изменений)
     *  ... [оставляю прежние функции showMainMenu, doSearch, 
     *       loadMoviesWithPagination, CardsComp, PaginationComp,
     *       showMovieDetails, playMovie] ...
     * ========================================================== */
    
    // [Здесь вставляются функции из предыдущей версии без изменений]
    // showMainMenu, doSearch, loadMoviesWithPagination, CardsComp, 
    // PaginationComp, showMovieDetails, playMovie
    
    /* ==========================================================
     *  КОПИЯ ФУНКЦИЙ ИЗ v2.0.0 (без изменений)
     * ========================================================== */
    
    function showMainMenu() {
        D.log('Menu', 'Открываю меню');

        var items = [];

        items.push({
            title: '🔍 Поиск фильмов',
            subtitle: 'Найти по названию',
            action: 'search'
        });

        items.push({
            title: '📽 Все фильмы',
            subtitle: 'Популярные и новые',
            action: 'all'
        });

        if (CONFIG.debug) {
            items.push({
                title: '🐛 Тест API',
                subtitle: 'Проверить парсер',
                action: 'test'
            });
        }

        items.push({
            title: '━━━ Жанры ━━━',
            subtitle: '',
            action: 'none',
            disabled: true
        });

        Src.cats().forEach(function(c) {
            items.push({
                title: '📂 ' + c.title,
                subtitle: '',
                action: 'genre',
                genre: c.slug
            });
        });

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
                        setTimeout(showMainMenu, 1500);
                        return;
                    }
                    
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
                showMainMenu();
            }
        });
    }

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
                loader: loader
            });
        });
    }

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

        this.start = function() { this.activate(); };
        this.pause = function() {};
        this.stop = function() {};
        this.render = function() { return scroll.render(); };
        this.destroy = function() { scroll.destroy(); };
    }

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
                var threshold = el.scrollHeight - 300;
                
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
                    setTimeout(function() { self.moreIndicator.hide(); }, 2000);
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

        this.start = function() { this.activate(); };
        this.pause = function() {};
        this.stop = function() {};
        this.render = function() { return scroll.render(); };
        this.destroy = function() { scroll.destroy(); };
    }

    function showMovieDetails(slug, title) {
        D.log('Detail', 'Открываю: ' + slug);
        D.noty('⏳ ' + title);

        Src.getDetails(slug, function(m) {
            if (!m) {
                D.noty('⚠ Ошибка загрузки');
                return;
            }

            var ratingText = '';
            if (m.rating > 0) ratingText += '★ ' + m.rating.toFixed(1);
            if (m.ratingKP > 0) ratingText += '  КП: ' + m.ratingKP.toFixed(1);
            if (m.ratingIMDB > 0) ratingText += '  IMDb: ' + m.ratingIMDB.toFixed(1);

            var ql = m.quality || '';
            if (ql === 'lq') ql = 'CAM';
            else if (ql === 'mq') ql = 'HD';
            else if (ql === 'hq') ql = 'FullHD';

            var detailItems = [];

            detailItems.push({
                title: '▶ Смотреть',
                subtitle: m.title + (m.year ? ' (' + m.year + ')' : ''),
                action: 'play',
                data: m
            });

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

    function playMovie(m) {
        var url = m.embedUrl || (CONFIG.site + '/movies/embed/' + m.slug);
        
        D.log('Play', 'URL: ' + url);
        D.noty('▶ Открываю: ' + m.title);

        try {
            if (typeof Lampa.Android !== 'undefined' && Lampa.Android.openUrl) {
                Lampa.Android.openUrl(url);
                return;
            }
        } catch(e) {}

        try {
            window.open(url, '_blank');
        } catch(e) {
            D.noty('🔗 Скопируйте ссылку: ' + url);
        }
    }

    /* ==========================================================
     *  БЛОК 13: РЕГИСТРАЦИЯ И ЗАПУСК
     * ========================================================== */
    
    Lampa.Component.add('zf_cards', CardsComp);
    Lampa.Component.add('zf_pagination', PaginationComp);

    var ICO = '<svg viewBox="0 0 24 24" fill="currentColor">' +
        '<path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2z' +
        'M8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2z' +
        'm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>';

    function addMenuButton() {
        if ($('[data-action="zonafilm"]').length) return;

        var li = $('<li class="menu__item selector" data-action="zonafilm">' +
            '<div class="menu__ico">' + ICO + '</div>' +
            '<div class="menu__text">ZonaFilm</div></li>');

        li.on('hover:enter', function() {
            D.log('Menu', 'Клик по кнопке');
            showMainMenu();
        });

        var menuList = $('.menu .menu__list');
        if (menuList.length) {
            menuList.eq(0).append(li);
        } else {
            var ul = $('.menu ul');
            if (ul.length) ul.eq(0).append(li);
        }
    }

    function init() {
        try {
            D.info();
            addMenuButton();
            D.noty('🎬 ZonaFilm v' + CONFIG.ver);
            D.log('Boot', '✅ Плагин загружен');
        } catch(e) {
            D.err('Boot', e.message);
        }
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') init();
        });
    }

})();
