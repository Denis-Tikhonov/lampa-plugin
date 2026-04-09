(function() {
    'use strict';

    var NAME = 'PornBriz';
    var HOST = 'https://pornobriz.com';

    function Briz(api) {
        this.main = function() {
            var items = [
                { title: 'Новое', url: HOST + '/latest-updates/' },
                { title: 'Популярное', url: HOST + '/most-popular/' },
                { title: 'Топ рейтинга', url: HOST + '/top-rated/' },
                { title: 'Длинные видео', url: HOST + '/categories/long-movies/' }
            ];
            api.menu(items, this.list.bind(this));
        };

        this.list = function(item) {
            var url = item.url;
            if (item.page > 1) {
                // Формат пагинации для Briz: /page/2/
                url = item.url.replace(/\/$/, '') + '/page/' + item.page + '/';
            }

            api.fetch(url, function(html) {
                if (!html) return api.error();

                var items = [];
                var temp = document.createElement('div');
                temp.innerHTML = html;

                // Основные селекторы карточек видео
                var cards = temp.querySelectorAll('.th-item, .thumb-video');

                cards.forEach(function(card) {
                    var link = card.querySelector('a');
                    var img = card.querySelector('img');
                    var title = card.querySelector('.th-title, .title, .thumb-title');

                    if (link) {
                        var href = link.getAttribute('href');
                        var video_url = href.indexOf('http') === -1 ? HOST + href : href;
                        
                        var poster = img ? (img.getAttribute('data-original') || img.getAttribute('data-src') || img.getAttribute('src')) : '';
                        if (poster && poster.indexOf('http') === -1) poster = HOST + poster;

                        items.push({
                            title: title ? title.textContent.trim() : link.getAttribute('title'),
                            url: video_url,
                            img: poster,
                            js: true // Сигнал AdultJS искать плеер на странице
                        });
                    }
                });

                api.result(items);
            });
        };

        this.search = function(query) {
            this.list({ url: HOST + '/search/' + encodeURIComponent(query) + '/' });
        };

        // Поиск прямой ссылки на видео или iframe
        this.video = function(item) {
            api.fetch(item.url, function(html) {
                if (!html) return api.error();

                // Ищем скрипты плеера или iframe
                var video_url = '';
                var match = html.match(/video_url:\s*['"]([^'"]+)['"]/);
                
                if (match && match[1]) {
                    video_url = match[1];
                } else {
                    // Если прямая ссылка зашифрована, пытаемся найти iframe
                    var iframe = html.match(/<iframe.*?src=["']([^"']+)["']/);
                    if (iframe) video_url = iframe[1];
                }

                if (video_url) {
                    api.play({ url: video_url, title: item.title });
                } else {
                    api.error('Не удалось найти видео');
                }
            });
        };
    }

    window.AdultJS.register(NAME, Briz);
})();
