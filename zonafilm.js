/**
 * ============================================================
 *  LAMPA PLUGIN — Trahkino v3.4.1 (Свободная навигация)
 * ============================================================
 *
 *  ИСПРАВЛЕНИЯ v3.4.1:
 *    ✅ Выход из сетки: при упоре в край событие НЕ блокируется.
 *       Ядро Lampa возвращает фокус в меню/назад.
 *    ✅ Кнопка "Назад": работает стандартно (кроме выхода из браузера).
 *    ✅ Скролл: используется scroll.position() из API Lampa.
 *
 * ============================================================
 */

(function () {
    'use strict';

    var CONFIG = {
        debug: true,
        ver: '3.4.1',
        site: 'https://trahkino.me',
        proxy: [
            'https://api.codetabs.com/v1/proxy?quest={u}',
            'https://corsproxy.io/?{u}',
            'https://api.allorigins.win/raw?url={u}'
        ],
        pi: 0,
        timeout: 15000
    };

    var D = {
        log: function(t,m){ if(CONFIG.debug) console.log('[TRK]['+t+']',m); },
        err: function(t,m){ console.error('[TRK][ERR]['+t+']',m); },
        noty: function(m){ try{ Lampa.Noty.show(m); }catch(e){} }
    };

    var Net = {
        get: function(url, ok, fail, _i){
            var i = typeof _i === 'number' ? _i : CONFIG.pi;
            if(i >= CONFIG.proxy.length){ if(fail) fail(); return; }
            var pu = CONFIG.proxy[i].replace('{u}', encodeURIComponent(url));
            $.ajax({ url: pu, timeout: CONFIG.timeout, success: function(data){
                CONFIG.pi = i; if(ok) ok(data);
            }, error: function(){ Net.get(url, ok, fail, i+1); }});
        }
    };

    var Src = {
        main: function(page, cb){
            D.noty('⏳ Загрузка каталога...');
            var url = CONFIG.site + (page > 1 ? '/page/'+page+'/' : '/');
            Net.get(url, function(html){
                if(typeof html !== 'string'){ cb([]); return; }
                try {
                    var doc = new DOMParser().parseFromString(html, 'text/html');
                    var cards = doc.querySelectorAll('a[href*="/video/"]');
                    var items = [];
                    cards.forEach(function(a){
                        var href = a.getAttribute('href') || '';
                        if(!href) return;
                        if(href.indexOf('http') === -1) href = CONFIG.site + href;
                        var img = a.querySelector('img');
                        var poster = img ? (img.getAttribute('src') || '') : '';
                        var titleEl = a.querySelector('.title, strong');
                        var title = titleEl ? titleEl.textContent.trim() : 'Без названия';
                        var durEl = a.querySelector('.duration');
                        var duration = durEl ? durEl.textContent.trim() : '';
                        if(title && poster) items.push({ title: title, url: href, poster: poster, duration: duration });
                    });
                    if(items.length > 0) D.noty('✅ Загружено: '+items.length);
                    else D.noty('⚠ Пусто');
                    cb(items);
                } catch(e){ cb([]); }
            }, function(){ D.noty('⚠ Ошибка сети'); cb([]); });
        },
        search: function(q, cb){ D.noty('Поиск на этапе 3'); cb([]); },
        cats: function(){ return []; }
    };

    var CSS = '\
        .items-cards{display:flex;flex-wrap:wrap;gap:1em;padding:1.5em}\
        .zf-loading{display:flex;align-items:center;justify-content:center;\
            padding:4em;color:#888;font-size:1.3em;width:100%}\
        .zf-spin{display:inline-block;width:2em;height:2em;border:3px solid #333;\
            border-top-color:#4FC3F7;border-radius:50%;margin-right:.8em;\
            animation:zfspin .7s linear infinite}\
        @keyframes zfspin{to{transform:rotate(360deg)}}\
        .zf-empty{text-align:center;padding:4em;color:#666;font-size:1.3em;width:100%}\
    ';
    $('#zf-css').remove();
    $('<style>').attr('id','zf-css').text(CSS).appendTo('head');

    function showMainMenu(){
        Lampa.Select.show({
            title: '🎬 Trahkino v' + CONFIG.ver,
            items: [
                { title: '🔍 Поиск', subtitle: '(Этап 3)', action: 'search' },
                { title: '📽 Последние видео', subtitle: 'Каталог', action: 'all' },
                { title: '← Назад', subtitle: '', action: 'back' }
            ],
            onBack: function(){ Lampa.Controller.toggle('content'); },
            onSelect: function(item){
                if(item.action === 'back' || item.action === 'search'){
                    if(item.action === 'back') Lampa.Controller.toggle('content');
                    return;
                }
                if(item.action === 'all'){
                    Lampa.Activity.push({ url: '', title: 'Последние видео', component: 'zf_cards', page: 1 });
                }
            }
        });
    }

    function CardsComp(object){
        var self   = this;
        var scroll = new Lampa.Scroll({mask:true, over:true, step:250});
        var wrap   = $('<div class="items-cards"></div>');
        
        var isActive = false;
        var lastBrowserOpenTime = 0;

        this.setFocus = function(card) {
            if(!card || !card.length) return;
            wrap.find('.card').removeClass('focus');
            card.addClass('focus');
            card.trigger('hover:focus');
            
            // Скролл через API Lampa (метод position из вашего списка)
            try {
                if (typeof scroll.position === 'function') {
                    scroll.position(card[0]); 
                } else {
                    // Запасной метод (чистый JS), если position недоступен
                    var scrollBody = scroll.body ? scroll.body() : scroll.render();
                    var cardTop = card[0].offsetTop;
                    var wrapTop = scrollBody.offset().top;
                    var scrollTo = cardTop - wrapTop - (scrollBody.height() / 2) + (card.height() / 2);
                    scrollBody.scrollTop(scrollTo);
                }
            } catch(e) {
                card[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };

        this.initNavigation = function(e) {
            if (!isActive) return;

            var key = e.key;
            
            // --- КНОПКА НАЗАД ---
            if (key === 'Escape' || key === 'Backspace') {
                if (Date.now() - lastBrowserOpenTime < 1500) {
                    // Защита: только что открыли браузер, блокируем выход
                    e.preventDefault();
                    e.stopPropagation();
                    return; 
                }
                // Стандартный выход: не трогаем событие, пусть Lampa делает backward()
                wrap.find('.card').removeClass('focus'); // Снимаем нашу рамку
                return; 
            }

            if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Enter'].includes(key)) return;

            var current = wrap.find('.card.focus');
            if(!current.length) {
                e.preventDefault();
                e.stopPropagation();
                self.setFocus(wrap.find('.card').first());
                return;
            }

            var target = null;

            switch(key) {
                case 'ArrowRight':
                    target = current.next('.card');
                    break;
                case 'ArrowLeft':
                    if(current.index() > 0) target = current.prev('.card');
                    break;
                    
                case 'ArrowDown': {
                    var curTop = current.offset().top;
                    var nextRowTop = null;
                    current.nextAll('.card').each(function(){
                        var t = $(this).offset().top;
                        if (t > curTop + 5) { nextRowTop = t; return false; }
                    });
                    
                    if (nextRowTop !== null) {
                        var curLeft = current.offset().left;
                        var minDist = Infinity;
                        current.nextAll('.card').each(function(){
                            if (Math.abs($(this).offset().top - nextRowTop) < 5) {
                                var dist = Math.abs($(this).offset().left - curLeft);
                                if (dist < minDist) { minDist = dist; target = $(this); }
                            }
                        });
                    }
                    break;
                }
                    
                case 'ArrowUp': {
                    var curTop = current.offset().top;
                    var prevRowTop = null;
                    current.prevAll('.card').each(function(){
                        var t = $(this).offset().top;
                        if (t < curTop - 5) { prevRowTop = t; return false; }
                    });
                    
                    if (prevRowTop !== null) {
                        var curLeft = current.offset().left;
                        var minDist = Infinity;
                        current.prevAll('.card').each(function(){
                            if (Math.abs($(this).offset().top - prevRowTop) < 5) {
                                var dist = Math.abs($(this).offset().left - curLeft);
                                if (dist < minDist) { minDist = dist; target = $(this); }
                            }
                        });
                    }
                    break;
                }

                case 'Enter':
                    e.preventDefault();
                    e.stopPropagation();
                    current.trigger('hover:enter');
                    return;
            }

            // --- СВОБОДНЫЙ ВЫХОД ИЗ СЕТКИ ---
            if(!target || !target.length) {
                // Упёрлись в край сетки (нет карточки дальше). 
                // Снимаем наш фокус и ОТПУСКАЕМ событие (не вызываем stopPropagation).
                // Ядро Lampa увидит пустой фокус и перенаправит вас в меню/назад.
                wrap.find('.card').removeClass('focus');
                return; 
            }

            // Перемещение внутри сетки (здесь мы перехватываем управление)
            e.preventDefault();
            e.stopPropagation();
            self.setFocus(target);
        };

        this.create = function(){
            isActive = false;
            wrap.append('<div class="zf-loading" id="zf-loader"><div class="zf-spin"></div>Загрузка...</div>');
            scroll.append(wrap);
            Src.main(object.page || 1, function(items){ self.onDataLoaded(items); });
        };

        this.onDataLoaded = function(items){
            $('#zf-loader').remove();
            if(!items.length){
                wrap.html('<div class="zf-empty">📭 Пусто</div>');
                return;
            }

            items.forEach(function(m, index){
                try {
                    var card = Lampa.Template.get('card', {
                        title: m.title + (m.duration ? ' ('+m.duration+')' : ''),
                        poster: m.poster,
                        id: index
                    });
                    
                    card.data('card-url', m.url);
                    card.data('card-title', m.title);
                    
                    card.on('hover:enter', function(){
                        openInBrowser($(this).data('card-url'), $(this).data('card-title'));
                    });

                    card.on('hover:focus', function(){
                        scroll.update($(this));
                    });

                    wrap.append(card);
                } catch(e) {
                    D.err('Template', e.message);
                }
            });
            
            window.addEventListener('keydown', self.initNavigation, true);
            
            setTimeout(function(){
                isActive = true;
                self.setFocus(wrap.find('.card').first());
            }, 300);
        };

        this.start = function(){ isActive = true; };
        this.toggle = function(){ isActive = true; };
        this.pause = function(){ isActive = false; };
        this.stop = function(){ isActive = false; };
        this.render = function(){ return scroll.render(); };
        
        this.destroy = function(){ 
            isActive = false;
            window.removeEventListener('keydown', self.initNavigation, true); 
            scroll.destroy(); 
            wrap.remove(); 
        };
    }

    function openInBrowser(url, title){
        D.noty('▶ Открываю: ' + title);
        lastBrowserOpenTime = Date.now(); 
        try {
            if(typeof Lampa.Android !== 'undefined' && Lampa.Android.openUrl){
                Lampa.Android.openUrl(url);
                return;
            }
        } catch(e){}
        try { window.open(url,'_blank'); } catch(e){}
    }

    Lampa.Component.add('zf_cards', CardsComp);

    var ICO = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>';

    function addMenu(){
        if($('[data-action="trahkino"]').length) return;
        var li = $('<li class="menu__item selector" data-action="trahkino">'+
            '<div class="menu__ico">'+ICO+'</div>'+
            '<div class="menu__text">Trahkino</div></li>');
        li.on('hover:enter', function(){ showMainMenu(); });
        var list = $('.menu .menu__list');
        if(list.length){ list.eq(0).append(li); return; }
        var ul = $('.menu ul');
        if(ul.length) ul.eq(0).append(li);
    }

    function init(){
        try {
            addMenu();
            D.noty('✅ Trahkino v'+CONFIG.ver+' загружен');
        } catch(e){ D.err('Boot',e.message); }
    }

    if(window.appready) init();
    else Lampa.Listener.follow('app', function(e){ if(e.type === 'ready') init(); });

})();
