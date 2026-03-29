/**
 * TK v0.3 — Извлечение карточек + тест плеера
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
            success: function(d){ cb(null, d); },
            error: function(x,s,e){ cb(s+' '+e, null); }
        });
    }

    function runDiag(){
        Lampa.Noty.show('⏳ Извлекаю карточки...');

        get(SITE, function(err, data){
            if(err){
                Lampa.Noty.show('❌ '+err);
                return;
            }

            var html = typeof data === 'string' ? data : '';
            var items = [];

            /* ============================================
             * 1. Парсим ВСЕ .item блоки
             * ============================================ */

            /*
             * Ищем каждый <div class="item"> ... </div>
             * Внутри: <a href="..."><div class="thumb">
             *   <img src/data-src/data-original="...">
             *   <span class="duration">...</span>
             * </a>
             * <div class="title"><a>НАЗВАНИЕ</a></div>
             */

            /* Извлекаем первые 5 item блоков для анализа */
            var itemBlocks = [];
            var pos = 0;
            for(var i = 0; i < 5; i++){
                var start = html.indexOf('class="item"', pos);
                if(start === -1) break;

                /* Находим открывающий тег */
                var tagStart = html.lastIndexOf('<', start);

                /* Ищем конец блока — следующий item или конец list-videos */
                var nextItem = html.indexOf('class="item"', start + 15);
                var endList = html.indexOf('</div>\n</div>', start);

                var end;
                if(nextItem !== -1 && (endList === -1 || nextItem < endList)){
                    end = html.lastIndexOf('<', nextItem);
                } else if(endList !== -1){
                    end = endList + 13;
                } else {
                    end = start + 2000;
                }

                var block = html.substring(tagStart, Math.min(end, tagStart + 2000));
                itemBlocks.push(block);
                pos = start + 15;
            }

            items.push({
                title: '📦 Найдено item блоков: ' + itemBlocks.length,
                subtitle: ''
            });

            /* Показываем сырой HTML первого блока */
            if(itemBlocks.length > 0){
                items.push({ title: '━━ СЫРОЙ HTML карточки #1 ━━', subtitle: '' });
                var raw = itemBlocks[0];
                var chunks = raw.match(/.{1,100}/g) || [];
                chunks.slice(0, 12).forEach(function(c){
                    items.push({ title: '', subtitle: c });
                });
            }

            /* ============================================
             * 2. Пробуем парсить карточки
             * ============================================ */
            items.push({ title: '━━ ПАРСИНГ ━━', subtitle: '' });

            itemBlocks.forEach(function(block, idx){
                /* href */
                var hrefM = block.match(/href="([^"]*\/video\/[^"]*)"/);
                var href = hrefM ? hrefM[1] : '?';

                /* img src — пробуем разные атрибуты */
                var imgM = block.match(/<img[^>]+(?:data-original|data-src|src)="([^"]+)"/);
                var img = imgM ? imgM[1] : '?';

                /* title/alt */
                var titleM = block.match(/(?:alt|title)="([^"]+)"/);
                var title = titleM ? titleM[1] : '?';

                /* Если title не найден в alt, ищем в отдельном div */
                if(title === '?'){
                    var titleM2 = block.match(/<(?:div|span)[^>]*class="[^"]*title[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)/);
                    if(titleM2) title = titleM2[1].trim();
                }

                /* Если ещё не найден */
                if(title === '?'){
                    var titleM3 = block.match(/>([^<]{5,80})</);
                    if(titleM3) title = titleM3[1].trim();
                }

                /* duration */
                var durM = block.match(/(?:duration|time)[^>]*>([^<]+)/);
                var dur = durM ? durM[1].trim() : '?';

                items.push({
                    title: '#' + (idx+1) + ': ' + title.substring(0, 60),
                    subtitle: 'href=' + href.substring(0, 50) + ' dur=' + dur
                });
                items.push({
                    title: '   img:',
                    subtitle: img.substring(0, 100)
                });
            });

            /* ============================================
             * 3. Анализ пагинации
             * ============================================ */
            items.push({ title: '━━ ПАГИНАЦИЯ ━━', subtitle: '' });

            /* Ищем блок пагинации */
            var pagM = html.match(/class="[^"]*paginat[^"]*"[\s\S]*?<\/(?:div|nav|ul)>/i);
            if(pagM){
                var pagHtml = pagM[0];
                var pagLinks = [];
                var re = /href="([^"]+)"/g;
                var m;
                while((m = re.exec(pagHtml)) !== null){
                    pagLinks.push(m[1]);
                }
                items.push({ title: 'Пагинация найдена: ' + pagLinks.length + ' ссылок', subtitle: '' });
                pagLinks.slice(0, 5).forEach(function(p){
                    items.push({ title: '', subtitle: p });
                });
            } else {
                /* Ищем ?page= или /page/ */
                var allPages = [];
                var re2 = /href="([^"]*(?:\?page=|\/page\/)\d+[^"]*)"/gi;
                while((m = re2.exec(html)) !== null){
                    if(allPages.indexOf(m[1]) === -1) allPages.push(m[1]);
                }

                /* Или просто ?from_videos= ?from= ?p= */
                if(allPages.length === 0){
                    var re3 = /href="([^"]*(?:\?from|mode=)[^"]*)"/gi;
                    while((m = re3.exec(html)) !== null){
                        if(allPages.indexOf(m[1]) === -1) allPages.push(m[1]);
                    }
                }

                if(allPages.length > 0){
                    items.push({ title: 'Страницы:', subtitle: '' });
                    allPages.slice(0, 5).forEach(function(p){
                        items.push({ title: '', subtitle: p });
                    });
                } else {
                    items.push({ title: '❓ Пагинация не найдена', subtitle: 'Возможно AJAX/бесконечная прокрутка' });
                }
            }

            /* ============================================
             * 4. Тест embed плеера
             * ============================================ */
            items.push({ title: '━━ ТЕСТ ПЛЕЕРА ━━', subtitle: '' });
            items.push({
                title: '▶ Тест embed плеера',
                subtitle: SITE + '/embeded/417554/',
                action: 'embed',
                url: SITE + '/embeded/417554/'
            });

            /* Тест страницы категории */
            items.push({
                title: '📂 Тест категории (стр.2)',
                subtitle: '',
                action: 'cat2'
            });

            items.push({ title: '━━━━━━━━━━━', subtitle: '' });
            items.push({ title: '← Назад', subtitle: '', action: 'back' });

            Lampa.Select.show({
                title: '🔧 TK Карточки',
                items: items,
                onBack: function(){ Lampa.Controller.toggle('content'); },
                onSelect: function(item){
                    if(item.action === 'back'){
                        Lampa.Controller.toggle('content');
                        return;
                    }
                    if(item.action === 'embed'){
                        testEmbed(item.url);
                        return;
                    }
                    if(item.action === 'cat2'){
                        testPagination();
                        return;
                    }
                }
            });
        });
    }

    /**
     * Тест embed — ищем прямую ссылку на видео
     */
    function testEmbed(url){
        Lampa.Noty.show('⏳ Анализ плеера...');

        get(url, function(err, data){
            var items = [];

            if(err){
                items.push({ title: '❌ ' + err, subtitle: '' });
            } else {
                var html = typeof data === 'string' ? data : '';
                items.push({ title: '✅ ' + html.length + ' симв', subtitle: url });

                /* Ищем video source */
                var sources = [];
                var re = /(?:src|file|video_url|source)\s*[:=]\s*['"](https?:\/\/[^'"]+\.(?:mp4|m3u8|webm))['"]/gi;
                var m;
                while((m = re.exec(html)) !== null){
                    sources.push(m[1]);
                }

                /* Ищем в JSON */
                var re2 = /['"](https?:\/\/[^'"]+\.(?:mp4|m3u8|webm))['"]/gi;
                while((m = re2.exec(html)) !== null){
                    if(sources.indexOf(m[1]) === -1) sources.push(m[1]);
                }

                items.push({ title: '🎥 Видео URL: ' + sources.length, subtitle: '' });
                sources.forEach(function(s){
                    items.push({ title: '', subtitle: s.substring(0, 120) });
                });

                /* iframe внутри embed */
                var iframes = [];
                var re3 = /<iframe[^>]+src="([^"]+)"/gi;
                while((m = re3.exec(html)) !== null){
                    iframes.push(m[1]);
                }
                if(iframes.length){
                    items.push({ title: '📺 Iframes:', subtitle: '' });
                    iframes.forEach(function(f){
                        items.push({ title: '', subtitle: f.substring(0, 120) });
                    });
                }

                /* Показываем HTML плеера */
                items.push({ title: '━━ HTML: ━━', subtitle: '' });
                var chunks = html.match(/.{1,100}/g) || [];
                chunks.slice(0, 15).forEach(function(c){
                    items.push({ title: '', subtitle: c });
                });
            }

            items.push({ title: '← Назад', subtitle: '', action: 'back' });

            Lampa.Select.show({
                title: '🎥 Embed анализ',
                items: items,
                onBack: function(){ Lampa.Controller.toggle('content'); },
                onSelect: function(item){
                    if(item.action === 'back') Lampa.Controller.toggle('content');
                }
            });
        });
    }

    /**
     * Тест пагинации — пробуем разные URL
     */
    function testPagination(){
        Lampa.Noty.show('⏳ Тест пагинации...');

        var urls = [
            SITE + '/?page=2',
            SITE + '/page/2/',
            SITE + '/?from=2',
            SITE + '/?mode=async&function=get_block&block_id=list_videos_latest_videos_list&sort_by=post_date&from=2',
            SITE + '/latest-updates/2/',
            SITE + '/new/2/',
            SITE + '/categories/lyubitelskiy-seks/2/'
        ];

        var results = [];
        var done = 0;

        urls.forEach(function(u, idx){
            get(u, function(err, data){
                var html = typeof data === 'string' ? data : '';
                var videoCount = 0;
                if(html){
                    var re = /\/video\/\d+\//g;
                    var matches = html.match(re) || [];
                    /* Уникальные */
                    var unique = {};
                    matches.forEach(function(m){ unique[m] = true; });
                    videoCount = Object.keys(unique).length;
                }

                results[idx] = {
                    url: u,
                    ok: !err && videoCount > 0,
                    videos: videoCount,
                    err: err || '',
                    len: html.length
                };

                done++;
                if(done >= urls.length) showPagResults(results);
            });
        });
    }

    function showPagResults(results){
        var items = [];
        items.push({ title: '━━ ПАГИНАЦИЯ ТЕСТ ━━', subtitle: '' });

        results.forEach(function(r){
            var icon = r.ok ? '✅' : '❌';
            items.push({
                title: icon + ' Видео: ' + r.videos,
                subtitle: r.url
            });
        });

        items.push({ title: '← Назад', subtitle: '', action: 'back' });

        Lampa.Select.show({
            title: '📄 Пагинация',
            items: items,
            onBack: function(){ Lampa.Controller.toggle('content'); },
            onSelect: function(item){
                if(item.action === 'back') Lampa.Controller.toggle('content');
            }
        });
    }

    function addMenu(){
        if($('[data-action="tkdiag"]').length) return;
        var li = $('<li class="menu__item selector" data-action="tkdiag">'+
            '<div class="menu__ico">'+ICO+'</div>'+
            '<div class="menu__text">TK Карточки</div></li>');
        li.on('hover:enter', function(){ runDiag(); });
        var list = $('.menu .menu__list');
        if(list.length) list.eq(0).append(li);
        else { var ul = $('.menu ul'); if(ul.length) ul.eq(0).append(li); }
    }

    function init(){
        addMenu();
        Lampa.Noty.show('🔧 TK v0.3');
    }

    if(window.appready) init();
    else Lampa.Listener.follow('app', function(e){
        if(e.type === 'ready') init();
    });
})();
