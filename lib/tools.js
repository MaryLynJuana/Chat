'use strict';

const parseAddress = data => {
  const words = data.split(' ');
  const username = words
    .filter(word => word.startsWith('@'))
    .map(word => word.substring(1))[ 0 ];
  return username;
};

const findByField = (map, field, value) => {
  for (const el of map.values()) {
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
    fn.length > args.length ?
      curry(fn.bind(null, ...args)) : fn(...args)
  );
  return curried;
};

module.exports = { parseAddress, findByField, getByValue, curry };
