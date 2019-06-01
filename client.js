

const net = require('net');
const rl = require('./rl');
const MessageQueue = require('./queue');
const { createMsg } = MessageQueue;
const { parseAddresses } = require('./tools');

const socket = new net.Socket();

const queue = new MessageQueue();

const operations = {
    '/dialogue': async data => {
        const address = parseAddresses(data)[ 0 ];
        if (address) await queue.startDialogue(address);
    },
    '/leave': () => queue.leaveDialogue(),
    '/viewUnread': async (data) => {
        const address = parseAddresses(data)[ 0 ];
        if (address) await queue.showOldCache(address);
    },
};

const executeCommand = async (data, login) => {
    const command = data.substring(0, data.indexOf(' ')) || data;
    const operation = operations[ command ];
    if (operation) return await operation(data, login);
};


const onConnect = async() => {
    const login = await rl.getLogin();
    socket.write(login);
    const password = await rl.getPassword();
    socket.write(password);
    queue.initialize(login);
    rl.on('line', async line => {
        if (line.startsWith('/')) return await executeCommand(line, login);
        const message = createMsg(login, queue.colocutor, line);
        return socket.write(message);
    });
};

const onData = data => queue.add(data.toString());

const onError = err => {
    console.log('Socket error: ', err);
    rl.close();
    socket.end();
};

const onEnd = async() => {
    console.log('Connection ended');
    rl.close();
    socket.end();
    return await queue.saveCache();
};

const events = {
    'connect': async() => await onConnect(),
    'data': data => onData(data),
    'error': err => onError(err),
    'end': () => onEnd(),
};

const addListeners = () => {
    for (const event in events) {
        const listener = events[ event ];
        socket.on(event, listener);
    }
};

addListeners();

socket.connect({
    port: 2000,
    host: '127.0.0.1',
});
