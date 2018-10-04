const {assign, keys} = Object;
const pm = (...args) => new Promise(...args);
const toArray = obj => obj ? keys(obj).reduce((arr, key) => arr.concat([obj[key]]), []) : [];
const merge = (source = {}, target = {}) => keys(target)
    .reduce((acc, currentKey) => {
        const obj = target[currentKey];
        const current = acc[currentKey];
        return assign(acc, {[currentKey]: (obj && obj.constructor === Object && current && current.constructor === Object) ? merge(current, obj) : obj});
    }, source);
export {assign, merge, pm, toArray};