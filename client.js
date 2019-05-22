'use strict';

const net = require('net');
const rl = require('./rl');

const socket = new net.Socket();

const events = {
  'connect': async () => await onConnect(),
  'data': data => onData(data),
  'error': err => onError(err),
  'end': () => onEnd(),
};

const onConnect = async () => {
  const username = await rl.getLogin();
  socket.write(username);
  const password = await rl.getPassword();
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
