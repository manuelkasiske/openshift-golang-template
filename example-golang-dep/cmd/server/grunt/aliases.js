module.exports = function (grunt, options) {
    'use strict';

    grunt.registerTask('default', [
        'newer:jshint',
        'prepareCss',
        'generateMixinsInclude',
        'jade',
        'webpack'
    ]);

    grunt.registerTask('startServer', [
        'shell:startGoServer'
    ]);

    grunt.registerTask('startWatchers', [
        'default',
        'concurrent:watchers'
    ]);

    grunt.registerTask('prepareCss', [
        // 'sprite',
        'less'
    ]);

    grunt.registerTask('build', [
        'clean:build',
        'prepareCss',
        'jshint',
        'webpack',
        'generateMixinsInclude',
        //'copy:resources',
        'jade'
    ]);

};
