// =============================================================
// xds.js — ТЕСТОВАЯ ЗАГЛУШКА AdultJS
// Version  : 1.1.0
// Изменено :
//  - постеры теперь соответствуют видео
//  - архитектура подключения НЕ изменена
// =============================================================

(function () {
  'use strict';

  var NAME = 'xds';

  // ----------------------------------------------------------
  // ВИДЕО + ПОСТЕРЫ
  // ----------------------------------------------------------

  var VIDEOS = [

    {
      title:'Big Buck Bunny',
      url:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      poster:'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg',
      dur:'9:56'
    },

    {
      title:'Elephants Dream',
      url:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      poster:'https://upload.wikimedia.org/wikipedia/commons/3/3a/Elephants_Dream_s1_proog.jpg',
      dur:'10:54'
    },

    {
      title:'For Bigger Blazes',
      url:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      poster:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
      dur:'0:15'
    },

    {
      title:'For Bigger Escapes',
      url:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      poster:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscape.jpg',
      dur:'0:15'
    },

    {
      title:'For Bigger Fun',
      url:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      poster:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
      dur:'0:15'
    },

    {
      title:'For Bigger Joyrides',
      url:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      poster:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
      dur:'0:15'
    },

    {
      title:'For Bigger Meltdowns',
      url:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      poster:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg',
      dur:'0:15'
    },

    {
      title:'Subaru Outback',
      url:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Subaru_Outback_On_Street_And_Dirt.mp4',
      poster:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg',
      dur:'5:30'
    },

    {
      title:'Tears of Steel',
      url:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      poster:'https://mango.blender.org/wp-content/uploads/2013/05/01_thom_celia_bridge.jpg',
      dur:'12:14'
    },

    {
      title:'Volkswagen GTI Review',
      url:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
      poster:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/VolkswagenGTIReview.jpg',
      dur:'0:14'
    },

    {
      title:'We Are Going On Bullrun',
      url:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      poster:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WeAreGoingOnBullrun.jpg',
      dur:'0:14'
    },

    {
      title:'What Car For A Grand',
      url:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
      poster:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WhatCarCanYouGetForAGrand.jpg',
      dur:'0:14'
    }

  ];

  // ----------------------------------------------------------
  // ГЕНЕРАТОР КАРТОЧЕК
  // ----------------------------------------------------------

  function makeCards(count, offset) {

    offset = offset || 0;

    var cards = [];

    var suffix = offset > 0 ? ' [стр.' + (Math.floor(offset / 12) + 1) + ']' : '';

    for (var i = 0; i < count; i++) {

      var idx = (offset + i) % VIDEOS.length;

      var v = VIDEOS[idx];

      cards.push({

        name:'TEST #' + (offset + i + 1) + ' — ' + v.title + suffix,

        video:v.url,

        picture:v.poster,

        preview:null,

        time:v.dur,

        quality:'1080p',

        json:false,

        related:false,

        model:null,

        source:NAME

      });

    }

    return cards;

  }

  // ----------------------------------------------------------
  // МЕНЮ
  // ----------------------------------------------------------

  function buildMenu(){

    return [{
      title:'Категория: Все',
      playlist_url:'submenu',
      submenu:[
        {title:'[TEST] Все',playlist_url:'xds://test/all'},
        {title:'[TEST] Короткие',playlist_url:'xds://test/short'},
        {title:'[TEST] Длинные',playlist_url:'xds://test/long'}
      ]
    }];

  }

  // ----------------------------------------------------------
  // API
  // ----------------------------------------------------------

  var XdsStub = {

    main:function(params,success,error){

      setTimeout(function(){

        success({
          results:makeCards(12,0),
          collection:true,
          total_pages:3,
          menu:buildMenu()
        });

      },0);

    },

    view:function(params,success,error){

      var page=parseInt(params.page,10)||1;

      var offset=(page-1)*12;

      setTimeout(function(){

        success({
          results:makeCards(12,offset),
          collection:true,
          total_pages:3,
          menu:buildMenu()
        });

      },0);

    },

    search:function(params,success,error){

      var query=params.query||'';

      setTimeout(function(){

        var results=makeCards(4,0).map(function(c,i){

          c.name='ПОИСК['+query+'] #'+(i+1)+' — '+VIDEOS[i].title;

          return c;

        });

        success({
          title:'xds: '+query,
          results:results,
          url:'xds://test/search?q='+encodeURIComponent(query),
          collection:true,
          total_pages:1
        });

      },0);

    }

  };

  // ----------------------------------------------------------
  // РЕГИСТРАЦИЯ
  // ----------------------------------------------------------

  function tryRegister(){

    if(window.AdultPlugin && typeof window.AdultPlugin.registerParser==='function'){

      window.AdultPlugin.registerParser(NAME,XdsStub);

      console.log('[xds-stub] v1.1.0 registered');

      try{

        setTimeout(function(){

          Lampa.Noty.show('xds: тестовая заглушка v1.1.0',{time:2500});

        },500);

      }catch(e){}

      return true;

    }

    return false;

  }

  if(!tryRegister()){

    var elapsed=0;

    var poll=setInterval(function(){

      elapsed+=100;

      if(tryRegister()||elapsed>=10000) clearInterval(poll);

    },100);

  }

})();
