(function () {
    'use strict';

    console.log('[phub] Parser loading...');

    var PhubParser = {
        view: function(params, success, error) {
            console.log('[phub] view() called');
            
            var url = params.url;
            if (url.indexOf('?') > -1) {
                url += '&page=' + (params.page || 1);
            } else {
                url += '?page=' + (params.page || 1);
            }
            
            var net = new Lampa.Reguest();
            net.silent(url, function(html) {
                try {
                    var items = PhubParser.parse(html);
                    success({
                        results: items,
                        total_pages: 100,
                        page: params.page || 1
                    });
                } catch(e) {
                    error('Parse error: ' + e.message);
                }
            }, function(err) {
                error('Network error');
            }, false, { dataType: 'text', timeout: 15000 });
        },

        parse: function(html) {
            var items = [];
            
            // Быстрый парсинг через регулярные выражения
            var itemRegex = /<li[^>]*class="[^"]*pcVideoListItem[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
            var match;

            while ((match = itemRegex.exec(html)) !== null) {
                try {
                    var itemHtml = match[1];
                    
                    // Получаем заголовок
                    var titleMatch = itemHtml.match(/title="([^"]+)"/i);
                    if (!titleMatch) continue;
                    
                    // Получаем ссылку
                    var hrefMatch = itemHtml.match(/href="([^"]+)"/i);
                    if (!hrefMatch) continue;
                    
                    // Получаем изображение
                    var imgMatch = itemHtml.match(/data-mediumthumb="([^"]+)"/i) || 
                                   itemHtml.match(/src="([^"]+\.jpg)"/i);
                    
                    items.push({
                        name: titleMatch[1].trim(),
                        video: hrefMatch[1].indexOf('http') === 0 ? hrefMatch[1] : 'https://rt.pornhub.com' + hrefMatch[1],
                        picture: imgMatch ? imgMatch[1] : '',
                        source: 'PornHub'
                    });
                } catch(e) {
                    console.log('[phub] Item parse error: ' + e.message);
                }
            }

            console.log('[phub] Parsed ' + items.length + ' items');
            return items;
        },

        search: function(params, success, error) {
            console.log('[phub] search() called');
            params.url = 'https://rt.pornhub.com/video/search?search=' + encodeURIComponent(params.query);
            this.view(params, success, error);
        },

        video: function(params, success, error) {
            console.log('[phub] video() called');
            
            var net = new Lampa.Reguest();
            net.silent(params.url, function(html) {
                try {
                    // Попытка 1: videoUrl
                    var videoMatch = html.match(/"videoUrl":"([^"]+)"/);
                    if (videoMatch) {
                        var url = videoMatch[1].replace(/\\/g, '');
                        success({ path: url });
                        return;
                    }

                    // Попытка 2: mediaDefinitions
                    var mediaMatch = html.match(/mediaDefinitions":\s*(\[[\s\S]*?\])/);
                    if (mediaMatch) {
                        var media = JSON.parse(mediaMatch[1]);
                        var best = media
                            .filter(function(m) { return m.videoUrl; })
                            .sort(function(a, b) { return (b.quality || 0) - (a.quality || 0); })[0];
                        
                        if (best && best.videoUrl) {
                            success({ path: best.videoUrl });
                            return;
                        }
                    }

                    error('Video URL not found');
                } catch(e) {
                    console.error('[phub] video() error: ' + e.message);
                    error('Parse error: ' + e.message);
                }
            }, function(err) {
                error('Network error');
            }, false, { dataType: 'text', timeout: 20000 });
        }
    };

    // Регистрация парсера
    if (window.AdultPlugin) {
        window.AdultPlugin.registerParser('phub', PhubParser);
        console.log('[phub] ✅ Registered');
    } else {
        console.error('[phub] ❌ AdultPlugin not found');
    }

})();
