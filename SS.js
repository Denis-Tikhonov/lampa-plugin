(function () {
    'use strict';

    var PLUGIN_VERSION = '1.2.0';
    var PLUGIN_ID = 'adult_plugin';
    
    // ✅ Ваши ссылки на GitHub
    var MENU_URL = 'https://raw.githubusercontent.com/Denis-Tikhonov/lampa-plugin/main/menu.json';
    var PARSERS_URL = 'https://raw.githubusercontent.com/Denis-Tikhonov/lampa-plugin/main/';

    // Логирование в Lampa (видно на Android TV)
    var Logger = {
        show: function(msg) {
            if (Lampa.Noty) {
                Lampa.Noty.show(msg);
            }
            console.log('[SS] ' + msg);
        },
        error: function(msg) {
            if (Lampa.Noty) {
                Lampa.Noty.show('❌ ' + msg, 'error');
            }
            console.error('[SS] ERROR: ' + msg);
        },
        info: function(msg) {
            console.log('[SS] INFO: ' + msg);
        }
    };

    // Кэш
    var Cache = {
        data: {},
        set: function(key, value) {
            this.data[key] = value;
        },
        get: function(key) {
            return this.data[key] || null;
        }
    };

    // Реестр парсеров
    window.AdultPlugin = {
        parsers: {},
        registerParser: function(name, obj) {
            this.parsers[name] = obj;
            Logger.info('Parser registered: ' + name);
        }
    };

    // Загрузчик парсеров
    var ParserLoader = {
        loaded: {},
        load: function(parserName, callback) {
            if (this.loaded[parserName]) {
                callback();
                return;
            }

            var scriptUrl = PARSERS_URL + parserName + '.js';
            var script = document.createElement('script');
            script.src = scriptUrl;
            
            script.onload = function() {
                ParserLoader.loaded[parserName] = true;
                Logger.info('✅ Loaded parser: ' + parserName);
                callback();
            };
            
            script.onerror = function() {
                Logger.error('Failed to load parser: ' + scriptUrl);
                callback();
            };
            
            document.head.appendChild(script);
        }
    };

    // =============================================================
    // ОСНОВНОЙ КОМПОНЕНТ
    // =============================================================
    function startPlugin() {
        Logger.show('📺 SS Plugin v' + PLUGIN_VERSION + ' started');
        
        Lampa.Component.add('adult', function(object) {
            var comp = this;
            
            this.create = function() {
                this.activity.loader(true);
                this.loadMenu();
                return this.render();
            };

            this.loadMenu = function() {
                Logger.info('Loading menu...');
                var cachedMenu = Cache.get('main_menu');
                
                if (cachedMenu) {
                    Logger.info('Using cached menu');
                    comp.showMenu(cachedMenu);
                    return;
                }

                var net = new Lampa.Reguest();
                net.silent(MENU_URL, function(data) {
                    Logger.info('Menu loaded successfully');
                    
                    if (data && data.channels && data.channels.length > 0) {
                        Cache.set('main_menu', data.channels);
                        comp.showMenu(data.channels);
                    } else {
                        Logger.error('Invalid menu structure');
                    }
                }, function(err) {
                    Logger.error('Menu load failed: ' + (err || 'Unknown error'));
                    comp.activity.loader(false);
                }, false, { dataType: 'json', timeout: 10000 });
            };

            this.showMenu = function(channels) {
                Logger.info('Showing ' + channels.length + ' channels');
                this.activity.loader(false);
                
                var items = channels.map(function(ch) {
                    return {
                        title: ch.title,
                        description: ch.playlist_url,
                        image: ch.icon || '',
                        parser: ch.parser || 'phub'
                    };
                });

                this.display(items);
            };

            this.display = function(items) {
                var scroll = new Lampa.Scroll({mask: true, over: true});
                
                items.forEach(function(item, idx) {
                    var card = Lampa.Template.get('button', {title: item.title});
                    
                    card.on('hover:enter', function() {
                        Logger.info('Selected: ' + item.title);
                        comp.openChannel(item);
                    });
                    
                    scroll.append(card);
                });
                
                comp.append(scroll.render());
            };

            this.openChannel = function(item) {
                Logger.info('Opening channel: ' + item.title + ' (' + item.parser + ')');
                
                var parser = window.AdultPlugin.parsers[item.parser];
                
                if (!parser) {
                    Logger.info('Parser not loaded, loading: ' + item.parser);
                    ParserLoader.load(item.parser, function() {
                        comp.openChannel(item);
                    });
                    return;
                }
                
                // Переход к компоненту просмотра
                Lampa.Activity.push({
                    url: item.description,
                    title: item.title,
                    component: 'adult_view',
                    page: 1,
                    parser: item.parser
                });
            };
        });

        setupUI();
    }

    // =============================================================
    // НАСТРОЙКИ
    // =============================================================
    function setupUI() {
        try {
            Lampa.SettingsApi.addComponent({
                component: 'adult_settings',
                name: '🔞 Клубничка',
                icon: '<svg height="36" viewBox="0 0 24 24" width="36"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" fill="white"/></svg>'
            });

            Lampa.SettingsApi.addParam({
                component: 'adult_settings',
                param: { name: 'adult_cache_clear', type: 'trigger' },
                field: { name: 'Очистить кэш', description: 'Удалить сохраненное меню' },
                onChange: function(val) {
                    if (val) {
                        Cache.data = {};
                        Logger.show('✅ Кэш очищен');
                    }
                }
            });
        } catch(e) {
            Logger.info('Settings setup skipped: ' + e.message);
        }
    }

    // Запуск
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') startPlugin();
        });
    }

})();
