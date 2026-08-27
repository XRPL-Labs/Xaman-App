import {
    parsePayChannelAmount,
    payChannelAmountsFromMeta,
    remainingPayChannelAmount,
} from '../payChannelAmounts';

jest.mock('@services/NetworkService', () => ({
    getNativeAsset: jest.fn().mockReturnValue('XRP'),
}));

describe('payChannelAmounts', () => {
    it('parses native drops and IOU/MPT amounts', () => {
        expect(parsePayChannelAmount('41000000')).toEqual({ currency: 'XRP', value: '41' });
        expect(
            parsePayChannelAmount({ currency: 'USD', issuer: 'rIssuer', value: '12.5' }),
        ).toEqual({ currency: 'USD', issuer: 'rIssuer', value: '12.5' });
        expect(
            parsePayChannelAmount({ currency: '00000A', value: '100', mpt_issuance_id: 'abc' }),
        ).toEqual({ currency: '00000A', value: '100', mpt_issuance_id: 'abc' });
    });

    it('subtracts remaining for native and IOU amounts', () => {
        expect(
            remainingPayChannelAmount({ currency: 'XRP', value: '41' }, { currency: 'XRP', value: '31.194298' }),
        ).toEqual({ currency: 'XRP', value: '9.805702' });
        expect(
            remainingPayChannelAmount(
                { currency: 'USD', issuer: 'rIssuer', value: '10.5' },
                { currency: 'USD', issuer: 'rIssuer', value: '1.25' },
            ),
        ).toEqual({ currency: 'USD', issuer: 'rIssuer', value: '9.25' });
    });

    it('reads Amount and Balance from PayChannel meta', () => {
        const meta = {
            AffectedNodes: [
                {
                    ModifiedNode: {
                        LedgerEntryType: 'PayChannel',
                        LedgerIndex: 'AABB',
                        FinalFields: {
                            Amount: '41000000',
                            Balance: '31194298',
                        },
                        PreviousFields: {
                            Balance: '20000000',
                        },
                    },
                },
            ],
        } as any;

        expect(payChannelAmountsFromMeta(meta, 'AABB')).toEqual({
            amount: { currency: 'XRP', value: '41' },
            balance: { currency: 'XRP', value: '31.194298' },
            previousBalance: { currency: 'XRP', value: '20' },
        });
        expect(
            remainingPayChannelAmount(
                { currency: 'XRP', value: '31.194298' },
                { currency: 'XRP', value: '20' },
            ),
        ).toEqual({ currency: 'XRP', value: '11.194298' });
        expect(remainingPayChannelAmount(
            parsePayChannelAmount('41000000'),
            parsePayChannelAmount('31194298'),
        )).toEqual({ currency: 'XRP', value: '9.805702' });
    });
});
