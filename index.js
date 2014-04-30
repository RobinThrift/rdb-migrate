var yaml    = require('js-yaml'),
    fs      = require('fs'),
    runtime = require('./lib/runtime');

'use strict';


process.argv.forEach(function(file, index) {
    if (index < 2) {
        return;
    }

    try {
        var spec = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        throw new Error('Invalud YAML, or file not found');
    }

    runtime.run(spec);
});