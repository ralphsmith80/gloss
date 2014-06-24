define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/moment',
    '../base/widget',
    '../base/formwidget',
    '../base/basemenu',
    './textbox',
    'tmpl!./datepicker/datepicker.mtpl',
    'tmpl!./datepicker/monthview.mtpl',
    'css!./datepicker/datepicker.css'
], function($, _, moment, Widget, FormWidget, BaseMenu, TextBox, widgetTemplate,
    monthViewTemplate) {

    var DatePicker = FormWidget.extend({
        defaults: {
            date: moment(),
            format: 'YYYY-MM-DD',
            populateEmptyNode: true
        },
        nodeTemplate: widgetTemplate,
        create: function() {
            var self = this;

            self.$node.addClass('datepicker');

            self._super.apply(this, arguments);

            self.options._selected = null;

            self.menu = BaseMenu(self.$node.find('.datepicker-menu'))
                .on('click', 'h4 .left, h4 .right', function() {
                    var date = self.options.date,
                        forward = $(this).hasClass('right');
                    self.set('date', date.add('months', forward? 1 : -1));
                }).on('mouseup', '.monthview td', function() {
                    var selectedDate = self.monthView.tdElToDate(this);
                    if (selectedDate) {
                        self.setValue(selectedDate);
                    }
                });

            self.input = TextBox(self.$node.children('input[type=text]'))
                .on('blur', self._updateValue)
                .on('focus click', self.menu.show)
                .on('keydown', function(evt) {
                    if (Widget.identifyKeyEvent(evt) in {enter:'', tab:''}) {
                        self._updateValue();
                        self.menu.hide();
                    }
                }).on('keyup', function(evt) {
                    if (!(Widget.identifyKeyEvent(evt) in {enter:'', tab:''})) {
                        self._updateValue(evt, {dontUpdateDisplay: true});
                    }
                });

            self.monthView = DatePicker.MonthView(
                self.menu.$node.find('.monthview').empty(),
                {date: moment(self.options.date)});

            self.onPageClick(self.menu.hide, {once: false});

            self.update();
        },
        _updateValue: function(evt, opts) {
            // input date will be (a) 'null' if this.input.getValue() returns
            // null, or (b) a moment object based on some date
            //
            // if it's a moment object, and it failed to successfully parse
            // this.input.getValue(), then it will be a valid date, but
            // inputDate.isValid() will return false
            var inputDate = moment(this.input.getValue(), [this.options.format]);
            opts = opts || {};
            if (inputDate) {
                if (inputDate.isValid()) {
                    this.setValue(inputDate, opts);
                } else {
                    this.setValue(this.getValue(), opts);
                }
            } else {
                this.setValue(null, opts);
            }
        },
        getValue: function() {
            return this.options._selected && this.options._selected._d;
        },
        setValue: function(date, opts) {
            date = moment(date || null);
            opts = opts || {};
            this.set('_selected', date, {silent: opts.dontUpdateDisplay});
            if (!opts.dontUpdateDisplay) {
                this.input.setValue(date && date.format(this.options.format));
            }
            return this;
        },
        // binding for two datepickers for apps with start <= end date requirements
        // the start date widiget is assumed to be `this` widget
        track: function(end) {
            var start = this;
            start.on('change', 'input[type=text]', function() {
                var startDate = moment(start.getValue()),
                    endDate = moment(end.getValue()),
                    diff = (startDate && endDate) ? startDate.diff(endDate) : null;

                // diff > 0 - startDate > endDate
                if (startDate && endDate && diff > 0) {
                    end.setValue(startDate);
                }
            });
            end.on('change', 'input[type=text]', function() {
                var fromDate = moment(start.getValue()),
                    toDate = moment(end.getValue()),
                    diff = (fromDate && toDate) ? toDate.diff(fromDate) : null;

                // diff < 0 - toDate < fromDate
                if (fromDate && toDate && diff < 0) {
                    start.setValue(toDate);
                }
            });
        },
        updateWidget: function(updated) {
            var date = this.options.date, selected = this.options._selected;
            if (updated.date) {
                this.menu.$node.find('h4 .title').text(date.format('MMMM YYYY'));
                this.monthView.set('date', date);
            }
            if (updated._selected) {
                this.monthView.set('_selected', moment(selected));
                if (selected) {
                    /*
                        A mind boggling issue:
                        - Adding an extra `date.isvalid` no-op check before '_selected' is set in the
                            `setValue` method makes the `$.isPlainObject` call in Widget::recursivemerge
                            work as expected and thus fixes a merging error with Moment objects in IE8
                        - without the odd `isValid` no-op check `$.isPlainObject` will in-correctly
                            responed with `true`. There are some typeing issues going on here. This
                            results in the `isMoment` test failing for the merged Moment object which
                            in trun breaks a moment clone so moment tries to return `new Date([moment Object])`
                        - the 'sane' work-around is to test those constraints and recreate the
                            moment object from the date ie. `moment._d`
                        - Note*: the fact that `$.isPlainObject` responds differently when the no-op
                            is in place is not the problem it just points to an issue with the
                            javascript parse.
                            How far do you want to travel down the rabbit hole mister Anderson?
                    */
                    if (!moment.isMoment(selected) && selected.isValid()) {
                        this.options._selected = selected = moment(selected._d);
                    }
                    this.set('date', moment(selected));
                }
            }
        }
    });

    DatePicker.MonthView = Widget.extend({
        defaults: {
            date: moment()
        },
        nodeTemplate: monthViewTemplate,
        create: function() {
            this.$node.addClass('monthview');
            this.update();
        },
        tdElToDate: function(td) {
            var _date = +$(td).text(), date,
                m = moment();
            if (!isNaN(_date)) {
                // set the date but the time is not tracked here so set to current browser time
                date = moment(this.options.date)
                    .date(_date)
                    .hours(m.hours())
                    .minutes(m.minutes())
                    .seconds(m.seconds());
                if (date.month() === this.options.date.month()) {
                    return date;
                }
            }
        },
        updateWidget: function(updated) {
            var date = this.options.date, selected = this.options._selected;

            this._selectedDate = DatePicker.sameMonth(date, selected)?
                selected.date() : null;

            if (updated.date && date) {
                this._num = DatePicker.numDaysInMonth(date);
                this._first = moment(
                    date.year() + '-' + (date.month()+1) + '-1',
                    'YYYY-MM-DD');
                this._numRows = Math.ceil((this._first.day() + this._num) / 7);
                this.render();
            }
            if (updated._selected) {
                this.render();
            }
        }
    });

    // got this little gem here: http://stackoverflow.com/a/1811003/5377
    // the 'date' params is an instance of moment
    DatePicker.numDaysInMonth = function(date) {
        return (/8|3|5|10/).test(date.month())?  // 30 days has sept, apr, june, & nov
            30 :
            date.month() !== 1?
                31 :                            // all the rest have 31...
                (date.isLeapYear()? 29 : 28);   // except feb
    };

    DatePicker.sameMonth = function(date1, date2) {
        if (date1 && date2) {
            return date1.year()===date2.year() && date1.month()===date2.month();
        }
    };

    return DatePicker;
});
