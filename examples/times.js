var pf = require('permafrost');

pf('times.db', { times : 0 }, function (err, obj) {
    obj.times ++;
    console.log(obj.times + ' times');
});
