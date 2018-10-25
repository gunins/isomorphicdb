const {assign} = Object;
const pipe = (fn, ...fns) => (param, ...staticArgs) => fns.reduce((acc, f) => f(acc), fn(param, ...staticArgs));
const compose = (...fns) => pipe(...fns.reverse());
const pipeAsync = (fn, ...fns) => (param, ...staticArgs) => fns.reduce((acc, f) => acc.then(_ => f(_, ...staticArgs)), fn(param, ...staticArgs));
const composeAsync = (...fns) => pipeAsync(...fns.reverse());
const apply = (...fns) => (...args) => fns.map(fn => fn(...args));
const curry = (fn, ...args) => (fn.length <= args.length) ? fn(...args) : (...more) => curry(fn, ...args, ...more);
const match = (guard) => (left = _ => _, right = _ => _) => (...args) => (..._) => guard(...args) ? right(..._, ...args) : left(..._, ...args);
const extract = (_) => (...methods) => methods.reduce((acc, method) => assign(acc, {[method]: (...args) => _[method](...args)}), {});


export {pipe, compose, curry, apply, match, extract, composeAsync, pipeAsync}
