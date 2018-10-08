import {merge, pm} from './dbUtils';
import {uniqueArray} from '../lib/unique';
import {lensPath, view} from '../lib/lenses';
import {option} from '../lib/option';
import {isObject} from '../lib/isObject';

const {assign} = Object;

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

const _db = Symbol('_ref');
const _name = Symbol('_name');
const _type = Symbol('_type');
const _setTransaction = Symbol('_setTransaction');


class DBDriver {
    constructor(db, name, type) {
        this[_name] = name;
        this[_db] = db;
        this[_type] = type;
    };

    [_setTransaction]() {
        return this[_db].transaction(this[_name], this[_type]).objectStore(this[_name]);
    };

    getAllKeys(keyPath) {
        return applyResult(this[_setTransaction]().getAllKeys()).then(_ => assign(_, {data: setKeyPath(keyPath, _.data)}));
    };

    get(keyPath) {
        return applyResult(this[_setTransaction]().get(keyPath))
    };

    has(keyPath) {
        return applyResult(this[_setTransaction]().get(keyPath)).then(({data}) => !!data);
    };


    put(data) {
        return applyResult(this[_setTransaction]().put(data));
    };


    add(data) {
        return applyResult(this[_setTransaction]().add(data));
    };

    async update(keyPath, data, force) {
        const result = await this.get(keyPath);
        const newVar = result.data && !force ? merge(result.data, data) : data;
        return applyResult(this[_setTransaction]().put(newVar));
    };

    delete(keyPath) {
        return applyResult(this[_setTransaction]().delete(keyPath));
    };

    //TODO: maybe too dangerous, need to remove.
    clear() {
        return applyResult(this[_setTransaction]().clear())
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
    createObjectStore: (name, options) => pm((res, rej) => assign(indexedDB.open(name, version),
        {
            onupgradeneeded(event) {
                const db = resultLens(event);
                const {objectStoreNames} = db;
                if (!objectStoreNames.contains(name)) {
                    db.createObjectStore(name, options);
                }
            },
            onsuccess: event => res(transaction(name, resultLens(event))),
            onerror:   event => rej(event)
        }))
});

export default db;
