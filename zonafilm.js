/**
 * TK v0.5 — Поиск прямых ссылок на видео
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

    function run(){
        Lampa.Noty.show('⏳ Ищу ссылки на видео...');

        get(SITE + '/video/432066/', function(err, data){
            if(err){ Lampa.Noty.show('❌ '+err); return; }

            var html = typeof data === 'string' ? data : '';
            var items = [];

            items.push({ title: '✅ Страница: '+html.length+' симв', subtitle: '' });

            /* 1. Ищем flowplayer config */
            var fpMatch = html.match(/flowplayer\s*\([^,]*,\s*(\{[\s\S]*?\})\s*\)/);
            if(fpMatch){
                items.push({ title: '✅ Flowplayer config найден', subtitle: '' });
                var cfg = fpMatch[1];
                var cfgChunks = cfg.match(/.{1,90}/g) || [];
                cfgChunks.slice(0,15).forEach(function(c){
                    items.push({ title: '', subtitle: c });
                });
            } else {
                items.push({ title: '❌ Flowplayer config НЕ найден', subtitle: '' });
            }

            /* 2. Ищем все URL с расширениями видео */
            var videoUrls = [];
            var re = /['"](https?:\/\/[^'"]*\.(?:mp4|m3u8|webm)[^'"]*)['"]/gi;
            var m;
            while((m = re.exec(html)) !== null){
                if(videoUrls.indexOf(m[1]) === -1) videoUrls.push(m[1]);
            }

            items.push({ title: '━━ Прямые URL видео: '+videoUrls.length+' ━━', subtitle: '' });
            videoUrls.forEach(function(u){
                items.push({ title: '', subtitle: u.substring(0,120) });
            });

            /* 3. Ищем все script блоки с video/flow/player */
            var scripts = [];
            var reS = /<script[^>]*>([\s\S]*?)<\/script>/gi;
            while((m = reS.exec(html)) !== null){
                var s = m[1].trim();
                if(s.length > 50 && (
                    s.indexOf('flowplayer') !== -1 ||
                    s.indexOf('video_url') !== -1 ||
                    s.indexOf('.mp4') !== -1 ||
                    s.indexOf('kt_player') !== -1 ||
                    s.indexOf('player') !== -1
                )){
                    scripts.push(s);
                }
            }

            items.push({ title: '━━ JS с player: '+scripts.length+' ━━', subtitle: '' });
            scripts.forEach(function(s, idx){
                items.push({ title: '--- Script #'+(idx+1)+' ('+s.length+' симв) ---', subtitle: '' });
                var lines = s.match(/.{1,90}/g) || [];
                lines.slice(0,20).forEach(function(l){
                    items.push({ title: '', subtitle: l });
                });
            });

            /* 4. Если ничего не найдено — ищем data- атрибуты */
            if(videoUrls.length === 0 && scripts.length === 0){
                items.push({ title: '━━ Data атрибуты ━━', subtitle: '' });
                var dataRe = /data-(?:video|src|url|config|clip)[^=]*="([^"]+)"/gi;
                while((m = dataRe.exec(html)) !== null){
                    items.push({ title: '', subtitle: m[0].substring(0,120) });
                }
            }

            /* 5. Ищем JSON конфиг */
            var jsonRe = /(?:var|let|const)\s+\w*(?:config|opts|options|settings|data)\s*=\s*(\{[^;]*\})/gi;
            while((m = jsonRe.exec(html)) !== null){
                items.push({ title: '━━ JSON config ━━', subtitle: '' });
                var jc = m[1].match(/.{1,90}/g) || [];
                jc.slice(0,10).forEach(function(c){
                    items.push({ title: '', subtitle: c });
                });
            }

            items.push({ title: '━━━━━━━━━━━', subtitle: '' });
            items.push({ title: '← Назад', subtitle: '', action: 'back' });

            Lampa.Select.show({
                title: '🎥 Видео URL поиск',
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
            '<div class="menu__text">TK Видео URL</div></li>');
        li.on('hover:enter', function(){ run(); });
        var list = $('.menu .menu__list');
        if(list.length) list.eq(0).append(li);
        else { var ul = $('.menu ul'); if(ul.length) ul.eq(0).append(li); }
    }

    function init(){
        addMenu();
        Lampa.Noty.show('🔧 TK v0.5');
    }

    if(window.appready) init();
    else Lampa.Listener.follow('app', function(e){
        if(e.type === 'ready') init();
    });
})();
