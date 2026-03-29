/**
 * ============================================================
 *  LAMPA PLUGIN — ZonaFilm v1.0.0
 * ============================================================
 *
 *  ЭТАП 1–2:
 *    - Плагин грузится без ошибок
 *    - В боковом меню появляется пункт "ZonaFilm"
 *    - Главное меню плагина на Lampa.Select
 *    - Пункт "Все фильмы" загружает /movies с ZonaFilm
 *    - HTML парсится, постеры выводятся через component:'category_full'
 *
 *  ДАЛЬШЕ (позже):
 *    - Детали фильма
 *    - Поиск
 *    - Категории / жанры
 *    - Дополнительные источники
 * ============================================================
 */

(function () {
    'use strict';

    /* ==========================================================
     *  БЛОК 0: ЗАЩИТА ОТ ДВОЙНОЙ ИНИЦИАЛИЗАЦИИ
     * ========================================================== */
    if (window.zonafilm_plugin_loaded) return;
    window.zonafilm_plugin_loaded = true;

    /* ==========================================================
     *  БЛОК 1: КОНФИГУРАЦИЯ
     * ========================================================== */
    var CONFIG = {
        debug: true,
        ver: '1.0.0',
        site: 'https://zonafilm.ru',
        buildId: '39MEgPaxeFXNBOSc6BloZ',
        proxy: [
            'https://api.codetabs.com/v1/proxy?quest={u}',
            'https://corsproxy.io/?{u}',
            'https://api.allorigins.win/raw?url={u}'
        ],
        pi: 0,
        timeout: 15000
    };

    /* ==========================================================
     *  БЛОК 2: ОТЛАДКА
     * ========================================================== */
    var D = {
        log: function (t, m) {
            if (CONFIG.debug) console.log('[ZF][' + t + ']', m);
        },
        err: function (t, m) {
            console.error('[ZF][ERR][' + t + ']', m);
        },
        noty: function (m) {
            try {
                Lampa.Noty.show(m);
            } catch (e) { }
        }
    };

    D.log('Boot', 'v' + CONFIG.ver);

    /* ==========================================================
     *  БЛОК 3: СЕТЬ
     * ========================================================== */
    var Net = {
        get: function (url, ok, fail, _i) {
            var i = typeof _i === 'number' ? _i : CONFIG.pi;

            if (i >= CONFIG.proxy.length) {
                D.err('Net', 'Все прокси исчерпаны: ' + url);
                if (fail) fail();
                return;
            }

            var pu = CONFIG.proxy[i].replace('{u}', encodeURIComponent(url));

            $.ajax({
                url: pu,
                timeout: CONFIG.timeout,
                dataType: 'text',
                success: function (data) {
                    D.log('Net', 'OK via proxy #' + i);
                    if (ok) ok(data);
                },
                error: function () {
                    D.err('Net', 'Ошибка через proxy #' + i + ', пробуем следующий');
                    Net.get(url, ok, fail, i + 1);
                }
            });
        }
    };

    /* ==========================================================
     *  БЛОК 4: ИСТОЧНИК ZonaFilm — ПАРСИНГ СПИСКА
     * ========================================================== */
    var SourceZonaFilm = {
        base: CONFIG.site,

        /**
         * Парсинг HTML-страницы со списком фильмов
         * Возвращает массив объектов:
         * { title, poster, card, url, year, rating }
         */
        parseList: function (html) {
            var items = [];

            if (!html) {
                D.err('Parse', 'Пустой HTML');
                return items;
            }

            // убираем переносы строк для удобства
            html = html.replace(/\n/g, ' ');

            // ищем все карточки <a class="group" ...>...</a>
            var cards = html.match(/<a class="group"[^>]*>.*?<\/a>/g);

            if (!cards || !cards.length) {
                D.err('Parse', 'Не найдено ни одной карточки');
                return items;
            }

            for (var i = 0; i < cards.length; i++) {
                var card = cards[i];

                // URL фильма
                var urlMatch = card.match(/href="([^"]+)"/);
                var url = urlMatch && urlMatch[1] ? SourceZonaFilm.base + urlMatch[1] : '';

                // постер
                var posterMatch = card.match(/<img[^>]+src="([^"]+)"/);
                var poster = posterMatch && posterMatch[1] ? posterMatch[1] : '';

                // название
                var titleMatch = card.match(/<div class="mt-2\.5[^"]*">.*?<p>(.*?)<\/p>/);
                if (!titleMatch) titleMatch = card.match(/<p>(.*?)<\/p>/);
                var title = titleMatch && titleMatch[1] ? titleMatch[1] : 'Без названия';

                // год
                var yearMatch = card.match(/data-testid="filmcardYear">(\d{4})</);
                var year = yearMatch && yearMatch[1] ? yearMatch[1] : '';

                // рейтинг
                var ratingMatch = card.match(/data-testid="cardRating"[^>]*>([^<]+)/);
                var rating = ratingMatch && ratingMatch[1] ? ratingMatch[1] : '';

                items.push({
                    title: title,
                    poster: poster,
                    card: poster,
                    url: url,
                    year: year,
                    rating: rating
                });
            }

            D.log('Parse', 'Найдено фильмов: ' + items.length);
            return items;
        }
    };

    /* ==========================================================
     *  БЛОК 5: CSS (МИНИМАЛЬНЫЙ)
     * ========================================================== */
    function injectCSS() {
        var css = ''
            + '.zonafilm-debug{color:#ff9800;}';

        var style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }

    /* ==========================================================
     *  БЛОК 6: ГЛАВНОЕ МЕНЮ ПЛАГИНА (Select)
     * ========================================================== */
    function openMainMenu() {
        D.log('UI', 'Открываем главное меню плагина');

        var items = [
            {
                title: 'Все фильмы',
                subtitle: 'Список с ZonaFilm',
                onSelect: function () {
                    openAllMovies();
                }
            },
            {
                title: 'О плагине',
                subtitle: 'Версия ' + CONFIG.ver,
                onSelect: function () {
                    D.noty('ZonaFilm v' + CONFIG.ver);
                }
            }
        ];

        var selectData = {
            title: 'ZonaFilm',
            items: items,
            onSelect: function (item) {
                if (item.onSelect) item.onSelect();
            },
            onBack: function () {
                D.log('UI', 'Закрытие главного меню');
            }
        };

        try {
            Lampa.Select.show(selectData);
        } catch (e) {
            D.err('UI', 'Ошибка при показе Select: ' + e.message);
            D.noty('Ошибка UI в плагине ZonaFilm');
        }
    }

    /* ==========================================================
     *  БЛОК 7: ОТОБРАЖЕНИЕ КАРТОЧЕК
     * ========================================================== */

    /**
     * Загружает страницу /movies, парсит и открывает сетку постеров
     */
    function openAllMovies() {
        var url = SourceZonaFilm.base + '/movies';

        D.log('Net', 'Загружаем список фильмов: ' + url);

        Net.get(url, function (html) {
            var list = SourceZonaFilm.parseList(html);

            if (!list || !list.length) {
                D.noty('ZonaFilm: не удалось получить список фильмов');
                return;
            }

            try {
                Lampa.Activity.push({
                    component: 'category_full',
                    items: list,
                    title: 'ZonaFilm — Все фильмы'
                });
            } catch (e) {
                D.err('UI', 'Ошибка Activity.push: ' + e.message);
                D.noty('ZonaFilm: ошибка отображения списка');
            }

        }, function () {
            D.noty('Ошибка загрузки ZonaFilm');
        });
    }

    /* ==========================================================
     *  БЛОК 8: ДЕТАЛИ ФИЛЬМА (ЗАГОТОВКА)
     * ========================================================== */
    // позже: парсинг страницы фильма и Select с описанием + "Смотреть"

    /* ==========================================================
     *  БЛОК 9: РЕГИСТРАЦИЯ + МЕНЮ + ЗАПУСК
     * ========================================================== */
    function registerMenu() {
        D.log('Init', 'Регистрируем пункт меню ZonaFilm');

        try {
            // локализация (если доступна)
            if (Lampa.Lang && Lampa.Lang.add) {
                Lampa.Lang.add({
                    zonafilm_title: {
                        ru: 'ZonaFilm',
                        en: 'ZonaFilm'
                    }
                });
            }

            var title = 'ZonaFilm';
            if (Lampa.Lang && Lampa.Lang.translate) {
                title = Lampa.Lang.translate('zonafilm_title') || title;
            }

            if (Lampa.Menu && Lampa.Menu.add) {
                Lampa.Menu.add({
                    id: 'zonafilm',
                    title: title,
                    icon: 'icon-lampa',
                    onSelect: function () {
                        openMainMenu();
                    }
                });

                D.log('Init', 'Пункт меню ZonaFilm добавлен');
            } else {
                D.err('Init', 'Lampa.Menu.add недоступен');
                D.noty('ZonaFilm: не удалось добавить пункт меню');
            }
        } catch (e) {
            D.err('Init', 'Ошибка при регистрации меню: ' + e.message);
        }
    }

    function start() {
        D.log('Start', 'Инициализация плагина');
        injectCSS();
        registerMenu();
    }

    // Ожидание готовности приложения Lampa
    if (window.appready) {
        D.log('Start', 'appready уже true, запускаемся сразу');
        start();
    } else if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) {
        D.log('Start', 'Ждём событие app.ready');
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') {
                D.log('Start', 'Получено событие app.ready');
                start();
            }
        });
    } else {
        D.err('Start', 'Lampa.Listener недоступен, пробуем отложенный запуск');
        setTimeout(function () {
            if (window.appready) start();
        }, 3000);
    }
})();
