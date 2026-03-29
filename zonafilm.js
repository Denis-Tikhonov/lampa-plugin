/**
 * ZonaFilm v1.2-test — ДИАГНОСТИКА СЕТИ
 * Проверяет все прокси и показывает результат
 */
(function(){
    'use strict';

    var PROXIES = [
        { name: 'codetabs',    tpl: 'https://api.codetabs.com/v1/proxy?quest={u}' },
        { name: 'corsproxy',   tpl: 'https://corsproxy.io/?{u}' },
        { name: 'allorigins',  tpl: 'https://api.allorigins.win/raw?url={u}' },
        { name: 'corsproxy2',  tpl: 'https://cors-proxy.fringe.zone/?{u}' },
        { name: 'proxy-cloud', tpl: 'https://api.cors.lol/?url={u}' }
    ];

    var TARGET = 'https://zonafilm.ru/_next/data/39MEgPaxeFXNBOSc6BloZ/movies.json';

    var ICO = '<svg viewBox="0 0 24 24" fill="currentColor">' +
        '<path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2z' +
        'M8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2z' +
        'm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>';

    function testProxies(){
        var results = [];
        var done = 0;
        var total = PROXIES.length;

        Lampa.Noty.show('🔧 Тестирую '+total+' прокси...');

        PROXIES.forEach(function(proxy, idx){
            var url = proxy.tpl.replace('{u}', encodeURIComponent(TARGET));
            var startTime = Date.now();

            $.ajax({
                url: url,
                timeout: 15000,
                success: function(data){
                    var elapsed = Date.now() - startTime;
                    var dataLen = typeof data === 'string' ? data.length : JSON.stringify(data).length;

                    /* Проверяем что пришли реальные данные */
                    var hasMovies = false;
                    try {
                        var j = typeof data === 'string' ? JSON.parse(data) : data;
                        var pp = j.pageProps || j;
                        var arr = pp.data || [];
                        hasMovies = Array.isArray(arr) && arr.length > 0;
                    } catch(e){}

                    results[idx] = {
                        name: proxy.name,
                        status: hasMovies ? '✅ РАБОТАЕТ' : '⚠ Ответ без фильмов',
                        detail: elapsed+'мс, '+dataLen+' байт' +
                                (hasMovies ? ', фильмов: '+arr.length : ''),
                        works: hasMovies,
                        time: elapsed
                    };
                    checkDone();
                },
                error: function(xhr, status, err){
                    var elapsed = Date.now() - startTime;
                    results[idx] = {
                        name: proxy.name,
                        status: '❌ ОШИБКА',
                        detail: status + ' ' + (err||'') + ' ('+elapsed+'мс)',
                        works: false,
                        time: elapsed
                    };
                    checkDone();
                }
            });
        });

        function checkDone(){
            done++;
            Lampa.Noty.show('🔧 Прокси: '+done+'/'+total);

            if(done < total) return;

            /* Все тесты завершены — показываем результат */
            showResults(results);
        }
    }

    function showResults(results){
        var items = [];

        /* Заголовок */
        var working = results.filter(function(r){ return r.works; });

        items.push({
            title: '🔧 Результат теста прокси',
            subtitle: 'Работает: '+working.length+' из '+results.length
        });

        items.push({
            title: '━━━━━━━━━━━━━━━',
            subtitle: ''
        });

        /* Результат каждого прокси */
        results.forEach(function(r){
            items.push({
                title: r.status + ' ' + r.name,
                subtitle: r.detail
            });
        });

        items.push({
            title: '━━━━━━━━━━━━━━━',
            subtitle: ''
        });

        /* Если есть рабочий прокси — кнопка теста загрузки */
        if(working.length > 0){
            var best = working.sort(function(a,b){ return a.time - b.time; })[0];
            items.push({
                title: '🎬 Тест загрузки через ' + best.name,
                subtitle: 'Загрузить список фильмов',
                action: 'test_load',
                proxyTpl: PROXIES.filter(function(p){
                    return p.name === best.name;
                })[0].tpl
            });
        }

        /* Ручной тест прямого запроса (без прокси) */
        items.push({
            title: '🌐 Тест БЕЗ прокси (прямой запрос)',
            subtitle: 'Проверить доступ к zonafilm.ru напрямую',
            action: 'test_direct'
        });

        items.push({
            title: '← Назад',
            subtitle: '',
            action: 'back'
        });

        Lampa.Select.show({
            title: '🔧 ZonaFilm — Диагностика сети',
            items: items,
            onBack: function(){
                Lampa.Controller.toggle('content');
            },
            onSelect: function(item){
                if(item.action === 'back'){
                    Lampa.Controller.toggle('content');
                    return;
                }

                if(item.action === 'test_load'){
                    testLoadMovies(item.proxyTpl);
                    return;
                }

                if(item.action === 'test_direct'){
                    testDirect();
                    return;
                }
            }
        });
    }

    /**
     * Тест загрузки фильмов через конкретный прокси
     */
    function testLoadMovies(proxyTpl){
        Lampa.Noty.show('⏳ Загрузка фильмов...');

        var url = proxyTpl.replace('{u}', encodeURIComponent(TARGET));

        $.ajax({
            url: url,
            timeout: 15000,
            success: function(data){
                try {
                    var j = typeof data === 'string' ? JSON.parse(data) : data;
                    var pp = j.pageProps || j;
                    var arr = pp.data || [];

                    if(arr.length > 0){
                        /* Показываем первые 5 фильмов */
                        var items = [{
                            title: '✅ Загружено: '+arr.length+' фильмов',
                            subtitle: 'Первые 5:'
                        }];

                        arr.slice(0,5).forEach(function(m){
                            items.push({
                                title: m.title + ' ('+m.year+')',
                                subtitle: '★ '+(m.rating||0)+' | '+m.slug
                            });
                        });

                        items.push({
                            title: '← Назад',
                            subtitle: '', action: 'back'
                        });

                        Lampa.Select.show({
                            title: '✅ Фильмы загружены!',
                            items: items,
                            onBack: function(){ Lampa.Controller.toggle('content'); },
                            onSelect: function(item){
                                if(item.action === 'back') Lampa.Controller.toggle('content');
                            }
                        });
                    } else {
                        Lampa.Noty.show('⚠ Данные пусты');
                    }
                } catch(e){
                    Lampa.Noty.show('⚠ Ошибка парсинга: '+e.message);
                }
            },
            error: function(xhr, st, err){
                Lampa.Noty.show('❌ Ошибка: '+st+' '+err);
            }
        });
    }

    /**
     * Тест прямого запроса без прокси
     */
    function testDirect(){
        Lampa.Noty.show('⏳ Прямой запрос...');

        $.ajax({
            url: TARGET,
            timeout: 10000,
            success: function(data){
                try {
                    var j = typeof data === 'string' ? JSON.parse(data) : data;
                    var pp = j.pageProps || j;
                    var arr = pp.data || [];
                    Lampa.Noty.show('✅ Прямой: '+arr.length+' фильмов (CORS не блокирует!)');
                } catch(e){
                    Lampa.Noty.show('⚠ Прямой: данные получены но ошибка парсинга');
                }
            },
            error: function(xhr, st){
                Lampa.Noty.show('❌ Прямой: '+st+' (нужен прокси)');
            }
        });
    }

    /* Кнопка в меню */
    function addMenu(){
        if($('[data-action="zonafilm"]').length) return;
        var li = $('<li class="menu__item selector" data-action="zonafilm">'+
            '<div class="menu__ico">'+ICO+'</div>'+
            '<div class="menu__text">ZF Тест сети</div></li>');
        li.on('hover:enter', function(){
            testProxies();
        });
        var list = $('.menu .menu__list');
        if(list.length) list.eq(0).append(li);
        else{
            var ul = $('.menu ul');
            if(ul.length) ul.eq(0).append(li);
        }
    }

    function init(){
        addMenu();
        Lampa.Noty.show('🔧 ZF Тест сети готов');
    }

    if(window.appready) init();
    else Lampa.Listener.follow('app', function(e){
        if(e.type === 'ready') init();
    });
})();
