import admin from 'firebase-admin';
import serviceAccount from './_hidden/serviceAccountKey';

const app = admin.initializeApp({
    credential:  admin.credential.cert(serviceAccount),
    databaseURL: 'https://test-project-780a1.firebaseio.com'
});

console.log(app);