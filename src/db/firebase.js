import {merge, pm, toArray} from './dbUtils';

const {assign, keys} = Object;
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

const useTransaction = (ref, update, method) => pm((res, rej) => ref.transaction(update,
    (error, committed, snapshot) => {
        if (error) {
            rej({
                status:  'Error',
                message: error,
                method
            });
        } else if (!committed) {
            rej({
                status:  'Error',
                message: 'Key already exists in the object store.',
                method
            });
        } else {
            res({
                status:  'Success',
                data:    snapshot.val(),
                message: 'firebase transaction finished',
                method
            })
        }
    }));

const noTransaction = (ref, update, method) => pm((res, rej) => update(ref)
    .then(data => res({
        status: 'Success',
        data,
        method
    }))
    .catch(message => rej({
        status: 'Error',
        message,
        method
    })));

const applyResult = (ref, update, method, _type) => checkType(method, _type).then(() => ['get', 'getAllKeys', 'delete', 'find', 'clear'].indexOf(method) === -1 ? useTransaction(ref, update, method) : noTransaction(ref, update, method));

const _ref = Symbol('_ref');
const _setTransaction = Symbol('_setTransaction');
const _exists = Symbol('_exists');
const _type = Symbol('_type');
const _keyPath = Symbol('_keyPath');
const _getRef = Symbol('_getRef');
const _getKeyPath = Symbol('_getKeyPath');
const _autoIncrement = Symbol('_autoIncrement');

class Action {
    constructor(ref, type, options) {
        const {autoIncrement, keyPath} = assign({autoIncrement: false}, options);
        if (!keyPath) {
            throw error('KeyPath Not defined.')
        }
        this[_keyPath] = keyPath;
        this[_autoIncrement] = autoIncrement;
        this[_ref] = ref;
        this[_type] = type;
    };


    [_setTransaction](ref) {
        return ref.once('value').then(snapshot => snapshot.val());
    };

    [_exists](ref) {
        return ref.once('value').then(snapshot => snapshot.exists());
    };

    [_getKeyPath](data) {
        const keyPath = (this[_autoIncrement]) ? this[_ref].push().key : data[this[_keyPath]];
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
        return !keyPath ? this[_ref] : this[_ref].child(keyPath)
    };

    get(keyPath) {
        return applyResult(this[_getRef](keyPath), ref => this[_setTransaction](ref), 'get', this[_type]);
    };

    has(keyPath) {
        return this[_exists](this[_getRef](keyPath));
    };

    //TODO: By concept, this function possibly not required. Possibly will remove.
    find(field, value) {
        return applyResult(this[_ref].orderByChild(field).equalTo(value), ref => this[_setTransaction](ref).then(resp => toArray(resp)), 'find', this[_type]);
    };

    getAllKeys(keyPath) {
        return applyResult(this[_getRef](keyPath), ref => this[_setTransaction](ref).then(resp => keys(resp || {})), 'getAllKeys', this[_type]);
    };

    put(obj) {
        const {keyPath, data} = this[_getKeyPath](obj);
        return applyResult(this[_getRef](keyPath), () => data, 'put', this[_type]);
    };

    add(obj) {
        const {keyPath, data} = this[_getKeyPath](obj);
        return applyResult(this[_getRef](keyPath), (currentData) => (currentData === null) ? data : undefined, 'add', this[_type]);

    };

    update(keyPath, data, force = false) {
        return applyResult(this[_getRef](keyPath), currentData => (currentData === null || force) ? data : merge(currentData, data), 'update', this[_type]);

    };

    delete(keyPath) {
        return applyResult(this[_getRef](keyPath), ref => ref.remove(), 'delete', this[_type]);
    };

    //TODO: maybe too dangerous, need to remove.
    clear() {
        return applyResult(this[_ref], ref => ref.remove(), 'clear', this[_type]);

    }
}

const transaction = (db, options = {}) => type => new Action(db, type, options),
    db = (name, version, firebaseDatabase) => ({
        createObjectStore: (obj, options) => pm((res, rej) => res(transaction(firebaseDatabase.ref(`/${name}/${version}/${obj}`), options)))
    });

export default db
