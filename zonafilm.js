/**
 * ============================================================
 *  LAMPA PLUGIN — ZonaFilm v1.0.0
 * ============================================================
 *
 *  ПОДХОД:
 *    Вместо кастомного Component используем Lampa.Select
 *    для меню плагина, а для отображения карточек —
 *    Lampa.Activity.push с component:'category_full'
 *    (встроенный компонент Lampa для сеток карточек).
 *
 *  ИНТЕРФЕЙС:
 *    1. Кнопка "ZonaFilm" в боковом меню
 *    2. При нажатии → Select-меню:
 *       - 🔍 Поиск
 *       - 📽 Все фильмы
 *       - 📂 Жанры (Боевик, Комедия, ...)
 *       - ← Назад
 *    3. При выборе → экран с постерами (рабочая навигация!)
 *    4. При клике на постер → Select с деталями + Смотреть
 *
 *  БЛОКИ:
 *    1. Конфигурация
 *    2. Отладка
 *    3. Сеть
 *    4. Источник ZonaFilm
 *    5. CSS (минимальный)
 *    6. Главное меню плагина (Select)
 *    7. Отображение карточек
 *    8. Детали фильма (Select)
 *    9. Регистрация + Меню + Запуск
 * ============================================================
 */

(function () {
    'use strict';

    /* ==========================================================
     *  БЛОК 1: КОНФИГУРАЦИЯ
     * ========================================================== */
    var CONFIG = {
        debug: true,
        ver: '1.0.0',
        site: 'https://zonafilm.ru',
        buildId: '39MEgPaxeFXNBOSc6BloZ',
        proxy: [
            'https://api.codetabs.com/v1/proxy?quest={u}',
            'https://corsproxy.io/?{u}',
            'https://api.allorigins.win/raw?url={u}'
        ],
        pi: 0,
        timeout: 15000
    };

    /* ==========================================================
     *  БЛОК 2: ОТЛАДКА
     * ========================================================== */
    var D = {
        log: function(t,m){ if(CONFIG.debug) console.log('[ZF]['+t+']',m); },
        err: function(t,m){ console.error('[ZF][ERR]['+t+']',m); },
        noty: function(m){ try{Lampa.Noty.show(m)}catch(e){} }
    };

    D.log('Boot','v'+CONFIG.ver);

    /* ==========================================================
     *  БЛОК 3: СЕТЬ
     * ========================================================== */
    var Net = {
        get: function(url, ok, fail, _i){
            var i = typeof _i==='number' ? _i : CONFIG.pi;
            if(i >= CONFIG.proxy.length){
                if(fail) fail();
                return;
            }
            var pu = CONFIG.proxy[i].replace('{u}', encodeURIComponent(url));
            $.ajax({
                url: pu,
                timeout: CONFIG.timeout,
                success: function(data){ CONFIG.pi=i; if(ok) ok(data); },
                error: function(){ Net.get(url,ok,fail,i+1); }
            });
        }
    };

    /* ==========================================================
     *  БЛОК 4: ИСТОЧНИК ZONAFILM
     * ========================================================== */
    var Src = {
        _bid: function(cb){
            if(CONFIG.buildId){ cb(CONFIG.buildId); return; }
            Net.get(CONFIG.site+'/movies', function(html){
                if(typeof html!=='string'){ cb(null); return; }
                var m=html.match(/"buildId"\s*:\s*"([^"]+)"/);
                if(m&&m[1]){ CONFIG.buildId=m[1]; cb(m[1]); }
                else cb(null);
            }, function(){ cb(null); });
        },

        _list: function(pp){
            var a=pp.data||pp.items||pp.movies||[];
            if(!Array.isArray(a)) a=a.items||a.results||[];
            return a.map(function(m){
                return {
                    title:m.title||'', slug:m.slug||'',
                    year:m.year||0, poster:m.cover_url||'',
                    rating:m.rating||0, quality:m.best_quality||'',
                    description:m.description||'',
                    directors:m.directors||'', duration:m.duration||0
                };
            });
        },

        /**
         * Загрузить каталог
         */
        main: function(page, cb){
            var self=this;
            this._bid(function(bid){
                if(!bid){ cb([]); return; }
                var url=CONFIG.site+'/_next/data/'+bid+'/movies.json';
                if(page>1) url+='?page='+page;
                Net.get(url, function(raw){
                    try{
                        var j=typeof raw==='string'?JSON.parse(raw):raw;
                        var pp=j.pageProps||j;
                        var items=self._list(pp);
                        if(items.length>0){ cb(items); return; }
                    }catch(e){}
                    cb([]);
                }, function(){ cb([]); });
            });
        },

        /**
         * Детали фильма
         */
        getDetails: function(slug, cb){
            this._bid(function(bid){
                if(!bid){ cb(null); return; }
                var url=CONFIG.site+'/_next/data/'+bid+'/movies/'+slug+'.json';
                Net.get(url, function(raw){
                    try{
                        var j=typeof raw==='string'?JSON.parse(raw):raw;
                        var d=(j.pageProps||j).data;
                        if(d){
                            var g=[],c=[];
                            ((d.meta&&d.meta.tags)||[]).forEach(function(t){
                                if(t.type==='genre') g.push(t.title);
                                if(t.type==='country') c.push(t.title);
                            });
                            var act=((d.meta&&d.meta.actors)||[]).map(function(a){
                                return a.name||'';
                            });
                            cb({
                                title:d.title||'', originalTitle:d.title_original||'',
                                slug:d.slug||'', year:d.year||0,
                                description:d.description||'',
                                poster:d.cover_url||'',
                                backdrop:(j.pageProps&&j.pageProps.backdropUrl)||'',
                                duration:d.duration||0, rating:d.rating||0,
                                ratingKP:d.rating_kp||0, ratingIMDB:d.rating_imdb||0,
                                quality:d.best_quality||'', genres:g, countries:c,
                                directors:d.directors||'', writers:d.writers||'',
                                actors:act, ageLimit:d.age_limit||0
                            });
                            return;
                        }
                    }catch(e){}
                    cb(null);
                }, function(){ cb(null); });
            });
        },

        /**
         * Поиск (клиентский)
         */
        search: function(q, cb){
            var lq=q.toLowerCase();
            this.main(1, function(items){
                cb(items.filter(function(m){
                    return m.title.toLowerCase().indexOf(lq)!==-1;
                }));
            });
        },

        /**
         * По жанру
         */
        byGenre: function(slug, cb){
            var self=this;
            this._bid(function(bid){
                if(!bid){ cb([]); return; }
                var url=CONFIG.site+'/_next/data/'+bid+
                    '/movies/filter/genre-'+slug+'.json';
                Net.get(url, function(raw){
                    try{
                        var j=typeof raw==='string'?JSON.parse(raw):raw;
                        cb(self._list(j.pageProps||j));
                    }catch(e){ cb([]); }
                }, function(){ cb([]); });
            });
        },

        streamUrl: function(slug){ return CONFIG.site+'/movies/'+slug; },

        cats: function(){
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
        }
    };


    /* ==========================================================
     *  БЛОК 5: CSS (минимальный — для карточек в компоненте)
     * ========================================================== */
    var CSS = '\
        .zf-card-wrap{padding:1em}\
        .zf-card-grid{display:flex;flex-wrap:wrap;gap:.6em}\
        .zf-card{width:10.5em;position:relative;transition:transform .15s}\
        .zf-card.focus{transform:scale(1.08)}\
        .zf-card-poster{width:100%;height:15em;border-radius:.4em;overflow:hidden;background:#111}\
        .zf-card-poster img{width:100%;height:100%;object-fit:cover}\
        .zf-card-badge{position:absolute;top:.3em;left:.3em;background:rgba(0,0,0,.75);\
            padding:.1em .35em;border-radius:.2em;font-size:.7em;font-weight:700}\
        .zf-card-bg{color:#66BB6A}.zf-card-by{color:#FFA726}.zf-card-br{color:#EF5350}\
        .zf-card-ql{position:absolute;top:.3em;right:.3em;background:#E65100;color:#fff;\
            padding:.05em .3em;border-radius:.2em;font-size:.6em;font-weight:700;\
            text-transform:uppercase}\
        .zf-card-name{color:#eee;font-size:.78em;margin-top:.3em;overflow:hidden;\
            text-overflow:ellipsis;white-space:nowrap}\
        .zf-card-year{color:#666;font-size:.7em}\
        .zf-loading{display:flex;align-items:center;justify-content:center;padding:3em;color:#888}\
        .zf-spinner{display:inline-block;width:1.5em;height:1.5em;border:3px solid #333;\
            border-top-color:#4FC3F7;border-radius:50%;margin-right:.6em;\
            animation:zf-spin .7s linear infinite}\
        @keyframes zf-spin{to{transform:rotate(360deg)}}\
    ';
    $('#zf-css').remove();
    $('<style>').attr('id','zf-css').text(CSS).appendTo('head');


    /* ==========================================================
     *  БЛОК 6: ГЛАВНОЕ МЕНЮ ПЛАГИНА
     *  ---------------------------------------------------------
     *  Используем Lampa.Select — встроенный компонент
     *  с гарантированной навигацией D-pad.
     *
     *  Lampa.Select.show({
     *    title: 'Заголовок',
     *    items: [{title:'Пункт', subtitle:'Описание'}],
     *    onSelect: function(item, index){},
     *    onBack: function(){}
     *  })
     * ========================================================== */

    function showMainMenu(){
        D.log('Menu','Открываю главное меню');

        /**
         * Формируем список пунктов меню
         */
        var items = [];

        /* --- Поиск --- */
        items.push({
            title: '🔍 Поиск фильмов',
            subtitle: 'Найти по названию',
            action: 'search'
        });

        /* --- Все фильмы --- */
        items.push({
            title: '📽 Все фильмы',
            subtitle: 'Популярные и новые',
            action: 'all'
        });

        /* --- Разделитель жанров --- */
        items.push({
            title: '━━━ Жанры ━━━',
            subtitle: '',
            action: 'none'
        });

        /* --- Жанры --- */
        Src.cats().forEach(function(c){
            items.push({
                title: '📂 ' + c.title,
                subtitle: '',
                action: 'genre',
                genre: c.slug
            });
        });

        /* --- Выход --- */
        items.push({
            title: '━━━━━━━━━━━',
            subtitle: '',
            action: 'none'
        });

        items.push({
            title: '← Назад',
            subtitle: 'Вернуться в Lampa',
            action: 'back'
        });

        /**
         * Показываем Select-меню
         */
        Lampa.Select.show({
            title: '🎬 ZonaFilm',
            items: items,

            onBack: function(){
                D.log('Menu','← back');
                Lampa.Controller.toggle('content');
            },

            onSelect: function(item){
                D.log('Menu','Выбрано: '+item.action);

                if(item.action === 'back' || item.action === 'none'){
                    Lampa.Controller.toggle('content');
                    return;
                }

                if(item.action === 'search'){
                    doSearch();
                    return;
                }

                if(item.action === 'all'){
                    loadAndShowCards('Все фильмы', function(cb){
                        Src.main(1, cb);
                    });
                    return;
                }

                if(item.action === 'genre'){
                    loadAndShowCards(item.title, function(cb){
                        Src.byGenre(item.genre, cb);
                    });
                    return;
                }
            }
        });
    }


    /* ==========================================================
     *  БЛОК 7: ПОИСК
     * ========================================================== */

    function doSearch(){
        Lampa.Input.edit({
            title: 'Поиск фильмов',
            value: '',
            free: true,
            nosave: true
        }, function(val){
            if(val && val.trim()){
                var q = val.trim();
                D.log('Search','Запрос: '+q);

                loadAndShowCards('🔍 ' + q, function(cb){
                    Src.search(q, cb);
                });
            } else {
                // Вернуться в меню
                showMainMenu();
            }
        });
    }


    /* ==========================================================
     *  БЛОК 8: ОТОБРАЖЕНИЕ КАРТОЧЕК
     *  ---------------------------------------------------------
     *  Компонент для отображения сетки постеров.
     *  Использует рабочую навигацию:
     *    Controller.add + enable + collectionSet + collectionFocus
     * ========================================================== */

    /**
     * Загрузить данные и показать экран с карточками
     * @param {string}   title    — заголовок экрана
     * @param {function} loader   — функция(callback) для загрузки
     */
    function loadAndShowCards(title, loader){
        D.noty('⏳ Загрузка...');

        loader(function(items){
            if(!items || !items.length){
                D.noty('📭 Ничего не найдено');
                showMainMenu();
                return;
            }

            D.log('Cards','Получено: '+items.length);

            /**
             * Используем Activity.push с кастомным компонентом
             */
            Lampa.Activity.push({
                url: '',
                title: title,
                component: 'zf_cards',
                page: 1,
                movie_items: items  // передаём данные в компонент
            });
        });
    }


    /**
     * Компонент для отображения карточек фильмов
     *
     * Навигация:
     *   Controller.add('content', {back:...})
     *   Controller.enable('content')
     *   Controller.collectionSet(scroll.render())
     *   Controller.collectionFocus(false, scroll.render())
     */
    function CardsComp(object){
        var self   = this;
        var scroll = new Lampa.Scroll({mask:true, over:true, step:250});
        var body   = $('<div class="zf-card-wrap"></div>');
        var grid   = $('<div class="zf-card-grid"></div>');
        var items  = object.movie_items || [];

        this.create = function(){
            D.log('Cards','create, items='+items.length);

            body.append(grid);
            scroll.append(body);

            if(!items.length){
                grid.html('<div style="padding:2em;color:#888;text-align:center">📭 Пусто</div>');
                this.activate();
                return;
            }

            /* Создаём карточки */
            items.forEach(function(m){
                var rc = m.rating>=7 ? 'zf-card-bg' : (m.rating>=5 ? 'zf-card-by' : 'zf-card-br');
                var ql = m.quality ? m.quality.toUpperCase() : '';
                if(ql==='LQ') ql='CAM';
                if(ql==='MQ') ql='HD';

                var card = $([
                    '<div class="zf-card selector">',
                      '<div class="zf-card-poster">',
                        m.poster ?
                          '<img src="'+m.poster+'" loading="lazy"/>' :
                          '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#333;font-size:2.5em">🎬</div>',
                      '</div>',
                      m.rating>0 ? '<div class="zf-card-badge '+rc+'">★ '+m.rating.toFixed(1)+'</div>' : '',
                      ql ? '<div class="zf-card-ql">'+ql+'</div>' : '',
                      '<div class="zf-card-name">'+m.title+'</div>',
                      '<div class="zf-card-year">'+(m.year||'')+'</div>',
                    '</div>'
                ].join(''));

                /* Клик по карточке → детали */
                card.on('hover:enter', function(){
                    showMovieDetails(m.slug, m.title);
                });

                /* Скролл при фокусе */
                card.on('hover:focus', function(){
                    scroll.update($(this));
                });

                grid.append(card);
            });

            this.activate();
        };

        /**
         * ✅ Рабочая навигация для bylampa
         */
        this.activate = function(){
            D.log('Cards','activate, selectors='+scroll.render().find('.selector').length);

            Lampa.Controller.add('content', {
                back: function(){
                    D.log('Cards','← back → меню');
                    Lampa.Activity.backward();

                    /* После возврата — снова показываем меню */
                    setTimeout(function(){
                        showMainMenu();
                    }, 300);
                }
            });

            Lampa.Controller.enable('content');
            Lampa.Controller.collectionSet(scroll.render());
            Lampa.Controller.collectionFocus(false, scroll.render());
        };

        this.start = function(){
            D.log('Cards','start');
            this.activate();
        };

        this.pause = function(){};
        this.stop = function(){};
        this.render = function(){ return scroll.render(); };
        this.destroy = function(){ scroll.destroy(); };
    }


    /* ==========================================================
     *  БЛОК 9: ДЕТАЛИ ФИЛЬМА (Select)
     *  ---------------------------------------------------------
     *  Показываем информацию через Lampa.Select —
     *  гарантированно рабочая навигация.
     * ========================================================== */

    function showMovieDetails(slug, title){
        D.log('Detail','Загрузка: '+slug);
        D.noty('⏳ ' + title);

        Src.getDetails(slug, function(m){
            if(!m){
                D.noty('⚠ Не удалось загрузить');
                return;
            }

            D.log('Detail','Показ: '+m.title);

            /* Формируем рейтинг */
            var ratingText = '';
            if(m.rating > 0) ratingText += '★ ' + m.rating.toFixed(1);
            if(m.ratingKP > 0) ratingText += '  КП: ' + m.ratingKP.toFixed(1);
            if(m.ratingIMDB > 0) ratingText += '  IMDb: ' + m.ratingIMDB.toFixed(1);

            /* Качество */
            var ql = m.quality ? m.quality.toUpperCase() : '';
            if(ql==='LQ') ql='CAM'; if(ql==='MQ') ql='HD';

            /* Пункты меню деталей */
            var detailItems = [];

            /* Кнопка Смотреть */
            detailItems.push({
                title: '▶ Смотреть',
                subtitle: m.title + (m.year ? ' ('+m.year+')' : ''),
                action: 'play'
            });

            /* Информация */
            if(ratingText){
                detailItems.push({
                    title: '⭐ Рейтинг',
                    subtitle: ratingText,
                    action: 'info'
                });
            }

            if(m.year || m.duration){
                var yearDur = '';
                if(m.year) yearDur += m.year;
                if(m.duration) yearDur += ' • ' + m.duration + ' мин';
                if(ql) yearDur += ' • ' + ql;
                if(m.ageLimit) yearDur += ' • ' + m.ageLimit + '+';
                detailItems.push({
                    title: '📅 Информация',
                    subtitle: yearDur,
                    action: 'info'
                });
            }

            if(m.genres.length){
                detailItems.push({
                    title: '🎭 Жанры',
                    subtitle: m.genres.join(', '),
                    action: 'info'
                });
            }

            if(m.countries.length){
                detailItems.push({
                    title: '🌍 Страна',
                    subtitle: m.countries.join(', '),
                    action: 'info'
                });
            }

            if(m.directors){
                detailItems.push({
                    title: '🎬 Режиссёр',
                    subtitle: m.directors,
                    action: 'info'
                });
            }

            if(m.writers){
                detailItems.push({
                    title: '✍ Сценарий',
                    subtitle: m.writers,
                    action: 'info'
                });
            }

            if(m.actors.length){
                detailItems.push({
                    title: '👥 Актёры',
                    subtitle: m.actors.slice(0,6).join(', '),
                    action: 'info'
                });
            }

            if(m.description){
                /* Обрезаем описание для subtitle */
                var desc = m.description.length > 200 ?
                    m.description.substring(0, 200) + '...' :
                    m.description;
                detailItems.push({
                    title: '📝 Описание',
                    subtitle: desc,
                    action: 'info'
                });
            }

            /* Назад */
            detailItems.push({
                title: '← Назад к списку',
                subtitle: '',
                action: 'back'
            });

            /* Показываем Select с деталями */
            Lampa.Select.show({
                title: '🎬 ' + m.title + (m.year ? ' ('+m.year+')' : ''),
                items: detailItems,

                onBack: function(){
                    D.log('Detail','← back');
                    Lampa.Controller.toggle('content');
                },

                onSelect: function(item){
                    if(item.action === 'play'){
                        playMovie(m);
                        return;
                    }

                    if(item.action === 'back'){
                        Lampa.Controller.toggle('content');
                        return;
                    }

                    /* info — ничего не делаем, просто информация */
                }
            });
        });
    }


    /* ==========================================================
     *  БЛОК 10: ВОСПРОИЗВЕДЕНИЕ
     * ========================================================== */

    function playMovie(m){
        var url = Src.streamUrl(m.slug);
        D.log('Play','URL: '+url);

        /* Android — открываем в системном браузере */
        try {
            if(typeof Lampa.Android !== 'undefined' && Lampa.Android.openUrl){
                D.log('Play','Android.openUrl');
                Lampa.Android.openUrl(url);
                return;
            }
        } catch(e){}

        /* Fallback — уведомление со ссылкой */
        D.noty('🔗 Открываю: ' + m.title);

        try {
            window.open(url, '_blank');
        } catch(e){
            D.noty('Скопируйте ссылку: ' + url);
        }
    }


    /* ==========================================================
     *  БЛОК 11: РЕГИСТРАЦИЯ + МЕНЮ + ЗАПУСК
     * ========================================================== */

    /* Регистрируем компонент карточек */
    Lampa.Component.add('zf_cards', CardsComp);

    /* Иконка */
    var ICO = '<svg viewBox="0 0 24 24" fill="currentColor">' +
        '<path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2z' +
        'M8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2z' +
        'm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>';

    /**
     * Кнопка в боковом меню
     */
    function addMenu(){
        if($('[data-action="zonafilm"]').length) return;

        var li = $('<li class="menu__item selector" data-action="zonafilm">' +
            '<div class="menu__ico">'+ICO+'</div>' +
            '<div class="menu__text">ZonaFilm</div></li>');

        li.on('hover:enter', function(){
            D.log('Menu','→ главное меню плагина');
            showMainMenu();
        });

        var list = $('.menu .menu__list');
        if(list.length){ list.eq(0).append(li); D.log('Menu','✅'); return; }
        var ul = $('.menu ul');
        if(ul.length){ ul.eq(0).append(li); D.log('Menu','✅'); }
    }

    /**
     * Запуск
     */
    function init(){
        try {
            addMenu();
            D.noty('🎬 ZonaFilm v'+CONFIG.ver);
            D.log('Boot','✅');
        } catch(e){
            D.err('Boot',e.message);
        }
    }

    if(window.appready) init();
    else Lampa.Listener.follow('app', function(e){
        if(e.type === 'ready') init();
    });

})();
