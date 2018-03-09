import absFloor from '../utils/abs-floor';
import absCeil from '../utils/abs-ceil';
import { createUTCDate } from '../create/date-from-array';

var abs = Math.abs;
var floor = Math.floor;
var ceil = Math.ceil;

export function bubble () {
    var milliseconds = this._milliseconds;
    var days         = this._days;
    var months       = this._months;
    var data         = this._data;
    var seconds, minutes, hours, years, monthsFromDays;

    // if we have a mix of positive and negative values, bubble down first
    // check: https://github.com/moment/moment/issues/2166
    if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
            (milliseconds <= 0 && days <= 0 && months <= 0))) {
        milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
        days = 0;
        months = 0;
    }

    // The following code bubbles up values, see the tests for
    // examples of what that means.
    data.milliseconds = milliseconds % 1000;

    seconds           = absFloor(milliseconds / 1000);
    data.seconds      = seconds % 60;

    minutes           = absFloor(seconds / 60);
    data.minutes      = minutes % 60;

    hours             = absFloor(minutes / 60);
    data.hours        = hours % 24;

    days += absFloor(hours / 24);

    // convert days to months
    monthsFromDays = absFloor(daysToMonths(days));
    months += monthsFromDays;
    days -= absCeil(monthsToDays(monthsFromDays));

    // 12 months -> 1 year
    years = absFloor(months / 12);
    months %= 12;

    data.days   = days;
    data.months = months;
    data.years  = years;

    return this;
}

// Converting between Months and Days
//
// 400 years have 146097 days, taking into account leap year rules.
// 400 years have 4800 months (12 * 400).
// Each month has 30.436875 days on average (146097 / 4800), but any
// single month has a whole number of days.
//
// To calculate the number of days for a given number of months,
// multiply months by 30.436875 then make a modified round on the result.
// AbsFloor the result, unless the result comes to within 12 hours of
// the next whole month... then Round the result.
// 12 hours in terms of the average month is 0.0164274420419588 months.
//
// Both calculations below are based on this logic, which is meant to
// respect leap year effects on large-value durations and also to give
// intuitive and symmetric conversions.
//
// These calculations are symmetric for converting whole months to days
// and back again for all 4800 months in the 400-year cycle, and give
// the correct value of exactly 146097 days for 4800 months.
var AVERAGE_DAYS_PER_MONTH = 30.436875;

// CHECK HOW THIS WORKS WITH NEGATIVE...
// NEED TO ABS DAYS FIRST?
export function daysToMonths (days) {
    var posneg = days < 0 ? -1 : 1;
    var absDays = abs(days);
    var fractionOfAverageMonth = absDays / AVERAGE_DAYS_PER_MONTH;
    var wholeMonths = floor(fractionOfAverageMonth);
    var daysInWholeMonths = monthsToDays(wholeMonths);
    var leftoverDays = absDays - daysInWholeMonths;
    var daysInNextWholeMonth = monthsToDays(wholeMonths + 1) - daysInWholeMonths;
    var fractionOfNextMonth = (leftoverDays / daysInNextWholeMonth);

    return posneg * (wholeMonths + fractionOfNextMonth);
}

export function monthsToDays (months) {
    var posneg = months < 0 ? -1 : 1;
    var absMonths = abs(months);
    var wholeMonths = floor(absMonths);
    var monthFraction = absMonths - wholeMonths;
    var daysInWholeMonths = floor(wholeMonths * AVERAGE_DAYS_PER_MONTH);
    var daysInNextMonth = floor((wholeMonths + 1) * AVERAGE_DAYS_PER_MONTH) - daysInWholeMonths;
    var daysInMonthFraction = monthFraction * daysInNextMonth;

    return posneg * (daysInWholeMonths + daysInMonthFraction);
}
