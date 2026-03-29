/**
 * ZonaFilm v1.4-debug — ПОЛНАЯ ДИАГНОСТИКА НА ЭКРАНЕ
 */
(function(){
    'use strict';

    /**
     * ⚠️ ВПИШИТЕ ВАШ URL WORKER
     */
    var WORKER = 'https://zonaproxy.777b737.workers.dev';

    var CONFIG = {
        site: 'https://zonafilm.ru',
        buildId: '39MEgPaxeFXNBOSc6BloZ',
        timeout: 15000
    };

    var ICO = '<svg viewBox="0 0 24 24" fill="currentColor">' +
        '<path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2z' +
        'M8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2z' +
        'm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>';

    /**
     * Пошаговый тест с выводом на экран
     */
    function runDebug(){
        var steps = [];

        function addStep(text){
            steps.push({ title: text, subtitle: '' });
        }

        function showSteps(){
            steps.push({ title: '━━━━━━━━━━━', subtitle: '' });
            steps.push({ title: '← Назад', subtitle: '', action: 'back' });

            Lampa.Select.show({
                title: '🔧 ZonaFilm Debug',
                items: steps,
                onBack: function(){ Lampa.Controller.toggle('content'); },
                onSelect: function(item){
                    if(item.action === 'back') Lampa.Controller.toggle('content');
                }
            });
        }

        /* ШАГ 1: Проверяем Worker URL */
        addStep('1️⃣ Worker URL: ' + WORKER);

        if(WORKER.indexOf('YOUR') !== -1){
            addStep('❌ URL Worker не заменён!');
            addStep('Откройте zonafilm.js');
            addStep('Замените YOUR-NAME на ваш логин Cloudflare');
            showSteps();
            return;
        }

        /* ШАГ 2: Пингуем Worker без параметров */
        addStep('2️⃣ Пингую Worker...');

        $.ajax({
            url: WORKER + '/',
            timeout: 10000,
            success: function(data){
                var txt = typeof data === 'string' ? data : JSON.stringify(data);
                addStep('✅ Worker отвечает: ' + txt.substring(0, 100));
                doStep3();
            },
            error: function(xhr, status, err){
                addStep('❌ Worker НЕ отвечает: ' + status + ' ' + err + ' HTTP=' + xhr.status);
                addStep('Проверьте: Worker задеплоен?');
                addStep('URL правильный?');
                showSteps();
            }
        });

        /* ШАГ 3: Запрос фильмов */
        function doStep3(){
            var target = CONFIG.site + '/_next/data/' + CONFIG.buildId + '/movies.json';
            var fullUrl = WORKER + '/?url=' + encodeURIComponent(target);

            addStep('3️⃣ Запрос фильмов...');
            addStep('Target: ' + target);
            addStep('Full URL: ' + fullUrl.substring(0, 120) + '...');

            $.ajax({
                url: fullUrl,
                timeout: 15000,
                success: function(data){
                    addStep('✅ Ответ получен!');
                    addStep('Тип: ' + typeof data);

                    var str = typeof data === 'string' ? data : JSON.stringify(data);
                    addStep('Размер: ' + str.length + ' символов');
                    addStep('Начало: ' + str.substring(0, 150));

                    /* Пробуем парсить */
                    try {
                        var j = typeof data === 'string' ? JSON.parse(data) : data;
                        addStep('✅ JSON парсинг OK');
                        addStep('Ключи: ' + Object.keys(j).join(', '));

                        if(j.error){
                            addStep('❌ Worker вернул ошибку: ' + j.error);
                            showSteps();
                            return;
                        }

                        var pp = j.pageProps;
                        if(pp){
                            addStep('✅ pageProps найден');
                            addStep('pageProps ключи: ' + Object.keys(pp).join(', '));

                            if(pp.data && Array.isArray(pp.data)){
                                addStep('✅ data массив: ' + pp.data.length + ' элементов');

                                if(pp.data.length > 0){
                                    var first = pp.data[0];
                                    addStep('🎬 Первый: ' + first.title + ' (' + first.year + ')');
                                    addStep('   slug: ' + first.slug);
                                    addStep('   poster: ' + (first.cover_url || 'нет').substring(0, 80));
                                    addStep('');
                                    addStep('✅✅✅ ВСЁ РАБОТАЕТ! ✅✅✅');
                                    addStep('Фильмов: ' + pp.data.length);
                                } else {
                                    addStep('⚠ data пуст');
                                }
                            } else {
                                addStep('⚠ data не массив или нет');
                                if(pp.data) addStep('typeof data: ' + typeof pp.data);
                            }
                        } else {
                            addStep('⚠ Нет pageProps');

                            /* Может buildId устарел */
                            if(j.notFound || j.redirect){
                                addStep('❌ buildId устарел! notFound/redirect');
                                addStep('Пробую определить новый...');
                                doStep4_buildId();
                                return;
                            }
                        }
                    } catch(e){
                        addStep('❌ JSON парсинг ошибка: ' + e.message);

                        /* Может HTML */
                        if(str.indexOf('__NEXT_DATA__') !== -1){
                            addStep('📄 Это HTML с __NEXT_DATA__');
                            try {
                                var tag = '__NEXT_DATA__" type="application/json">';
                                var s = str.indexOf(tag) + tag.length;
                                var e2 = str.indexOf('</script>', s);
                                var inner = JSON.parse(str.substring(s, e2));
                                addStep('✅ Внутренний JSON ОК');
                                if(inner.buildId){
                                    addStep('BuildId: ' + inner.buildId);
                                    CONFIG.buildId = inner.buildId;
                                }
                                var pp2 = inner.pageProps;
                                if(pp2 && pp2.data){
                                    addStep('✅ Фильмов: ' + pp2.data.length);
                                }
                            } catch(e3){
                                addStep('❌ HTML парсинг: ' + e3.message);
                            }
                        } else if(str.indexOf('<html') !== -1){
                            addStep('📄 Это HTML страница');
                            var tm = str.match(/<title>([^<]*)<\/title>/i);
                            if(tm) addStep('Title: ' + tm[1]);
                        }
                    }

                    showSteps();
                },
                error: function(xhr, status, err){
                    addStep('❌ Запрос ошибка: ' + status + ' ' + err);
                    addStep('HTTP код: ' + xhr.status);
                    addStep('Response: ' + (xhr.responseText || '').substring(0, 200));
                    showSteps();
                }
            });
        }

        /* ШАГ 4: Попробовать определить buildId из HTML */
        function doStep4_buildId(){
            var htmlUrl = WORKER + '/?url=' + encodeURIComponent(CONFIG.site + '/movies');

            addStep('4️⃣ Загрузка HTML для buildId...');

            $.ajax({
                url: htmlUrl,
                timeout: 15000,
                success: function(html){
                    if(typeof html !== 'string'){
                        addStep('❌ Ответ не строка');
                        showSteps();
                        return;
                    }

                    addStep('Получен HTML: ' + html.length + ' симв');

                    var m = html.match(/"buildId"\s*:\s*"([^"]+)"/);
                    if(m && m[1]){
                        addStep('✅ Новый buildId: ' + m[1]);
                        addStep('Старый был: ' + CONFIG.buildId);
                        CONFIG.buildId = m[1];
                        addStep('🔄 Повторите тест с новым buildId');
                    } else {
                        addStep('❌ buildId не найден в HTML');
                    }
                    showSteps();
                },
                error: function(xhr, status){
                    addStep('❌ HTML загрузка: ' + status);
                    showSteps();
                }
            });
        }
    }

    /* Кнопка в меню */
    function addMenu(){
        if($('[data-action="zonafilm"]').length) return;
        var li = $('<li class="menu__item selector" data-action="zonafilm">'+
            '<div class="menu__ico">'+ICO+'</div>'+
            '<div class="menu__text">ZF Debug</div></li>');
        li.on('hover:enter', function(){
            runDebug();
        });
        var list = $('.menu .menu__list');
        if(list.length) list.eq(0).append(li);
        else {
            var ul = $('.menu ul');
            if(ul.length) ul.eq(0).append(li);
        }
    }

    function init(){
        addMenu();
        Lampa.Noty.show('🔧 ZF Debug v1.4');
    }

    if(window.appready) init();
    else Lampa.Listener.follow('app', function(e){
        if(e.type === 'ready') init();
    });
})();
