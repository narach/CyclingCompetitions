'use strict';

// Load the built handler from dist. This supports configurations that mistakenly point to index.handler
// by providing an index.js that proxies to dist/index.js.
const implementation = require('./dist/index.js');

exports.handler = implementation.handler;
