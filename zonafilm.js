(function () {
  'use strict';

  var Defined = {
    use_api: 'lampac',
    // базовый URL на GitHub
    github_raw_base: 'https://raw.githubusercontent.com/Denis-Tikhonov/lampa-plugin/main',
    // Путь к json файлам
    json_host: 'https://raw.githubusercontent.com/Denis-Tikhonov/lampa-plugin/main/ss',
    // Можно использовать pages: https://denis-tikhonov.github.io/lampa-plugin/
    // Для закладок, если есть:
    bookmarks_url: 'https://raw.githubusercontent.com/Denis-Tikhonov/lampa-plugin/main/bookmarks.json',
    // Для phub json
    phub_url: 'https://raw.githubusercontent.com/Denis-Tikhonov/lampa-plugin/main/phub.json',
  };

  var network = new Lampa.Reguest();

  // --------- Функции для получения json с github ---------
  function getJsonFromGithub(path, success, error) {
    var url = Defined.json_host + '/' + path;
    network.silent(
      url,
      function (json) {
        if (json) success(json);
        else error();
      },
      error
    );
  }

  // --------- Работа с закладками в localStorage ---------
  function getBookmarks(success, error) {
    try {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      success(bookmarks);
    } catch (e) {
      error();
    }
  }

  function saveBookmarks(bookmarks) {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }

  // --------- Получение json для phub ---------
  function getPhub(success, error) {
    getJsonFromGithub('phub.json', success, error);
  }

  // --------- API подключение ---------
  function Api() {
    var self = this;

    // Главное меню — например, из github
    self.menu = function (success, error) {
      getJsonFromGithub('menu.json', success, error);
    };

    // Представление
    self.view = function (params, success, error) {
      getJsonFromGithub('view.json', success, error);
    };

    // Работа с закладками
    self.bookmark = function (element, add, call) {
      getBookmarks(function (bookmarks) {
        if (add) {
          // добавляем
          bookmarks.push(element);
        } else {
          // удаляем
          var index = bookmarks.findIndex(b => b.uid === element.uid);
          if (index !== -1) bookmarks.splice(index, 1);
        }
        saveBookmarks(bookmarks);
        call(true);
      }, function () {
        call(false);
      });
    };

    // Для получения json, например, для плейлистов
    self.playlist = function (add_url_query, oncomplite, error) {
      getJsonFromGithub('playlist.json', oncomplite, error);
    };

    // Получение json для /phub
    self.phub = function (success, error) {
      getPhub(success, error);
    };

    // Очистка кеша (если нужно)
    self.clear = function () {
      // ничего не делаем
    };

    // Пример: получение аккаунта (заглушка)
    self.account = function (u) {
      return u;
    };
  }

  var Api = new Api();

  // --------- Инициализация плагина ---------
  function startPlugin() {
    window['plugin_sisi_' + Defined.use_api + '_ready'] = true;

    var unic_id = Lampa.Storage.get('sisi_unic_id', '');
    if (!unic_id) {
      unic_id = Lampa.Utils.uid(8).toLowerCase();
      Lampa.Storage.set('sisi_unic_id', unic_id);
    }

    // Регистрация компонентов
    Lampa.Component.add('sisi_' + Defined.use_api, Sisi);
    Lampa.Component.add('sisi_view_' + Defined.use_api, View);
    // addSourceSearch(); // если нужно
    Lampa.Search.addSource(Search);

    // Инициализация
    function init() {
      // Можно загрузить закладки из localStorage по умолчанию
      // или сделать начальную инициализацию
      if (!localStorage.getItem('bookmarks')) {
        localStorage.setItem('bookmarks', JSON.stringify([]));
      }
    }

    if (window.appready) init();
    else {
      Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') init();
      });
    }
  }

  // Запуск
  if (!window['plugin_sisi_' + Defined.use_api + '_ready']) {
    startPlugin();
  }
})();
