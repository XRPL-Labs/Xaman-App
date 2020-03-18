/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import { randomKey, SHA1, SHA256, SHA512, AES } from '../crypto';

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
    it('Encrypt/Decrypt', async () => {
        const entry = 'somemessage';
        const key = 'somekey';

        // Encrypt
        const result = await AES.encrypt(entry, key);

        expect(result).toBeDefined();
        expect(result.cipher).toBeDefined();
        expect(result.iv).toBeDefined();

        // DECRYPT
        const decrypted = await AES.decrypt(result.cipher, key, result.iv);
        expect(decrypted).toBe(entry);
    });
});
