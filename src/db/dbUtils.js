const {assign, keys} = Object;
const pm = (...args) => new Promise(...args);
const toArray = obj => obj ? keys(obj).reduce((arr, key) => arr.concat([obj[key]]), []) : [];
const merge = (source = {}, target = {}) => keys(target)
    .reduce((acc, currentKey) => {
        const obj = target[currentKey];
        const current = acc[currentKey];
        return assign(acc, {[currentKey]: (obj && obj.constructor === Object && current && current.constructor === Object) ? merge(current, obj) : obj});
    }, source);

const loopToArray = _ => {
    let array = [];
    _.forEach(_ => {
        array.push(_);
    });
    return array;
};

const wrapToObject = key => _ => ({
    [key]() {
        return _
    }
});
export {assign, merge, pm, toArray, loopToArray, wrapToObject};