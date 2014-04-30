var yaml    = require('js-yaml'),
    fs      = require('fs'),
    runtime = require('./lib/runtime');

'use strict';

try {
    var spec = yaml.safeLoad(fs.readFileSync('test/fixtures/testdb.yaml', 'utf8'));
} catch (e) {
    throw new Error('Invalud YAML, or file not found');
}

runtime.run(spec);