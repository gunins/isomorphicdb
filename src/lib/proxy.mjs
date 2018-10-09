import {option} from './option';
//has available on readwrite and read only, and return only booleaan. that's why is not checked.
const types = {
    '*':         ['get', 'find', 'has', 'getAllKeys'],
    'readwrite': ['get', 'find', 'has', 'getAllKeys', 'put', 'add', 'update', 'delete', 'clear']
};
const constructorTypes = ['then'];


const checkType = (method, _type) => {
    const type = types[_type] || types['*'];
    return type.indexOf(method)!==-1;
};
const checkConstructorTypes = method => constructorTypes.indexOf(method)!==-1;

const errorAccess = (method) => () => Promise.reject({
    status:  'Error',
    message: 'Method not Allowed, for this transaction type.',
    method
});

const response = (instance, method, success, error) => (...args) => instance[method](...args)
    .then(_ => option()
        .or(method === 'has', () => _)
        .finally(() => success(method, _)))
    .catch(_ => error(method, _));

const proxy = (instance, {type, success, error}) => new Proxy(instance, {
    get(obj, method) {
        return option()
            .or(checkConstructorTypes(method), () => obj)
            .or(checkType(method, type), () => response(instance, method, success, error))
            .finally(() => errorAccess(method))
    }
});

export {proxy};