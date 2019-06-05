'use strict';

const { colorer } = require('../lib');

module.exports = class MessageQueue {
  constructor(socket) {
    this.colocutor = 'everybody';
    this.socket = socket;
    this.waiting = {};
  }

  initialize(login) {
    this.user = login;
  }

  async startDialogue(address) {
    this.colocutor = address;
    const cache = this.waiting[ address ];
    if (!cache) return;
    cache.forEach(msg => {
      this.show(msg);
      this.waiting[ address ].unshift();
    });
  }

  leaveDialogue() {
    this.colocutor = 'everybody';
  }

  inPublic(receiver) {
    const publicMsg = receiver === 'everybody';
    const inPublicChat = this.colocutor === 'everybody';
    return publicMsg && inPublicChat;
  }

  inPrivate(sender, receiver) {
    const fromColocutor = sender === this.colocutor;
    const toMe = receiver === this.user;
    return fromColocutor && toMe;
  }

  toCache(message) {
    const { sender } = message;
    this.waiting[ sender ] = this.waiting[ sender ] || [];
    this.waiting[ sender ].push(message);
  }

  notify(sender, receiver) {
    if (receiver === 'everybody') return;
    const newMsgWarn = `${sender} has sent you a private message.
Type '/dialogue @${sender}' to check it`;
    console.log('📨: ', newMsgWarn);
  }

  async show(message) {
    console.log('📨: ', message.text, message.date);
    message.read = true;
    this.socket.write(JSON.stringify(message));
  }

  warn(message) {
    const warning = colorer(message.text, 3);
    console.log(warning);
  }

  async add(data) {
    const message = JSON.parse(data);
    if (message.type === 'warning') return this.warn(message);
    message.sent = true;
    const { sender, receiver } = message;
    const inPublic = this.inPublic(receiver);
    const inPrivate = this.inPrivate(sender, receiver);
    const fromCurrentChat = inPrivate || inPublic;
    if (fromCurrentChat) return await this.show(message);
    this.notify(sender, receiver);
    if (receiver !== 'everybody') this.toCache(message);
  }

  static createMsg(sender, receiver, text) {
    const msg = {
      sender, receiver, text,
      date: new Date().toLocaleString(),
      read: false,
      type: 'message',
    };
    return JSON.stringify(msg);
  }
};

