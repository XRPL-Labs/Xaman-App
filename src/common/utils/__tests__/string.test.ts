/* eslint-disable spellcheck/spell-checker */
import { Truncate, HexEncoding, Capitalize, StringTypeCheck, UUIDEncoding } from '../string';

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

    describe('UUIDEncoding', () => {
        it('should turn uuid to hex in right format', () => {
            expect(UUIDEncoding.toHex('068196C5-E4D9-4445-B6A8-E1703B519B97')).toStrictEqual(
                '068196c5f24d094445f56a08e1703b519b97',
            );
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

    describe('Capitalize', () => {
        it('should capitalize the first letter', () => {
            expect(Capitalize('test')).toStrictEqual('Test');
        });
    });

    describe('StringTypeCheck', () => {
        it('should check if string is valid UUIDv4', () => {
            // @ts-ignore
            expect(StringTypeCheck.isValidUUID({ someting: true })).toBe(false);
            expect(StringTypeCheck.isValidUUID(undefined)).toBe(false);
            expect(StringTypeCheck.isValidUUID('test-test-test-test-test')).toBe(false);
            expect(StringTypeCheck.isValidUUID('')).toBe(false);
            expect(StringTypeCheck.isValidUUID('f5569322-989a-11ec-b909-0242ac120002')).toBe(false);
            expect(StringTypeCheck.isValidUUID('8036a695-3b59-4592-ae3b-e465919192cc')).toBe(true);
            expect(StringTypeCheck.isValidUUID('8036A695-3B59-4592-AE3B-E465919192CC')).toBe(true);
        });

        it('should check if string is valid URL', () => {
            const validUrls = [
                'https://example.com',
                'https://example.com/blah',
                'https://wwww.example.com/test/?page=2',
            ];

            const invalidUrls = [
                'www.example.com',
                'www.example.com/blah',
                'http://www.example.com/blah',
                'http://127.0.0.1',
                'http://127.0.0.1/wow',
                'ftp://example.com',
                'ftp://127.0.0.1',
            ];

            // @ts-ignore
            expect(StringTypeCheck.isValidURL({ someting: true })).toBe(false);
            expect(StringTypeCheck.isValidURL(undefined)).toBe(false);
            expect(StringTypeCheck.isValidURL(null)).toBe(false);
            expect(StringTypeCheck.isValidURL('')).toBe(false);

            for (let i = 0; i < validUrls.length; i++) {
                expect(StringTypeCheck.isValidURL(validUrls[i])).toBe(true);
            }

            for (let i = 0; i < invalidUrls.length; i++) {
                expect(StringTypeCheck.isValidURL(invalidUrls[i])).toBe(false);
            }
        });

        it('should check if string is valid amount', () => {
            const validAmounts = ['1337', '0.1', '0.123456789123456'];
            const invalidAmounts = ['0', '0.', '0.1234567891234567', '0.1c', 'not a number'];

            // @ts-ignore
            expect(StringTypeCheck.isValidAmount({ someting: true })).toBe(false);
            expect(StringTypeCheck.isValidAmount(undefined)).toBe(false);
            expect(StringTypeCheck.isValidAmount(null)).toBe(false);
            expect(StringTypeCheck.isValidAmount('')).toBe(false);

            for (let i = 0; i < validAmounts.length; i++) {
                expect(StringTypeCheck.isValidAmount(validAmounts[i])).toBe(true);
            }

            for (let i = 0; i < invalidAmounts.length; i++) {
                expect(StringTypeCheck.isValidAmount(invalidAmounts[i])).toBe(false);
            }
        });

        it('should check if string is valid transaction hash', () => {
            // @ts-ignore
            expect(StringTypeCheck.isValidHash({ someting: true })).toBe(false);
            expect(StringTypeCheck.isValidHash(undefined)).toBe(false);
            expect(StringTypeCheck.isValidHash(null)).toBe(false);
            expect(StringTypeCheck.isValidHash('')).toBe(false);
            expect(
                StringTypeCheck.isValidHash('1CE80FF3298223CDF8BE80BF007A857F24C09843FCA24359DFA3E035D5C021889'),
            ).toBe(false);
            expect(StringTypeCheck.isValidHash('1CE80FF3298223CDF8BE80BF007A857F24C09843FCA24359DFA3E035D5C02')).toBe(
                false,
            );
            expect(
                StringTypeCheck.isValidHash('1CE80FF3298223CDF8BE80BF007A857F24C09843FCA24359DFA3E035D5C02188'),
            ).toBe(true);
        });

        it('should check if string is valid xApp Identifier', () => {
            // @ts-ignore
            expect(StringTypeCheck.isValidXAppIdentifier({ someting: true })).toBe(false);
            expect(StringTypeCheck.isValidXAppIdentifier(undefined)).toBe(false);
            expect(StringTypeCheck.isValidXAppIdentifier(null)).toBe(false);
            expect(StringTypeCheck.isValidXAppIdentifier('')).toBe(false);
            expect(StringTypeCheck.isValidXAppIdentifier('something.@test')).toBe(false);
            expect(StringTypeCheck.isValidXAppIdentifier('somethings_.test/')).toBe(false);
            expect(StringTypeCheck.isValidXAppIdentifier('xumm.app_TEST28-z_identifier')).toBe(true);
        });
    });
});
