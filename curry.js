'use strict'

const curry = fn => {
	const curried = (...args) => (
		(fn.length > args.length) ?
			curry(fn.bind(null, ...args)) : fn(...args)
	);
	return curried
};

module.exports = curry;