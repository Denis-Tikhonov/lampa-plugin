(function () {
    'use strict';

    // Вспомогательные конструкторы данных
    var u = function (name, video, picture, preview, time, quality, json, related, model) {
        this.name = name;
        this.video = video;         // Прямая ссылка на страницу или видео
        this.picture = picture;     // Обложка
        this.preview = preview;     // .mp4 для ховера
        this.time = time;           // Длительность
        this.quality = quality;     // Качество (HD)
        this.json = json;           // true, так как нужна страница видео для поиска плеера
        this.related = related;
        this.model = model;
    };

    var p = function (title, playlist_url, search_on) {
        this.title = title;
        this.playlist_url = playlist_url;
        this.search_on = search_on;
    };

    var LenkinoParser = {
        host: 'https://lenkino.guru',

        /**
         * Точка входа для AdultJS
         */
        view: function (params, success, error) {
            var _this = this;
            var url = params.url || this.host;
            
            // Обработка пагинации
            if (params.page > 1) {
                // Lenkino использует /page/2/
                url = url.replace(/\/$/, '') + '/page/' + params.page + '/';
            }

            var net = new Lampa.Reguest();
            net.ajax(url, function (html) {
                try {
                    var items = _this.Playlist(html);
                    var menu = _this.Menu(url);
                    success({
                        results: items,
                        menu: menu,
                        page: params.page,
                        total_pages: items.length > 0 ? 100 : params.page // Эмуляция бесконечной прокрутки
                    });
                } catch (e) {
                    error("Ошибка разбора: " + e.message);
                }
            }, error);
        },

        /**
         * Парсинг главной для плитки (AdultMain)
         */
        main: function (params, success, error) {
            this.view(params, success, error);
        },

        /**
         * Поиск по сайту
         */
        search: function (params, success, error) {
            var searchUrl = this.host + '/index.php?do=search&subaction=search&story=' + encodeURIComponent(params.query);
            this.view({ url: searchUrl, page: 1 }, function(data) {
                data.title = 'Lenkino';
                success(data);
            }, error);
        },

        /**
         * Парсинг HTML в массив VideoItem
         */
        Playlist: function (html) {
            var items = [];
            var dom = $(html.replace(/<img/g, '<img data-src')); // Предотвращаем загрузку картинок браузером
            
            dom.find('.movie-item').each(function () {
                var container = $(this);
                var titleE = container.find('.movie-title, .movie-item__title');
                var link = titleE.find('a').attr('href');
                var name = titleE.text().trim();
                var img = container.find('img').attr('data-src');
                var time = container.find('.movie-item__duration').text().trim();
                var quality = container.find('.movie-item__quality').text().trim();

                if (link && name) {
                    // Исправляем относительные ссылки
                    if (link.indexOf('http') !== 0) link = LenkinoParser.host + link;
                    if (img && img.indexOf('http') !== 0) img = LenkinoParser.host + img;

                    items.push(new u(
                        name,
                        link,
                        img,
                        null,   // Lenkino обычно не отдает прямые mp4 превью в листинге
                        time,
                        quality || 'HD',
                        true,   // Нужен переход на страницу для извлечения плеера
                        true,
                        null
                    ));
                }
            });
            return items;
        },

        /**
         * Формирование фильтров (Меню)
         */
        Menu: function (currentUrl) {
            return [
                new p('Новинки', this.host, false),
                new p('Популярное', this.host + '/f/sort=rating/order=desc/', false),
                new p('Топ просмотров', this.host + '/f/sort=views/order=desc/', false),
                new p('Поиск', this.host + '/index.php?do=search&subaction=search&story=', 'search')
            ];
        }
    };

    // Регистрация в глобальной системе AdultJS
    if (window.AdultPlugin && window.AdultPlugin.registerParser) {
        window.AdultPlugin.registerParser('lenkino', LenkinoParser);
    }
})();
