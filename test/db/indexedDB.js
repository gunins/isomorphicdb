import indexedDB from 'fake-indexeddb';
import db from '../../src/db/indexedDB';
import {expect} from 'chai';

let recordA = {title: "Quarry Memories", author: "Fred", isbn: 123456}
let recordA_ = {title: "Quarry Memories", author: "Freda", isbn: 123456}
let recordB = {title: "Water Buffaloes", author: "Fred", isbn: 234567}
let recordC = {title: "Bedrock Nights", author: "Barney", isbn: 345678}
let recordD = {title: "Bedrock Nights", author: "Barney", deep: {a: 'deepA', c: [1, 2, 3]}, isbn: 345678}
let recordE = {title: "Bedrock Nights", author: "Barney", deep: {b: 'deepB', c: [1, 2, 3]}, isbn: 345678}
let recordDE = {title: "Bedrock Nights", author: "Barney", deep: {a: 'deepA', b: 'deepB', c: [1, 2, 3]}, isbn: 345678};

let recordKeyPathA = {title: "Quarry Memories", author: "Freda", isbn: 'a/b/c/123456'}
let recordKeyPathB = {title: "Quarry Memories", author: "Fredb", isbn: 'a/b/c/123457'}


let dbName = 'test';
let version = 1;

describe('Tests for indexedDB interface', () => {

    it('test, database connection and get add', async () => {
        let database = db('test', 1, indexedDB);
        let transaction = await database.createObjectStore('testRecords', {keyPath: 'isbn'}).then(_ => _('readwrite'));

        let transactionA = await transaction.add(recordA);
        let transactionB = await transaction.add(recordB);
        let transactionC = await transaction.add(recordC);

        expect(transactionA.method).to.be.eql('add');
        expect(transactionA.status).to.be.eql('Success');

        expect(transactionB.method).to.be.eql('add');
        expect(transactionB.status).to.be.eql('Success');

        expect(transactionC.method).to.be.eql('add');
        expect(transactionC.status).to.be.eql('Success');

        let resultA = await transaction.get(123456);
        let resultB = await transaction.get(234567);
        let resultC = await transaction.get(345678);

        expect(resultA.data).to.be.eql(recordA);
        expect(resultB.data).to.be.eql(recordB);
        expect(resultC.data).to.be.eql(recordC);
    });

    it('test, database connection and get delete', async () => {
        let database = db(dbName, version, indexedDB);
        let objectStore = await database.createObjectStore('testRecords', {keyPath: 'isbn'});
        let transactions = objectStore('readwrite');

        let transactionA = await transactions.delete(123456);
        let transactionB = await transactions.delete(345678);

        expect(transactionA.method).to.be.eql('delete');
        expect(transactionA.status).to.be.eql('Success');

        expect(transactionB.method).to.be.eql('delete');
        expect(transactionB.status).to.be.eql('Success');

        let resultA = await transactions.get(123456);
        let resultB = await transactions.get(234567);
        let resultC = await transactions.get(345678);

        expect(resultA.data).to.be.undefined;
        expect(resultB.data).to.be.eql(recordB);
        expect(resultC.data).to.be.undefined;
    });

    it('test, database connection and get, put, has', async () => {
        let database = db(dbName, version, indexedDB);
        let objectStore = await database.createObjectStore('testRecords', {keyPath: 'isbn'});
        let transactions = objectStore('readwrite');

        let transactionA = await transactions.put(recordA_);
        let transactionB = await transactions.put(recordB);
        let transactionC = await transactions.put(recordC);

        expect(transactionA.method).to.be.eql('put');
        expect(transactionA.status).to.be.eql('Success');

        expect(transactionB.method).to.be.eql('put');
        expect(transactionB.status).to.be.eql('Success');

        expect(transactionC.method).to.be.eql('put');
        expect(transactionC.status).to.be.eql('Success');

        let resultA = await transactions.get(123456);
        let resultB = await transactions.get(234567);
        let resultC = await transactions.get(345678);

        expect(resultA.method).to.be.eql('get');
        expect(resultA.data).to.be.eql(recordA_);

        expect(resultB.method).to.be.eql('get');
        expect(resultB.data).to.be.eql(recordB);

        expect(resultC.method).to.be.eql('get');
        expect(resultC.data).to.be.eql(recordC);


        let resultHasA = await transactions.has(123456);
        let resultHasB = await transactions.has(234567);
        let resultHasC = await transactions.has(345678);

        let resultHasD = await transactions.has(3456789);
        let resultHasE = await transactions.has(3456787);

        expect(resultHasA).to.be.true;
        expect(resultHasB).to.be.true;
        expect(resultHasC).to.be.true;

        expect(resultHasD).to.be.false;
        expect(resultHasE).to.be.false;
    });

    it('test method, getAllKeys', async () => {
        let database = db(dbName, version, indexedDB);
        let objectStore = await database.createObjectStore('testRecords', {keyPath: 'isbn'});
        let transactions = objectStore('readwrite');
        let keys = await transactions.getAllKeys();
        expect(keys.status).to.be.eql('Success');
        expect(keys.method).to.be.eql('getAllKeys');
        expect(keys.data).to.be.eql(['123456', '234567', '345678']);

        let transactionA = await transactions.add(recordKeyPathA);
        let transactionB = await transactions.add(recordKeyPathB);

        let keysA = await transactions.getAllKeys('a/b/c');
        expect(keysA.data).to.be.eql(['123456', '123457']);

        let keysB = await transactions.getAllKeys('a/b');
        expect(keysB.data).to.be.eql(['c']);

        let keysC = await transactions.getAllKeys();
        expect(keysC.data).to.be.eql(['123456', '234567', '345678', 'a']);

    });

    it('test, database connection and get update', async () => {
        let database = db(dbName, version, indexedDB);
        let objectStore = await database.createObjectStore('testRecords', {keyPath: 'isbn'});
        let transactions = objectStore('readwrite');
        let transactionA = await transactions.update(123456, {author: 'Vasja'});
        let transactionB = await transactions.update(234567, {title: 'Petja'});
        let transactionC = await transactions.update(345678, recordD);

        expect(transactionA.method).to.be.eql('update');
        expect(transactionA.status).to.be.eql('Success');

        expect(transactionB.method).to.be.eql('update');
        expect(transactionB.status).to.be.eql('Success');

        expect(transactionC.method).to.be.eql('update');
        expect(transactionC.status).to.be.eql('Success');

        let resultA = await transactions.get(123456);
        let resultB = await transactions.get(234567);
        let resultC = await transactions.get(345678);

        expect(resultA.method).to.be.eql('get');
        expect(resultA.data.author).to.be.eql('Vasja');

        expect(resultB.method).to.be.eql('get');
        expect(resultB.data.title).to.be.eql('Petja');

        expect(resultC.method).to.be.eql('get');
        expect(resultC.data).to.be.eql(recordD);

        let transactionD = await transactions.update(345678, recordE);
        expect(transactionD.method).to.be.eql('update');

        let resultD = await transactions.get(345678);

        expect(resultD.method).to.be.eql('get');
        expect(resultD.data).to.be.eql(recordDE);

        let clear = await transactions.clear();
        expect(clear.method).to.be.eql('clear');
        let resultE = await transactions.get(345678);
        expect(resultE.data).to.be.undefined;

    });


});