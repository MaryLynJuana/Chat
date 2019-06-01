

const parseAddresses = data => {
    const words = data.split(' ');
    const usernames = words
        .filter(word => word.startsWith('@'))
        .map(word => word.substring(1));
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
        fn.length > args.length ?
            curry(fn.bind(null, ...args)) : fn(...args)
    );
    return curried;
};

module.exports = { parseAddresses, findByField, getByValue, curry };
