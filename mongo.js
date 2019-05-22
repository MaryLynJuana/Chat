const { MongoClient, ObjectId } = require('mongodb');

module.exports = class DatabaseInterface {
  constructor(dbName) {
    this.name = dbName;
    this.url = "mongodb://localhost:27017/";
    this.client = null;
    this.database = null;
    this.collection = null;
      }

  async connect() {
    if (this.database) return this;
    const client = await MongoClient.connect(this.url, { useNewUrlParser: true });
    this.client = client;
    this.database = client.db(this.name);
    return this;
  }

  close() {
    if (!this.client) return;
    this.client.close();
  }

  async chooseCollection(name) {
    await this.connect();
    this.collection = this.database.collection(name);
    return this;
  }

  async getItem(query) {
    const doc = await this.collection.findOne(query);
    return doc;
  }

  async setItem(item) {
    await this.collection.insertOne(item);
    return this;
  }

  async deleteItem(item) {
    await this.collection.deleteOne(item);
    return this;
  }

  async getValue(item, key) {
    const doc = await this.getItem(this.name, item);
    const value = doc[ key ];
    return value;
  }

  async setValue(item, key, value) {
    const data = {};
    data[ key ] = value;
    await this.collection.updateOne(item, { $set: data });
    return this;
  }

  async deleteValue(item, key) {
    const data = {};
    data[ key ] = '';
    await this.collection.updateOne(item, { $unset: data });
    return this;
  }

  createId() {
    return new ObjectId();
  }
};
