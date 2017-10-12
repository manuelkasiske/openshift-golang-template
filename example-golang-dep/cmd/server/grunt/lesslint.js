module.exports = function () {
    'use strict';
    return {
        src: ['webapp/public/less/**/style.less'],
        options: {
            imports: ['webapp/public/less/**/*.less'],
            csslint: {
                "adjoining-classes": false,
                "box-sizing": false,
                "box-model": false,
                "important": false,
                "duplicate-properties": false,
                "text-indent": false,
                "qualified-headings": false,
                "unique-headings": false,
                "overqualified-elements": false,
                "font-sizes": false
            }
        }

    };
};