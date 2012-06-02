define([
    'vendor/jquery',
    'vendor/underscore',
    './widget',
    './button',
    './numberbox',
    './checkbox',
    './radiogroup',
    './togglegroup',
    './checkboxgroup',
    './selectbox',
    './textbox',
    './messagelist'
], function($, _, Widget, Button, NumberBox, CheckBox, RadioGroup, ToggleGroup,
    CheckBoxGroup, SelectBox, TextBox, MessageList) {
    return Widget.extend({
        defaults: {
            widgets: null,
            widgetize: false,
            widgetMap: [
                ['button', Button],
                ['input[type=checkbox]', CheckBox],
                ['input[type=text],input[type=password],input[type=search]', TextBox],
                ['input[type=submit],input[type=reset]', Button],
                ['input[type=number]', NumberBox],
                ['select,.select', SelectBox],
                ['textarea', TextBox],
                ['div.radiogroup', RadioGroup],
                ['div.togglegroup', ToggleGroup],
                ['div.checkboxgroup', CheckBoxGroup]
            ],
            widgetSelector: 'button[name],div.radiogroup,input[name],select[name],div.select[name],textarea[name],div.togglegroup,div.checkboxgroup'
        },

        create: function() {
            var self = this;
            if (self.options.widgets == null) {
                self.options.widgets = {};
            }
            if (self.options.widgetize) {
                self.widgetizeDescendents();
            }
            $.each(self.options.widgets, function(name, widget) {
                if (widget.options.messageList === null) {
                    var candidate = self.$node.find('.messagelist[data-for=' + name + ']');
                    if (candidate.length === 1) {
                        widget.set('messageList', MessageList(candidate));
                    }
                }
            });
            self.$node.find('label[data-for]:not([for])').each(function(i, el) {
                var $radio, $el = $(el),
                    split = $el.attr('data-for').split(':'),
                    name = split[0],
                    value = split[1],
                    widget = self.options.widgets[name];
                if (widget) {
                    if (value != null) {
                        $radio = widget.$node
                            .find('[type=radio][value=' + value + ']');
                        $el.attr('for', $radio.attr('id'));
                    } else {
                        $el.attr('for', widget.id);
                    }
                }
            });
        },

        getValues: function() {
            var self = this, values = {};
            $.each(self.options.widgets, function(name, widget) {
                if (widget.getValue) {
                    values[name] = widget.getValue();
                }
            });
            return values;
        },

        getWidget: function(name) {
            return this.options.widgets[name];
        },

        widgetizeDescendents: function() {
            var self = this, map = this.options.widgetMap, widgets = this.options.widgets;
            self.$node.find(self.options.widgetSelector).each(function(i, node) {
                var $node = $(node), name;
                if (!self.registry.isWidget($node)) {
                    $.each(map, function(i, candidate) {
                        if ($node.is(candidate[0])) {
                            name = $node.hasClass('radiogroup')?
                                $node.find('input[type=radio]').attr('name') :
                                $node.attr('name');
                            widgets[name] = candidate[1]($node);
                        }
                    });
                }
            });
        }
    });
});
