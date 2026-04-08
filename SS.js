(function () {
    'use strict';

    var PLUGIN_VERSION = '1.2.0';
    var PLUGIN_ID = 'adult_plugin';
    
    // ✅ УБЕДИТЕСЬ, что это правильные ссылки на ВАШ репо!
    var MENU_URL = 'https://raw.githubusercontent.com/Denis-Tikhonov/lampa-plugin/main/menu.json';
    var PARSERS_URL = 'https://raw.githubusercontent.com/Denis-Tikhonov/lampa-plugin/main/';

    console.log('🟢 AdultJS v' + PLUGIN_VERSION + ' loaded');
    console.log('📋 Menu URL:', MENU_URL);
    console.log('📦 Parsers URL:', PARSERS_URL);

    // =============================================================
    // [1] СИСТЕМА ЛОГИРОВАНИЯ
    // =============================================================
    var Logger = {
        levels: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 },
        currentLevel: Lampa.Storage.field('adult_debug_mode') ? 0 : 1,
        
        log: function(level, component, msg, data) {
            if (level < this.currentLevel) return;
            var timestamp = new Date().toLocaleTimeString();
            var levelStr = Object.keys(this.levels).find(k => this.levels[k] === level);
            var logMsg = `[${timestamp}] [AdultJS] [${component}] ${levelStr}: ${msg}`;
            console.log(logMsg, data || '');
            
            if (level >= 2) {
                var logs = Lampa.Storage.get('adult_debug_logs', []);
                logs.push({ t: timestamp, c: component, l: levelStr, m: msg });
                Lampa.Storage.set('adult_debug_logs', logs.slice(-50));
            }
        },
        debug: function(c, m, d) { this.log(0, c, m, d); },
        info: function(c, m, d) { this.log(1, c, m, d); },
        warn: function(c, m, d) { this.log(2, c, m, d); },
        error: function(c, m, d) { this.log(3, c, m, d); }
    };

    // =============================================================
    // [2] УМНЫЙ КЭШ
    // =============================================================
    var SmartCache = {
        _data: {},
        set: function(key, value, ttl_ms) {
            this._data[key] = { v: value, e: Date.now() + (ttl_ms || 3600000) };
            Logger.debug('Cache', 'Saved: ' + key);
        },
        get: function(key) {
            var item = this._data[key];
            if (!item) {
                Logger.debug('Cache', 'Miss: ' + key);
                return null;
            }
            if (Date.now() > item.e) { 
                delete this._data[key]; 
                Logger.debug('Cache', 'Expired: ' + key);
                return null; 
            }
            Logger.debug('Cache', 'Hit: ' + key);
            return item.v;
        },
        clear: function() { this._data = {}; }
    };

    // =============================================================
    // [3] РЕЕСТР ПАРСЕРОВ
    // =============================================================
    window.AdultPlugin = {
        parsers: {},
        registerParser: function(name, obj) {
            this.parsers[name] = obj;
            Logger.info('Registry', '✅ Parser registered: ' + name);
            console.log('🎯 Available parsers:', Object.keys(this.parsers));
        }
    };

    // =============================================================
    // [4] ЗАГРУЗЧИК ПАРСЕРОВ
    // =============================================================
    var ParserLoader = {
        loaded: {},
        load: function(parserName, callback) {
            var _this = this;
            
            if (this.loaded[parserName]) {
                Logger.info('ParserLoader', 'Parser already loaded: ' + parserName);
                callback();
                return;
            }

            var scriptUrl = PARSERS_URL + parserName + '.js';
            Logger.info('ParserLoader', 'Loading parser: ' + scriptUrl);

            var script = document.createElement('script');
            script.src = scriptUrl;
            
            script.onload = function() {
                _this.loaded[parserName] = true;
                Logger.info('ParserLoader', '✅ Loaded: ' + parserName);
                callback();
            };
            
            script.onerror = function() {
                Logger.error('ParserLoader', '❌ Failed to load: ' + scriptUrl);
                callback(); // Продолжаем, чтобы не зависнуть
            };
            
            document.head.appendChild(script);
        }
    };

    // =============================================================
    // [5] ОСНОВНАЯ ЛОГИКА ПЛАГИНА
    // =============================================================
    function startPlugin() {
        Logger.info('Plugin', 'Initializing...');
        
        Lampa.Component.add('adult', function(object) {
            var comp = this;
            
            this.create = function() {
                Logger.info('Component', 'Create called');
                this.activity.loader(true);
                this.loadMenu();
                return this.render();
            };

            this.loadMenu = function() {
                Logger.info('Menu', 'Loading menu...');
                var cachedMenu = SmartCache.get('main_menu');
                
                if (cachedMenu) {
                    Logger.info('Menu', 'Using cached menu');
                    return this.showMenu(cachedMenu);
                }

                var net = new Lampa.Reguest();
                net.silent(MENU_URL, function(data) {
                    Logger.info('Menu', 'Received data');
                    console.log('📥 Menu data:', data);
                    
                    if (data && data.channels) {
                        SmartCache.set('main_menu', data.channels, 86400000);
                        comp.showMenu(data.channels);
                    } else {
                        Logger.error('Menu', 'Invalid data structure');
                        Lampa.Noty.show('Ошибка: некорректная структура меню');
                    }
                }, function(err) {
                    Logger.error('Menu', 'Load failed: ' + err);
                    Lampa.Noty.show('❌ Ошибка загрузки меню');
                }, false, { dataType: 'json', timeout: 10000 });
            };

            this.showMenu = function(channels) {
                Logger.info('Menu', 'Showing ' + channels.length + ' channels');
                this.activity.loader(false);
                
                var items = channels.map(function(ch) {
                    return {
                        title: ch.title,
                        description: ch.playlist_url,
                        image: ch.icon,
                        parser: ch.parser
                    };
                });

                this.display(items);
            };

            this.display = function(items) {
                Logger.info('Display', 'Rendering ' + items.length + ' items');
                var scroll = new Lampa.Scroll({mask: true, over: true});
                
                items.forEach(function(item) {
                    var card = Lampa.Template.get('button', {title: item.title});
                    card.on('hover:enter', function() {
                        Logger.info('Display', 'Opened: ' + item.title);
                        comp.openChannel(item);
                    });
                    scroll.append(card);
                });
                
                comp.append(scroll.render());
            };

            this.openChannel = function(item) {
                Logger.info('Channel', 'Opening: ' + item.title + ' with parser: ' + item.parser);
                
                var parser = window.AdultPlugin.parsers[item.parser];
                
                if (!parser) {
                    Logger.warn('Channel', 'Parser not found: ' + item.parser + ', loading...');
                    this.injectParser(item.parser, function() {
                        Logger.info('Channel', 'Parser loaded, opening channel again');
                        comp.openChannel(item);
                    });
                    return;
                }
                
                Logger.info('Channel', 'Parser found, pushing activity');
                
                Lampa.Activity.push({
                    url: item.description,
                    title: item.title,
                    component: 'adult_view',
                    page: 1,
                    parser: item.parser
                });
            };

            this.injectParser = function(name, cb) {
                ParserLoader.load(name, cb);
            };
        });

        setupSettings();
    }

    // =============================================================
    // [6] НАСТРОЙКИ
    // =============================================================
    function setupSettings() {
        Logger.info('Settings', 'Setting up...');
        
        Lampa.SettingsApi.addComponent({
            component: 'adult_settings',
            name: 'Клубничка',
            icon: '<svg height="36" viewBox="0 0 24 24" width="36"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" fill="white"/></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: 'adult_settings',
            param: { name: 'adult_proxy_mode', type: 'select', values: { 'auto': 'Авто', 'always': 'Всегда', 'none': 'Нет' }, default: 'auto' },
            field: { name: 'Использовать прокси', description: 'Помогает обходить блокировки' }
        });

        Lampa.SettingsApi.addParam({
            component: 'adult_settings',
            param: { name: 'adult_debug_mode', type: 'trigger', default: false },
            field: { name: 'Режим отладки', description: 'Детальные логи в консоли' },
            onChange: function(value) {
                Logger.currentLevel = value ? 0 : 1;
            }
        });
    }

    // =============================================================
    // [7] ЗАПУСК
    // =============================================================
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') startPlugin();
        });
    }

})();
