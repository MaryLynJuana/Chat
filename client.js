'use strict';

const net = require('tls');
const rl = require('./rl');
const fs = require('fs');
const MessageQueue = require('./queue');
const { createMsg } = MessageQueue;
const { parseAddress } = require('./tools');


const options = {
  ca: [ fs.readFileSync('./cert/server-cert.pem') ]
};

const socket = net.connect(2000, options);

const queue = new MessageQueue();

const operations = {
  '/dialogue': async data => {
    const address = parseAddress(data);
    if (address) await queue.startDialogue(address);
  },
  '/leave': () => queue.leaveDialogue(),
  '/viewUnread': async data => {
    const address = parseAddress(data);
    if (address) await queue.showOldCache(address);
  },
};

const executeCommand = async data => {
  const command = data.substring(0, data.indexOf(' ')) || data;
  const operation = operations[ command ];
  if (operation) return await operation(data);
};


const onConnect = async () => {
  const login = await rl.getLogin();
  socket.write(login);
  const password = await rl.getPassword();
  socket.write(password);
  rl.on('line', async line => {
    if (line.startsWith('/')) return await executeCommand(line);
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

const saveCache = () => {
  for (const address in queue.waiting) {
    const cache = queue.waiting[ address ];
    for (const msg of cache) socket.write(JSON.stringify(msg));
  }
};

rl.on('SIGINT', () => {
  saveCache();
  rl.close();
  process.exit(0);
});

const onEnd = () => {
  console.log('Connection ended');
  rl.close();
};

const events = {
  'connect': async () => await onConnect(),
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

