define([
    'vendor/underscore',
    'bedrock/mixins/assettable',
    'bedrock/mixins/aslistenable',
    './../widgets/user_inputs/button',
    './../widgets/user_display/powergrid',
    './../widgets/user_display/powergrid/columnmodel',
    './../widgets/user_display/powergrid/column',
    './../widgets/user_display/powergrid/powergridsearch',
    './../widgets/user_display/powergrid/asformwidget',
    './simpleview',
    'tmpl!./listbuilder/listbuilder.mtpl',
    'css!./listbuilder/listbuilder.css'
], function(_, asSettable, asListenable, Button, PowerGrid, ColumnModel,
    Column, GridFilter, asFormWidget, SimpleView,
    template) {
    'use strict';

    function MakeGridClass(Grid) {
        var GridClass = Grid.extend({
            defaults: {
                collectionMap: function(models) {
                    var attr = this.get('selectedListAttr');
                    return _.mwhere(models, attr, undefined);
                }
            }
        });
        return GridClass;
    }
    function MakeSelectedGridClass(Grid) {
        var SelectedGridClass = Grid.extend({
            defaults: {
                collectionMap: function(models) {
                    var attr = this.get('selectedListAttr');
                    return _.mwhere(models, attr, true);
                }
            }
        });
        asFormWidget.call(SelectedGridClass.prototype);
        SelectedGridClass = SelectedGridClass.extend({
            _onChangeFormValue: function() {
                this.trigger('change');
            },
            getValue: function() {
                var attr = this.get('selectedListAttr');
                return _.mpluck(_.mwhere(this.get('models'), attr, true), 'id');
            },
            setValue: function(newValue) {
            },
            update: function(changed) {
                if(changed.models) {
                    // only trigger change if the models changed
                    // this is necessary for validation to occur
                    if (_.difference(this.get('models'), this.previous('models')).length !== 0 ||
                        _.difference(this.previous('models'), this.get('models')).length !== 0) {
                        this._onChangeFormValue();
                    }
                }
                // to the super update after we check for changes other wise
                // the grid will invalidate our check my `_sort`ing the new models
                // which causes previous('model') === get('models') just a different order
                Grid.prototype.update.apply(this, arguments);
            }
        });
        asSettable.call(SelectedGridClass.prototype, {areEqual: _.isEqual});
        return  SelectedGridClass;
    }

    var ListBuilder = SimpleView.extend({
        template: template,
        defaults: {
            gridClass: null     // *required: set the default Grid class on instantiation
            // dataCollection:
            // selectedDataCollection:
        },
        _initWidgets: function() {
            var ret = this._super.apply(this, arguments),
                attr = '_'+this.el.id+'_selectedForList',
                SelectedGridClass, GridClass, placeholder, searchBtnTxt, searchParam;

            this.set('selectedListAttr', attr);

            SelectedGridClass = MakeSelectedGridClass(this.get('gridClass'));
            GridClass = MakeGridClass(this.get('gridClass'));
            this.selectedDataGrid = SelectedGridClass({
                selectedListAttr: attr,
                $el: this.$el.find('.selected-data .grid')
            });
            this.dataGrid = GridClass({
                selectedListAttr: attr,
                $el: this.$el.find('.data .grid')
            });
            searchBtnTxt = GridFilter.prototype.defaults.searchButtonText;
            placeholder = GridFilter.prototype.defaults.placeholder;
            searchParam = GridFilter.prototype.defaults.searchParam;
            this.dataFilter =
                GridFilter(this.$el.find('.data .filter'), {
                    searchParam: this.get('searchParam') || searchParam,
                    searchButtonText: this.get('strings.search.button') || searchBtnTxt,
                    placeholder: this.get('strings.search.placeholder') || placeholder
                });
            this.addButton = Button(this.$el.find('button[name=add]'));
            this.removeButton = Button(this.$el.find('button[name=remove]'));
            this.addButton.disable();
            this.removeButton.disable();

            this.listenTo('selectedDataCollection', 'change', '_onDataChange');
            this.listenTo('dataCollection', 'change', '_onDataChange');
            this.listenTo('dataCollection', 'powerGridSearchStarted',
                    '_onGridSearch');

            return ret;
        },
        _bindEvents: function() {
            var self = this,
                sdGrid = this.selectedDataGrid,
                dataGrid = this.dataGrid,
                ret = this._super.apply(this, arguments);

            this.on('click', '[name=add]', function(evt) {
                self._onAction(dataGrid, 'select');
            });
            this.on('click', '[name=remove]', function(evt) {
                self._onAction(sdGrid, 'unselect');
            });

            return ret;
        },
        _onAction: function(grid, method) {
            var ids, models = grid.selected();
                grid.unselect(models);
            models = _.compact(_.isArray(models)? models : [models]);
            ids = _.mpluck(models, 'id');
            if (ids.length > 0) {
                this[method](ids);
            }
        },
        _onDataChange: function(evtName, collection) {
            var attr, widget;
            if (collection === this.dataGrid.get('collection')) {
                attr = this.dataGrid.get('selectedAttr');
                widget = this.addButton;
            } else {
                attr = this.selectedDataGrid.get('selectedAttr');
                widget = this.removeButton;
            }
            widget[collection.mfindWhere(attr, true)? 'enable' : 'disable']();
        },
        _onGridSearch: function() {
            this.get('selectedDataCollection').refresh();
        },
        _select: function(ids) {
            var data = this.dataGrid.get('models'),
                selectedData = this.selectedDataGrid.get('models'),
                attr = this.get('selectedListAttr');

            _.each(ids, function(id, i) {
                var silent = i !== ids.length-1,
                    m1 = _.mfindWhere(selectedData, 'id', id),
                    m2 = _.mfindWhere(data, 'id', id);
                if (m1) {
                    m1.set(attr, true, {silent: silent});
                }
                if (m2) {
                    m2.set(attr, true, {silent: silent});
                }
            });
        },
        _unselect: function(ids, opts) {
            var data = this.dataGrid.get('models'),
                selectedData = this.selectedDataGrid.get('models'),
                attr = this.get('selectedListAttr');

            _.each(ids, function(id, i) {
                var silent = i !== ids.length-1,
                    m1 = _.mfindWhere(selectedData, 'id', id),
                    m2 = _.mfindWhere(data, 'id', id);
                if (m1) {
                    m1.del(attr, {silent: (opts || {}).silent || silent});
                }
                if (m2) {
                    m2.del(attr, {silent: (opts || {}).silent || silent});
                }
            });
        },
        clearFilter: function() {
            this.dataFilter._onClickClear();
            return this;
        },
        clearStatus: function(){
            return this.selectedDataGrid.clearStatus
                .apply(this.selectedDataGrid, arguments);
        },
        getValue: function() {
            return this.selectedDataGrid.getValue
                .apply(this.selectedDataGrid, arguments);
        },
        select: function(ids) {
            // if !ids then select all
            ids = !ids? this.get('dataCollection').mpluck('id') :
                    _.isArray(ids)? ids : [ids];
            this._select(ids);
        },
        setStatus: function(){
            return this.selectedDataGrid.setStatus
                .apply(this.selectedDataGrid, arguments);
        },
        setValue: function(newValue) {
            var ids;
            if ((_.isArray(newValue) && newValue.length === 0) ||
                    newValue === void 0) {
                this.unselect();
            } else {
                ids = _.pluck(this.get('dataCollection.models') || [], 'id');
                this._unselect(ids, {silent: true});
                this.select(newValue);
            }
            return this;
        },
        show: function() {
            this.propagate('show');
        },
        unselect: function(ids) {
            // if !ids then unselect all
            var dataCollection = this.get('dataCollection');
            if (!dataCollection) return;
            ids = !ids? dataCollection.mpluck('id') :
                    _.isArray(ids)? ids : [ids];
            this._unselect(ids);
            return this;
        },
        update: function(changed) {
            var self = this;
            this._super.apply(this, arguments);
            if (changed.selectedDataCollection) {
                self.waitForInitialRender.then(function() {
                    self.selectedDataGrid
                        .set('collection', self.get('selectedDataCollection'));
                });
            }
            if (changed.dataCollection) {
                self.waitForInitialRender.then(function() {
                    self.dataGrid.set('collection', self.get('dataCollection'));
                    self.dataFilter.set('collection', self.get('dataCollection'));
                });
            }
            if (changed.messageList) {
                this.selectedDataGrid.set('messageList', this.get('messageList'));
            }
        }
    });

    asListenable.call(ListBuilder.prototype);

    return ListBuilder;
});

