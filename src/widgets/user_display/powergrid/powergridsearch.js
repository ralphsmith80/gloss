define([
    'vendor/jquery',
    'vendor/underscore',
    './../../base/widgetgroup',
    './../../mixins/collectionviewable',
    'tmpl!./powergridsearch/powergridsearch.mtpl'
], function($, _, WidgetGroup, CollectionViewable, template) {
    var PowerGridSearch = WidgetGroup.extend({
        defaults: {
            placeholder: 'Enter terms to search...',
            searchParam: 'name__icontains',
            searchButtonText: 'Search',
            populateEmptyNode: true,
            widgetize: true
        },
        nodeTemplate: template,
        create: function() {
            this._super.apply(this, arguments);
            if (!this.getWidget('q').getValue()) {
                this.getWidget('clear').disable();
            }
            this.on('submit', this.submit);
            // we need to handle the submit event synthetically when the
            // searchers root node is NOT a form.
            // this is usually the case when we have to put the searcher in parent form
            // since a form can not be in a form.
            if (this.$node.is(':not(form)')) {
                this._bindSyntheticSubmit();
            }
            this.on('keyup', '[name=q]', this._onKeyup);
            this.on('click', '[name=clear]', this._onClickClear);
            this.update();
        },
        _bindSyntheticSubmit: function() {
            var self = this;
            this.on('click', '[name=search]', self.submit)
                .on('keyup', '[name=q],[name=search]', function(evt) {
                    if (evt.which === 13) {
                        self.submit(evt);
                    }
                });
        },
        _escapeQuery: function(string) {
            // The back-end has a problem with some characters so we're giving them
            // a hand by adding explicit esacpes.
            // http://jira.storediq.com/browse/DAQ-717
            var entityMap = {
                    '[': '\\[',
                    ']': '\\]',
                    '{': '\\{',
                    '}': '\\}',
                    '\\': '\\\\'
                },
                // regex to match the keys of entityMap
                entityRegex = (/[\[\]{}\\]/g);

            if (string == null) return '';
            return ('' + string).replace(entityRegex, function(match) {
                return entityMap[match];
            });
        },
        _getPreviousParams: function() {
            return $.extend(true, {}, this.options.collection.query.params);
        },
        _makeQueryParams: function() {
            var p = {query: {}},
                value = this.getWidget('q').getValue().trim(),
                previousParams = this._getPreviousParams(),
                result = {};

            if (value) {
                value = this._escapeQuery(value);
                p.query[this.options.searchParam] = value;
            }

            // to check if the previous params had a query parameter then remove search param from it
            if (previousParams.query && _.has(previousParams.query, this.options.searchParam)) {
                previousParams.query = _.omit(previousParams.query, this.options.searchParam);
            }

            result = $.extend(true, result, previousParams, p);

            // If query parameter is empty then delete it
            result.query = _.isEmpty(result.query) ? null : result.query;
            return result;
        },
        _onClickClear: function() {
            this.getWidget('q').setValue('');
            if (this._filtered) {
                this.submit();
            }
        },
        _onKeyup: function() {
            var method = this._filtered || this.getWidget('q').getValue()?
                'enable' : 'disable';
            this.getWidget('clear')[method]();
        },
        submit: function(evt) {
            var params, self = this, collection = self.options.collection;
            if (evt) {
                evt.preventDefault();
            }
            if (!collection) {
                console.warn('powergridsearch only works with a collection backing it!');
                return;
            }
            self.propagate('disable');
            collection.trigger('powerGridSearchStarting');

            params = self._makeQueryParams();
            self._filtered = !!params.query;
            collection.reset(params);
            self.trigger('searchStarted'); // deprecated, use collection event
            collection.trigger('powerGridSearchStarted');

            return collection.load().always(function() {
                self.propagate('enable');
                self.trigger('searchCompleted'); // deprecated, use coll. event

                if (self.getWidget('q').getValue()) {
                    collection.trigger('powerGridSearchCompleted');
                } else {
                    self.getWidget('clear').disable();
                    collection.trigger('powerGridSearchCleared');
                }
            });
        }
    }, {mixins: [CollectionViewable]});

    return PowerGridSearch;
});
