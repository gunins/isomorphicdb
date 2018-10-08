import {merge, pm, toArray} from './dbUtils';
import {option} from '../lib/option';
import {proxy} from '../lib/proxy';

const {assign, keys} = Object;


const useTransaction = ref => update => ref
    .transaction(_ => update(_),
        (error, committed, snapshot) => pm((res, rej) => option()
            .or(error, () => rej(error))
            .or(!committed, () => rej('Key already exists in the object store.'))
            .finally(() => res(snapshot.val()))));

const setPath = (autoIncrement, ref, keyPath) => (data) => option().or((autoIncrement), () => ref.push().key).finally(() => data[keyPath]);


const setRef = (ref) => keyPath => option().or(!keyPath, () => ref)
    .finally(() => ref.child(keyPath));

const getData = ref => ref.once('value');

const _ref = Symbol('_ref');
const _keyPath = Symbol('_keyPath');
const _getKeyPath = Symbol('_getKeyPath');
const _path = Symbol('_path');


class DBDriver {
    constructor(ref, options) {
        const {autoIncrement, keyPath} = assign({autoIncrement: false}, options);
        if (!keyPath) {
            throw error('KeyPath Not defined.')
        }
        this[_keyPath] = keyPath;
        this[_path] = setPath(autoIncrement, ref, keyPath);
        this[_ref] = setRef(ref);
    };

    [_getKeyPath](data) {
        const keyPath = this[_path](data);
        if (!keyPath) {
            return Promise.reject({
                status:  'Error',
                message: 'KeyPath not exists.'
            });
        }

        return {
            keyPath,
            data: assign({[this[_keyPath]]: keyPath}, data)
        }
    };


    get(keyPath) {
        const ref = this[_ref](keyPath);
        return getData(ref).then(snapshot => snapshot.val());
    };

    has(keyPath) {
        const ref = this[_ref](keyPath);
        return getData(ref).then(snapshot => snapshot.exists());
    };

    //TODO: By concept, this function possibly not required. Possibly will remove.
    find(field, value) {
        const ref = this[_ref]().orderByChild(field).equalTo(value);
        return getData(ref).then(snapshot => toArray(snapshot.val()));
    };

    getAllKeys(keyPath) {
        const ref = this[_ref](keyPath);
        return getData(ref).then(snapshot => keys(snapshot.val() || {}));
    };

    put(obj) {
        const {keyPath, data} = this[_getKeyPath](obj);
        const ref = this[_ref](keyPath);
        return useTransaction(ref)(() => data);
    };

    add(obj) {
        const {keyPath, data} = this[_getKeyPath](obj);
        const ref = this[_ref](keyPath);
        return useTransaction(ref)(currentData => option()
            .or(currentData === null, () => data)
            .finally(() => undefined));

    };

    update(keyPath, data, force = false) {
        const ref = this[_ref](keyPath);
        return useTransaction(ref)(currentData => option()
            .or((currentData === null || force), () => data)
            .finally(() => merge(currentData, data)));

    };

    delete(keyPath) {
        const ref = this[_ref](keyPath);
        return ref.remove();
    };

    //TODO: maybe too dangerous, need to remove.
    clear() {
        const ref = this[_ref]();
        return ref.remove();

    }
}

const dbDriver = (...args) => new DBDriver(...args);

const error = (method, message) => ({
    status: 'Error',
    message,
    method
});

const success = (method, data) => ({
    status:  'Success',
    data,
    message: 'firebase transaction finished',
    method
});

const transaction = (db, options = {}) => type => proxy(dbDriver(db, options), {
    type,
    success,
    error
});

const getReference = (firebaseDatabase) => (name, version, obj) => firebaseDatabase.ref(`/${name}/${version}/${obj}`);
const db = (name, version, firebaseDatabase) => ({
    createObjectStore: (obj, options) => transaction(getReference(firebaseDatabase)(name, version, obj), options)
});

export default db
