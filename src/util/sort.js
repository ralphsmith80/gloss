define([
    'vendor/underscore'
], function(_) {
    'use strict';

    var normalize = function(text) {
        var normalizedTxt = text.toString().toLowerCase()
            .replace(/^\W+/, '').replace(/\W+$/, '');
        if (!normalizedTxt) {
            // if there is no text after normalization then we can't normalize
            // using the reverse 'word character' regex (\W)
            // so just return the original text
            // this can occure with international characters like Chinese
            return text;
        }
        return normalizedTxt;
    };

    return {
        // this function is a comparator intended to be passed to Array#sort()
        //
        // it sorts in a user-friendly, special-character aware, alphabetical
        // manner, so that you get something like this:
        //
        //     abc
        //     "def"
        //     ghi
        //
        // instead of this:
        //
        //     abc
        //     ghi
        //     "def"
        //
        // also, it's very general purpose (read: slow).
        //
        userFriendly: function(a, b) {
            if (a == null && b == null) {
                return 0;
            } else if (a == null) {
                return -1;
            } else if (b == null) {
                return 1;
            }
            if (!(_.isDate(a) && _.isDate(b)) &&
                !(_.isNumber(a) && _.isNumber(b))) {
                a = normalize(a);
                b = normalize(b);
            }
            return ((a < b) ? -1 : ((a > b) ? 1 : 0));
        }
    };
});
