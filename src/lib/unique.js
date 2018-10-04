const {keys} = Object;

const uniqueArray = (...arrays) => arrays.reduce((_, array=[]) => _.concat(array)).sort().filter((item, pos, self) => !pos || item !== self[pos - 1]);

const uniqueProperties = (...objects) => uniqueArray(...objects.map(_ => keys(_ || {})));

export {uniqueProperties, uniqueArray};