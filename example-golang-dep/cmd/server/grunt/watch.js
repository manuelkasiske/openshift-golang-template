module.exports = function (grunt, options) {
    'use strict';
    return {
        jade: {
            files: ['**/*.jade',
                '!layout/**/*.jade',
                '!mixins/**/*.jade'],
            tasks: ['jade']
        },
        webpack: {
            files: ['static/js/**/*.js', '!static/js/*.bundle.js','!static/js/vendor/*.js'],
            tasks: ['webpack']
        },
        less: {
            files: ['src/less/**/*.less'],
            tasks: ['newer:less']
        },
        mixinsAddedOrRemoved: {
            files: ['src/jade/mixins/**/*.jade'],
            tasks: ['generateMixinsInclude'],
            options: {
                event: ['added', 'deleted']
            }
        },
        livereload: {
            files: [
                'src/jade/**/*.jade',
                'static/js/**',
                '!static/js/vendor'
            ],
            tasks: [],
            options: {
                livereload: {
                    host: 'localhost',
                    port: 9000
                }
            }
        }
    };
};