

const net = require('net');
const { parseAddresses, getByValue, curry } = require('./tools');
const randomColor = require('./colors');
const db = require('./database');
const { createMsg } = require('./queue');

const systemMsg = createMsg.bind(null, 'server');

const clients = new Map();

const writeToAll = (message, sender) => {
    clients.forEach(client => {
        if (client !== sender) client.write(message);
    });
};

const saveUnreadMsg = async message => {
    const messages = await db.chooseCollection('messages');
    await messages.setItem({ ...message, read: false });
};

const sendMessage = async message => {
    const client = clients.get(message.receiver);
    return client ? client.write(JSON.stringify(message)) :
        await saveUnreadMsg(message);
};

const sendAddressed = async message => {
    const addresses = parseAddresses(message.text);
    addresses.forEach(async address => {
        message.receiver = address;
        await sendMessage(message);
    });
};

const processMessage = curry(async(socket, data) => {
    const message = JSON.parse(data.toString());
    const { text, receiver } = message;
    message.text = socket.username + ' ' + text;
    if (text.includes('@')) return await sendAddressed(message);
    return receiver === 'everybody' ?
        writeToAll(JSON.stringify(message), socket) :
        await sendMessage(message);
});

const signIn = (user, password) => password === user.password;

const signUp = async(name, password) => {
    const user = { name, password };
    const users = await db.chooseCollection('users');
    await users.setItem(user);
    console.log('New user: ', name);
    return true;
};

const enterChatRoom = (login, socket) => {
    socket.username = randomColor(login);
    clients.set(`${login}`, socket);
    socket.write(
        systemMsg(login, `Hello from server, ${socket.username} !`));
    writeToAll(systemMsg(
        'everybody', `User connected: ${socket.username}`), socket);
    socket.on('data', processMessage(socket));
};

const logIn = curry(async(socket, loginBuffer) => {
    const login = loginBuffer.toString();
    const users = await db.chooseCollection('users');
    const user = await users.getItem({ 'name': login });
    socket.once('data', passwdBuffer => {
        const password = passwdBuffer.toString();
        const access = user ?
            signIn(user, password) : signUp(login, password);
        return access ?
            enterChatRoom(login, socket) : socket.end(systemMsg(
                'unregistered', 'Failed  to access'));
    });
});

const leaveChatRoom = socket => {
    const address = getByValue(clients, socket);
    if (!address) return;
    clients.delete(address);
    writeToAll(
        systemMsg('everybody', `User disconnected: ${socket.username}`));
};

const onConnection = socket => {
    socket.setNoDelay(true);
    socket.once('data', logIn(socket));
    socket.on('error', err => {
        console.log('Socket error: ', err);
    });
    socket.on('end', () => leaveChatRoom(socket));
};
const server = net.createServer(onConnection);

server.on('error', err => {
    console.log('Server error: ', err);
});

server.listen(2000);
