module.exports = function (/*grunt, options*/) {

    'use strict';

    var webpack = require("webpack");

    return {
        options: {
            devtool: "source-map",

            resolve: {
                modulesDirectories: ['./static/js/'],
                alias: {
                    'bootstrap': 'vendor/bootstrap.min.js',
                    'jquery': 'vendor/jquery.min.js',
                    'knockout': 'vendor/knockout-min.js',
                    'chart': 'vendor/chart.min.js',
                    'dragdealer': 'vendor/dragdealer/src/dragdealer.js'
                }
            },

            stats: {
                // Configure the console output
                colors: false,
                modules: true,
                reasons: true
            },
            module: {
                loaders: [
                    { test: /\.css$/, loader: "style!css" }
                ]
            },
            plugins: [
                new webpack.ProvidePlugin({
                    $: "jquery",
                    jQuery: "jquery",
                    "windows.jQuery": "jquery"
                })
            ]
        },

        index: {
            // webpack options
            entry: "./static/js/index.js",
            output: {
                path: "static/js/",
                filename: "index.bundle.js",
                publicPath: "/static/js/",
                sourceMapFilename: "indexBundle.map"
            }
        },

        login: {
            // webpack options
            entry: "./static/js/login.js",
            output: {
                path: "static/js/",
                filename: "login.bundle.js",
                publicPath: "/static/js/",
                sourceMapFilename: "loginBundle.map"
            }
        },

        subscribers: {
            // webpack options
            entry: "./static/js/subscribers.js",
            output: {
                path: "static/js/",
                filename: "subscribers.bundle.js",
                publicPath: "/static/js/",
                sourceMapFilename: "subscribersBundle.map"
            }
        },

        evaluation: {
            // webpack options
            entry: "./static/js/evaluation.js",
            output: {
                path: "static/js/",
                filename: "evaluation.bundle.js",
                publicPath: "/static/js/",
                sourceMapFilename: "evaluationBundle.map"
            }
        },

        form: {
            // webpack options
            entry: "./static/js/form.js",
            output: {
                path: "static/js/",
                filename: "form.bundle.js",
                publicPath: "/static/js/",
                sourceMapFilename: "formBundle.map"
            }
        }
    }
};