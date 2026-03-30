// ============================================================
//  LAMPA PLUGIN — Grid Navigation (Debug Mode)
//  Полная диагностика без ADB
// ============================================================

(function() {
    'use strict';

    // ======== ВИЗУАЛЬНАЯ КОНСОЛЬ НА ЭКРАНЕ ========
    var LOG = [];
    var MAX_LOG = 15;
    
    function log(msg) {
        var time = new Date().toLocaleTimeString();
        var entry = '[' + time + '] ' + msg;
        LOG.push(entry);
        if (LOG.length > MAX_LOG) LOG.shift();
        updateScreen();
        // Также пытаемся в консоль
        try { console.log(entry); } catch(e) {}
    }
    
    function updateScreen() {
        var box = document.getElementById('viz-log');
        if (!box) {
            box = document.createElement('div');
            box.id = 'viz-log';
            box.style.cssText = 'position:fixed;top:5px;left:5px;right:5px;background:rgba(0,0,0,0.95);color:#0f0;padding:10px;font-family:monospace;font-size:13px;z-index:99999;max-height:200px;overflow:auto;border:2px solid #0f0;pointer-events:none;line-height:1.4';
            document.body.appendChild(box);
        }
        box.innerHTML = LOG.join('<br>');
        box.scrollTop = box.scrollHeight;
    }

    log('=== PLUGIN v3.0 START ===');

    // ======== ПРОВЕРКА LAMPA ========
    if (typeof window.Lampa === 'undefined') {
        log('FATAL: window.Lampa undefined!');
        return;
    }
    
    var L = window.Lampa;
    log('Lampa found');
    
    // Проверяем все ключевые объекты
    var checks = ['Controller', 'Scroll', 'Component', 'Activity', 'Listener'];
    for (var i = 0; i < checks.length; i++) {
        var name = checks[i];
        var exists = typeof L[name] !== 'undefined';
        log(name + ': ' + (exists ? 'OK' : 'MISSING'));
        
        if (exists && name === 'Controller') {
            // Детальная проверка Controller
            var C = L.Controller;
            log('  - enabled: ' + (typeof C.enabled !== 'undefined' ? 'function' : 'missing'));
            log('  - enable: ' + (typeof C.enable !== 'undefined' ? 'function' : 'missing'));
            log('  - add: ' + (typeof C.add !== 'undefined' ? 'function' : 'missing'));
            log('  - remove: ' + (typeof C.remove !== 'undefined' ? 'function' : 'missing'));
            log('  - collectionSet: ' + (typeof C.collectionSet !== 'undefined' ? 'function' : 'missing'));
            log('  - collectionMove: ' + (typeof C.collectionMove !== 'undefined' ? 'function' : 'missing'));
        }
    }

    // ======== СТИЛИ ========
    var CSS = [
        '.dg-wrap{position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;background:#151515;padding-top:220px}',
        '.dg-grid{display:flex;flex-wrap:wrap;gap:25px;padding:30px 40px;justify-content:flex-start}',
        '.dg-card{width:20%;min-width:180px;height:200px;background:#2a2a2a;border-radius:15px;position:relative;transition:all 0.25s;border:3px solid #444;overflow:hidden;box-sizing:border-box}',
        '.dg-card.focus{background:#00d4ff;border-color:#fff;transform:scale(1.12);box-shadow:0 0 50px rgba(0,212,255,0.8);z-index:100}',
        '.dg-card.active{background:#ff0066;border-color:#fff}',
        '.dg-num{position:absolute;top:8px;left:8px;background:#000;color:#0f0;padding:5px 10px;border-radius:5px;font-size:16px;font-weight:bold;z-index:10}',
        '.dg-card.focus .dg-num{background:#fff;color:#000}',
        '.dg-title{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.95));color:#fff;padding:20px 10px 15px;text-align:center;font-size:15px;font-weight:bold}'
    ].join('');
    
    try {
        $('<style>').text(CSS).appendTo('head');
        log('CSS loaded');
    } catch(e) {
        log('CSS ERROR: ' + e.message);
    }

    // ======== КОМПОНЕНТ ========
    function DebugGridComponent(object) {
        log('=== COMPONENT INIT ===');
        
        var self = this;
        this.activity = object;
        
        // Создаем элементы через чистый DOM для совместимости
        this.scroll = new L.Scroll({ mask: true, over: true, step: 250 });
        
        // Grid как jQuery объект
        this.$grid = $('<div class="dg-grid"></div>');
        this.grid = this.$grid[0]; // чистый DOM
        
        this.currentFocus = 0;
        this.totalCards = 12;
        this.cols = 4;

        // ======== УДАЛЕНИЕ СТАРОГО ========
        try {
            L.Controller.remove('content');
            log('Old controller removed');
        } catch(e) {
            log('No old controller');
        }

        // ======== СОЗДАНИЕ КОНТРОЛЛЕРА ========
        log('Registering controller...');
        
        var ctrlDef = {
            toggle: function() {
                log('>>> TOGGLE() called');
                self.activateGrid();
            },
            
            up: function() { self.navigate('up'); },
            down: function() { self.navigate('down'); },
            left: function() { self.navigate('left'); },
            right: function() { self.navigate('right'); },
            
            back: function() {
                log('BACK pressed');
                L.Activity.backward();
            }
        };

        try {
            this.controller = L.Controller.add('content', ctrlDef);
            log('Controller registered: ' + (this.controller ? 'OK' : 'FAIL'));
        } catch(e) {
            log('Controller REG ERROR: ' + e.message);
            // Запасной вариант
            this.controller = ctrlDef;
            log('Using fallback controller');
        }

        // ======== МЕТОДЫ НАВИГАЦИИ ========
        
        this.activateGrid = function() {
            log('Activating grid...');
            
            try {
                L.Controller.collectionSet(this.$grid);
                log('collectionSet OK');
            } catch(e) {
                log('collectionSet FAIL: ' + e.message);
            }
            
            try {
                var first = this.$grid.find('.selector').first();
                log('First card: ' + first.length);
                L.Controller.collectionFocus(first, this.$grid);
                log('Focus set');
            } catch(e) {
                log('Focus FAIL: ' + e.message);
                // Ручная установка
                this.manualFocus(0);
            }
        };

        this.navigate = function(dir) {
            log('NAV: ' + dir);
            
            // Пробуем стандартный метод
            try {
                L.Controller.collectionMove(dir);
                log('collectionMove OK');
                this.updateFocusIndex();
                return;
            } catch(e) {
                log('collectionMove FAIL: ' + e.message);
            }
            
            // Ручная навигация
            this.manualNavigate(dir);
        };

        this.manualNavigate = function(dir) {
            var oldIdx = this.currentFocus;
            var newIdx = oldIdx;
            
            switch(dir) {
                case 'up': newIdx = oldIdx - this.cols; break;
                case 'down': newIdx = oldIdx + this.cols; break;
                case 'left': newIdx = oldIdx - 1; break;
                case 'right': newIdx = oldIdx + 1; break;
            }
            
            // Проверка границ
            if (newIdx < 0) newIdx = 0;
            if (newIdx >= this.totalCards) newIdx = this.totalCards - 1;
            
            // Проверка перехода строки для left/right
            if (dir === 'left' && oldIdx % this.cols === 0) newIdx = oldIdx;
            if (dir === 'right' && (oldIdx + 1) % this.cols === 0) newIdx = oldIdx;
            
            log('Manual: ' + oldIdx + ' -> ' + newIdx);
            this.manualFocus(newIdx);
        };

        this.manualFocus = function(idx) {
            this.$grid.find('.focus').removeClass('focus');
            var card = this.$grid.find('.selector').eq(idx);
            card.addClass('focus');
            this.scroll.update(card);
            this.currentFocus = idx;
            log('Focus now: ' + idx);
        };

        this.updateFocusIndex = function() {
            var focused = this.$grid.find('.focus');
            var all = this.$grid.find('.selector');
            this.currentFocus = all.index(focused);
            log('Focus index: ' + this.currentFocus);
        };

        // ======== СОЗДАНИЕ КАРТОЧЕК ========
        this.createCard = function(i) {
            var card = $('<div class="dg-card card selector" data-index="' + i + '">' +
                '<div class="dg-num">' + (i + 1) + '</div>' +
                '<div class="dg-title">Card ' + (i + 1) + '</div>' +
            '</div>');

            // События Lampa
            card.on('hover:focus', function() {
                $(this).addClass('focus');
                self.scroll.update($(this));
                self.currentFocus = i;
            });

            card.on('hover:blur', function() {
                $(this).removeClass('focus');
            });

            card.on('hover:enter', function() {
                log('ENTER on card ' + (i + 1));
                $(this).toggleClass('active');
                try {
                    L.Noty.show('Card ' + (i + 1));
                } catch(e) {}
            });

            return card;
        };

        // ======== ЖИЗНЕННЫЙ ЦИКЛ ========
        
        this.create = function() {
            log('CREATE called');
            
            var wrap = $('<div class="dg-wrap"></div>');
            
            for (var i = 0; i < this.totalCards; i++) {
                this.$grid.append(this.createCard(i));
            }
            log('Cards: ' + this.totalCards);
            
            wrap.append(this.$grid);
            
            var scrollEl = this.scroll.render();
            scrollEl.append(wrap);
            
            log('CREATE done');
            return scrollEl;
        };

        this.start = function() {
            log('>>> START called');
            
            // Проверка состояния
            var before = 'unknown';
            try {
                var en = L.Controller.enabled();
                before = en ? (en.name || 'no name') : 'null';
            } catch(e) {
                before = 'error';
            }
            log('Controller before: ' + before);
            
            // Активация
            log('Calling enable...');
            try {
                L.Controller.enable('content');
                log('Enable called');
            } catch(e) {
                log('Enable ERROR: ' + e.message);
            }
            
            // Проверка после
            var after = 'unknown';
            try {
                var en2 = L.Controller.enabled();
                after = en2 ? (en2.name || 'no name') : 'null';
            } catch(e) {
                after = 'error';
            }
            log('Controller after: ' + after);
            
            // Принудительная активация через toggle
            var self = this;
            setTimeout(function() {
                log('Delayed activation...');
                try {
                    if (self.controller && self.controller.toggle) {
                        self.controller.toggle();
                    } else {
                        log('No toggle, manual activate');
                        self.activateGrid();
                    }
                } catch(e) {
                    log('Activation ERROR: ' + e.message);
                }
            }, 300);
            
            // Вторичная проверка
            setTimeout(function() {
                var final = 'unknown';
                try {
                    var enf = L.Controller.enabled();
                    final = enf ? (enf.name || 'no name') : 'null';
                } catch(e) {}
                log('Final controller: ' + final);
                
                // Если всё ещё нет фокуса — ставим вручную
                if (self.$grid.find('.focus').length === 0) {
                    log('NO FOCUS! Setting manually');
                    self.manualFocus(0);
                }
            }, 600);
        };

        this.pause = function() {
            log('PAUSE');
            try { L.Controller.disable('content'); } catch(e) {}
        };

        this.stop = function() {
            log('STOP');
            try { L.Controller.disable('content'); } catch(e) {}
        };

        this.toggle = function() {
            log('TOGGLE');
            this.activateGrid();
        };

        this.render = function() {
            log('RENDER');
            return this.scroll.render();
        };

        this.destroy = function() {
            log('DESTROY');
            try { L.Controller.remove('content'); } catch(e) {}
            this.scroll.destroy();
        };
    }

    // ======== РЕГИСТРАЦИЯ ========
    log('Registering component...');
    try {
        L.Component.add('debug_grid', DebugGridComponent);
        log('Component OK');
    } catch(e) {
        log('Component ERROR: ' + e.message);
        return;
    }

    // ======== МЕНЮ ========
    function addMenu() {
        log('Adding menu...');
        
        var item = $('<li class="menu__item selector" data-action="debug_grid">' +
            '<div class="menu__ico" style="font-size:24px">🧪</div>' +
            '<div class="menu__text">DEBUG GRID v3</div>' +
        '</li>');

        item.on('hover:enter', function() {
            log('Menu clicked!');
            try {
                L.Activity.push({
                    url: '',
                    title: 'Debug Grid',
                    component: 'debug_grid',
                    page: 1
                });
            } catch(e) {
                log('Push ERROR: ' + e.message);
            }
        });

        try {
            $('.menu .menu__list').eq(0).append(item);
            log('Menu OK');
        } catch(e) {
            log('Menu ERROR: ' + e.message);
        }
    }

    // ======== ЗАПУСК ========
    if (window.appready) {
        log('App ready NOW');
        addMenu();
    } else {
        log('Waiting for app...');
        L.Listener.follow('app', function(e) {
            log('App event: ' + e.type);
            if (e.type === 'ready') {
                addMenu();
            }
        });
    }

    log('=== INIT COMPLETE ===');
})();
