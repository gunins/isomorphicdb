const isObject = (val) => val != null && typeof val === 'object' && Array.isArray(val) === false;

export {isObject}