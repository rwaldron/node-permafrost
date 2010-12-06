Permafrost
==========

Permafrost uses harmony proxies to recursively trap updates to data structures
and store the changing structures to disk automatically and transparently to the
programming model.

Think ORM, but with a crazy low impedance mismatch.

Examples
========

times.js
--------

    var pf = require('permafrost');
    
    pf('times.db', { times : 0 }, function (err, obj) {
        obj.times ++;
        console.log(obj.times + ' times');
    });

And then run it:
    $ node times.js 
    1 times
    $ node times.js 
    2 times
    $ node times.js 
    3 times

Amazing! You can modify references too:

push.js
-------

    var pf = require('permafrost');

    pf('push.db', [], function (err, xs) {
        var n = Math.floor(Math.random() * 256);
        xs.push(n);
        console.dir(xs);
    });

Then run it repeatedly:
    $ node push.js 
    [ 109 ]
    $ node push.js 
    [ 109, 9 ]
    $ node push.js 
    [ 109, 9, 33 ]

Super great. You can modify nested references too:

    var pf = require('permafrost');
    
    pf('moo.db', {}, function (err, moo) {
        moo.xs = [3,4,5];
        moo.xs.push(6);
        moo.xs.push({ a : 1, b : 2, c : [3,4,5] });
        
        console.dir(moo);
    });

Which prints:
    { xs: [ 3, 4, 5, 6, { a: 1, b: 2, c: [Object] } ] }

Installation
============

With [npm](http://github.com/isaacs/npm), just do:
    npm install permafrost

or clone this project on github:

    git clone http://github.com/substack/node-permafrost.git
