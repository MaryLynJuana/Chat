'use strict';

module.exports = class User {
  constructor(login, socket, db) {
    this.login = login;
    this.socket = socket;
    this.db = db;
  }

  async saveMessage(msg) {
    const { sender, receiver, text, date, sent, read } = msg;
    if (sent && !read) return;
    const messages = await this.db.chooseCollection('messages');
    if (!read) return await messages.setItem(msg);
    const query = { sender, receiver, text, date };
    await messages.setValue(query, 'read', true);
  }

  async sendMessage(message, receiver) {
    if (!message.sent) message.sender = this.login;
    await this.saveMessage(message);
    if (message.sent || !receiver) return;
    const client = receiver.socket;
    client.write(JSON.stringify(message));
  }

};
