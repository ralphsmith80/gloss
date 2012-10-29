/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    './../view',
    './../widgets/togglegroup',
    './../widgets/datepicker',
    './../widgets/textbox',
    './../widgets/checkbox',
    'tmpl!./propagation.mtpl'
], function($, _, View, ToggleGroup, DatePicker, TextBox, CheckBox,
    propagationTemplate) {

    test('instantiating a view', function() {
        var v = View();
        ok(v);
    });

    test('defaults are preserved and inherited correctly', function() {
        var ParentViewClass, par, ChildViewClass, child, GrandChildViewClass,
        grandChild;
        ParentViewClass = View.extend({
            defaults: {
                parentDefault: 'foo',
                overriddenDefault: 'bar'
            }
        });
        ChildViewClass = ParentViewClass.extend({
            defaults: {
                childDefault: 'foo2',
                overriddenDefault: 'bar2'
            }
        });
        // we want to re-wrap the derived extend, just to make sure that the
        // defaults are still properly inherited
        ChildViewClass.extend = _.wrap(ChildViewClass.extend, function(func) {
            var rest = Array.prototype.slice.call(arguments, 1),
                derivedClass = func.apply(this, rest);
            if (derivedClass.prototype.defaults.overriddenDefault !==
                derivedClass.__super__.prototype.defaults.overriddenDefault) {
                derivedClass.prototype.clobbered =
                    derivedClass.__super__.prototype.defaults.overriddenDefault;
            }
            if (derivedClass.prototype.defaults.childDefault !==
                derivedClass.__super__.prototype.defaults.childDefault) {
                derivedClass.prototype.shouldntBeClobbered =
                    derivedClass.__super__.prototype.defaults.childDefault;
            }
            return derivedClass;
        });
        GrandChildViewClass = ChildViewClass.extend({
            defaults: {
                grandChildDefault: 'foo3',
                overriddenDefault: 'bar3'
            }
        });

        par = ParentViewClass();
        child = ChildViewClass();
        grandChild = GrandChildViewClass();

        equal(ParentViewClass.prototype.defaults.parentDefault, 'foo');
        equal(ParentViewClass.prototype.defaults.overriddenDefault, 'bar');
        equal(_.keys(ParentViewClass.prototype.defaults).length, 2);

        equal(par.get('parentDefault'), 'foo');
        equal(par.options.parentDefault, 'foo');
        equal(par.get('overriddenDefault'), 'bar');
        equal(par.options.overriddenDefault, 'bar');

        equal(ChildViewClass.prototype.defaults.parentDefault, 'foo');
        equal(ChildViewClass.prototype.defaults.childDefault, 'foo2');
        equal(ChildViewClass.prototype.defaults.overriddenDefault, 'bar2');
        equal(_.keys(ChildViewClass.prototype.defaults).length, 3);

        equal(child.get('parentDefault'), 'foo');
        equal(child.options.parentDefault, 'foo');
        equal(child.get('childDefault'), 'foo2');
        equal(child.options.childDefault, 'foo2');
        equal(child.get('overriddenDefault'), 'bar2');
        equal(child.options.overriddenDefault, 'bar2');

        equal(GrandChildViewClass.prototype.defaults.parentDefault, 'foo');
        equal(GrandChildViewClass.prototype.defaults.childDefault, 'foo2');
        equal(GrandChildViewClass.prototype.defaults.grandChildDefault, 'foo3');
        equal(GrandChildViewClass.prototype.defaults.overriddenDefault, 'bar3');
        equal(_.keys(GrandChildViewClass.prototype.defaults).length, 4);

        equal(GrandChildViewClass.prototype.clobbered, 'bar2');
        ok(!GrandChildViewClass.prototype.hasOwnProperty('shouldntBeClobbered'));

        equal(grandChild.get('parentDefault'), 'foo');
        equal(grandChild.options.parentDefault, 'foo');
        equal(grandChild.get('childDefault'), 'foo2');
        equal(grandChild.options.childDefault, 'foo2');
        equal(grandChild.get('grandChildDefault'), 'foo3');
        equal(grandChild.options.grandChildDefault, 'foo3');
        equal(grandChild.get('overriddenDefault'), 'bar3');
        equal(grandChild.options.overriddenDefault, 'bar3');

        equal(grandChild.clobbered, 'bar2');
        ok(!grandChild.hasOwnProperty('shouldntBeClobbered'));
    });

    asyncTest('page click events', function() {
        var count = 0, foobarCount = 0, oneCount = 0,
            v = View().appendTo('#qunit-fixture'),
            $other = $('<div>other</div>').appendTo('#qunit-fixture');

        v.$el.css({height: 200, width: 200, backgroundColor: 'red'});

        v.on('pageclick', function(evt) {
            if (++count >= 4) {
                v.off('pageclick');
            }
        });
        v.on('pageclick.foobar', function(evt) {
            if (++foobarCount >= 2) {
                v.off('pageclick.foobar');
            }
        });
        v.one('pageclick', function(evt) {
            ++oneCount;
        });

        setTimeout(function() {
            _.times(6, function() {
                $other.trigger($.Event('click'));
            });
            setTimeout(function() {
                equal(count, 4);
                equal(foobarCount, 2);
                equal(oneCount, 1);
                start();
            }, 0);
        }, 0);
    });

    test('creating view maintains existing classes', function() {
        var $el = $('<div class=foo></div>'),
            MyView = View.extend({template: '<div class=bar></div>'}),
            v = MyView({$el: $el});

        equal(v.$el.hasClass('foo'), true, 'view didnt blow away foo class');
        equal(v.$el.hasClass('bar'), true, 'view added bar class');
    });

    test('calling render does not add duplicate class names', function() {
        var $el = $('<div class=foo></div>'),
            MyView = View.extend({template: '<div class=bar></div>'}),
            v = MyView({$el: $el});

        equal(v.$el.attr('class'), 'foo bar');
        v.render();
        equal(v.$el.attr('class'), 'foo bar');
    });

    var widgetize = function($el) {
        var DisableSquashingView = View.extend({ disable: function() {} });
        return {
            created: DatePicker($el.find('[name=created]')),
            chooser: ToggleGroup($el.find('[name=chooser]')),
            query: TextBox($el.find('[name=query]')),
            preview: View({$el: $el.find('.preview')}),
            selected: CheckBox($el.find('[name=selected]')),
            disablesquashingview: DisableSquashingView({
                $el: $el.find('.disablesquashingview')
            }),
            wontbedisabled: CheckBox($el.find('[name=wont-be-disabled]'))
        };
    };

    test('getting child widgets and views works', function() {
        var $el = $(propagationTemplate()),
            widgets = widgetize($el),
            v = View({$el: $el}),
            children = v._childWidgetsAndViews();

        console.log(children);
        ok(children[0] === widgets.created, 'datepicker included');
        ok(children[1] === widgets.chooser, 'togglegroup included');
        ok(children[2] === widgets.query, 'query included');
        ok(children[3] === widgets.preview, 'preview included');
        ok(children[4] === widgets.disablesquashingview,
            'disablesquashingview included');
        equal(children.length, _.keys(widgets).length-2);
    });

    test('propagating disable works', function() {
        var $el = $(propagationTemplate()),
            MyView = View.extend({template: propagationTemplate}),
            v = MyView(),
            widgets = widgetize(v.$el);

        v.propagate('disable');
        equal(widgets.created.$node.hasClass('disabled'), true,
            'datepicker is disabled');
    });

    start();
});
