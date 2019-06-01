

const readline = require('readline');
const { promisify } = require('util');

const mutableStream = stream => {
    const mutable = {
        muted: false,
        mute() {
            this.muted = true;
        },
        unmute() {
            this.muted = false;
            stream.write('\n');
        },
        write(chunk, encoding, cb) {
            if (this.muted) return;
            stream.write(chunk, encoding, cb);
        },
    };
    Object.setPrototypeOf(mutable, stream);
    return mutable;
};

const rl = readline.createInterface({
    input: process.stdin,
    output: mutableStream(process.stdout),
    terminal: true,
});

rl.question[promisify.custom] = question => new Promise(resolve => {
    rl.question(question, resolve);
});

const account = {
    question: promisify(rl.question),
    async getLogin() {
        const login = await this.question('Enter your username: ');
        return login ? login : this.getLogin();
    },
    async getPassword() {
        rl.output.write('Enter your password: ');
        rl.output.mute();
        const password = await this.question('');
        rl.history = rl.history.slice(1);
        rl.output.unmute();
        return password;
    },
};

Object.setPrototypeOf(account, rl);

module.exports = account;
