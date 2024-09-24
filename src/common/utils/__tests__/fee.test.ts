import { NormalizeFeeDataSet, PrepareTxForHookFee } from '../fee';

import * as AccountLib from 'xrpl-accountlib';

describe('Utils.Fee', () => {
    describe('NormalizeFeeDataSet', () => {
        it('Should return right values', () => {
            const baseFees = {
                10: ['12', '15', '25'],
                12: ['12', '15', '25'],
                24: ['24', '30', '45'],
                100: ['100', '150', '200'],
                500: ['500', '600', '900'],
                1200: ['1200', '1500', '2500'],
                10000: ['10000', '15000', '20000'],
                50000: ['50000', '60000', '75000'],
                20000: ['20000', '25000', '35000'],
                800000: ['800000', '850000', '850000'],
            };

            Object.keys(baseFees).forEach((base) => {
                expect(
                    NormalizeFeeDataSet({
                        drops: { base_fee: base },
                        fee_hooks_feeunits: '0',
                    }),
                ).toMatchObject({
                    availableFees: [
                        {
                            type: 'LOW',
                            value: baseFees[base][0],
                        },
                        {
                            type: 'MEDIUM',
                            value: baseFees[base][1],
                        },
                        {
                            type: 'HIGH',
                            value: baseFees[base][2],
                        },
                    ],
                    feeHooks: 0,
                    suggested: 'LOW',
                });
            });
        });
    });

    describe('PrepareTxForHookFee', () => {
        it('Should throw an error if txJson is not a valid object', () => {
            expect(() => {
                PrepareTxForHookFee(undefined, {}, 0);
            }).toThrowError('PrepareTxForHookFee requires a json transaction to calculate the fee for');

            expect(() => {
                PrepareTxForHookFee('invalid', {}, 0);
            }).toThrowError('PrepareTxForHookFee requires a json transaction to calculate the fee for');
        });

        it('Should prepare the txJson correctly for signing', () => {
            const txJson = {
                Fee: '12',
                SigningPubKey: 'SOME_PUB_KEY',
            };

            // mock and spy sign method
            const signSpy = jest.spyOn(AccountLib, 'sign');

            // call the method
            PrepareTxForHookFee(txJson, undefined, 1);

            expect(signSpy).toBeCalledWith(
                {
                    Fee: '0',
                    SigningPubKey: '',
                    Sequence: 0,
                },
                expect.any(Object),
                undefined,
            );

            signSpy.mockClear();
        });

        it('Should include NetworkID if necessary', () => {
            const txJson = {};

            const signSpy = jest.spyOn(AccountLib, 'sign');
            PrepareTxForHookFee(txJson, undefined, 2337);
            expect(signSpy).toBeCalledWith(
                {
                    Fee: '0',
                    SigningPubKey: '',
                    Sequence: 0,
                    NetworkID: 2337,
                },
                expect.any(Object),
                undefined,
            );
            signSpy.mockClear();
        });

        it('Should not include NetworkID if networkId is less than or equal to 1024', () => {
            const txJson = {};

            const signSpy = jest.spyOn(AccountLib, 'sign');
            PrepareTxForHookFee(txJson, undefined, 1024);
            expect(signSpy).toBeCalledWith(
                {
                    Fee: '0',
                    SigningPubKey: '',
                    Sequence: 0,
                },
                expect.any(Object),
                undefined,
            );
            signSpy.mockClear();
        });

        it('Should set Amount to 0 if TransactionType is Payment and Amount is not set', () => {
            const txJson = {
                TransactionType: 'Payment',
            };

            const signSpy = jest.spyOn(AccountLib, 'sign');
            PrepareTxForHookFee(txJson, undefined, 0);
            expect(signSpy).toBeCalledWith(
                {
                    ...txJson,
                    Amount: '0',
                    Fee: '0',
                    SigningPubKey: '',
                    Sequence: 0,
                },
                expect.any(Object),
                undefined,
            );
            signSpy.mockClear();
        });

        it('Should set xrplDefinitions if definitions is an object', () => {
            const txJson = {};

            const signSpy = jest.spyOn(AccountLib, 'sign');
            PrepareTxForHookFee(txJson, AccountLib.binary.DEFAULT_DEFINITIONS, 0);
            expect(signSpy).toBeCalledWith(
                {
                    ...txJson,
                    Fee: '0',
                    SigningPubKey: '',
                    Sequence: 0,
                },
                expect.any(Object),
                expect.any(Object),
            );
            signSpy.mockClear();
        });
    });
});
