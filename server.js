'use strict';

const tls = require('tls');
const fs = require('fs');
const { findByField, getByValue, curry } = require('./lib');
const db = require('./server/database');
const User = require('./server/user');

const options = {
  key: fs.readFileSync('./cert/server-key.pem'),
  cert: fs.readFileSync('./cert/server-cert.pem')
};

const clients = new Map();

const warn = text => ({ type: 'warning', text });

const writeToAll = (message, sender) => {
  message.sender = sender.login;
  clients.forEach(client => {
    const json = JSON.stringify(message);
    if (client !== sender) client.socket.write(json);
  });
};

const disconnect = socket => {
  const failMsg = warn('Failed to access');
  return socket.end(JSON.stringify(failMsg));
};

const processMessage = async (socket, message) => {
  const { receiver, sent } = message;
  const client = clients.get(receiver);
  const sender = findByField(clients, 'socket', socket);
  if (!sender) return disconnect(socket);
  return (receiver === 'everybody' && !sent) ?
    writeToAll(message, sender) :
    await sender.sendMessage(message, client);
};

const signIn = (user, password) => password === user.password;

const signUp = async (name, password) => {
  const user = { name, password };
  const users = await db.chooseCollection('users');
  await users.setItem(user);
  console.log('New user: ', name);
  return true;
};

const resendUnread = async (receiver, socket) => {
  const messages = await db.chooseCollection('messages');
  const unread = await messages.findAll({ receiver, read: false });
  unread.forEach(msg => socket.write(msg));
}

const enterChatRoom = async (login, socket) => {
  const client = new User(login, socket, db);
  clients.set(login, client);
  const hello = warn(`Hello from server, ${login} !`);
  socket.write(JSON.stringify(hello));
  writeToAll(warn(`User connected: ${login}`), client);
  await resendUnread(login, socket);
};

const logIn = curry(async (socket, data) => {
  const { login, password } = data;
  const users = await db.chooseCollection('users');
  const user = await users.getItem({ 'name': login });
  const access = user ?
    signIn(user, password) : signUp(login, password);
  access ? await enterChatRoom(login, socket) :
    disconnect(socket);
});

const leaveChatRoom = socket => {
  const address = getByValue(clients, socket);
  if (!address) return;
  clients.delete(address);
  const note = warn(`User disconnected: ${address}`);
  writeToAll(JSON.stringify(note));
};

const processors = {
  login: logIn,
  message: processMessage,
};

const onData = curry((socket, data) => {
  const message = JSON.parse(data);
  const { type } = message;
  const processor = processors[ type ];
  return processor(socket, message);
});

const onConnection = socket => {
  socket.setNoDelay(true);
  socket.on('data', onData(socket));
  socket.on('error', err => {
    console.log('Socket error: ', err);
  });
  socket.on('end', () => leaveChatRoom(socket));
};
const server = tls.createServer(options, onConnection);

server.on('error', err => {
  console.log('Server error: ', err);
});

server.listen(8000);
