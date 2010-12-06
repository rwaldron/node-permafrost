module.exports = Persist;

var Store = require('supermarket');

function Persist (db, def, cb) {
    if (cb === undefined) { cb = def; def = {} }
    if (!def) def = {};
    
    var self = {};
    
    if (typeof db == 'string') {
        Store({ filename : db, json : true }, function (err, db) {
            if (err) cb(err)
            else load(db, def, cb);
        });
    }
    else load(db, def, cb);
    
    return self;
}

var Hash = require('traverse/hash');
var Traverse = require('traverse');
var EventEmitter = require('events').EventEmitter;

function load (db, def, cb) {
    db.join(function (rows) {
        var keyed = Hash.zip(
            rows.map(function (r) { return r.key }),
            rows.map(function (r) { return r.value })
        );
        
        rows.forEach(function (row) {
            if (row.key == '') return;
            var pkey = row.key.split('.').slice(0,-1).join('.');
            var key = row.key.split('.').slice(-1)[0];
            keyed[pkey][key] = keyed[row.key];
        });
        var root = keyed[''];
        
        var em = new EventEmitter;
        
        em.on('set', function set (ps, value) {
            var key = ps.join('.');
            if (typeof value != 'object' || value === null) {
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
        
        em.on('delete', function rm (ps) {
            var key = ps.join('.');
            db.remove(key);
        });
        
        if (rows.length === 0) {
            root = def;
            em.emit('set', [], def);
        }
        
        cb(null, Wrapper(root, [], em));
    });
}

var Proxy = require('node-proxy');

function Wrapper (obj, path, em) {
    if (typeof obj != 'object' || obj === null) return obj;
    
    return Proxy.create({
        get : function (recv, name) {
            var ps = path.concat(name);
            if (typeof obj[name] == 'function') {
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
                em.emit('delete', path.concat(name));
            }
            delete obj[name];
            return true;
        },
        fix : function () {
            return undefined;
        },
    }, Object.getPrototypeOf(obj));
};
