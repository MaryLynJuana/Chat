

const DatabaseInterface = require('./mongo');
const db = new DatabaseInterface('chat');

module.exports = db;
