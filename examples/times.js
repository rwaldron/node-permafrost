var pf = require('permafrost');

pf('times.db', { times : 0 }, function (err, moo) {
    moo.times ++;
    console.log(moo.times + ' times');
});
