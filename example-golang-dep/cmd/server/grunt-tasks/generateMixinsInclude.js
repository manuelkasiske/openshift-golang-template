/**
 * Tasks generating a views/layout/_mixins.jade file that contains
 * include-directives for all .jade template in view/layout/mixins.
 */
module.exports = function (grunt, opts) {

    'use strict';

    const TARGET_FILE = 'src/jade/layout/_mixins.jade',
          glob = require('glob'),
          path = require('path');

    grunt.registerTask('generateMixinsInclude', 'generates a _mixins.jade file that includes all jade mixins',  function() {

        var done = this.async();

        console.log('Updating _mixins.jade ...');

        glob('mixins/**/*.jade', {
            nodir: true,
            cwd: path.join(__dirname, '../src/jade/')
        }, (err, files) => {
            if (!err) {
                var fileContent = [
                    '',
                    '//- !!! DO NOT EDIT !!!',
                    '//- This file is generated by the generateMixinsInclude grunt task!\n'
                ];
                files.forEach(file => {
                    fileContent.push(`include /${file.replace(/\.jade$/,'')}`);
                });
                grunt.file.write(TARGET_FILE, fileContent.join('\n'));
                grunt.log.ok(`Successfully written ${TARGET_FILE}`);
            } else {
                console.error(err);
            }
            done();
        });

    });

};