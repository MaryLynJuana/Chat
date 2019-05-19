'use strict'

const parseAddresses = data => {
  const words = data.split(' ');
  const usernames = words.filter(word => word.startsWith('@'));
  return usernames;
};

const findByField = (arr, field, value) => {
  for (const el of arr) {
    if (el[ field ] === value) return el;
  }
};

const getByValue = (map, searchValue) => {
  for (const [ key, value ] of map.entries()) {
    if (value === searchValue) return key;
  }
};

const curry = fn => {
  const curried = (...args) => (
    (fn.length > args.length) ?
      curry(fn.bind(null, ...args)) : fn(...args)
  );
  return curried;
};

const mutableStream = stream => {
  const mutable = {
    muted: false,
    mute() {
      this.muted = true;
    },
    unmute() {
      this.muted = false;
      stream.write('\n');
    },
    write(chunk, encoding, cb) {
      if (this.muted) return;
      stream.write(chunk, encoding, cb);
    },
  };
  Object.setPrototypeOf(mutable, stream);
  return mutable;
};

module.exports = { parseAddresses, findByField, getByValue, curry, mutableStream };
