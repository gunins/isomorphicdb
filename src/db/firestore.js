import {merge, pm, toArray} from './dbUtils';
import {option, promiseOption} from '../lib/option';
import {uniqueArray} from '../lib/unique';
import {compose} from '../lib/curry';

const setID = (id = '') => ({
    get() {
        return id.toString().replace(/_/g, '/')
    },
    set() {
        return id.toString().replace(/\//g, '_')
    }
});

const {assign} = Object;
//has available on readwrite and read only, and return only booleaan. that's why is not checked.
const types = {
    '*':         ['get', 'find', 'has', 'getAllKeys'],
    'readwrite': ['get', 'find', 'has', 'getAllKeys', 'put', 'add', 'update', 'delete', 'clear']
};

const checkType = (method, _type) => {
    const type = types[_type] || types['*'];
    return pm((res, rej) => type.indexOf(method) !== -1 ? res() : rej({
        status:  'Error',
        message: 'Method not Allowed, for this transaction type.',
        method
    }))
};
const dataExistError = (keyPath) => Promise.reject(`Key "${keyPath}" already exists in the object store.`);
const getData = snapshot => option().or(snapshot.data, () => snapshot.data()).finally(() => ({}));
const stripSlashes = (path) => (string) => (string || '').replace(path, '').replace(/^\//g, '').split('/').shift();
const setKeyPath = (keyPath = '') => data => uniqueArray(data.map(_ => _.toString()).filter(_ => _.indexOf(keyPath) === 0).map(stripSlashes(keyPath)));

const snapshotToArray = _ => {
    let array = [];
    _.forEach(_ => {
        array.push(_);
    });
    return array;
};
const setKeys = _ => snapshotToArray(_).map(({id}) => setID(id).get());
const setSnapshotData = _ => ({
    data() {
        return snapshotToArray(_).map(_ => _.data());
    }
});

const extractKeys = (keyPath, _) => ({
    data() {
        return compose(setKeyPath(keyPath), setKeys)(_)
    }
});

const response = (execution, method) => execution()
    .then((snapshot) => ({
        status:  'Success',
        data:    getData(snapshot),
        message: 'firetrace transaction finished',
        method
    })).catch((error) => ({
        status:  'Error',
        message: error,
        method
    }));


const updateData = (ref, data) => ref.get().then(_ => ref.set(merge(_.data(), data)));
const applyResult = (execution, method, _type) => checkType(method, _type).then(() => response(execution, method));

const getID = collection => collection().get().then(({size}) => size + 1);

const _collection = Symbol('_collection');
const _exists = Symbol('_exists');
const _type = Symbol('_type');
const _keyPath = Symbol('_keyPath');
const _getRef = Symbol('_getRef');
const _getKeyPath = Symbol('_getKeyPath');
const _autoIncrement = Symbol('_autoIncrement');

class Action {
    constructor(collection, type, options) {
        const {autoIncrement, keyPath} = assign({autoIncrement: false}, options);
        if (!keyPath) {
            throw error('KeyPath Not defined.')
        }
        this[_keyPath] = keyPath;
        this[_autoIncrement] = autoIncrement;
        this[_collection] = collection;
        this[_type] = type;
    };

    async [_getKeyPath](data) {
        const keyPath = (this[_autoIncrement] ? await getID(this[_collection]) : data[this[_keyPath]]);
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

    [_getRef](keyPath) {
        return option().or(keyPath, () => this[_collection].doc(setID(keyPath).set())).finally(() => this[_collection])
    };

    [_exists](keyPath) {
        return this[_getRef](keyPath).get().then(({exists}) => promiseOption(exists));
    };

    get(keyPath) {
        return applyResult(() => this[_getRef](keyPath).get(), 'get', this[_type]);
    };

    //TODO: need later to alias on _exists function. At the moment this is the current API
    has(keyPath) {
        return this[_getRef](keyPath).get().then(({exists}) => exists);
    };

    //TODO: By concept, this function possibly not required. Possibly will remove.
    find(field, value) {
        return applyResult(() => this[_getRef]().where(field, '==', value).get().then(_ => setSnapshotData(_)), 'find', this[_type]);

    };

    getAllKeys(keyPath) {
        return applyResult(() => this[_getRef]().get().then(_ => extractKeys(keyPath, _)), 'getAllKeys', this[_type]);
    };

    async put(obj) {
        const {keyPath, data} = await
            this[_getKeyPath](obj);
        return applyResult(() => this[_getRef](keyPath).set(data), 'put', this[_type]);
    };

    async add(obj) {
        const {keyPath, data} = await this[_getKeyPath](obj);
        return applyResult(() => this[_exists](keyPath)
                .then(() => dataExistError(keyPath))
                .catch(() => this[_getRef](keyPath).set(data)),
            'add',
            this[_type]);

    };

    update(keyPath, data, force = false) {
        const ref = this[_getRef](keyPath);
        return applyResult(() => option().or(force, () => ref.set(data)).finally(() => updateData(ref, data)), 'update', this[_type]);

    };

    delete(keyPath) {
        return applyResult(() => this[_getRef](keyPath).delete(), 'delete', this[_type]);
    };

}

const transaction = (db, options = {}) => type => new Action(db, type, options);
const db = (name, version, firestore) => ({
    createObjectStore: async (obj, options) => transaction(firestore.collection(`/${name}/${version}/${obj}`), options)
});

export default db
