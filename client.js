

const net = require('tls');
const rl = require('./rl');
const fs = require('fs');
const randomColorer = require('./colors');
const MessageQueue = require('./queue');
const { createMsg } = MessageQueue;
const { parseAddress } = require('./tools');


const options = {
  ca: [ fs.readFileSync('./cert/server-cert.pem') ]
};

const socket = net.connect(2000, options);

const queue = new MessageQueue(socket);

const operations = {
  '/dialogue': async data => {
    const address = parseAddress(data);
    if (address) await queue.startDialogue(address);
  },
  '/leave': () => queue.leaveDialogue(),
};

const executeCommand = async data => {
  const command = data.substring(0, data.indexOf(' ')) || data;
  const operation = operations[ command ];
  if (operation) return await operation(data);
};

const processLine = async (line, login) => {
  const username = randomColorer(login);
  if (line.startsWith('/')) return await executeCommand(line);
  const text = username + ' ' + line;
  const message = createMsg(login, queue.colocutor, text);
  return socket.write(message);
};

const onConnect = async () => {
  const login = await rl.getLogin();
  const password = await rl.getPassword();
  socket.write(JSON.stringify({ type: 'login', login, password }));
  queue.initialize(login);
  rl.on('line', async line => processLine(line, login));
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

