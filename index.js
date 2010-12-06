module.exports = pf;

var Store = require('supermarket');

function pf (db, def, cb) {
    if (cb === undefined) { cb = def; def = {} }
    if (!def) def = {};
    
    if (typeof db === 'string') {
        Store({ filename : db, json : true }, function (err, db) {
            if (err) cb(err)
            else load(db, def, cb);
        });
    }
    else {
        var missing = [ 'get', 'set', 'remove', 'all' ]
            .filter(function (x) { return !db[x] })
        ;
        if (missing.length) {
            cb('The store is missing: ' + missing.join(', '));
        }
        else {
            load(db, def, cb);
        }
    }
}

var nstore = require('nStore');
pf.nstore = function (store, def, cb) {
    var db = typeof store === 'string'
        ? nstore(store) : store;
    db.set = db.save.bind(db);
    db.all_ = db.all;
    db.all = function (f) {
        db.all_(function (err, values, keys) {
            if (err) f(err)
            else f(
                err,
                keys.slice(1).map(function (x) { return x.key }),
                values.slice(1)
            )
        });
    };
    pf(db, def, cb);
};

var dirty = require('dirty');
pf.dirty = function (store, def, cb) {
    var db = typeof store === 'string' ? dirty(store) : store;
    pf(db, def, cb);
};

var Hash = require('traverse/hash');
var Traverse = require('traverse');
var EventEmitter = require('events').EventEmitter;

function load (db, def, cb) {
    db.all(function (err, keys, values) {
        if (err) { cb(err); return }
        
        var keyed = Hash.zip(keys, values);
        if (keyed[''] === undefined) {
            keyed[''] = Array.isArray(def) ? [] : {};
        }
        
        keys
            .sort(function (a,b) {
                // so that children don't get set before their parents
                return a.length - b.length
            })
            .forEach(function (key) {
                if (key === '') return;
                var pkey = key.split('.').slice(0,-1).join('.');
                var name = key.split('.').slice(-1)[0];
                keyed[pkey][name] = keyed[key];
            })
        ;
        var root = keyed[''];
        
        var em = new EventEmitter;
        
        em.on('set', function set (ps, value) {
            var key = ps.join('.');
            
            if (typeof value !== 'object' || value === null) {
                db.set(key, value);
            }
            else if (Array.isArray(value)) {
                db.set(key, []);
                value.forEach(function (x, i) {
                    set(ps.concat(i), x);
                });
            }
            else {
                db.set(key, {});
                Hash(value).forEach(function (x, k) {
                    set(ps.concat(k), x);
                });
            }
        });
        
        em.on('delete', function rm (ps, obj) {
            var key = ps.join('.');
            var name = ps[ps.length - 1];
            db.remove(key);
            
            if (Array.isArray(obj)) {
                obj.forEach(
                    function (x,k) { rm(ps.concat(k), x) }
                );
            }
            else if (typeof obj === 'object') {
                Hash(obj).forEach(
                    function (x, k) { rm(ps.concat(k), x) }
                );
            }
        });
        
        if (keys.length === 0) {
            root = def;
            em.emit('set', [], def);
        }
        
        cb(null, Wrapper(root, [], em));
    });
}

var Proxy = require('node-proxy');

function Wrapper (obj, path, em) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    return Proxy.create({
        get : function (recv, name) {
            var ps = path.concat(name);
            if (name === 'toString') {
                return obj[name].bind(obj);
            }
            if (typeof obj[name] === 'function') {
                var up = Wrapper(obj, ps.slice(0,-1), em);
                return obj[name].bind(up);
            }
            else {
                return Wrapper(obj[name], ps, em);
            }
        },
        set : function (recv, name, value) {
            if (typeof value === 'function') {
                em.emit('error', new Error('Cannot set functions'));
                return;
            }
            
            obj[name] = value;
            
            var ps = path.concat(name);
            if (obj.propertyIsEnumerable(name)) {
                em.emit('set', ps, value);
                return Wrapper(value, ps, em);;
            }
            else return value;
        },
        enumerate : function () {
            return Object.keys(obj);
        },
        delete : function (name) {
            if (obj.propertyIsEnumerable(name)) {
                em.emit('delete', path.concat(name), obj[name]);
            }
            delete obj[name];
            return true;
        },
        fix : function () {
            return undefined;
        },
    }, Object.getPrototypeOf(obj));
};
