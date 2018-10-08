import {merge, pm} from './dbUtils';
import {uniqueArray} from '../lib/unique';
import {lensPath, view} from '../lib/lenses';
import {option} from '../lib/option';
import {isObject} from '../lib/isObject';

const {assign} = Object;

const openDB = (indexedDB, name, version, options) => pm((res, rej) => assign(indexedDB.open(name, version),
    {
        onupgradeneeded(event) {
            const db = resultLens(event);
            const {objectStoreNames} = db;
            if (!objectStoreNames.contains(name)) {
                db.createObjectStore(name, options);
            }
        },
        onsuccess(_) {
            res(_)
        },
        onerror(error) {
            rej(error)
        }
    }));


const stripSlashes = (path) => (string) => (string || '').replace(path, '').replace(/^\//g, '').split('/').shift();
const setKeyPath = (keyPath = '', data) => uniqueArray(data.map(_ => _.toString()).filter(_ => _.indexOf(keyPath) === 0).map(stripSlashes(keyPath)));

const dataLens = view(lensPath('result'));

const applyResult = (objectStore) => pm((res, rej) => assign(
    objectStore,
    {
        onsuccess(event) {
            res({
                status:  'Success',
                data:    dataLens(objectStore),
                event:   event,
                message: 'indexedDB transaction finished',
            })
        },
        onerror(event) {
            rej({
                status:  'Error',
                event:   event,
                message: 'Error while stored data',
            })
        }
    }));

const _ref = Symbol('_ref');

const setRef = (db, name, type) => () => new Proxy(db.transaction(name, type).objectStore(name), {
    get(instance, method) {
        return (...args) => applyResult(instance[method](...args))
    }
});

class DBDriver {
    constructor(db, name, type) {
        this[_ref] = setRef(db, name, type);
    };

    getAllKeys(keyPath) {
        return this[_ref]().getAllKeys().then(_ => assign(_, {data: setKeyPath(keyPath, _.data)}));
    };

    get(keyPath) {
        return this[_ref]().get(keyPath);
    };

    has(keyPath) {
        return this[_ref]().get(keyPath).then(({data}) => !!data);
    };


    put(data) {
        return this[_ref]().put(data);
    };


    add(data) {
        return this[_ref]().add(data);
    };

    update(keyPath, data, force) {
        return this.get(keyPath)
            .then(_ => option()
                .or(_.data && !force, () => merge(_.data, data))
                .finally(() => data))
            .then(merged => this[_ref]().put(merged));
    };

    delete(keyPath) {
        return this[_ref]().delete(keyPath);
    };

    //TODO: maybe too dangerous, need to remove.
    clear() {
        return this[_ref]().clear();
    }
}

const dbDriver = (...args) => new DBDriver(...args);
const transaction = (name, db) => (type) => new Proxy(dbDriver(db, name, type), {
    get(instance, method) {
        return (...args) => instance[method](...args)
            .then(_ => option()
                .or(isObject(_), () => assign(_, {method}))
                .finally(() => _))
    }
});


const resultLens = view(lensPath('target', 'result'));
const db = (name, version, indexedDB) => ({
    createObjectStore: (name, options) => openDB(indexedDB, name, version, options).then(_ => transaction(name, resultLens(_)))
});

export default db;
