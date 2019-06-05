'use strict';

const lib = {};

[ 'tools', 'colors' ].forEach(name => {
  const submodule = require(`./lib/${name}.js`);
  Object.assign(lib, submodule);
});

module.exports = lib;
