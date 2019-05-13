'use strict';

const COLORS = [
  /* 1 */ 'black',
  /* 2 */ 'red',
  /* 3 */ 'green',
  /* 4 */ 'yellow',
  /* 5 */ 'blue',
  /* 6 */ 'magenta',
  /* 7 */ 'cyan',
  /* 8 */ 'white'
];

const colorer = (s, color) => `\x1b[3${color}m${s}\x1b[0m`;

const randomColorer = message => {
	const color = Math.floor(Math.random() * (COLORS.length - 1));
	return colorer(message, color)
};

module.exports = randomColorer;