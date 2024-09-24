/* eslint-disable max-len */

import { randomKey, HMAC256, SHA1, SHA256, SHA512 } from '../crypto';

describe('Crypto', () => {
    it('randomKey', async () => {
        const result = await randomKey(16);
        expect(Buffer.from(result, 'hex')).toHaveLength(16);
        expect(result).toHaveLength(32);
    });

    it('SHA1', async () => {
        const result = await SHA1('thisisatest');
        expect(result).toBe('42d4a62c53350993ea41069e9f2cfdefb0df097d');
    });

    it('SHA256', async () => {
        const result = await SHA256('thisisatest');
        expect(result).toBe('a7c96262c21db9a06fd49e307d694fd95f624569f9b35bb3ffacd880440f9787');
    });

    it('SHA512', async () => {
        const result = await SHA512('thisisatest');
        expect(result).toBe(
            'd44edf261feb71975ee9275259b2eab75920d312cb1481a024306002dc57bf680e0c3b5a00edb6ffd15969369d8a714ccce1396937a57fd057ab312cb6c6d8b6',
        );
    });

    it('HMAC256', async () => {
        const result = await HMAC256('thisisatest', 'b1ebcf12f5ff0a48b8f76604156a8d52e748');
        expect(result).toBe('2c5808c4833446895070b2946e6db446fc337a916730b63f46213684e38b4415');
    });
});
