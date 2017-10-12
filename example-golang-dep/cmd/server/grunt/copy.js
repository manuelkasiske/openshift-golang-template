module.exports = function (grunt, options) {

    'use strict';

    return {
        resources: {
            files: [
                {
                    expand: true,
                    cwd:  'webapp/public/documentation/Elementekatalog',
                    dest: 'build/',
                    src:  ['**', '!index.html']
                },
                {
                    expand: true,
                    cwd:  'webapp/public/',
                    dest: 'build/',
                    src:  ['Scripts/**', 'Content/**', 'Images/**']
                },
                {
                    expand: true,
                    cwd:  'webapp/public/less',
                    dest: 'build/',
                    src:  ['Content/**']
                }
            ]
        }
   };
};
