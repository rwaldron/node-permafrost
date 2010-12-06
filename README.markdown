Permafrost
==========

Permafrost uses harmony proxies to recursively trap updates to data structures
and store the changing structures to disk automatically and transparently to the
programming model.

Think ORM, but with a crazy low impedance mismatch.

This thing is still quite buggy. I wouldn't use it for anything important yet.

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

moo.js
------

    var pf = require('permafrost');
    
    pf('moo.db', {}, function (err, moo) {
        moo.xs = [3,4,5];
        moo.xs.push(6);
        moo.xs.push({ a : 1, b : 2, c : [3,4,5] });
        
        console.dir(moo);
    });

Which prints:
    { xs: [ 3, 4, 5, 6, { a: 1, b: 2, c: [Object] } ] }

Methods
=======

pf(db, cb)
----------
pf(db, def, cb)
---------------

Get a handle to the top-layer object in the provided callback.

If `db` is a string, a it's treated as the filename of a
[supermarket](https://github.com/pkrumins/node-supermarket)
database. Otherwise `db` is treated as a key/value store and is expected to have
`.get()`, `.set()`, `.remove()`, and `.all()`.

If `def` is supplied and there is no existing data in the database, permafrost
will return `def` to the inner callback instead.

When the data store is ready, `cb(err, obj)` is called with the wrapped object
or an error message. The data store is updated immediately when `obj` changes.

Installation
============

With [npm](http://github.com/isaacs/npm), just do:
    npm install permafrost

or clone this project on github:

    git clone http://github.com/substack/node-permafrost.git

To run the tests with [expresso](http://github.com/visionmedia/expresso),
just do:

    expresso

Dependencies
------------

* [node-proxy](https://github.com/brickysam26/node-proxy)
* [supermarket](https://github.com/pkrumins/node-supermarket)
* [traverse](https://github.com/pkrumins/node-supermarket)

When you `npm install permafrost` these dependencies will be automatically
installed.
