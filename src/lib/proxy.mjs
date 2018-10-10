import {option} from './option';
//has available on readwrite and read only, and return only booleaan. that's why is not checked.
const types = {
    '*':         ['get', 'find', 'has', 'getAllKeys'],
    'readwrite': ['get', 'find', 'has', 'getAllKeys', 'put', 'add', 'update', 'delete', 'clear']
};


const checkType = (method, _type) => {
    const type = types[_type] || types['*'];
    return type.indexOf(method) !== -1;
};
const isMethod = (instance, method) => !!instance[method];

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
    get(_, method) {
        return option()
        //For some reasons in Proxy true promises, is called method then. To avoid fail in promises, this hack will help.
            .or(!isMethod(instance, method), () => undefined)
            .or(checkType(method, type), () => response(_, method, success, error))
            .finally(() => errorAccess(method))
    }
});

export {proxy};