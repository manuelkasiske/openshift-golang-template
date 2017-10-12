module.exports = function (/*grunt, options*/) {

    'use strict';

    return {
        options: {
            sourceMap: true,
            sourceMapName: function(jsPath) {
                return jsPath.replace(/\.js$/, '-sourcemap.js');
            },
            compress: {},
            environment: 'production'
        },
        js_sources: {
            files: [
                {
                    expand: true,
                    cwd: 'static/js',
                    dest: 'static/js',
                    src: ['!lib/**', '!**/*.min.js', '**/*.js'],
                    extDot: 'last',
                    ext: '.min.js'
                }
            ]
        }
    };
};
