const { MongoClient, ObjectId } = require('mongodb');

module.exports = class DatabaseInterface {
  constructor(dbName) {
    this.name = dbName;
    this.url = "mongodb://localhost:27017/";
    this.client = null;
  }
  async connect() {
    if (this.database) return this;
    const client = await MongoClient.connect(this.url, { useNewUrlParser: true });
    try {
      this.client = client;
      this.database = client.db(this.name);
      return this;
    } catch(e) {
      console.error(e)
    };
  }
  close() {
    if (!this.client) return;
    this.client.close();
  }
  chooseCollection(collectionName) {
    this.collection = this.database.collection(collectionName);
  }
  async getDoc(collectionName, query) {
    try {
      await this.connect();
      this.chooseCollection(collectionName);
      const doc = await this.collection.findOne(query);
      return doc;
    } catch(e) {
      console.error(e)
    };
  }
  async setDoc(collectionName, data, query) {
    try {
      await this.connect();
      this.chooseCollection(collectionName);
      if (query) {
        await this.collection.updateOne(query, data);
      } else {
        await this.collection.insertOne(data);
      }
    } catch(e) {
      console.error(e)
    };
    return this;
  }
  async deleteDoc(collectionName, query) {
  try {
      await this.connect();
      this.chooseCollection(collectionName);
      await this.collection.deleteOne(query);
    } catch(e) {
      console.error(e)
    };
  return this;
  }
  async getValue(collectionName, query, key) {
    try {
      await this.connect();
      const doc = await this.getDoc(collectionName, query);
      const value = doc[ key ];
      return value;
    } catch(e) {
      console.error(e)
    };
  }
  async setValue(collectionName, query, key, value) {
  try {
      await this.connect();
      this.chooseCollection(collectionName);
      const data = {};
      data[ key ] = value;
      await this.collection.updateOne(query, {$set: data});
    } catch(e) {
      console.error(e)
    };
    return this;
  }
  async deleteValue(collectionName, query, key) {
    try {
      await this.connect();
      this.chooseCollection(collectionName);
      const data = {};
      data[ key ] = '';
      await this.collection.updateOne(query, {$unset: data});
    } catch(e) {
      console.error(e)
    };
    return this;
  }
  createId() {
    return new ObjectId
  }
};
