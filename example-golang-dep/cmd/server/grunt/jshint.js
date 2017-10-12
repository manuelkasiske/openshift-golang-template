module.exports = function (grunt, options) {
    'use strict';
    return {
        options: {
            jshintrc: './.jshintrc'
        },
        all: [
            'Gruntfile.js',
            'grunt/*.js',
            'static/js/**/*.js',
            '!static/js/**/*.bundle.js',
            '!static/js/vendor/**/*.js'
        ]
    };
};