import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import {join, dirname} from 'path';
import rest from './rest';
import ip from 'ip';
import serviceAccount from '../../_hidden/serviceAccountKey';
import admin from 'firebase-admin';
import firestoreDb from '../../src/db/firestore';
import firebaseDb from '../../src/db/firebase';
import {lensPath, view} from '../../src/lib/lenses';
import config from './config';

const firebase = admin.initializeApp({
    credential:  admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
}, 'firestore');

const app = express();
app.use(bodyParser.json());
app.use(morgan('combined'));

const dbName = view(lensPath('db', 'name'))(config);
const dbVersion = view(lensPath('db', 'version'))(config);

const firestore = firebase.firestore();
firestore.settings({timestampsInSnapshots: true});
const db = firestoreDb(dbName, dbVersion, firestore);

/*const db = firebaseDb(dbName, dbVersion, firebase.database())*/

rest(db)
    .then(service => app.use('/api/v1', service));

const port = 5050;
const host = 'localhost';
const type = 'http';

app.use('/', express.static(join(dirname(''), '/'), {maxAge: 0}));


app.listen(port, () => {
    console.log('app access URLs:');
    console.log('---------------------------------');
    console.log(`Local: ${type}://${host}:${port}`);
    console.log(`External: ${type}://${ip.address()}:${port}`);
    console.log('---------------------------------');
    console.log('\n');
});
