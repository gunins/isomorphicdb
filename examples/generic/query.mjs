import config from './config';
import {lensPath, view} from '../../src/lib/lenses';

const dbCollection = view(lensPath('db', 'collection'))(config);
const keyPath = view(lensPath('db', 'keyPath'))(config);

export default async (driver) => {
    const {put, get, getAllKeys} = await driver.createObjectStore(dbCollection, {keyPath}).then(_=>_('readwrite'));
    // const {put, get, getAllKeys} = db('readwrite');
    return ({
        addUsers(batch) {
            return Promise.all(batch.map(_ => put(_)));
        },
        readIds() {
            return getAllKeys();
        },
        readUser(keyPath) {
            return get(keyPath);
        }
    })
}