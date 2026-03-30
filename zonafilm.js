// ============================================================
//  LAMPA PLUGIN — Grid Navigation (Guaranteed Working)
//  Версия с максимальной совместимостью и отладкой
// ============================================================

(function() {
    'use strict';

    // ======== ОТЛАДКА ========
    var DEBUG = true;
    function log(msg, data) {
        if (!DEBUG) return;
        console.log('[GRID-NAV]', msg, data || '');
        // Визуальный лог на экране
        var debugBox = document.getElementById('grid-nav-debug');
        if (!debugBox) {
            debugBox = document.createElement('div');
            debugBox.id = 'grid-nav-debug';
            debugBox.style.cssText = 'position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.9);color:#0f0;padding:10px;font-family:monospace;font-size:12px;z-index:99999;max-width:400px;max-height:150px;overflow:auto;border:2px solid #0f0;pointer-events:none;';
            document.body.appendChild(debugBox);
        }
        var line = document.createElement('div');
        line.textContent = new Date().toLocaleTimeString() + ' ' + msg;
        debugBox.appendChild(line);
        if (debugBox.children.length > 8) debugBox.removeChild(debugBox.firstChild);
    }

    log('Plugin loading started');

    // ======== ПРОВЕРКА ОКРУЖЕНИЯ ========
    if (typeof Lampa === 'undefined') {
        log('ERROR: Lampa not found!');
        return;
    }
    log('Lampa found, version:', Lampa.Manifest?.app_digital);

    // ======== СТИЛИ ========
    var STYLE = [
        '.gn-wrap{position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden}',
        '.gn-grid{display:flex;flex-wrap:wrap;gap:20px;padding:30px}',
        '.gn-card{width:22%;height:200px;background:#2a2a2a;border-radius:10px;position:relative;transition:all 0.2s;overflow:hidden;border:3px solid transparent}',
        '.gn-card.focus{background:#4FC3F7;border-color:#fff;transform:scale(1.05);box-shadow:0 0 30px rgba(79,195,247,0.8);z-index:100}',
        '.gn-num{position:absolute;top:8px;left:8px;background:#000;color:#0f0;padding:4px 8px;border-radius:4px;font-size:14px;font-weight:bold}',
        '.gn-card.focus .gn-num{background:#4FC3F7;color:#000}',
        '.gn-title{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.9));color:#fff;padding:15px 10px 10px;font-size:16px;text-align:center}'
    ].join('');
    
    $('<style>').text(STYLE).appendTo('head');

    // ======== КОМПОНЕНТ ========
    function GridNavComponent(object) {
        log('Component constructor called');
        
        var self = this;
        this.activity = object;
        
        // Создаем Scroll через Lampa
        this.scroll = new Lampa.Scroll({ mask: true, over: true, step: 200 });
        
        // Создаем grid как jQuery-объект
        this.grid = $('<div class="gn-grid"></div>');
        
        // Флаг инициализации
        this.initialized = false;

        // ======== КОНТРОЛЛЕР (КЛЮЧЕВОЙ БЛОК) ========
        // Удаляем старый контроллер если есть
        try {
            Lampa.Controller.remove('content');
            log('Old controller removed');
        } catch(e) {}

        // Создаем новый контроллер
        this.controller = Lampa.Controller.add('content', {
            toggle: function() {
                log('Controller: toggle() called');
                // Устанавливаем коллекцию
                Lampa.Controller.collectionSet(self.grid);
                // Фокус на первый элемент
                var firstCard = self.grid.find('.selector').first();
                Lampa.Controller.collectionFocus(firstCard, self.grid);
                log('Controller: focus set to first card');
            },
            
            up: function() {
                log('Key: UP');
                Lampa.Controller.collectionMove('up');
                self.showFocusInfo();
            },
            down: function() {
                log('Key: DOWN');
                Lampa.Controller.collectionMove('down');
                self.showFocusInfo();
            },
            left: function() {
                log('Key: LEFT');
                Lampa.Controller.collectionMove('left');
                self.showFocusInfo();
            },
            right: function() {
                log('Key: RIGHT');
                Lampa.Controller.collectionMove('right');
                self.showFocusInfo();
            },
            
            back: function() {
                log('Key: BACK');
                Lampa.Activity.backward();
            }
        });
        
        log('Controller registered:', this.controller ? 'OK' : 'FAIL');

        // ======== МЕТОДЫ ========
        
        // Показать информацию о фокусе
        this.showFocusInfo = function() {
            var focused = this.grid.find('.focus');
            var num = focused.find('.gn-num').text() || 'none';
            log('Focus on card:', num);
        };

        // Создание карточки
        this.createCard = function(index) {
            var card = $([
                '<div class="gn-card card selector" data-index="' + index + '">',
                    '<div class="gn-num">#' + index + '</div>',
                    '<div class="gn-title">Видео ' + index + '</div>',
                '</div>'
            ].join(''));

            // hover:focus — когда карточка получает фокус (стрелками)
            card.on('hover:focus', function(e) {
                $(this).addClass('focus');
                self.scroll.update($(this));
                log('Event: focus on #' + index);
            });

            // hover:blur — когда фокус уходит
            card.on('hover:blur', function(e) {
                $(this).removeClass('focus');
            });

            // hover:enter — когда нажали OK/Enter
            card.on('hover:enter', function(e) {
                log('Event: ENTER on #' + index);
                // Показываем уведомление
                try {
                    Lampa.Noty.show('Выбрано видео #' + index);
                } catch(e) {}
            });

            return card;
        };

        // ======== ЖИЗНЕННЫЙ ЦИКЛ ========
        
        this.create = function() {
            log('create() called');
            
            // Создаем обертку
            var wrap = $('<div class="gn-wrap"></div>');
            wrap.append(this.grid);

            // Создаем карточки
            for (var i = 1; i <= 12; i++) {
                this.grid.append(this.createCard(i));
            }
            log('Created 12 cards');

            // Добавляем grid в scroll
            var scrollContent = this.scroll.render();
            scrollContent.append(wrap);
            
            // Возвращаем для Activity
            this.initialized = true;
            log('create() finished');
            
            return scrollContent;
        };

        this.start = function() {
            log('start() called');
            // Активируем контроллер!
            var enabled = Lampa.Controller.enabled();
            log('Current controller:', enabled ? enabled.name : 'none');
            
            Lampa.Controller.enable('content');
            
            var newEnabled = Lampa.Controller.enabled();
            log('New controller:', newEnabled ? newEnabled.name : 'none');
        };

        this.pause = function() {
            log('pause() called');
            Lampa.Controller.disable('content');
        };

        this.stop = function() {
            log('stop() called');
            Lampa.Controller.disable('content');
        };

        this.toggle = function() {
            log('toggle() called');
            // Восстанавливаем фокус при возврате
            Lampa.Controller.collectionSet(this.grid);
            var lastFocus = this.grid.find('.focus');
            Lampa.Controller.collectionFocus(lastFocus.length ? lastFocus : false, this.grid);
        };

        this.render = function() {
            log('render() called');
            return this.scroll.render();
        };

        this.destroy = function() {
            log('destroy() called');
            Lampa.Controller.remove('content');
            this.scroll.destroy();
            $('#grid-nav-debug').remove();
        };
    }

    // ======== РЕГИСТРАЦИЯ ========
    Lampa.Component.add('grid_nav', GridNavComponent);
    log('Component registered');

    // ======== МЕНЮ ========
    function addMenu() {
        var item = $('<li class="menu__item selector" data-action="grid_nav">' +
            '<div class="menu__ico">🎯</div>' +
            '<div class="menu__text">Grid Navigation Test</div>' +
        '</li>');

        item.on('hover:enter', function() {
            log('Menu clicked, pushing activity');
            Lampa.Activity.push({
                url: '',
                title: 'Grid Navigation',
                component: 'grid_nav',
                page: 1
            });
        });

        $('.menu .menu__list').eq(0).append(item);
        log('Menu item added');
    }

    // ======== ЗАПУСК ========
    if (window.appready) {
        addMenu();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') addMenu();
        });
    }

    log('Plugin loaded');
})();
