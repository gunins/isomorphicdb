import {expect} from 'chai';
import {composeP} from '../../src/lib/curry';

describe('compose tests', () => {
    it('composeP, shoud take Promise and return Promise', async () => {
        const a = (_) => Promise.resolve(_ + 1);
        const b = (_) => Promise.resolve(_ * 2);
        const result = await composeP(a, b)(2);
        expect(result).to.be.eql(5);

        const resultA = await composeP(b, a)(2);
        expect(resultA).to.be.eql(6);
    });
});
