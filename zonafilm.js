// ============================================================
//  LAMPA PLUGIN — Grid Navigation (Clean Version)
//  Без спецсимволов, emoji и сложных конструкций
// ============================================================

(function() {
    'use strict';

    // Проверка Lampa
    if (typeof window.Lampa === 'undefined') {
        console.error('Lampa not found');
        return;
    }

    var L = window.Lampa;
    var $ = window.$ || window.jQuery;

    // Простые стили (без Unicode)
    var style = document.createElement('style');
    style.textContent = [
        '.gx-wrap{position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;background:#111;padding-top:50px}',
        '.gx-grid{display:flex;flex-wrap:wrap;gap:20px;padding:30px}',
        '.gx-card{width:22%;height:180px;background:#333;border-radius:10px;position:relative;border:3px solid #666}',
        '.gx-card.focus{background:#09f;border-color:#fff;transform:scale(1.1)}',
        '.gx-num{position:absolute;top:10px;left:10px;background:#000;color:#0f0;padding:5px 10px}',
        '.gx-title{position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.8);color:#fff;padding:10px;text-align:center}'
    ].join('');
    document.head.appendChild(style);

    // Компонент
    function GridComponent(object) {
        var self = this;
        this.scroll = new L.Scroll({ mask: true, over: true, step: 250 });
        this.grid = $('<div class="gx-grid"></div>');

        // Удаляем старый контроллер
        try {
            L.Controller.remove('content');
        } catch(e) {}

        // Создаем контроллер
        var controller = {
            toggle: function() {
                L.Controller.collectionSet(self.grid);
                var first = self.grid.find('.selector').first();
                L.Controller.collectionFocus(first, self.grid);
            },
            up: function() { L.Controller.collectionMove('up'); },
            down: function() { L.Controller.collectionMove('down'); },
            left: function() { L.Controller.collectionMove('left'); },
            right: function() { L.Controller.collectionMove('right'); },
            back: function() { L.Activity.backward(); }
        };

        L.Controller.add('content', controller);

        // Создание карточек
        this.create = function() {
            var wrap = $('<div class="gx-wrap"></div>');

            for (var i = 1; i <= 12; i++) {
                var card = $('<div class="gx-card card selector">' +
                    '<div class="gx-num">#' + i + '</div>' +
                    '<div class="gx-title">Video ' + i + '</div>' +
                '</div>');

                card.on('hover:focus', function() {
                    $(this).addClass('focus');
                    self.scroll.update($(this));
                });

                card.on('hover:blur', function() {
                    $(this).removeClass('focus');
                });

                card.on('hover:enter', function() {
                    try { L.Noty.show('Selected'); } catch(e) {}
                });

                this.grid.append(card);
            }

            wrap.append(this.grid);
            var scrollEl = this.scroll.render();
            scrollEl.append(wrap);
            return scrollEl;
        };

        this.start = function() {
            L.Controller.enable('content');
        };

        this.pause = function() {
            L.Controller.disable('content');
        };

        this.stop = function() {
            L.Controller.disable('content');
        };

        this.toggle = function() {
            L.Controller.collectionSet(this.grid);
            L.Controller.collectionFocus(false, this.grid);
        };

        this.render = function() {
            return this.scroll.render();
        };

        this.destroy = function() {
            L.Controller.remove('content');
            this.scroll.destroy();
        };
    }

    // Регистрация
    L.Component.add('grid_test', GridComponent);

    // Меню
    function addMenu() {
        var item = $('<li class="menu__item selector" data-action="grid_test">' +
            '<div class="menu__ico">*</div>' +
            '<div class="menu__text">Grid Test</div>' +
        '</li>');

        item.on('hover:enter', function() {
            L.Activity.push({
                url: '',
                title: 'Grid Test',
                component: 'grid_test',
                page: 1
            });
        });

        $('.menu .menu__list').eq(0).append(item);
    }

    // Запуск
    if (window.appready) {
        addMenu();
    } else {
        L.Listener.follow('app', function(e) {
            if (e.type === 'ready') addMenu();
        });
    }

})();
