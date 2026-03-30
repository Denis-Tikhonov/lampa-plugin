// ============================================================
//  LAMPA PLUGIN — Grid Test (Fixed for jQuery/DOM compatibility)
// ============================================================

(function() {
    'use strict';

    console.log('[GRID-TEST] Plugin loading');

    var CONFIG = {
        debug: true,
        cardsCount: 12,
        title: 'Test Grid'
    };

    // Проверка Lampa
    if (typeof Lampa === 'undefined') {
        console.error('[GRID-TEST] Lampa not found!');
        return;
    }

    // ======== СТИЛИ ========
    var CSS = [
        '.test-grid-wrap{position:relative;height:100%;overflow:hidden}',
        '.test-grid{display:flex;flex-wrap:wrap;gap:20px;padding:40px}',
        '.test-card{width:22%;height:180px;background:#333;border-radius:12px;position:relative;transition:all 0.2s;cursor:pointer}',
        '.test-card.focus{background:#4FC3F7;transform:scale(1.08);box-shadow:0 0 20px rgba(79,195,247,0.6);z-index:10}',
        '.test-poster{width:100%;height:120px;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-size:48px;color:rgba(255,255,255,0.5)}',
        '.test-info{padding:10px;color:#fff;font-size:14px;text-align:center}'
    ].join('');

    $('<style>').text(CSS).appendTo('head');

    // ======== КОМПОНЕНТ ========
    function GridComponent(object) {
        var self = this;
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var grid = $('<div class="test-grid"></div>');

        // ======== КОНТРОЛЛЕР НАВИГАЦИИ ========
        Lampa.Controller.add('content', {
            toggle: function() {
                console.log('[GRID-TEST] toggle');
                Lampa.Controller.collectionSet(grid);
                Lampa.Controller.collectionFocus(false, grid);
            },
            up: function() { 
                Lampa.Controller.collectionMove('up'); 
                self.logFocus();
            },
            down: function() { 
                Lampa.Controller.collectionMove('down'); 
                self.logFocus();
            },
            left: function() { 
                Lampa.Controller.collectionMove('left'); 
                self.logFocus();
            },
            right: function() { 
                Lampa.Controller.collectionMove('right'); 
                self.logFocus();
            },
            back: function() { 
                Lampa.Activity.backward(); 
            }
        });

        // ======== СОЗДАНИЕ ========
        this.create = function() {
            console.log('[GRID-TEST] create() start');

            // Создаем обертку
            var wrap = $('<div class="test-grid-wrap"></div>');
            wrap.append(grid);

            // Добавляем карточки
            for (var i = 1; i <= CONFIG.cardsCount; i++) {
                var card = $([
                    '<div class="test-card card selector">',
                        '<div class="test-poster">#' + i + '</div>',
                        '<div class="test-info">Видео ' + i + '</div>',
                    '</div>'
                ].join(''));

                // События навигации
                card.on('hover:focus', function() {
                    $(this).addClass('focus');
                    scroll.update($(this));
                });

                card.on('hover:blur', function() {
                    $(this).removeClass('focus');
                });

                card.on('hover:enter', function() {
                    var num = $(this).find('.test-poster').text();
                    console.log('[GRID-TEST] Selected:', num);
                });

                grid.append(card);
            }

            // ======== КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ========
            // scroll.render() возвращает jQuery-объект!
            // Нужно использовать jQuery для добавления в DOM
            
            var scrollElement = scroll.render(); // это jQuery-объект
            
            // Вариант 1: Через jQuery.append() (рекомендуется)
            scrollElement.append(wrap);
            
            // Вариант 2: Если нужен чистый DOM
            // var domElement = scrollElement[0] || scrollElement;
            // domElement.appendChild(wrap[0]);

            // Добавляем в body через jQuery
            $('body').append(scrollElement);

            console.log('[GRID-TEST] Grid created, cards:', CONFIG.cardsCount);
        };

        this.logFocus = function() {
            var focused = grid.find('.focus .test-poster').text() || 'none';
            console.log('[GRID-TEST] Focus:', focused);
        };

        // ======== ЖИЗНЕННЫЙ ЦИКЛ ========
        this.start = function() {
            console.log('[GRID-TEST] start()');
            Lampa.Controller.enable('content');
        };

        this.pause = function() {
            Lampa.Controller.disable('content');
        };

        this.stop = function() {
            Lampa.Controller.disable('content');
        };

        this.toggle = function() {
            console.log('[GRID-TEST] toggle()');
            Lampa.Controller.collectionSet(grid);
            Lampa.Controller.collectionFocus(false, grid);
        };

        this.render = function() {
            // Возвращаем jQuery-объект для совместимости с Lampa
            return scroll.render();
        };

        this.destroy = function() {
            console.log('[GRID-TEST] destroy()');
            Lampa.Controller.remove('content');
            scroll.destroy();
        };
    }

    // ======== РЕГИСТРАЦИЯ ========
    Lampa.Component.add('grid_test', GridComponent);
    console.log('[GRID-TEST] Component registered');

    // ======== МЕНЮ ========
    function addMenu() {
        var item = $('<li class="menu__item selector" data-action="grid_test">' +
            '<div class="menu__ico">🔲</div>' +
            '<div class="menu__text">Test Grid</div>' +
        '</li>');

        item.on('hover:enter', function() {
            Lampa.Activity.push({
                url: '',
                title: CONFIG.title,
                component: 'grid_test',
                page: 1
            });
        });

        $('.menu .menu__list').eq(0).append(item);
        console.log('[GRID-TEST] Menu added');
    }

    // ======== ЗАПУСК ========
    if (window.appready) {
        addMenu();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') addMenu();
        });
    }

})();
