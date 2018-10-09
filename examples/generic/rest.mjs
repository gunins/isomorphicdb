import express from 'express';
import data from './data';
import query from './query';

export default async (driver, engine) => {
    const {addUsers, readUser, readIds} = await query(driver, engine);
    const updateData = await addUsers(data);
    console.log(updateData);

    const router = express.Router({});

    router.get('/user/:id', (req, resp) => {
        const {id} = req.params;
        readUser(id).then(({data}) => resp.send(data));
    });

    router.get('/user', (req, resp) => {
        readIds().then(({data}) => resp.send(data));

    });


    return router;
}