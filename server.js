

const net = require('tls');
const fs = require('fs');
const { getByValue, curry } = require('./tools');
const DatabaseInterface = require('./mongo');
const db = new DatabaseInterface('chat');

const options = {
  key: fs.readFileSync('./cert/server-key.pem'),
  cert: fs.readFileSync('./cert/server-cert.pem')
};

const clients = new Map();

const writeToAll = (message, sender) => {
  clients.forEach(client => {
    if (client !== sender) client.write(message);
  });
};

const save = async msg => {
  const { sender, receiver, text, date, sent, read } = msg;
  if (sent && !read) return;
  const messages = await db.chooseCollection('messages');
  if (!read) return await messages.setItem(msg);
  const query = { sender, receiver, text, date };
  await messages.setValue(query, 'read', true);
};

const sendMessage = async message => {
  if (message.sent) return;
  const client = clients.get(message.receiver);
  if (!client) return;
  client.write(JSON.stringify(message));
};

const processMessage = curry(async (socket, message) => {
  const { receiver } = message;
  if (receiver !== 'everybody') await save(message);
  receiver === 'everybody' ?
    writeToAll(JSON.stringify(message), socket) :
    await sendMessage(message);
});

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
  unread.forEach(msg => socket.write(JSON.stringify(msg)));
};

const enterChatRoom = async (login, socket) => {
  clients.set(`${login}`, socket);
  socket.write(`Hello from server, ${login} !`);
  writeToAll(`User connected: ${login}`, socket);
  await resendUnread(login, socket);
};

const logIn = curry(async (socket, data) => {
  const { login, password } = data;
  const users = await db.chooseCollection('users');
  const user = await users.getItem({ 'name': login });
  const access = user ?
    signIn(user, password) : signUp(login, password);
  access ? await enterChatRoom(login, socket) :
    socket.end('Failed  to access');
});

const leaveChatRoom = socket => {
  const address = getByValue(clients, socket);
  if (!address) return;
  clients.delete(address);
  writeToAll(`User disconnected: ${address}`);
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
const server = net.createServer(options, onConnection);

server.on('error', err => {
  console.log('Server error: ', err);
});

server.listen(2000);
