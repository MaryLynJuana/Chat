

module.exports = class MessageQueue {
    constructor() {
        this.colocutor = 'everybody';
        this.waiting = {};
        this.db = require('./database');
        this.username = null;
    }

    initialize(name) {
      this.username = name;
    }

    async startDialogue(address) {
        this.colocutor = address;
        await this.showOldCache(address);
        const cache = this.waiting[ address ];
        if (!cache) return;
        for (const msg of cache) {
            this.show(msg);
            this.waiting[ address ].shift();
        }
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
        const newMsgWarn = `${sender} has sent you a private message.
Type '/dialogue @${sender}' to check it`;
        console.log('📨: ', newMsgWarn);
    }

    async add(data) {
        const message = JSON.parse(data);
        const { sender, receiver } = message;
        const inPublic = this.inPublic(receiver);
        const fromCurrentChat = sender === this.colocutor || inPublic;
        const isSystemMsg = sender === 'server';
        if (fromCurrentChat || isSystemMsg) {
            await this.show(message);
            return;
        }
        if (receiver !== 'everybody') this.toCache(message);
    }

    async save(message, read, inDb) {
        const messages = await this.db.chooseCollection('messages');
        inDb ? await messages.setValue(message, 'read', read) :
            await messages.setItem({ ...message, read });
    }

    async show(message, inDb) {
        console.log('📨: ', message.text, message.date);
        if (message.sender === 'server') return;
        await this.save(message, true, inDb);
    }

    async saveCache() {
        if (!this.waiting) return;
        for (const sender in this.waiting) {
            const cache = this.waiting[ sender ];
            for (const msg of cache) await this.save(msg, false);
        }
    }

    async showOldCache(sender) {
        const { username } = this;
        const messages = await this.db.chooseCollection('messages');
        const unreadMsgs = await messages.findAll({
            sender, receiver: username, read: false });
        for (const msg of unreadMsgs) this.show(msg, true);
    }

    static createMsg(sender, receiver, text) {
        const msg = {
            sender, receiver, text,
            date: new Date().toLocaleString(),
        };
        return JSON.stringify(msg);
    }
};

