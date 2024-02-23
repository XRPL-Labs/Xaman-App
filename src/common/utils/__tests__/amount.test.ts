/* eslint-disable spellcheck/spell-checker */
import { NormalizeAmount, NormalizeCurrencyCode, ValueToIOU } from '../amount';

jest.mock('@services/NetworkService');

describe('Utils.Amount', () => {
    describe('NormalizeAmount', () => {
        it('should return right values', () => {
            const tests = [
                {
                    value: 999.0123456789,
                    output: 999.01234568,
                },
                {
                    value: 2e2,
                    output: 200,
                },
            ];
            tests.forEach((v) => {
                expect(NormalizeAmount(v.value)).toBe(v.output);
            });
        });
    });

    describe('NormalizeCurrencyCode', () => {
        it('should return right values', () => {
            const tests = [
                {
                    value: '',
                    output: '',
                },
                {
                    value: 'XRP',
                    output: 'XRP',
                },
                {
                    value: '4D79417765736F6D6543757272656E6379000000',
                    output: 'MyAwesomeCurrency',
                },
                {
                    value: '20416E205852504C204E46543F3F3F3F3F3F3F3F',
                    output: ' An XRPL NFT????????',
                },
                {
                    value: 'xrp',
                    output: 'FakeXRP',
                },
                {
                    value: 'xrP',
                    output: 'FakeXRP',
                },
                {
                    value: 'CSC',
                    output: 'CSC',
                },
                {
                    value: '5852500000000000000000000000000000000000',
                    output: 'FakeXRP',
                },
                {
                    value: '021D001703B37004416E205852504C204E46543F',
                    output: 'An XRPL NFT?',
                },
                {
                    value: '4A65727279436F696E0000000000000000000000',
                    output: 'JerryCoin',
                },
            ];
            tests.forEach((v) => {
                expect(NormalizeCurrencyCode(v.value)).toBe(v.output);
            });
        });
    });

    describe('ValueToIOU', () => {
        it('should raise error', () => {
            expect(() => ValueToIOU(undefined as any)).toThrowError('Value is not valid string!');
            // @ts-ignore
            expect(() => ValueToIOU(0.1)).toThrowError('Value is not valid string!');
            // @ts-ignore
            expect(() => ValueToIOU(0)).toThrowError('Value is not valid string!');
            expect(() => ValueToIOU('99999999999999999.1234566')).toThrowError('Amount too high to reliably slice!');
        });
        it('should return right values', () => {
            const tests = [
                {
                    value: '123.123',
                    output: '123.123',
                },
                {
                    value: '1337',
                    output: '1337',
                },
                {
                    value: '1234567891011123.123456',
                    output: '1234567891011123',
                },
                {
                    value: '90000000',
                    output: '90000000',
                },
                {
                    value: '1234567.1234567891011',
                    output: '1234567.123456789',
                },
                {
                    value: '0.0000000000000001',
                    output: '0',
                },
                {
                    value: '0.1230000000000000000001',
                    output: '0.123',
                },
                {
                    value: '9999999999999999.1',
                    output: '9999999999999999',
                },
            ];
            tests.forEach((v) => {
                expect(ValueToIOU(v.value)).toBe(v.output);
            });
        });
    });
});
