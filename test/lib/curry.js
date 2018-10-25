import {expect} from 'chai';
import {composeAsync} from '../../src/lib/curry';

describe('compose tests', () => {
    it('composeP, shoud take Promise and return Promise', async () => {
        const a = (_) => Promise.resolve(_ + 1);
        const b = (_) => Promise.resolve(_ * 2);
        const result = await composeAsync(a, b)(2);
        expect(result).to.be.eql(5);

        const resultA = await composeAsync(b, a)(2);
        expect(resultA).to.be.eql(6);
    });
});
