// =============================================================
// btit.js — Парсер BigTitsLust (v1.3.0)
// Strategy: Delegate video extraction to Worker /resolve-page
// =============================================================

(function () {
  'use strict';

  var NAME = 'btit';
  var HOST = 'https://www.bigtitslust.com';
  var TAG  = '[' + NAME + ']';

  // Функция получения базового URL воркера из ядра
  function getWorkerBase() {
    var base = window.AdultPlugin.workerUrl || 'https://zonaproxy.777b737.workers.dev/?url=';
    return base.replace(/[/?&]url=?$/, '').replace(/\/+$/, '');
  }

  function httpGet(url, success, error) {
    if (window.AdultPlugin && typeof window.AdultPlugin.networkRequest === 'function') {
      window.AdultPlugin.networkRequest(url, success, error);
    } else {
      fetch(url).then(function(r){ return r.text(); }).then(success).catch(error);
    }
  }

  var Parser = {
    // Основной метод поиска видео
    qualities: function (videoPageUrl, success, error) {
      console.log(TAG, 'qualities() → запрос к Worker resolve-page для:', videoPageUrl);

      // Используем новый Worker эндпоинт, который сам ищет remote_control.php
      var resolveUrl = getWorkerBase() + '/resolve-page?url=' + encodeURIComponent(videoPageUrl);
      
      httpGet(resolveUrl, function (jsonText) {
        try {
          var data = JSON.parse(jsonText);
          if (data.final && data.final.indexOf('remote_control.php') !== -1) {
            console.log(TAG, 'Успешный резолв: remote_control найден');
            success({ qualities: { 'HD': data.final } });
          } else if (data.error) {
            error('Worker Error: ' + data.error);
          } else {
            error('Видео не найдено через Worker');
          }
        } catch (e) {
          error('JSON Parse Error: ' + e.message);
        }
      }, error);
    },

    main: function (params, success, error) { /* ... реализация из 1.2.0 ... */ },
    view: function (params, success, error) { /* ... реализация из 1.2.0 ... */ },
    search: function (params, success, error) { /* ... реализация из 1.2.0 ... */ }
  };

  // Регистрация
  function tryRegister() {
    if (window.AdultPlugin && typeof window.AdultPlugin.registerParser === 'function') {
      window.AdultPlugin.registerParser(NAME, Parser);
      return true;
    }
    return false;
  }
  var poll = setInterval(function () { if (tryRegister()) clearInterval(poll); }, 200);
})();
