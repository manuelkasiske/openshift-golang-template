module.exports = function (grunt, options) {
    'use strict';

    return {
        all: {
            src: ['static/images/sprites/isolated/**/*.png'],
            dest: 'static/images/sprites/spritesheet-generated.png',
            destCss: 'static/css/spritesheet-generated.css',
            algorithm: 'binary-tree',
            padding: 4,
            cssOpts: {
                cssSelector: function (sprite) {
                    return '.icon.icon-' + sprite.name;
                }
            },
            cssVarMap: function (sprite) {
                sprite.name = sprite.name.replace(/__hover$/, ':hover')
                                .replace(/__active$/, ':active').replace(/__click$/, ':active');
            }
        }
    }
};