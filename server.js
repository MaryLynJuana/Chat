'use strict';

const net = require('net');
const { parseAddresses, getByValue, curry } = require('./tools');
const randomColor = require('./colors');
const Db = require('./filesystem');
const db = new Db('chat');

const clients = new Map();

const writeToAll = (message, sender) =>
  clients.forEach(client => {
    if (client !== sender) client.write(message);
});

const sendMessage = curry((socket, data) => {
  const message = data.toString();
  if (message.includes('@')) {
    const addresses = parseAddresses(message);
    addresses.forEach(address => {
      const client = clients.get(address);
      client.write(`${socket.username} ${message}`);
    });
  } else writeToAll(`${socket.username} ${message}`, socket);
});

const signIn = (user, password) => password === user.password;

const signUp = async (name, password) => {
  const user = { name, password };
  const users = await db.chooseCollection('users');
  await users.setItem(user);
  console.log('New user: ', name);
  return true;
};

const enterChatRoom = (login, socket) => {
  socket.username = randomColor(login);
  clients.set(`@${login}`, socket);
  socket.write(`Hello from server,  ${socket.username} !`);
  writeToAll(`User connected: ${socket.username}`, socket);
  socket.on('data', sendMessage(socket));
};

const logIn = curry(async (socket, loginBuffer) => {
  const login = loginBuffer.toString();
  const users = await db.chooseCollection('users');
  const user = await users.getItem({ 'name': login });
  socket.once('data', passwdBuffer => {
    const password = passwdBuffer.toString();
    const access = user ?
      signIn(user, password) : signUp(login, password);
    return (access) ?
      enterChatRoom(login, socket) : socket.end('Failed  to access');
  });
});

const leaveChatRoom = socket => {
  const address = getByValue(clients, socket);
  if (!address) return;
  clients.delete(address);
  writeToAll(`User disconnected: ${socket.username}`);
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
 