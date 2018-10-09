import config from './config';
import {lensPath, view} from '../../src/lib/lenses';

const dbCollection = view(lensPath('db', 'collection'))(config);
const keyPath = view(lensPath('db', 'keyPath'))(config);

export default async connector => {
    const {put, get, getAllKeys} = await connector.createObjectStore(dbCollection, {keyPath}).then(_ => _('readwrite'));
    return ({
        async addBatch(batch) {
            return Promise.all(batch.map(_ => put(_)));
        },
        readKeys() {
            return getAllKeys();
        },
        readRecord(keyPath) {
            return get(keyPath);
        }
    })
}