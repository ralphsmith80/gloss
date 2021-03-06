define([
    'vendor/jquery',
    'vendor/underscore',
    './../../../../util/format'
], function($, _, format) {
    return function asPercent(options) {
        if (options && options.prototype && options.extend) {
            asPercent.apply(options.prototype,
                Array.prototype.slice.call(arguments, 1));
            return options;
        }

        this.defaults = $.extend({}, this.defaults, {
            // leave as null for no decimals
            decimalPlaces: null
        }, options);

        this.cssClasses = _.wrap(this.cssClasses, function(func) {
            return 'number ' +
                func.apply(this, Array.prototype.slice.call(arguments, 1));
        });

        this.formatValue = function(value, model) {
            return format.percent(value, this.get('decimalPlaces'));
        };
    };
});
