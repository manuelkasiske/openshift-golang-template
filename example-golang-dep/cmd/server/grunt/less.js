module.exports = function (grunt, cfg) {
    'use strict';

    return {
        compileCore: {
            options: {
                strictMath: false,
                sourceMap: true,
                outputSourceFiles: true,
                sourceMapURL: 'bootstrap.css.map',
                sourceMapFilename: 'dist/css/bootstrap.css.map'
            },
            src: 'src/less/bootstrap.less',
            dest: 'static/css/bootstrap.css'
        },
        compileTheme: {
            options: {
                strictMath: true,
                sourceMap: true,
                outputSourceFiles: true,
                sourceMapURL: 'bootstrap-theme.css.map',
                sourceMapFilename: 'dist/css/bootstrap-theme.css.map'
            },
            src: 'src/less/theme.less',
            dest: 'static/css/bootstrap-theme.css'
        }
    };

};
