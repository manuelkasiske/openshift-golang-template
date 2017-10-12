module.exports = function (grunt, cfg) {
    'use strict';

    return {
        html: {
            /*
            files: {
                'public/evaluation.html': ['src/jade/evaluation.jade']
            },
            */
            files: [{
                expand: true,
                cwd: 'src/jade',
                src: [
                    '**/*.jade',
                    '!layout/**/*.jade',
                    '!mixins/**/*.jade'
                ],
                dest: 'public',
                extDot: 'last',
                ext: '.html'
            }],
            
            options: {
                pretty: true,
                compileDebug: true,
                basedir: 'src/jade'
            }
        }
    };
};