// Внутри компонента
this.manualNav = function(direction) {
    var cards = this.grid.find('.selector');
    var current = this.grid.find('.focus');
    var currentIndex = cards.index(current);
    var cols = 4; // количество колонок
    
    var newIndex;
    switch(direction) {
        case 'up': newIndex = currentIndex - cols; break;
        case 'down': newIndex = currentIndex + cols; break;
        case 'left': newIndex = currentIndex - 1; break;
        case 'right': newIndex = currentIndex + 1; break;
    }
    
    if (newIndex >= 0 && newIndex < cards.length) {
        current.removeClass('focus');
        cards.eq(newIndex).addClass('focus').trigger('hover:focus');
    }
};

// В контроллере:
up: function() { self.manualNav('up'); },
down: function() { self.manualNav('down'); },
// ...
