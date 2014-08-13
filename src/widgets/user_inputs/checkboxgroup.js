define([
    'vendor/underscore',
    './../../core/registry',
    '../base/formwidget',
    '../mixins/collectionviewable',
    'tmpl!./checkboxgroup/checkboxgroup.mtpl',
    'css!./checkboxgroup/checkboxgroup.css'
], function(_, Registry, FormWidget, CollectionViewable, template) {

    // we use the registry to add our MockCheckboxes so we don't
    // try to re-instatiate them during widgetize
    var registry = Registry.getInstance();
    // A mock checkbox because instantiating a CheckBox widget is to expesive for large data sets
    var MockCheckbox = function(params) {
        this.$node = $(params.el);
        this.node = this.$node.get(0);
        this.options = params.options;

        this.id = this.$node.attr('id');
        if (this.id == null) {
            this.id = _.uniqueId('widget');
            this.$node.attr('id', this.id);
        }
        registry.widgets[this.id] = this;

        // this is just so the mock checkbox will play with the registry
        this.propagate = function() {
            return this;
        };

        this.getValue = function() {
            var checked = $(this.node).is(':checked');
            return checked ? this.options.value : null;
        };

        this.setValue = function(value) {
            var $el = $(this.node),
                checked = $el.is(':checked');

            if (typeof value === 'undefined') {
                value = false;
            }
            if(value !== checked) {
                $el.prop('checked', value);
            }
        };
        if (this.options.initialValue === true) {
            this.$node.prop('checked', true);
        }
    };

    return FormWidget.extend({
        defaults: {
            template: template,
            checked: false,
            checkall: false,
            checkallLabel: 'Check All',
            /*there are 2 ways of defining the icon to be used for a checkbox group
            * 1. programmatically (CheckboxGroup(..)) - pass in the markup to be used for the icon as
            *  `icon:'<span><!--icon-definition--></span>'`
            * 2. decalaratively (from a widgetgroup or using aswidgetizable) - use a data-icon attribute and
            *  place the HTML string for the icon inside a span element with class=`icon-definition`
            *  eg <div class=checkboxgroup data-icon="eg-icon">
            *       <span class="icon-definition"><!-- markup for the icon --></span>
            *     </div>
            */
            icon:false, /*icon markup string; false to disable icons*/
            translate: function(model) {
                return {name: model.name, value: model.id};
            }
        },

        create: function() {
            var self = this,
                $node = this.$node,
                $iconDef,
                iconHTML;
            this._super();
            this.checkboxes = checkboxes = [];
            if($node.attr('data-icon')){
                $iconDef = $node.find('.icon-definition');
                iconHTML = $iconDef.html() || '';
                this.options.icon = iconHTML;
                $iconDef.remove();
            }
            this.$node.find('input[type=checkbox]:not(.checkall)').each(function(i, el) {
                var cb = new MockCheckbox({
                    el: el,
                    options: {}
                });
                checkboxes.push(cb);
            });

            this.on('change', '.checkall', function(evt) {
                var checked = $(evt.target).is(':checked'),
                    value = checked ? 'all' : 'none';
                self.setValue(value);
            });
            this.on('click', 'input[type=checkbox]:not(.checkall)', function(evt) {
                // normally we would cache this but since the template can be
                // rerendered at run-time the cached value might be invalid
                self.$node.find('.checkall').attr('checked', false);
            });

            // this is to prevent the icon click from bubbling to the checkbox. there is still
            // a visible state change (pressed) on the checkbox element.
            this.on('click','span.icon', function(e){
                e.preventDefault();
            });
            this.update();
        },

        getValue: function() {
            return _.filter(
                _.map(this.checkboxes, function(cb) {
                    return cb.getValue();
                }),
                function(v) { return v !== null; }
            );
        },

        setValue: function(array, silent) {
            var cur = this.getValue().sort();
            if (array === undefined) return;
            if (_.isString(array)) {
                if (array === 'all') {
                    array = _.map(this.checkboxes, function(cb) {
                        return cb.options.value;
                    });
                } else {
                    array = [];
                }
            }
            array = array.slice(0).sort();

            if (!_.isEqual(cur, array)) {
                _.each(this.checkboxes, function(cb) {
                    var value = _.indexOf(array, cb.options.value);
                    cb.setValue(value >= 0);
                });
                if (!silent) {
                    this.trigger('change');
                }
            }
            return this;
        },

        _readCheckboxState: function() {
            var checkboxes = [];
            _.each(this.options.entries, function(entry, i) {
                checkboxes.push((entry!=undefined && entry.checked) ? true : false);
            });
            return checkboxes;
        },

        _applySavedCheckboxState: function(checkedEntries) {
            var entries = _.map(this.options.models, this.options.translate);
            _.each(entries, function( entry, i ) {
                if(entry != undefined) {
                    entry.checked = checkedEntries[i];
                }
            });
            return entries;
        },

        disable: function() {
            this.$node.find('input[type=checkbox]').attr('disabled', true);
            return this._super.apply(this, arguments);
        },
        enable: function() {
            this.$node.find('input[type=checkbox]').attr('disabled', false);
            return this._super.apply(this, arguments);
        },
        updateWidget: function(updated) {
            var options = this.options, checkboxes,
                checkedEntries = this._readCheckboxState();

            if (updated.models) {
                var entries = this._applySavedCheckboxState(checkedEntries);
                this.set('entries', entries );
            }

            if (updated.entries) {
                this.checkboxes = checkboxes = [];
                this.$node.html(options.template(this))
                    .find('input[type=checkbox]:not(.checkall)').each(function(i, el) {
                        var cb = new MockCheckbox({
                            el: el,
                            options: {
                                value: options.entries[i].value,
                                name: options.entries[i].name,
                                initialValue: checkedEntries[i]
                            }
                        });
                        checkboxes.push(cb);
                    });
            }
            if (updated.checked && this.options.checked) {
                this.$node.find('.checkall').attr('checked', true);
                this.setValue('all');
            }
        }
    }, {mixins: [CollectionViewable]});
});
