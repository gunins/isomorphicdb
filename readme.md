## Isomorphic DB Adapter

Isomorphic DB adapter is build to using same API with different key/value databases. At the moment supporting indexedDB, Firebase Realtime Database and Firestore

### Key capabilities

Because currently service workers and firebase become more and more popular. Large chunk of logic are same in backkend and frontend. 
Only problem there is different databases are used, with completely different APIs. 
Another problem, is to migrate project form one environment to another. For Example `Firebase Realtime Database` to `FireStore`.
In future there can be more adapters for `MongoDB`, `Redis` etc.

Another advantage to use these adapters , for example, indexedDB API is very complex, there is simple promise `get` and `set` methods.

### Installation

```bash

    npm install isomorphicdb

```

Isomorphic db is written by using es6 experimental modules in nodejs. For `rollup` need to add extensions `.mjs`.

Also need firebase project to setup. In examples, serviceAccountKeys not included. Copy them from firebase console, in `_hidden/serviceAccountKey.mjs` folder.

`serviceAccountKey.mjs` should look like:

```javascript

export default ({
    "type":                        ...,
    "project_id":                  ...,
    "private_key_id":              ...,
    "private_key":                 ...,
    "client_email":                ...,
    "client_id":                   ...,
    "auth_uri":                    ...,
    "token_uri":                   ...,
    "auth_provider_x509_cert_url": ...,
    "client_x509_cert_url":        ...
});


```

### Firebase Realtime Database Setup.

```javascript

import serviceAccount from './_hidden/serviceAccountKey';
import admin from 'firebase-admin';

import {firebaseAdapter} from 'isomorpicdb';

const firebase = admin.initializeApp({
    credential:  admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
}, 'firebase');
const dbName ='test';
const dbVersion = 1;

const db = firebaseAdapter(dbName, dbVersion, firebase.database())

```

### Firestore Setup

```javascript

import serviceAccount from './_hidden/serviceAccountKey';
import admin from 'firebase-admin';

import {firestoreAdapter} from 'isomorpicdb/';

const firebase = admin.initializeApp({
    credential:  admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
}, 'firebase');

const dbName ='test';
const dbVersion = 1;

const firestore = firebase.firestore();
firestore.settings({timestampsInSnapshots: true});
const db = firestoreAdapter(dbName, dbVersion, firestore);

```

### IndexedDB Setup

For indexedDB no need serveiceAccount keys.

```javascript

import {indexedDBAdapter} from 'isomorpicdb';

const dbName ='test';
const dbVersion = 1;

// for unit tests indexedDB can replace with mocks. that's why indexeDB not included in source.
const db = indexedDBAdapter(dbName, dbVersion, indexedDB);

```

### Usage Examples

Now we see, db is object with exact same API, we can use it in different implementations.

We have db adapter above.Now we have query method

```javascript

const dbCollection = 'users';
const keyPath = '_id';

export default async (driver) => {
    const db = await driver.createObjectStore(dbCollection, {keyPath}).then(_=>_('readwrite'));
    // const {put, get, getAllKeys} = db('readwrite');
    return ({
        addUsers(batch) {
            return Promise.all(batch.map(_ => db.put(_)));
        },
        readIds() {
            return db.getAllKeys();
        },
        readUser(keyPath) {
            return db.get(keyPath);
        }
    })
}


``` 

And now we can use it with any db driver.

```javascript

import query from './query';
import data from './data';


    query(db).then(({addUsers, readUser, readIds}) =>{
        addUsers(data).then(()=>{
            ...
            //data is added
        });
        
        readUser(id).then(({data}) => {
            ...
            //Got user with userID
        });
        
        readIds().then(({data}) => {
            ...
            //get list of user ids
        });

    });


```

Possibly this not the most useful example, but I tried to show potential, how you with same code, no need to change anything, by using different databases.

### API

All driver constructors taking parmeters `driver(dbName, version, dbDriver)` like in examples above. Driver can create db with `readwrite` and `read` permissions. 
Will return with method `createObjectStore(collectionName, {autoincrement?(boolean: false is default),keyPath})` 

#### DB methods

**get(keyPath):** Return data, if `keyPath` exists.

**has(keyPath):** return `boolean` if `keyPath` exists

**put(data):** Add data and replace current if no exists. If `autoincrement` is false, data should contain `keyPath` field.

**add(data):** Add data, only if not `keyPath` exist already. If `autoincrement` is false, data should contain `keyPath` field.

**update(keyPath,data,force):** Merge with existing data with `keyPath`, with option force is same as put method.

**getAllKeys(keyPath?):** returning all keys from collection.

**delete(keyPath):** Delete record with `keyPath` provided.

All methods will return `Promise` with following data.

```javascript
    {
        status:  'Success|Error',
        data,
        message
    }
```
