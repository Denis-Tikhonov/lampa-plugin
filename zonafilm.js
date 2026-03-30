(function () {
    'use strict';

    // Стили для отладчика (без изменений)
    var CSS = '\
        #zf-debug-box{position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.92);color:#0f0;padding:15px;z-index:99999;font-size:16px;border:2px solid #0f0;max-width:450px;word-wrap:break-word;border-radius:8px}\
        #zf-debug-box div{margin-bottom:5px}\
        .zf-test-grid{display:flex;flex-wrap:wrap;gap:20px;padding:60px}\
        .zf-test-card{width:200px;height:120px;background:#444;border:3px solid transparent;transition:transform .2s}\
        .zf-test-card.focus{border-color:#ff0;transform:scale(1.05)}\
    ';
    $('<style>').text(CSS).appendTo('head');

    function log(msg){
        var box = $('#zf-debug-box');
        box.append('<div>> ' + msg + '</div>');
        box.scrollTop(box[0].scrollHeight);
    }

    function TestComp(){
        var scroll = new Lampa.Scroll({mask:true, over:true});
        var grid   = $('<div class="zf-test-grid"></div>');

        this.create = function(){
            for(var i = 1; i <= 3; i++){
                var card = $('<div class="zf-test-card selector">Карточка ' + i + '</div>');
                
                card.on('hover:focus', function(){
                    log('ФОКУС на: ' + $(this).text());
                    scroll.update($(this));
                });

                card.on('hover:enter', function(){
                    log('ENTER на: ' + $(this).text());
                });

                grid.append(card);
            }
            scroll.append(grid);
        };

        this.start = function(){
            log('--- МЕТОД START ВЫЗВАН ---');
            
            try {
                // ИЗМЕНЕНИЕ: Регистрируем системный контроллер 'items'
                // НО! Мы НЕ пишем в нем left/right/up/down!
                // Мы только отдаем ему контейнер (render), чтобы ядро само находило карточки
                Lampa.Controller.add('items', {
                    render: grid,
                    toggle: function(){
                        Lampa.Controller.collectionSet(grid);
                        Lampa.Controller.collectionFocus(false, grid);
                    }
                });
                
                // Включаем именно его
                Lampa.Controller.toggle('items');
                log('Контроллер items успешно создан');
            } catch(e) {
                log('ОШИБКА контроллера items: ' + e.message);
            }

            setTimeout(function(){
                Lampa.Controller.collectionSet(grid);
                Lampa.Controller.collectionFocus(false, grid);
                log('collectionSet/Focus выполнен');
            }, 300);
        };
        
        this.toggle = function(){ 
            Lampa.Controller.toggle('items');
            log('--- TOGGLE ---'); 
        };
        this.pause = function(){};
        this.stop = function(){ log('--- STOP ---'); };
        this.render = function(){ return scroll.render(); };
        this.destroy = function(){ 
            scroll.destroy(); 
            grid.remove(); 
            $('#zf-debug-box').remove(); 
        };
    }

    Lampa.Component.add('zf_test_comp', TestComp);

    var li = $('<li class="menu__item selector" data-action="zf_test">'+
        '<div class="menu__text">🔧 ТЕСТ НАВИГАЦИИ</div></li>');
    li.on('hover:enter', function(){
        if(!$('#zf-debug-box').length) $('body').append('<div id="zf-debug-box"></div>');
        log('Запуск теста с контроллером items...');
        
        Lampa.Activity.push({
            url: '', title: 'Тест Навигации', component: 'zf_test_comp', page: 1
        });
    });
    
    var list = $('.menu .menu__list');
    if(list.length) list.eq(0).append(li);

    log('Отладчик загружен');
})();
