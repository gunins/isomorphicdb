import {lensPath, view} from '../lib/lenses';
import {option} from '../lib/option';

const constructorLens = view(lensPath('constructor'));
const eql = compareFunction => (...args) => args.every(_ => compareFunction(_));
const isObjects = eql(_ => constructorLens(_) === Object);
const {assign, keys} = Object;

const pm = _ => new Promise(_);
const toArray = obj => keys(obj || {}).reduce((arr, key) => arr.concat([obj[key]]), []);

const merge = (source = {}, target = {}) => keys(target)
    .reduce((acc, currentKey) => {
        const obj = target[currentKey];
        const current = acc[currentKey];
        return assign(acc, {
            [currentKey]: option()
                              .or(isObjects(obj, current), () => merge(current, obj))
                              .finally(() => obj)
        });
    }, source);

const loopToArray = _ => {
    let array = [];
    _.forEach(_ => {
        array.push(_);
    });
    return array;
};

const wrapToObject = key => _ => ({
    [key]: () => _
});
export {assign, merge, pm, toArray, loopToArray, wrapToObject};