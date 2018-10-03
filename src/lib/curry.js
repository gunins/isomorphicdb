const {assign} = Object;
const pipe = (fn, ...fns) => (...args) => fns.reduce((acc, f) => f(acc), fn(...args));
const compose = (...fns) => pipe(...fns.reverse());
const pipeP = (fn, ...fns) => (...args) => fns.reduce((acc, f) => acc.then(_ => f(_)), fn(...args));
const composeP = (...fns) => pipeP(...fns.reverse());
const apply = (...fns) => (...args) => fns.map(fn => fn(...args));
const curry = (fn, ...args) => (fn.length <= args.length) ? fn(...args) : (...more) => curry(fn, ...args, ...more);
const match = (guard) => (left = _ => _, right = _ => _) => (...args) => (..._) => guard(...args) ? right(..._, ...args) : left(..._, ...args);
const extract = (_) => (...methods) => methods.reduce((acc, method) => assign(acc, {[method]: (...args) => _[method](...args)}), {});


export {pipe, compose, curry, apply, match, extract, composeP, pipeP}