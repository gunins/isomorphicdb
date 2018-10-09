import data from './data';
import query from './query';
import driver from '../../src/db/indexedDB';
import {lensPath, view} from '../../src/lib/lenses';
import config from './config';

const dbName = view(lensPath('db', 'name'))(config);
const dbVersion = view(lensPath('db', 'version'))(config);

(async () => {
    const db = driver(dbName, dbVersion, indexedDB);
    const {addUsers, readUser, readIds} = await query(db);
    const updateData = await addUsers(data);
    console.log(updateData);

    const {data: ids} = await readIds();
    console.log(ids);

    ids.forEach((id) => {
        readUser(id).then(({data}) => console.log(data))
    });

})();

