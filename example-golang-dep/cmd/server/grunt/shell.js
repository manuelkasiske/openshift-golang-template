/*jshint esnext: true */
module.exports = function (grunt, options) {

    'use strict';

    return {
        startGoServer: {
            command: `go build && ./mutservice`
        }
   };
};
