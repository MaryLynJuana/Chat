'use strict';

const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

module.exports = class FileSystemInterface {
  constructor(dirName) {
    this.dirName = './' + dirName + '/';
    this.collection = null;
  }

  async chooseCollection(name) {
    this.path = this.dirName + name;
    if (fs.existsSync(this.path)) {
      const data = await readFile(this.path, 'utf8');
      this.collection = JSON.parse(data);
    } else {
      this.collection = [];
      const data = JSON.stringify([]);
      await writeFile(this.path, data);
    }
    return this;
  }

  getItem(query) {
    for (const item of this.collection) {
      if (Object.entries(item).toString().
includes(Object.entries(query).toString())) return item;
    }
  }

  async setItem(item) {
    this.collection.push(item);
    await writeFile(this.path, JSON.stringify(this.collection));
    return this;
  }
}