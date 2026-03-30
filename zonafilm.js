(function () {
    'use strict';

    function MyPlugin(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        var items   = [];
        var html    = $('<div></div>');
        var active_node;

        // 1. Создаем интерфейс
        this.create = function () {
            var _this = this;

            // Добавляем тестовые карточки
            for (var i = 1; i <= 20; i++) {
                var item = $(`
                    <div class="card selector" style="width: 200px; height: 300px; background: #333; margin: 10px; display: inline-block; border: 2px solid transparent; transition: 0.2s;">
                        <div style="padding: 20px; color: #fff;">Карточка ${i}</div>
                    </div>
                `);

                item.on('hover:focus', function () {
                    active_node = $(this);
                    $(this).css('border-color', '#fff'); // Подсветка при фокусе
                    console.log('Focus on card:', i);
                    // Прокрутка к элементу, если он вне видимости
                    scroll.scrollTo(active_node);
                }).on('hover:enter', function () {
                    Lampa.Noty.show('Нажата карточка ' + i);
                    console.log('Select card:', i);
                }).on('hover:hover', function(){
                    $(this).css('border-color', 'transparent');
                });

                items.push(item);
                html.append(item);
            }

            scroll.append(html);
        }

        // 2. Логика активации контроллера
        this.toggle = function () {
            Lampa.Controller.add('my_plugin_controller', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.context('my_plugin_controller');
                },
                right: function () {
                    Lampa.Navigator.move('right');
                },
                left: function () {
                    Lampa.Navigator.move('left');
                },
                down: function () {
                    Lampa.Navigator.move('down');
                },
                up: function () {
                    Lampa.Navigator.move('up');
                },
                back: function () {
                    Lampa.Activity.backward(); // Возврат назад
                }
            });

            Lampa.Controller.toggle('my_plugin_controller');
        }

        this.render = function () {
            return scroll.render();
        }

        this.destroy = function () {
            network.clear();
            scroll.destroy();
            html.remove();
            items = null;
        }
    }

    // Регистрация плагина в Lampa
    function startPlugin() {
        window.my_plugin_ready = true;

        Lampa.Component.add('my_test_plugin', MyPlugin);

        // Добавляем кнопку в левое меню для теста
        var menu_item = $('<li class="menu__item selector" data-action="my_plugin">' +
            '<div class="menu__ico">!</div>' +
            '<div class="menu__text">Тест Навигации</div>' +
            '</li>');

        menu_item.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: 'Тест навигации',
                component: 'my_test_plugin',
                page: 1
            });
        });

        $('.menu .menu__list').append(menu_item);
    }

    if (!window.my_plugin_ready) startPlugin();

})();
