// =============================================================
// xds_stub.js
// TEST STUB для AdultJS / Lampa
// Постеры соответствуют видео
// =============================================================

(function () {

'use strict';

var NAME = 'xds';

// ----------------------------------------------------------
// СКОЛЬКО КАРТОЧЕК ПОКАЗЫВАТЬ (9 или 12)
// ----------------------------------------------------------

var CARDS_PER_PAGE = 12;


// ----------------------------------------------------------
// ПУБЛИЧНЫЕ ВИДЕО + СООТВЕТСТВУЮЩИЕ ПОСТЕРЫ
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
title:'Tears of Steel',
url:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
poster:'https://mango.blender.org/wp-content/uploads/2013/05/01_thom_celia_bridge.jpg',
dur:'12:14'
},

{
title:'For Bigger Blazes',
url:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
poster:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
dur:'0:15'
},

{
title:'For Bigger Escape',
url:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscape.mp4',
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
title:'Subaru Outback',
url:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Subaru_Outback_On_Street_And_Dirt.mp4',
poster:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg',
dur:'5:30'
},

{
title:'Volkswagen GTI',
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
title:'What care can you get for a grand',
url:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
poster:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WhatCarCanYouGetForAGrand.jpg',
dur:'0:15'
},

{
title:'Sintel Trailer',
url:'https://media.w3.org/2010/05/sintel/trailer.mp4',
poster:'https://download.blender.org/durian/poster/sintel_poster.jpg',
dur:'0:52'
}

];


// ----------------------------------------------------------
// ГЕНЕРАЦИЯ КАРТОЧЕК
// ----------------------------------------------------------

function makeCards(count, offset){

offset = offset || 0;

var cards = [];

for(var i=0;i<count;i++){

var index = (offset + i) % VIDEOS.length;

var video = VIDEOS[index];

cards.push({

name:'TEST VIDEO #' + (offset + i + 1) + ' — ' + video.title,

video:video.url,

picture:video.poster,

preview:null,

time:video.dur,

quality:'1080p',

json:false,

related:false,

source:NAME

});

}

return cards;

}


// ----------------------------------------------------------
// МЕНЮ
// ----------------------------------------------------------

function buildMenu(){

return [

{
title:'TEST CONTENT',

playlist_url:'submenu',

submenu:[

{title:'Все видео',playlist_url:'xds://test/all'},

{title:'Короткие',playlist_url:'xds://test/short'},

{title:'Длинные',playlist_url:'xds://test/long'}

]

}

];

}


// ----------------------------------------------------------
// API ПАРСЕРА
// ----------------------------------------------------------

var XdsStub = {

main:function(params,success,error){

setTimeout(function(){

success({

results:makeCards(CARDS_PER_PAGE,0),

collection:true,

total_pages:5,

menu:buildMenu()

});

},0);

},


view:function(params,success,error){

var page = parseInt(params.page || 1);

var offset = (page-1)*CARDS_PER_PAGE;

setTimeout(function(){

success({

results:makeCards(CARDS_PER_PAGE,offset),

collection:true,

total_pages:5,

menu:buildMenu()

});

},0);

},


search:function(params,success,error){

var query = params.query || '';

var results = makeCards(4,0);

results.forEach(function(r,i){

r.name = 'SEARCH ['+query+'] #' + (i+1);

});

success({

title:'xds search',

results:results,

collection:true,

total_pages:1

});

}

};


// ----------------------------------------------------------
// РЕГИСТРАЦИЯ ПАРСЕРА
// ----------------------------------------------------------

function register(){

if(window.AdultPlugin && window.AdultPlugin.registerParser){

window.AdultPlugin.registerParser(NAME,XdsStub);

console.log('xds stub registered');

try{
Lampa.Noty.show('XDS TEST STUB ACTIVE',{time:2000});
}catch(e){}

return true;

}

return false;

}


if(!register()){

var t = setInterval(function(){

if(register()) clearInterval(t);

},200);

}

})();
