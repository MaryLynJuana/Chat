


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
    cache.forEach((msg, index) => {
      this.show(msg);
      delete this.waiting[ address ][ index ];
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

  async add(data) {
    if (!data.startsWith('{')) return console.log(data);
    const message = JSON.parse(data);
    message.sent = true;
    const { sender, receiver } = message;
    const inPublic = this.inPublic(receiver);
    const inPrivate = this.inPrivate(sender, receiver);
    const fromCurrentChat = inPrivate || inPublic;
    if (fromCurrentChat) return await this.show(message);
    this.notify(sender, receiver);
    if (receiver !== 'everybody') this.toCache(message);
  }

  async show(message) {
    console.log('📨: ', message.text, message.date);
    message.read = true;
    this.socket.write(JSON.stringify(message));
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

