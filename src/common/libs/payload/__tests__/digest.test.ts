/* eslint-disable max-len */
// eslint-disable spellcheck/spell-checker

import { DigestSerializeWithSHA1 } from '../digest';

describe('DigestSerializeWithSHA1', () => {
    describe('Serialize', () => {
        it('should serialize an empty object', () => {
            const input = {};
            const expectedOutput = '{[]}';
            expect(DigestSerializeWithSHA1.serialize(input)).toEqual(expectedOutput);
        });

        it('should serialize an object with string and number properties', () => {
            const input = {
                TransactionType: 'Payment',
                Sequence: 30,
            };
            const expectedOutput = '{["Sequence","TransactionType"]30,"Payment",}';
            expect(DigestSerializeWithSHA1.serialize(input)).toEqual(expectedOutput);
        });

        it('should serialize an array of strings', () => {
            const input = {
                TransactionType: 'Payment',
                Memos: [
                    {
                        Memo: {
                            MemoData: '5852502054697020426F74',
                            MemoType: '587270546970426F744E6F7465',
                        },
                    },
                ],
            };
            const expectedOutput =
                '{["Memos","TransactionType"][{["Memo"]{["MemoData","MemoType"]"5852502054697020426F74","587270546970426F744E6F7465",},}],"Payment",}';
            expect(DigestSerializeWithSHA1.serialize(input)).toEqual(expectedOutput);
        });

        it('should serialize nested objects', () => {
            const input = {
                TransactionType: 'Payment',
                Amount: {
                    currency: 'USD',
                    value: '1',
                    issuer: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
                },
            };
            const expectedOutput =
                '{["Amount","TransactionType"]{["currency","issuer","value"]"USD","rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn","1",},"Payment",}';
            expect(DigestSerializeWithSHA1.serialize(input)).toEqual(expectedOutput);
        });

        it('should serialize object with different key orders', () => {
            const input = {
                TransactionType: 'Payment',
                Amount: {
                    currency: 'USD',
                    value: '1',
                    issuer: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
                },
                Memos: [
                    {
                        Memo: {
                            MemoData: '5852502054697020426F74',
                            MemoType: '587270546970426F744E6F7465',
                        },
                    },
                ],
            };
            const input2 = {
                Amount: {
                    currency: 'USD',
                    issuer: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
                    value: '1',
                },
                Memos: [
                    {
                        Memo: {
                            MemoType: '587270546970426F744E6F7465',
                            MemoData: '5852502054697020426F74',
                        },
                    },
                ],
                TransactionType: 'Payment',
            };

            const expectedOutput =
                '{["Amount","Memos","TransactionType"]{["currency","issuer","value"]"USD","rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn","1",},[{["Memo"]{["MemoData","MemoType"]"5852502054697020426F74","587270546970426F744E6F7465",},}],"Payment",}';

            expect(DigestSerializeWithSHA1.serialize(input)).toEqual(expectedOutput);
            expect(DigestSerializeWithSHA1.serialize(input2)).toEqual(expectedOutput);
        });

        it('should throw an error for unsupported data type', () => {
            const input = null as any;
            expect(() => DigestSerializeWithSHA1.serialize(input)).toThrow('Invalid object type object');
        });

        it('should throw an error for illegal data types', () => {
            const input = {
                TransactionType: 'Payment',
                Amount: () => {},
            };
            expect(() => DigestSerializeWithSHA1.serialize(input)).toThrow('Invalid object type function');
        });
    });

    describe('Digest', () => {
        it('should calculate digest correctly for valid input', async () => {
            const input = {
                TransactionType: 'Payment',
                Amount: {
                    currency: 'USD',
                    value: '1',
                    issuer: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
                },
            };

            const result = await DigestSerializeWithSHA1.digest(input);
            // Ensure that the result is the expected digest
            expect(result).toEqual('6c4873827bb120755dda381b8e55b79f7ffa75a4');
        });

        it('should reject with an error for invalid input', async () => {
            const invalidInput = null as any;
            await expect(DigestSerializeWithSHA1.digest(invalidInput)).rejects.toThrowError(
                'digest `request_json` should be valid object!',
            );
        });
    });
});
