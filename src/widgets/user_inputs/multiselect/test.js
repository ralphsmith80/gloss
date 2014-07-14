/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    './../multiselect',
    './../form',
    './../../../data/mock',
    './../../../test/api/v1/targetvolume',
    'text!./../../../test/api/v1/test/fixtures/targetvolume.json',
    'mesh/tests/example',
    'mesh/tests/examplefixtures',
    'mesh/tests/mockutils',
    'tmpl!./multiselecttesttemplate.mtpl'
], function($, _, Multiselect, Form, Mock, TargetVolume, targetvolume_json,
    Example, exampleFixtures, mockUtils, tmpl) {

    var valueMatchesCheckboxes = function(checkboxes, value) {
        _.each(checkboxes, function(cb) {
            var idx = _.indexOf(value, cb.options.value);
            equal(cb.node.checked, idx >= 0);
        });
    };

    var BigMock = mockUtils('Example', Example, exampleFixtures);
    Mock(TargetVolume, JSON.parse(targetvolume_json));

    asyncTest('multiselect instantiation from collection', function() {
        var ms = Multiselect()
                    .set('collection', TargetVolume.collection())
                    .appendTo('#qunit-fixture');
        setTimeout(function() {
            equal(ms.$node.find('input[type=checkbox]').length, 6);
            start();
        }, 50);
    });

    test('multiselect instantiation without collection', function() {
        var ms = Multiselect(undefined, {
            models: [
                {name: 'foo bar baz', id: 0, value: 'dummy'},
                {name: 'foo bar biggity iggity bazzle', id: 1, value: 'dummy'}
            ]
        }).appendTo('#qunit-fixture');

        equal(ms.$node.find('input[type=checkbox]').length, 2);
    });

    asyncTest('setting and getting values of multiselect', function() {
        var ms = Multiselect()
                    .set('collection', TargetVolume.collection())
                    .appendTo('#qunit-fixture');
        setTimeout(function() {
            equal(ms.getValue().length, 0);
            valueMatchesCheckboxes(ms.checkBoxGroup.checkboxes, ms.getValue());

            ms.setValue([1357, 4]);
            ok(_.isEqual(ms.getValue(), [1357, 4]), 'getValue() should equal [1357, 4]');
            valueMatchesCheckboxes(ms.checkBoxGroup.checkboxes, ms.getValue());
            start();
        }, 50);
    });

    test('setting values to all/none', function() {
        var ms = Multiselect(undefined, {
            models: [
                {name: 'foo bar baz', id: 0},
                {name: 'foo bar biggity iggity bazzle', id: 1}
            ]
        }).appendTo('#qunit-fixture');
        
        ms.resetSelectAll.trigger('click');
        deepEqual(ms.getValue(), [0, 1]);

        ms.resetSelectNone.trigger('click');
        deepEqual(ms.getValue(), []);
    });

    test('multiselect div correctly widgetized', function() {
        var $frm = $('<form><div name=my-multiselect1 class=multiselect></div></form>')
                .appendTo('#qunit-fixture'),
            form = Form($frm, {widgetize: true});

        ok(form.getWidget('my-multiselect1'));
        ok(form.getWidget('my-multiselect1') instanceof Multiselect);
    });
    
    test('multiselect select correctly widgetized', function() {
        var form = Form($(tmpl()), {widgetize: true}),
            wd = null;

        form.appendTo($('#qunit-fixture'));

        wd = form.getWidget('my-multiselect2'); 
        ok(wd);
        ok(wd instanceof Multiselect);
        deepEqual(wd.getValue(), ['foo', 'bar']);
    });

    asyncTest('multiselect instantiation without collection', function() {
        var ms = window.ms = Multiselect(undefined, {
            models: [
                {name: 'foo bar baz', id: 0},
                {name: 'foo bar biggity iggity bazzle', id: 1},
                {name: 'foo bar qwet', id: 2},
                {name: 'foo bar ycvhdf', id: 3},
                {name: 'foo bar vfdrf', id: 4},
                {name: 'foo bar jnoi', id: 5},
                {name: 'foo bar hu', id: 6},
                {name: 'foo bar zrte', id: 7},
                {name: 'foo bar xyr', id: 8},
                {name: 'foo bar zji', id: 9}
            ]
        }).appendTo('body');

        setTimeout(function() {
            ok(ms);
            start();
        }, 15);
    });

    test('instantiating multiselect with select el preserves name', function() {
        var $select = $('<select name=foo></select>'),
            ms = Multiselect($select);
        equal(ms.$node.attr('name'), 'foo');
    });

    test('replacing select element correctly modifies dom', function() {
        var ms, $select = $('<select name=foo></select>').appendTo('#qunit-fixture');
        equal($('#qunit-fixture').find('select').length, 1);
        equal($('#qunit-fixture').find('.multiselect').length, 0);
        ms = Multiselect($select);
        equal($('#qunit-fixture').find('select').length, 0);
        equal($('#qunit-fixture').find('.multiselect').length, 1);
    });

    test('performance check', function() {
        var start, ms,
            limit = 1000,
            collection = BigMock.collection({limit: limit}),
            $perfButton = $("<button class='perf-button'>performance check</button>");
        
        $perfButton.appendTo('body');
        $('body').on('click', '.perf-button', function() {
            $perfButton.text('working...');
            ms = Multiselect(undefined, {
                translator: function(item) {
                    return {value: item.id, name: item.text_field, checked: item.selected};
                }
            }).appendTo('body');

            start = new Date();
            ms.set('collection', collection);
        });
        collection.on('update', function() {
            var end = new Date(),
                timeLapse = (end-start)/1000;

            console.log('time:', timeLapse);
            $('.perf-button').after('<b>'+limit+' object in '+timeLapse+' seconds</b> ');
            $perfButton.text('performance check');
        });
        ok(true);
    });

    start();
});
