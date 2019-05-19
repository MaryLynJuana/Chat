'use strict';

const net = require('net');
const readline = require('readline');
const { mutableStream } = require('./tools');
const { promisify } = require('util');

const rl = readline.createInterface({
  input: process.stdin,
  output: mutableStream(process.stdout),
});

rl.question[promisify.custom] = question => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

const question = promisify(rl.question);

const socket = new net.Socket();

const events = {
  'connect': async () => await onConnect(),
  'data': data => onData(data),
  'error': err => onError(err),
  'end': () => onEnd(),
};

const onConnect = async () => {
  const username = await question('Enter your username: ');
  if (!username) return onConnect();
  socket.write(username);
  rl.output.write('Enter your password: ');
  rl.output.mute();
  const password = await question('');
  rl.output.unmute();
  socket.write(password);
  rl.on('line', line => socket.write(line));
};

const onData = data => {
  console.log('📨:', data.toString());
};

const onError = err => {
  console.log('Socket error: ', err);
  rl.close();
  socket.end();
};

const onEnd =  () => {
  console.log('Connection ended');
  rl.close();
  socket.end();
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
