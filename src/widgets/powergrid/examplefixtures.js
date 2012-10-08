define([
    'vendor/underscore'
], function(_) {
    var total = 1000,
        x=123456789, y=362436069, z=521288629,
        r = function() {
            x ^= x << 16;
            x ^= x >> 5;
            x ^= x << 1;

            var t = x;
            x = y;
            y = z;
            z = t ^ x ^ y;

            return (z < 0? -1*z : z) % total;
        };
    return _.map(_.range(total), function(____, i) {
        return {
            id: i+1,
            text_field: 'item ' + i,
            required_field: 'something absolutely necessary ' + i,
            boolean_field: false,
            datetime_field: '2012-08-29T14:10:21Z',
            integer_field: r(),
            default_field: i % 5 === 0? null : 'default ' + i
        };
    });
});