var Q       = require('q'),
    r       = require('rethinkdb'),
    forEach = require('lodash.forEach'),
    setup, exec, conn, buildDB, buildTable, createIndex;


setup = function(host, port) {
    var deferred = Q.defer();

    r.connect({host: host, port: port}, function(err, connection) {
        if (err) { 
            deferred.reject(err);
        }
        conn = connection;
        deferred.resolve();
    });

    return deferred.promise;
};


createIndex = function(db, table, name) {
    var deferred = Q.defer();

    r.db(db).table(table).indexCreate(name).run(conn, function(err) {
        if (err) {
            deferred.reject(err);
            return;
        }

        deferred.resolve();
    });
}


buildTable = function(db, name, opts) {
    var deferred = Q.defer(),
        inicesPs = [],
        indices  = opts.indices;

    delete opts.indices;

    r.db(db).tableCreate(name, opts).run(conn, function(err) {
        if (err) {
            deferred.reject(err);
            return;
        }

        forEach(indices, function(index) {
            inicesPs.push(createIndex(db, name, index));
        });

        Q.all(inicesPs)
            .then(function() {
                r.db(db).table(name).indexWait().run(conn, function(err) {
                    if (err) {
                        deferred.reject(err);
                        return;
                    }
                    deferred.resolve();
                });
            }, function(err) {
                if (err) {
                    deferred.reject(err);
                }
            });

    });

    return deferred.promise;
};

buildDB = function(name, tables) {
    var deferred  = Q.defer(),
        tPromises = []

    r.dbCreate(name).run(conn, function(err) {
        if (err) {
            deferred.reject(err);
            return;
        }

        forEach(tables, function(_table, _name) {
            tPromises.push(buildTable(name, _name, _table));            
        });

        Q.all(tPromises)
            .then(function() {
                deferred.resolve();
            }, function(err) {
                deferred.reject(err);
            });
    });

    return deferred.promise;
}

exec = function(spec) {
    return function() {
        var deferred   = Q.defer(),
            dbs        = spec.dbs,
            dbPromises = [];

        forEach(dbs, function(_db, _name) {
            dbPromises.push(buildDB(_name, _db));            
        });

        Q.all(dbPromises)
            .then(function() {
                deferred.resolve();
            }, function(err) {
                deferred.reject(err);
            });

        return deferred.promise;
    }
};

module.exports.run = function(spec) {
    setup(spec.config.host, spec.config.port)
        .then(exec(spec))
        .done(function() {
            conn.close();
        }, function(err) {
            if (err) { throw err; }
        });
};