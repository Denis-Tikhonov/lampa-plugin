console.log('ШАГ 1: Файл загружен');
try {
    Lampa.Controller.add('items', { render: document.body, toggle: function(){} });
    console.log('ШАГ 2: Контроллер items создан без ошибок');
} catch(e) {
    console.error('ШАГ 3: ОШИБКА при создании items ->', e.message);
}
