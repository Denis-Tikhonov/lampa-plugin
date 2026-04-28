(function () {
  'use strict';

  var PLUGIN_ID      = 'adult_lampac';
  var PLUGIN_VERSION = '1.6.0';
  var GITHUB_BASE    = 'https://denis-tikhonov.github.io/plug/';
  var MENU_URL       = GITHUB_BASE + 'menu.json';
  var WORKER_DEFAULT = 'https://zonaproxy.777b737.workers.dev/?url=';

  // 1.6.0: Карта соответствия URL и имен файлов парсеров
  var DOMAIN_MAP = {
    'pornhub.com':     'phub',
    'rt.pornhub.com':  'phub',
    'xhamster.com':    'xham',
    'xvideos.com':     'xvid',
    'xnxx.com':        'xnxx',
    'bongacams.com':   'bonga',
    'chaturbate.com':  'chatur',
    'porno365':        'p365',
    'beeg.com':        'beeg',
    'tnaflix.com':     'tna',
    'spankbang.com':   'spank',
    'redtube.com':     'redt',
    'youporn.com':     'yporn',
    'ebold.com':       'ebold',
    'pxtv':            'pxtv',
    'xv-ru.com':       'xvid'
  };

  function resolveParserName(url) {
    if (!url) return null;
    for (var domain in DOMAIN_MAP) {
      if (url.indexOf(domain) !== -1) return DOMAIN_MAP[domain];
    }
    return null;
  }

  // ПОЛИФИЛЛЫ
  if (!Array.prototype.find) {
    Array.prototype.find = function (fn) {
      for (var i = 0; i < this.length; i++) {
        if (fn(this[i], i, this)) return this[i];
      }
      return undefined;
    };
  }

  // ХРАНИЛИЩЕ ЗАКЛАДОК
  var Bookmarks = {
    _key: 'adult_bookmarks_list',
    all: function () {
      var v = Lampa.Storage.get(this._key, []);
      return Array.isArray(v) ? v : [];
    },
    has: function (element) {
      if (!element || !element.video) return false;
      return this.all().some(function (b) { return b.video === element.video; });
    },
    toggle: function (element) {
      var list = this.all();
      if (this.has(element)) {
        list = list.filter(function (b) { return b.video !== element.video; });
        Lampa.Noty.show('Удалено из закладок');
      } else {
        list.unshift({
          video: element.video,
          name: element.name,
          picture: element.picture,
          preview: element.preview || '',
          quality: element.quality || '',
          source: element.source || ''
        });
        Lampa.Noty.show('Добавлено в закладки');
      }
      Lampa.Storage.set(this._key, list);
    }
  };

  // СЕТЕВОЙ МОДУЛЬ
  var AdultPlugin = {
    networkRequest: function (url, success, error) {
      var workerUrl = WORKER_DEFAULT + encodeURIComponent(url);
      
      // Попытка через Native (Worker)
      Lampa.Network.native(workerUrl, function (result) {
        var text = (typeof result === 'string') ? result : JSON.stringify(result);
        if (text && text.indexOf('"status":403') === -1) success(text);
        else fallback();
      }, fallback);

      function fallback() {
        var net = new Lampa.Reguest();
        net.silent(url, function (data) { success(data); }, error, false, { dataType: 'text' });
      }
    },
    workerUrl: WORKER_DEFAULT
  };
  window.AdultPlugin = AdultPlugin;

  var Utils = {
    proxyVideoUrl: function (url) {
      if (!url || url.indexOf('http') !== 0) return url;
      return WORKER_DEFAULT + encodeURIComponent(url);
    },
    fixCards: function (list) {
      list.forEach(function (m) {
        if (m.picture && m.picture.indexOf('http') === 0) {
          m.picture = WORKER_DEFAULT + encodeURIComponent(m.picture);
        }
        m.background_image = m.picture;
        m.poster = m.picture;
      });
    },
    play: function (element) {
      Lampa.Loading.show();
      var parserName = resolveParserName(element.source || element.video);
      
      if (parserName && Parsers[parserName] && Parsers[parserName].qualities) {
        Parsers[parserName].qualities(element.video, function (qualities) {
          Lampa.Loading.stop();
          var video = {
            title: element.name,
            url: Utils.proxyVideoUrl(qualities[0] ? qualities[0].file : element.video),
            quality: qualities
          };
          Lampa.Player.play(video);
          Lampa.Player.playlist([video]);
        }, function () {
          Lampa.Loading.stop();
          Lampa.Player.play({ title: element.name, url: Utils.proxyVideoUrl(element.video) });
        });
      } else {
        Lampa.Loading.stop();
        Lampa.Player.play({ title: element.name, url: Utils.proxyVideoUrl(element.video) });
      }
    }
  };

  var Parsers = {};
  function loadParser(name, callback) {
    if (Parsers[name]) return callback(Parsers[name]);
    var script = document.createElement('script');
    script.src = GITHUB_BASE + name + '.js?v=' + Date.now();
    script.onload = function () { callback(Parsers[name]); };
    document.head.appendChild(script);
  }
  window.AdultPlugin.registerParser = function (name, obj) { Parsers[name] = obj; };

  // РОУТИНГ И ИНТЕРФЕЙС
  var Api = {
    view: function (params, success, error) {
      if (params.url === 'local://bookmarks') {
        var b = Bookmarks.all();
        Utils.fixCards(b);
        return success({ results: b, total_pages: 1 });
      }
      var name = resolveParserName(params.url);
      if (!name) return error();
      loadParser(name, function (p) { p.view(params, success, error); });
    }
  };

  // Регистрация в Lampa
  function startPlugin() {
    Lampa.Component.add('adult_view', function (object) {
      var comp = new Lampa.InteractionMain(object);
      comp.create = function () {
        Api.view(object, this.build.bind(this), this.empty.bind(this));
      };
      return comp;
    });

    // Добавление кнопки в меню настроек и прочее...
    console.log('AdultJS Loaded v' + PLUGIN_VERSION);
  }

  if (window.appready) startPlugin();
  else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startPlugin(); });

})();
