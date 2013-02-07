define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/t',
    'bedrock/class',
    'bedrock/assettable',
    './../widgets/widget',
    './widgetize',
    './binding'
], function($, _, t, Class, asSettable, Widget, widgetize, Binding) {
    var registry = Widget().registry;

    var BindingGroup = Class.extend({
        bindings: [],
        init: function(options) {
            this.set(options);
        },
        _autoInstantiateBindings: function() {
            var self = this, root = self.get('$el')[0],
                widgets = widgetize(self.get('$el'));
            t.dfs(root, function(el, parentEl, ctrl) {
                var params, widget = _.find(widgets, function(w) {
                    return w.node === el? w : null;
                });

                if (widget) {
                    params = {
                        prop: widget.$node.attr('data-bind'),
                        twoWay: true,
                        widget: widget
                    };
                } else if (el.getAttribute('data-bind')) {
                    params = {prop: el.getAttribute('data-bind'), $el: $(el)};
                }

                if (params) {
                    ctrl.cutoff = true;
                    params.strings = [];
                    if (self.has('strings.field-errors.' + params.prop)) {
                        params.strings.push(
                            self.get('strings.field-errors.' + params.prop));
                    }
                    if (self.has('strings.errors')) {
                        params.strings.push(self.get('strings.errors'));
                    }
                    if (self.has('globalErrorStrings')) {
                        params.strings.push(self.get('globalErrorStrings'));
                    }
                    self.bindings.push(Binding(params));
                }
            });
        },
        update: function(changed) {
            if (changed.$el) {
                this._autoInstantiateBindings();
            }
            if (changed.additionalBindings) {
                _.each(this.get('additionalBindings'), function(b) {
                    if (_.indexOf(this.bindings, b) < 0) {
                        this.bindings.push(b);
                    }
                });
            }
        }
    });

    asSettable.call(BindingGroup.prototype, {
        prop: null,
        onChange: 'update'
    });

    return BindingGroup;
});
