module.exports = function (grunt, options) {

    'use strict';

    return {
        options: {
            separator: ';\n\n',
            footer: '/* footer */'
        },
        foo: {
            dest: 'webapp/public/js/bundle.js',
            src: [
            ],
            nonull: true
        }
    };
};
