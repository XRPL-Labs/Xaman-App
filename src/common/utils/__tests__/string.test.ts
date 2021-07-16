/* eslint-disable spellcheck/spell-checker */
import { Truncate, HexEncoding } from '../string';

describe('Utils.String', () => {
    // truncate
    const longText = 'thisisatestfortruncate';
    const truncated = 'this...ate';
    const testString = 'teststring';
    const testHex = '74657374737472696e67';
    const testinvalidHex = '6CCF8826E4C803D46808B4BE68DD2BF1730E5E3C001318CC400EB851EED18B764';

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

        it('should convert hex to UTF-8', () => {
            const string = HexEncoding.toUTF8(testHex);
            expect(string).toStrictEqual(testString);
        });

        it('should return the hex if not valid UTF-8', () => {
            const string = HexEncoding.toUTF8(testinvalidHex);
            expect(string).toStrictEqual(testinvalidHex);
        });
    });
});
