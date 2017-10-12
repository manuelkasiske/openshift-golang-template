/**
 * Tasks requesting all pages from the sitemap and writing them to files into the build-directory.
 * Assumes a server instance to be running on the port configured in package.json (config.buildPort).
 *
 * @param grunt
 * @param opts
 */
module.exports = function (grunt, opts) {

    'use strict';

    grunt.registerTask('generateFiles', 'Triggers generation of the HTML files',  function() {
        const sitemap = require('statichtmlfactory/sitemap'),
            pkg = require('statichtmlfactory/pkg'),
            http = require('http'),
            path = require('path'),
            SERVER_SHUTDOWN_URL = sitemap.getUrl(pkg.config.shutdownUrl, true);

        var asyncDone = this.async(),
            done = function() {
                try {
                    http.get(SERVER_SHUTDOWN_URL, res => {
                        console.log('Server has shut down');
                        asyncDone();
                    });
                } catch (e) {
                    grunt.log.warn('Server shutdown request failed');
                    asyncDone();
                }
            };

        sitemap.getSimpleMap().then(map => {
            var filesCount = map.urls.length;

            map.urls.push('/_sitemap.html');

            Promise.all(map.urls.map(url => {

                return new Promise(function(resolve, reject) {
                    var urlToRequest = sitemap.getUrl(url, true),
                        htmlFileToWrite = path.join(__dirname, '../build', url.replace(/(\.jade|\.html|\/)$/, '.html'));

                    http.get(urlToRequest, res => {
                        var bodyHtmlParts = [];
                        res.on('data', data => {
                            bodyHtmlParts.push(data);
                        });
                        res.on('end', () => {
                            grunt.file.write(htmlFileToWrite, bodyHtmlParts.join(''), {encoding: 'utf-8'});
                            grunt.log.ok(`HTML written -> ${htmlFileToWrite}`);
                            resolve();
                        })
                    }).on('error', (err) => {
                        grunt.log.warn(`Error while requesting ${url}`, err);
                        reject(err);
                    });
                })

            })).then(() => {
                grunt.log.ok(`Successfully generated ${filesCount} files.`);
                done();
            }, (err) => {
                grunt.fail.warn(err);
                done();
            });
        }, (err) => {
            grunt.fail.warn(err);
            done();
        });

    });

};