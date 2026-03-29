/**
 * ============================================================
 *  LAMPA PLUGIN — ZonaFilm v1.2.0
 * ============================================================
 *
 *  ИЗМЕНЕНИЯ v1.2 (Этап 2: Парсинг и воспроизведение):
 *    ✅ Парсинг реального HTML каталога через DOMParser
 *    ✅ Извлечение постеров, годов, рейтингов из карточек
 *    ✅ Добавлен метод Net.post() для запросов к API
 *    ✅ Метод getStream() обращается к /api/getStream
 *    ✅ Извлечение .m3u8 ссылки из ответа API
 *    ✅ Воспроизведение через встроенный Lampa.Player (HLS)
 *    ✅ Усиленная отладка на этапе получения видео
 *
 *  СТРУКТУРА:
 *    Меню (Select) → Карточки из HTML (Component) → Play (Lampa.Player)
 * ============================================================
 */

(function () {
    'use strict';

    /* ==========================================================
     *  БЛОК 1: КОНФИГУРАЦИЯ
     * ========================================================== */
    var CONFIG = {
        debug: true,
        ver: '1.2.0',
        site: 'https://zonafilm.ru',
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
        log: function(t,m){
            if(CONFIG.debug) console.log('[ZF]['+t+']',m);
        },
        err: function(t,m){
            console.error('[ZF][ERR]['+t+']',m);
        },
        noty: function(m){
            try{ Lampa.Noty.show(m); }catch(e){}
        }
    };

    D.log('Boot','v'+CONFIG.ver);

    /* ==========================================================
     *  БЛОК 3: СЕТЬ (GET и POST)
     * ========================================================== */
    var Net = {
        get: function(url, ok, fail, _i){
            var i = typeof _i === 'number' ? _i : CONFIG.pi;
            if(i >= CONFIG.proxy.length){
                D.err('Net','Все прокси недоступны (GET): '+url);
                if(fail) fail();
                return;
            }
            var pu = CONFIG.proxy[i].replace('{u}', encodeURIComponent(url));
            D.log('Net','GET Прокси #'+i);
            $.ajax({ url: pu, timeout: CONFIG.timeout, success: function(data){
                CONFIG.pi = i; D.log('Net','✅ GET Успех'); if(ok) ok(data);
            }, error: function(xhr, status, err){
                D.log('Net','❌ GET Ошибка #'+i); Net.get(url, ok, fail, i+1);
            }});
        },
        post: function(url, payload, ok, fail, _i){
            var i = typeof _i === 'number' ? _i : CONFIG.pi;
            if(i >= CONFIG.proxy.length){
                D.err('Net','Все прокси недоступны (POST): '+url);
                if(fail) fail();
                return;
            }
            var pu = CONFIG.proxy[i].replace('{u}', encodeURIComponent(url));
            D.log('Net','POST Прокси #'+i+' -> '+url);
            $.ajax({
                url: pu,
                type: 'POST',
                data: JSON.stringify(payload),
                contentType: 'application/json',
                timeout: CONFIG.timeout,
                success: function(data){
                    CONFIG.pi = i; 
                    D.log('Net','✅ POST Успех'); 
                    if(ok) ok(data);
                },
                error: function(xhr, status, err){
                    D.log('Net','❌ POST Ошибка #'+i+': '+status);
                    Net.post(url, payload, ok, fail, i+1);
                }
            });
        }
    };

    /* ==========================================================
     *  БЛОК 4: ИСТОЧНИК ZONAFILM (HTML PARSER + API)
     * ========================================================== */
    var Src = {
        /**
         * Парсинг HTML-каталога
         */
        main: function(page, cb){
            D.log('Src','main() page='+page);
            D.noty('⏳ Парсинг каталога...');

            var url = CONFIG.site + '/movies';
            // Если нужна другая страница, можно попробовать url += '?page='+page; 
            // Но часто такие сайты подгружают пагинацию через JS. Пока берем первую.

            Net.get(url, function(html){
                if(typeof html !== 'string'){
                    D.err('Src','Ответ не является HTML строкой');
                    cb([]); return;
                }

                try {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(html, 'text/html');
                    var cards = doc.querySelectorAll('a.group');
                    var items = [];

                    cards.forEach(function(a){
                        var href = a.getAttribute('href') || '';
                        if(href.indexOf('/movies/') === -1) return;

                        var slug = href.replace('/movies/', '').replace('/', '');
                        
                        var img = a.querySelector('img');
                        var poster = img ? (img.getAttribute('src') || '') : '';
                        
                        var yearEl = a.querySelector('[data-testid="filmcardYear"]');
                        var year = yearEl ? yearEl.textContent.trim() : '';
                        
                        var ratEl = a.querySelector('[data-testid="cardRating"]');
                        var ratText = ratEl ? ratEl.textContent.trim().replace(',', '.') : '0';
                        var rating = parseFloat(ratText) || 0;

                        var titleEl = a.querySelector('p');
                        var title = titleEl ? titleEl.textContent.trim() : 'Без названия';

                        if(title && slug){
                            items.push({
                                title: title,
                                slug: slug,
                                year: year,
                                poster: poster,
                                rating: rating,
                                quality: '' // В каталоге качества нет, будет определено при запросе потока
                            });
                        }
                    });

                    D.log('Src','Спарсено карточек: '+items.length);
                    if(items.length > 0) D.noty('✅ Найдено фильмов: '+items.length);
                    else D.noty('⚠ Карточки не найдены (возможно changed HTML)');
                    
                    cb(items);
                } catch(e){
                    D.err('Src','Ошибка DOMParser: '+e.message);
                    cb([]);
                }
            }, function(){
                D.err('Src','Сетевая ошибка загрузки каталога');
                D.noty('⚠ Ошибка сети при загрузке каталога');
                cb([]);
            });
        },

        /**
         * Получение ссылки на видео через API сайта
         * Предполагается, что API принимает slug и возвращает JSON с m3u8
         */
        getStream: function(slug, cb){
            D.log('Src','Запрос видео для: '+slug);
            D.noty('⏳ Получение ссылки на видео...');

            var apiUrl = CONFIG.site + '/api/getStream';
            
            // Отправляем запрос. Тело запроса подобрано типичное для таких API.
            // Если API требует другие параметры, отладка ниже покажет ошибку 400 или пустой ответ.
            var payload = { slug: slug };

            Net.post(apiUrl, payload, function(raw){
                D.log('Src','Ответ API getStream получен');
                
                // Преобразуем ответ в строку для поиска m3u8 ссылки
                var responseStr = typeof raw === 'string' ? raw : JSON.stringify(raw);
                D.log('Src','Тело ответа (фрагмент): ' + responseStr.substring(0, 500));

                // Ищем любую ссылку, заканчивающуюся на .m3u8
                var m3u8Regex = /(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/g;
                var match = m3u8Regex.exec(responseStr);

                if(match && match[1]){
                    D.log('Src','✅ Найдена m3u8 ссылка: ' + match[1]);
                    cb(match[1]);
                } else {
                    D.err('Src','m3u8 ссылка не найдена в ответе API!');
                    D.noty('⚠ Ссылка на видео не найдена');
                    cb(null);
                }
            }, function(){
                D.err('Src','Ошибка запроса к /api/getStream');
                D.noty('⚠ Не удалось связаться с API видео');
                cb(null);
            });
        },

        /**
         * Заглушки для будущих этапов (поиск, жанры)
         */
        search: function(q, cb){
            D.noty('⚠ Поиск будет добавлен на следующем этапе');
            cb([]);
        },
        byGenre: function(slug, cb){
            D.noty('⚠ Жанры будут добавлены на следующем этапе');
            cb([]);
        },
        cats: function(){
            return [{title:'Боевик',slug:'boevik'},{title:'Комедия',slug:'komediia'}]; // сокращено для меню
        }
    };

    /* ==========================================================
     *  БЛОК 5: CSS
     * ========================================================== */
    var CSS = '\
        .zf-wrap{padding:1em}\
        .zf-grid{display:flex;flex-wrap:wrap;gap:.6em}\
        .zf-card{width:10.5em;position:relative;transition:transform .15s}\
        .zf-card.focus{transform:scale(1.08)}\
        .zf-poster{width:100%;height:15em;border-radius:.4em;overflow:hidden;background:#111}\
        .zf-poster img{width:100%;height:100%;object-fit:cover}\
        .zf-badge{position:absolute;top:.3em;left:.3em;background:rgba(0,0,0,.75);\
            padding:.1em .35em;border-radius:.2em;font-size:.7em;font-weight:700}\
        .zf-bg{color:#66BB6A}.zf-by{color:#FFA726}.zf-br{color:#EF5350}\
        .zf-ql{position:absolute;top:.3em;right:.3em;background:#E65100;color:#fff;\
            padding:.05em .3em;border-radius:.2em;font-size:.6em;font-weight:700;\
            text-transform:uppercase}\
        .zf-name{color:#eee;font-size:.78em;margin-top:.3em;overflow:hidden;\
            text-overflow:ellipsis;white-space:nowrap}\
        .zf-year{color:#666;font-size:.7em}\
        .zf-loading{display:flex;align-items:center;justify-content:center;\
            padding:3em;color:#888;font-size:1.1em}\
        .zf-spin{display:inline-block;width:1.5em;height:1.5em;border:3px solid #333;\
            border-top-color:#4FC3F7;border-radius:50%;margin-right:.6em;\
            animation:zfspin .7s linear infinite}\
        @keyframes zfspin{to{transform:rotate(360deg)}}\
        .zf-empty{text-align:center;padding:3em;color:#666;font-size:1.1em}\
    ';
    $('#zf-css').remove();
    $('<style>').attr('id','zf-css').text(CSS).appendTo('head');

    /* ==========================================================
     *  БЛОК 6: ГЛАВНОЕ МЕНЮ (Select)
     * ========================================================== */
    function showMainMenu(){
        var items = [
            { title: '🔍 Поиск фильмов', subtitle: '(В разработке)', action: 'search' },
            { title: '📽 Все фильмы', subtitle: 'Парсинг HTML каталога', action: 'all' },
            { title: '━━━ Жанры ━━━', subtitle: '', action: 'none' }
        ];

        Src.cats().forEach(function(c){
            items.push({ title: '📂 ' + c.title, subtitle: '(В разработке)', action: 'genre', genre: c.slug, genreTitle: c.title });
        });

        items.push({ title: '← Назад', subtitle: 'Вернуться в Lampa', action: 'back' });

        Lampa.Select.show({
            title: '🎬 ZonaFilm v'+CONFIG.ver,
            items: items,
            onBack: function(){ Lampa.Controller.toggle('content'); },
            onSelect: function(item){
                if(item.action === 'back' || item.action === 'none' || item.action === 'search' || item.action === 'genre'){
                    if(item.action === 'back') Lampa.Controller.toggle('content');
                    if(item.action === 'search' || item.action === 'genre') D.noty('Функция будет доступна на этапе 3-4');
                    return;
                }
                if(item.action === 'all'){
                    Lampa.Activity.push({
                        url: '', title: 'Все фильмы', component: 'zf_cards', page: 1, zf_mode: 'all'
                    });
                }
            }
        });
    }

    /* ==========================================================
     *  БЛОК 7: КОМПОНЕНТ КАРТОЧЕК
     * ========================================================== */
    function CardsComp(object){
        var self   = this;
        var scroll = new Lampa.Scroll({mask:true, over:true, step:250});
        var body   = $('<div class="zf-wrap"></div>');
        var grid   = $('<div class="zf-grid"></div>');
        var mode   = object.zf_mode || 'all';

        this.create = function(){
            var loader = $('<div class="zf-loading" id="zf-loader"><div class="zf-spin"></div>Парсинг страницы...</div>');
            body.append(loader);
            body.append(grid);
            scroll.append(body);

            Src.main(1, function(items){ self.onDataLoaded(items); });
        };

        this.onDataLoaded = function(items){
            $('#zf-loader').remove();
            if(!items.length){
                grid.html('<div class="zf-empty">📭 Пусто (проверьте прокси или HTML структуру)</div>');
                this.activate(); return;
            }

            items.forEach(function(m){
                var rc = m.rating >= 7 ? 'zf-bg' : (m.rating >= 5 ? 'zf-by' : 'zf-br');
                var card = $([
                    '<div class="zf-card selector">',
                      '<div class="zf-poster">',
                        m.poster ? '<img src="'+m.poster+'" loading="lazy"/>' : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#333;font-size:2.5em">🎬</div>',
                      '</div>',
                      m.rating > 0 ? '<div class="zf-badge '+rc+'">★ '+m.rating.toFixed(1)+'</div>' : '',
                      '<div class="zf-name">'+m.title+'</div>',
                      '<div class="zf-year">'+m.year+'</div>',
                    '</div>'
                ].join(''));

                // При нажатии на карточку — сразу запрашиваем поток
                card.on('hover:enter', function(){
                    startPlayback(m.slug, m.title);
                });

                card.on('hover:focus', function(){ scroll.update($(this)); });
                grid.append(card);
            });
            this.activate();
        };

        this.activate = function(){
            Lampa.Controller.add('content', {
                back: function(){ Lampa.Activity.backward(); setTimeout(showMainMenu, 300); }
            });
            Lampa.Controller.enable('content');
            Lampa.Controller.collectionSet(scroll.render());
            Lampa.Controller.collectionFocus(false, scroll.render());
        };

        this.start = function(){ this.activate(); };
        this.pause = function(){};
        this.stop = function(){};
        this.render = function(){ return scroll.render(); };
        this.destroy = function(){ scroll.destroy(); };
    }

    /* ==========================================================
     *  БЛОК 8: ВОСПРОИЗВЕДЕНИЕ (Lampa.Player)
     * ========================================================== */
    function startPlayback(slug, title){
        D.log('Play','Старт для: '+slug);
        
        // Шаг 1: Получаем m3u8 через API
        Src.getStream(slug, function(streamUrl){
            if(!streamUrl){
                D.noty('❌ Не удалось получить ссылку на видео');
                return;
            }

            D.log('Play','Запуск плеера: '+streamUrl);
            D.noty('▶ Запуск: ' + title);

            // Шаг 2: Запускаем встроенный плеер Lampa
            // Lampa.Player умеет играть HLS (.m3u8) из коробки на Android TV
            Lampa.Player.play({
                title: title,
                url: streamUrl,
                // Если потребуются субтитры или качества, они добавляются сюда
            });
            
            Lampa.Player.show();
        });
    }

    /* ==========================================================
     *  БЛОК 9: РЕГИСТРАЦИЯ + ЗАПУСК
     * ========================================================== */
    Lampa.Component.add('zf_cards', CardsComp);

    var ICO = '<svg viewBox="0 0 24 24" fill="currentColor">'+
        '<path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2z'+
        'M8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2z'+
        'm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>';

    function addMenu(){
        if($('[data-action="zonafilm"]').length) return;
        var li = $('<li class="menu__item selector" data-action="zonafilm">'+
            '<div class="menu__ico">'+ICO+'</div>'+
            '<div class="menu__text">ZonaFilm</div></li>');
        li.on('hover:enter', function(){ showMainMenu(); });
        var list = $('.menu .menu__list');
        if(list.length){ list.eq(0).append(li); return; }
        var ul = $('.menu ul');
        if(ul.length) ul.eq(0).append(li);
    }

    function init(){
        try {
            addMenu();
            D.noty('🎬 ZonaFilm v'+CONFIG.ver + ' (Этап 2)');
            D.log('Boot','✅ Загружен');
        } catch(e){ D.err('Boot',e.message); }
    }

    if(window.appready) init();
    else Lampa.Listener.follow('app', function(e){ if(e.type === 'ready') init(); });

})();
