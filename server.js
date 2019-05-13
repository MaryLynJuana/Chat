'use strict';

const net = require('net');
const curry = require('./curry.js');
const randomColor = require('./colors.js');

const clients = [];

const writeToAll = (message, sender) => clients.forEach(client => {
	if (client !== sender) client.write(message)
});

const onData = curry(
	(socket, data) => {
	const message = `${socket.username} ${data.toString()}`;
    writeToAll(message, socket);
});

const logIn = curry(
  (socket, login) => {
    socket.username = randomColor(login.toString());
    clients.push(socket);
    socket.write(`Hello from server,  ${socket.username} !`);
    writeToAll(`User connected: ${socket.username}`, socket);
    socket.on('data', onData(socket));
});

const onConnection = socket => {
  socket.setNoDelay(true);
  socket.once('data', logIn(socket));
  socket.on('error', err => {
    console.log('Socket error: ', err)
  });
  socket.on('end', () => {
    const index = clients.indexOf(socket);
    clients.splice(index, 1);
    writeToAll(`User disconnected: ${socket.username}`);
  })
};
const server = net.createServer(onConnection);

server.on('error', err => {
  console.log('Server error: ', err)
});

server.listen(2000);
