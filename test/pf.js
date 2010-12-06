var pf = require('permafrost');

exports.attrs = function (assert) {
    var filename = '/tmp/'
        + (Math.random() * Math.pow(2, 32)).toString(16)
        + '.db'
    ;
    
    pf(filename, { a : 1 }, function (err, obj) {
        assert.eql(obj.a, 1);
        obj.b = 3;
        obj.a ++;
        obj.c = [3,4];
    });
    
    setTimeout(function () {
        pf(filename, function (err, obj) {
            assert.eql(obj, { a : 2, b : 3, c : [3,4] });
        });
    }, 500);
};
