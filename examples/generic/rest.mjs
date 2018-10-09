import express from 'express';
import data from './data';
import query from './query';

export default async (db) => {
    const {addBatch, readRecord, readKeys} = await query(db);
    const updateData = await addBatch(data);
    console.log(updateData);

    const router = express.Router({});

    router.get('/user/:id', (req, resp) => {
        const {id} = req.params;
        readRecord(id).then(({data}) => resp.send(data));
    });

    router.get('/user', (req, resp) => {
        readKeys().then(({data}) => resp.send(data));

    });


    return router;
}