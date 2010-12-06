var pf = require('permafrost');

pf('push.db', [], function (err, xs) {
    var n = Math.floor(Math.random() * 256);
    xs.push(n);
    console.dir(xs);
});
