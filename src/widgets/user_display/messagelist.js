define([
    'vendor/jquery',
    'vendor/underscore',
    './../base/widget'
], function($, _, Widget) {
    return Widget.extend({
        defaults: {
            escape: true,
        },
        create: function() {
            this.shown = false;
            this.$node.hide().addClass('messagelist');
        },
        append: function(type, messages) {
            var h, i, l;
            if(!$.isArray(messages)) {
                messages = [messages];
            }
            if(!this.shown) {
                this.$node.show();
                this.shown = true;
            }
            for(i = 0, l = messages.length; i < l; i++) {
                if(messages[i] != null) {
                    $('<div>')
                        .hide()
                        .addClass(type)
                        .html(this.options.escape ? _.escape(messages[i]) : messages[i])
                        .attr('title', messages[i])
                        .appendTo(this.$node)
                        .slideDown('fast');
                }
            }
            this._clearing = false;
            return this;
        },
        clear: function(options) {
            var self = this;
            options = options || {animate: true};
            if (options.animate) {
                self._clearing = true;
                self.$node.find('div').slideUp('fast', function() {
                    if (self._clearing) {
                        self.$node.hide().empty();
                        self._clearing = false;
                    }
                });
            } else {
                self.$node.hide().empty();
            }
            self.shown = false;
            return self;
        }
    });
});
