'use strict';


module.exports = class MessageQueue {
  constructor() {
    this.colocutor = 'everybody';
    this.waiting = {};
  }

  async startDialogue(address) {
    this.colocutor = address;
    const cache = this.waiting[ address ];
    if (!cache) return;
    cache.forEach((msg, index) => {
      this.show(msg);
      this.waiting[ address ][ index ] = msg;
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

  toCache(message) {
    const { sender } = message;
    this.waiting[ sender ] = this.waiting[ sender ] || [];
    this.waiting[ sender ].push(message);
  }

  notify(sender) {
    const newMsgWarn = `${sender} has sent you a private message.
Type '/dialogue @${sender}' to check it`;
    console.log('📨: ', newMsgWarn);
  }

  async add(data) {
    if (!data.startsWith('{')) return console.log(data);
    const message = JSON.parse(data);
    message.sent = true;
    const { sender, receiver } = message;
    const inPublic = this.inPublic(receiver);
    const fromCurrentChat = sender === this.colocutor || inPublic;
    fromCurrentChat ? await this.show(message) : this.notify(sender);
    if (receiver !== 'everybody') return this.toCache(message);
  }

  async show(message) {
    console.log('📨: ', message.text, message.date);
    message.read = true;
  }

  static createMsg(sender, receiver, text) {
    const msg = {
      sender, receiver, text,
      date: new Date().toLocaleString(),
      read: false,
    };
    return JSON.stringify(msg);
  }
};

