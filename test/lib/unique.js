import {expect} from 'chai';
import {uniqueProperties, uniqueArray} from '../../src/lib/unique';

describe('Utility test for uniqueProperties, uniqueArray, flatten', () => {
    it('should remove duplicate records from arrays', () => {
        let arrA = [1, 2, 3];
        let arrB = [2, 3, 'a', 'b', 'c'];
        let arrC = [1, 'b', 'd'];
        let result = [1, 2, 3, 'a', 'b', 'c', 'd'];
        expect(uniqueArray(arrA, arrB, arrC)).to.be.eql(result)
    });
    it('should return unique keys from objects', () => {

        let objA = {'1':1, '2':2, '3':3};
        let objB = {'2':2, '3':3, 'a':1, 'b':2, 'c':3};
        let objC = {'1':1, 'b':2, 'd':3};
        let result = ['1', '2', '3', 'a', 'b', 'c', 'd'];
        expect(uniqueProperties(objA, objB, objC)).to.be.eql(result)

    })
});