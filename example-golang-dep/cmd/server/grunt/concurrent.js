module.exports = function (grunt, cfg) {
    'use strict';

    return {
        options: {
            logConcurrentOutput: true
        },
        watchers: [
            'watch:less',
            'watch:jade',
            'watch:webpack',
            'watch:mixinsAddedOrRemoved',
            'watch:livereload'
//            'shell:startGoServer'
        ]
    };

};
