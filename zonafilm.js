/**
 * TrahKino v0.2-diag — Детальный анализ структуры
 */
(function(){
    'use strict';

    var WORKER = 'https://zonaproxy.777b737.workers.dev';
    var SITE = 'https://trahkino.me';

    var ICO = '<svg viewBox="0 0 24 24" fill="currentColor">' +
        '<path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2z' +
        'M8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2z' +
        'm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>';

    function get(url, cb){
        $.ajax({
            url: WORKER + '/?url=' + encodeURIComponent(url),
            timeout: 20000,
            success: function(data){ cb(null, data); },
            error: function(xhr, st, err){ cb(st+' '+err, null); }
        });
    }

    function runDiag(){
        Lampa.Noty.show('⏳ Анализ структуры...');

        get(SITE, function(err, data){
            if(err){
                Lampa.Noty.show('❌ ' + err);
                return;
            }

            var html = typeof data === 'string' ? data : '';
            var items = [];

            items.push({ title: '✅ HTML: ' + html.length + ' симв', subtitle: '' });

            /* ============================================
             * 1. Все ссылки на категории
             * ============================================ */
            var catLinks = [];
            var re1 = /<a[^>]+href="([^"]*\/categories\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
            var m;
            while((m = re1.exec(html)) !== null){
                var text = m[2].replace(/<[^>]+>/g, '').trim();
                if(text) catLinks.push({ href: m[1], title: text });
            }

            items.push({ title: '━━ КАТЕГОРИИ: ' + catLinks.length + ' ━━', subtitle: '' });
            catLinks.forEach(function(c){
                items.push({ title: '📂 ' + c.title, subtitle: c.href });
            });

            /* ============================================
             * 2. Ищем карточки видео — разные паттерны
             * ============================================ */
            items.push({ title: '━━ ВИДЕО КАРТОЧКИ ━━', subtitle: '' });

            /* Паттерн 1: div с классом содержащим thumb/item/video */
            var cardClasses = [];
            var re2 = /class="([^"]*(?:thumb|item|video|card|post|content)[^"]*)"/gi;
            var seen = {};
            while((m = re2.exec(html)) !== null){
                if(!seen[m[1]]){ seen[m[1]] = true; cardClasses.push(m[1]); }
            }
            items.push({ title: 'CSS классы:', subtitle: cardClasses.slice(0,10).join(' | ') });

            /* Паттерн 2: img с src (превью) */
            var images = [];
            var re3 = /<img[^>]+src="([^"]*)"[^>]*>/gi;
            var seenImg = {};
            while((m = re3.exec(html)) !== null){
                var src = m[1];
                if(src.length > 20 && !seenImg[src] &&
                   (src.indexOf('.jpg') !== -1 || src.indexOf('.png') !== -1 ||
                    src.indexOf('.webp') !== -1 || src.indexOf('thumb') !== -1)){
                    seenImg[src] = true;
                    images.push(src);
                }
            }
            items.push({ title: '🖼 Превью: ' + images.length, subtitle: '' });
            images.slice(0, 3).forEach(function(s){
                items.push({ title: '', subtitle: s.substring(0, 120) });
            });

            /* Паттерн 3: ссылки на /video/ */
            var vidLinks = [];
            var re4 = /<a[^>]+href="([^"]*\/video\/[^"]*)"[^>]*>/gi;
            while((m = re4.exec(html)) !== null){
                if(vidLinks.indexOf(m[1]) === -1) vidLinks.push(m[1]);
            }

            if(vidLinks.length === 0){
                /* Пробуем другие паттерны */
                var re4b = /<a[^>]+href="(\/[^"]*\d+[^"]*\.html)"[^>]*>/gi;
                while((m = re4b.exec(html)) !== null){
                    if(vidLinks.indexOf(m[1]) === -1) vidLinks.push(m[1]);
                }
            }

            if(vidLinks.length === 0){
                var re4c = /<a[^>]+href="([^"]*)"[^>]*>[\s\S]*?<img/gi;
                while((m = re4c.exec(html)) !== null){
                    var h = m[1];
                    if(h.indexOf(SITE) !== -1 || (h.indexOf('/') === 0 && h.length > 5)){
                        if(vidLinks.indexOf(h) === -1) vidLinks.push(h);
                    }
                }
            }

            items.push({ title: '🎬 Видео ссылок: ' + vidLinks.length, subtitle: '' });
            vidLinks.slice(0, 5).forEach(function(v){
                items.push({ title: '', subtitle: v.substring(0, 120) });
            });

            /* ============================================
             * 3. Пробуем извлечь полную карточку
             * ============================================ */
            items.push({ title: '━━ СТРУКТУРА КАРТОЧКИ ━━', subtitle: '' });

            /* Ищем блок вокруг первого img+a */
            var cardPatterns = [
                /<div[^>]*class="[^"]*(?:thumb|item|video-item|card)[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi,
                /<article[^>]*>([\s\S]*?)<\/article>/gi,
                /<li[^>]*class="[^"]*(?:thumb|item|video)[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
                /<div[^>]*class="[^"]*(?:col|grid)[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi
            ];

            var sampleCard = '';
            for(var p = 0; p < cardPatterns.length; p++){
                var rm = cardPatterns[p].exec(html);
                if(rm && rm[1] && rm[1].indexOf('<img') !== -1 && rm[1].indexOf('href') !== -1){
                    sampleCard = rm[1];
                    items.push({ title: 'Паттерн #' + (p+1) + ' ✅', subtitle: '' });
                    break;
                }
            }

            if(sampleCard){
                /* Показываем карточку по частям */
                var cardChunks = sampleCard.match(/.{1,120}/g) || [];
                cardChunks.slice(0, 8).forEach(function(chunk){
                    items.push({ title: '', subtitle: chunk });
                });
            } else {
                items.push({ title: '⚠ Карточка не найдена стандартным паттерном', subtitle: '' });

                /* Показываем кусок HTML где есть первый img */
                var imgPos = html.indexOf('<img');
                if(imgPos > 0){
                    var start = Math.max(0, imgPos - 200);
                    var sample = html.substring(start, imgPos + 300);
                    items.push({ title: 'HTML вокруг первого img:', subtitle: '' });
                    var chunks = sample.match(/.{1,120}/g) || [];
                    chunks.slice(0, 6).forEach(function(c){
                        items.push({ title: '', subtitle: c });
                    });
                }
            }

            /* ============================================
             * 4. Пагинация
             * ============================================ */
            items.push({ title: '━━ ПАГИНАЦИЯ ━━', subtitle: '' });
            var pageRe = /href="([^"]*(?:\?page=|\/page\/|\/\d+\/?)[^"]*)"/gi;
            var pages = [];
            while((m = pageRe.exec(html)) !== null){
                if(pages.indexOf(m[1]) === -1) pages.push(m[1]);
            }
            if(pages.length > 0){
                pages.slice(0, 5).forEach(function(p){
                    items.push({ title: '📄 ' + p, subtitle: '' });
                });
            } else {
                items.push({ title: 'Не найдена', subtitle: '' });
            }

            /* ============================================
             * 5. Тест страницы видео
             * ============================================ */
            if(vidLinks.length > 0){
                items.push({ title: '━━━━━━━━━━━', subtitle: '' });
                items.push({
                    title: '🔍 Открыть страницу видео',
                    subtitle: vidLinks[0],
                    action: 'video',
                    url: vidLinks[0]
                });
            }

            if(catLinks.length > 0){
                items.push({
                    title: '🔍 Открыть категорию',
                    subtitle: catLinks[0].href,
                    action: 'category',
                    url: catLinks[0].href
                });
            }

            items.push({ title: '━━━━━━━━━━━', subtitle: '' });
            items.push({ title: '← Назад', subtitle: '', action: 'back' });

            Lampa.Select.show({
                title: '🔧 Структура ' + SITE,
                items: items,
                onBack: function(){ Lampa.Controller.toggle('content'); },
                onSelect: function(item){
                    if(item.action === 'back'){
                        Lampa.Controller.toggle('content');
                        return;
                    }
                    if(item.action === 'video' || item.action === 'category'){
                        analyzeSubPage(item.url, item.action);
                    }
                }
            });
        });
    }

    /**
     * Анализ подстраницы (видео или категория)
     */
    function analyzeSubPage(url, type){
        /* Делаем абсолютный URL */
        if(url.indexOf('http') !== 0){
            url = SITE + (url.indexOf('/') === 0 ? '' : '/') + url;
        }

        Lampa.Noty.show('⏳ Загрузка ' + type + '...');

        get(url, function(err, data){
            var items = [];

            if(err){
                items.push({ title: '❌ Ошибка: ' + err, subtitle: '' });
            } else {
                var html = typeof data === 'string' ? data : '';
                items.push({ title: '✅ ' + html.length + ' символов', subtitle: url });

                if(type === 'video'){
                    /* Ищем video/iframe/source теги */
                    var sources = [];
                    var re = /<(?:source|video|iframe)[^>]+(?:src|data-src)="([^"]+)"/gi;
                    var m;
                    while((m = re.exec(html)) !== null){
                        sources.push(m[1]);
                    }

                    items.push({ title: '🎥 Источники видео: ' + sources.length, subtitle: '' });
                    sources.forEach(function(s){
                        items.push({ title: '', subtitle: s.substring(0, 120) });
                    });

                    /* Ищем JS-переменные с URL видео */
                    var jsVars = html.match(/(?:video_url|file|source|mp4|stream)['":\s]*['"]([^'"]+\.(?:mp4|m3u8|webm))['"]/gi) || [];
                    if(jsVars.length > 0){
                        items.push({ title: '📎 JS видео:', subtitle: '' });
                        jsVars.slice(0, 5).forEach(function(v){
                            items.push({ title: '', subtitle: v.substring(0, 120) });
                        });
                    }

                    /* Показываем кусок HTML с player */
                    var playerPos = html.search(/player|video|iframe/i);
                    if(playerPos > 0){
                        var sample = html.substring(Math.max(0, playerPos - 100), playerPos + 500);
                        items.push({ title: '━━ HTML плеера: ━━', subtitle: '' });
                        var chunks = sample.match(/.{1,120}/g) || [];
                        chunks.slice(0, 8).forEach(function(c){
                            items.push({ title: '', subtitle: c });
                        });
                    }
                }

                if(type === 'category'){
                    /* Считаем видео на странице категории */
                    var vids = [];
                    var re2 = /<a[^>]+href="([^"]*\/video\/[^"]*)"[^>]*>/gi;
                    var m2;
                    while((m2 = re2.exec(html)) !== null){
                        if(vids.indexOf(m2[1]) === -1) vids.push(m2[1]);
                    }

                    if(vids.length === 0){
                        var re2b = /<a[^>]+href="([^"]*)"[^>]*>[\s\S]*?<img/gi;
                        while((m2 = re2b.exec(html)) !== null){
                            if(vids.indexOf(m2[1]) === -1) vids.push(m2[1]);
                        }
                    }

                    items.push({ title: '🎬 Видео в категории: ' + vids.length, subtitle: '' });
                    vids.slice(0, 5).forEach(function(v){
                        items.push({ title: '', subtitle: v.substring(0, 120) });
                    });
                }
            }

            items.push({ title: '━━━━━━━━━━━', subtitle: '' });
            items.push({ title: '← Назад', subtitle: '', action: 'back' });

            Lampa.Select.show({
                title: '🔧 ' + type + ' анализ',
                items: items,
                onBack: function(){ Lampa.Controller.toggle('content'); },
                onSelect: function(item){
                    if(item.action === 'back') Lampa.Controller.toggle('content');
                }
            });
        });
    }

    function addMenu(){
        if($('[data-action="tkdiag"]').length) return;
        var li = $('<li class="menu__item selector" data-action="tkdiag">'+
            '<div class="menu__ico">'+ICO+'</div>'+
            '<div class="menu__text">TK Анализ</div></li>');
        li.on('hover:enter', function(){ runDiag(); });
        var list = $('.menu .menu__list');
        if(list.length) list.eq(0).append(li);
        else { var ul = $('.menu ul'); if(ul.length) ul.eq(0).append(li); }
    }

    function init(){
        addMenu();
        Lampa.Noty.show('🔧 TK Анализ v0.2');
    }

    if(window.appready) init();
    else Lampa.Listener.follow('app', function(e){
        if(e.type === 'ready') init();
    });
})();
