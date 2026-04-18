/* Lampa Parser: TrahKino v1.1.0 */
(function () {
    'use strict';

    function TrahKino(object) {
        var network = new Lampa.RegExp();
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var items = [];
        var html = $('<div></div>');
        
        // Очистка URL от префикса проксирования Lampa, если он есть
        function cleanUrl(url) {
            if (!url) return '';
            return url.replace(/^.*?\/function\/0\//, '');
        }

        this.search = function (query) {
            var url = 'https://trahkino.me/?do=search&subaction=search&story=' + encodeURIComponent(query);
            network.silent(url, function (str) {
                var data = str.replace(/\s/g, ' ');
                var items_html = data.match(/<div class="th-item">.*?<\/div> <\/div>/g) || [];
                items = [];

                items_html.forEach(function (item) {
                    var title = item.match(/<div class="th-title">(.*?)<\/div>/);
                    var link = item.match(/href="(.*?)"/);
                    var img = item.match(/src="(.*?)"/);

                    if (title && link) {
                        items.push({
                            title: title[1],
                            url: link[1],
                            img: img ? 'https://trahkino.me' + img[1] : ''
                        });
                    }
                });

                if (items.length) {
                    html.append(scroll.render());
                    items.forEach(function (item) {
                        var card = Lampa.Template.get('button', {title: item.title});
                        card.on('hover:enter', function () {
                            extractVideo(item.url);
                        });
                        scroll.append(card);
                    });
                }
            });
        };

        function extractVideo(url) {
            network.silent(cleanUrl(url), function (str) {
                var video = str.match(/file:"(.*?)"/);
                if (video) {
                    var finalUrl = video[1];
                    // Направляем через ваш W138.js
                    var proxyUrl = 'https://W138.js.workers.dev/?url=' + encodeURIComponent(finalUrl);
                    
                    Lampa.Player.play({
                        url: proxyUrl,
                        title: object.movie.title
                    });
                }
            });
        }
    }

    Lampa.Plugins.add('trahkino', TrahKino);
})();
