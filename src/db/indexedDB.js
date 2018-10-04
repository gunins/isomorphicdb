import {merge, pm} from './dbUtils';
import {uniqueArray} from '../lib/unique';

const {assign} = Object;

const stripSlashes = (path) => (string) => (string || '').replace(path, '').replace(/^\//g, '').split('/').shift();
const setKeyPath = (keyPath = '', data) => uniqueArray(data.map(_ => _.toString()).filter(_ => _.indexOf(keyPath) === 0).map(stripSlashes(keyPath)));

const applyResult = (objectStore, method) => new Promise((res, rej) => assign(
    objectStore,
    {
        onsuccess(event) {
            res({
                status: 'Success',
                data:   objectStore.result,
                event:  event,
                message: 'indexedDB transaction finished',
                method
            })
        },
        onerror(event) {
            rej({
                status: 'Error',
                event:  event,
                message: 'Error while stored data',
                method
            })
        }
    }));
const transaction = (name, db) => (type) => new Action(db, name, type);

const _db = Symbol('_ref');
const _name = Symbol('_name');
const _type = Symbol('_type');
const _setTransaction = Symbol('_setTransaction');


class Action {
    constructor(db, name, type) {
        this[_name] = name;
        this[_db] = db;
        this[_type] = type;
    };

    [_setTransaction]() {
        return this[_db].transaction(this[_name], this[_type]).objectStore(this[_name]);
    };

    getAllKeys(keyPath) {
        return applyResult(this[_setTransaction]().getAllKeys(), 'getAllKeys').then(resp => assign(resp, {data: setKeyPath(keyPath, resp.data)}));
    };

    get(keyPath) {
        return applyResult(this[_setTransaction]().get(keyPath), 'get')
    };

    has(keyPath) {
        return applyResult(this[_setTransaction]().get(keyPath), 'has').then(({data}) => !!data);
    };


    put(data) {
        return applyResult(this[_setTransaction]().put(data), 'put');
    };


    add(data) {
        return applyResult(this[_setTransaction]().add(data), 'add');
    };

    async update(keyPath, data, force) {
        const result = await this.get(keyPath);
        const newVar = result.data && !force ? merge(result.data, data) : data;
        return applyResult(this[_setTransaction]().put(newVar), 'update');
    };

    delete(keyPath) {
        return applyResult(this[_setTransaction]().delete(keyPath), 'delete');
    };

    //TODO: maybe too dangerous, need to remove.
    clear() {
        return applyResult(this[_setTransaction]().clear(), 'clear')
    }
}

const db = (name, version, indexedDB) => ({
    createObjectStore: (name, options) => pm((res, rej) => assign(indexedDB.open(name, version),
        {
            onupgradeneeded(event) {
                const db = event.target.result;
                const {objectStoreNames} = db;
                if (!objectStoreNames.contains(name)) {
                    db.createObjectStore(name, options);
                }
            },
            onsuccess: event => res(transaction(name, event.target.result)),
            onerror:   event => rej(event)
        }))
});

export default db;
