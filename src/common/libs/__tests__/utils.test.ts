/* eslint-disable spellcheck/spell-checker */
import { Truncate, HexEncoding } from '../utils';

describe('Utils', () => {
    // truncate
    const longText = 'thisisatestfortruncate';
    const truncated = 'this...ate';
    const testString = 'teststring';
    const testHex = '74657374737472696e67';

    describe('Truncate', () => {
        it('should truncate the string', () => {
            const resultText = Truncate(longText, 10);
            expect(resultText).toEqual(truncated);
        });

        it('should return full text', () => {
            const resultText = Truncate(longText, 22);
            expect(resultText).toEqual(longText);
        });
    });

    describe('Hex Encoding', () => {
        it('should convert hex the string', () => {
            const string = HexEncoding.toString(testHex);
            expect(string).toStrictEqual(testString);
        });

        it('should convert string to hex', () => {
            const bytes = HexEncoding.toHex(testString);
            expect(bytes).toBe(testHex);
        });
    });
});
