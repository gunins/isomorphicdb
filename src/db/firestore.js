import {merge, loopToArray, wrapToObject} from './dbUtils';
import {option, promiseOption} from '../lib/option';
import {uniqueArray} from '../lib/unique';
import {compose, curry, composeP} from '../lib/curry';
import {proxy} from '../lib/proxy';

const setID = (id = '') => ({
    get() {
        return id.toString().replace(/_/g, '/')
    },
    set() {
        return id.toString().replace(/\//g, '_')
    }
});

const setRef = collection => keyPath => {
    const ref = option().or(keyPath, () => collection.doc(setID(keyPath).set())).finally(() => collection);
    return ({
        get() {
            return ref.get()
        },
        set(data) {
            return ref.set(data)
        },
        where(...args) {
            return ref.where(...args)
        },
        delete() {
            return ref.delete()
        }
    });
}


const {assign} = Object;


const dataExistError = (keyPath) => Promise.reject(`Key "${keyPath}" already exists in the object store.`);
const getData = snapshot => option().or(snapshot.data, () => snapshot.data()).finally(() => ({}));
const stripSlashes = (path) => (string) => (string || '').replace(path, '').replace(/^\//g, '').split('/').shift();
const setKeyPath = (keyPath = '') => data => uniqueArray(data.map(_ => _.toString()).filter(_ => _.indexOf(keyPath) === 0).map(stripSlashes(keyPath)));

const setKeys = _ => loopToArray(_).map(({id}) => setID(id).get());

const toData = wrapToObject('data');
const extractKeys = (keyPath, _) => compose(toData, setKeyPath(keyPath), setKeys)(_);
const setSnapshotData = _ => compose(toData, _ => _.map(_ => _.data()), loopToArray)(_);

const getID = collection => collection().get().then(({size}) => size + 1);
const setPath = (autoIncrement, collection, path) => async data => await option().or(autoIncrement, () => getID(collection)).finally(async () => data[path]);

const _exists = Symbol('_exists');
const _keyPath = Symbol('_keyPath');
const _path = Symbol('_path');
const _getRef = Symbol('_getRef');
const _getKeyPath = Symbol('_getKeyPath');

class Action {
    constructor(collection, type, options) {
        const {autoIncrement, keyPath} = assign({autoIncrement: false}, options);
        if (!keyPath) {
            throw error('KeyPath Not defined.')
        }
        this[_keyPath] = keyPath;
        this[_path] = setPath(autoIncrement, collection, keyPath);
        this[_getRef] = setRef(collection);
    };

    async [_getKeyPath](data) {
        const keyPath = await this[_path](data);
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


    [_exists](keyPath) {
        return this[_getRef](keyPath).get().then(({exists}) => promiseOption(exists));
    };

    get(keyPath) {
        return this[_getRef](keyPath).get();
    };

    //TODO: need later to alias on _exists function. At the moment this is the current API
    has(keyPath) {
        return this[_getRef](keyPath).get().then(({exists}) => exists);
    };

    //TODO: By concept, this function possibly not required. Possibly will remove.
    find(field, value) {
        return this[_getRef]().where(field, '==', value).get().then(_ => setSnapshotData(_));

    };

    getAllKeys(keyPath) {
        return this[_getRef]().get().then(_ => extractKeys(keyPath, _));
    };

    put(obj) {
        const execution = ({keyPath, data}) => this[_getRef](keyPath).set(data);
        return this[_getKeyPath](obj).then(_ => execution(_));
    };

    add(obj) {
        const execution = ({keyPath, data}) => this[_exists](keyPath)
            .then(() => dataExistError(keyPath))
            .catch(() => this[_getRef](keyPath).set(data));
        return this[_getKeyPath](obj).then(_ => execution(_));


    };

    update(keyPath, data, force = false) {
        const {get, set} = this[_getRef](keyPath);
        return option().or(force, () => set(data)).finally(() => composeP(set, async _ => merge(_.data(), data), get)());
    };

    delete(keyPath) {
        return this[_getRef](keyPath).delete();
    };

}

const errorResponse = (error, method) => ({
    status:  'Error',
    message: error,
    method
});

const successResponse = (method, _) => ({
    status:  'Success',
    data:    getData(_),
    message: 'firetrace transaction finished',
    method
});


const transaction = (db, options = {}) => type => proxy(new Action(db, type, options), type, successResponse, errorResponse);

const getCollection = curry((firestore, name, version, obj) => firestore.collection(`/${name}/${version}/${obj}`));
const db = (name, version, firestore) => ({
    createObjectStore: (obj, options) => transaction(getCollection(firestore)(name, version, obj), options)
});

export default db
