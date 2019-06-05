'use strict';

const chooseDb = name => require(`./db/${name}.js`);

const DatabaseInterface = chooseDb('mongo');
const db = new DatabaseInterface('chat');

module.exports = db;
