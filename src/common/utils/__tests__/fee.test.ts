/* eslint-disable spellcheck/spell-checker */
import { NormalizeFeeDataSet } from '../fee';

describe('Utils.Fee', () => {
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
        } as any;

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
