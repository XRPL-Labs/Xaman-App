import { LedgerEntryTypes, TransactionTypes } from '@common/libs/ledger/types/enums';
import FlagParser from '../flag';

jest.mock('NetworkService', () => ({
    getNetworkDefinitions: jest.fn().mockReturnValue({
        transactionFlags: {
            OfferCreate: {
                tfFillOrKill: 262144,
                tfImmediateOrCancel: 131072,
                tfPassive: 65536,
                tfSell: 524288,
            },
            UnsupportedType: {},
        },
        transactionFlagsIndices: {
            AccountSet: {
                asfAccountTxnID: 5,
                asfAuthorizedNFTokenMinter: 10,
                asfDefaultRipple: 8,
                asfDepositAuth: 9,
                asfDisableMaster: 4,
                asfDisallowIncomingCheck: 13,
                asfDisallowIncomingNFTokenOffer: 12,
                asfDisallowIncomingPayChan: 14,
                asfDisallowIncomingTrustline: 15,
                asfDisallowXRP: 3,
                asfGlobalFreeze: 7,
                asfNoFreeze: 6,
                asfRequireAuth: 2,
                asfRequireDest: 1,
            },
        },
    }),
}));

describe('FlagParser', () => {
    describe('get method', () => {
        it('should return proper flag settings for transaction when flags set', () => {
            const parser = new FlagParser(TransactionTypes.OfferCreate, 393216);

            expect(parser.get()).toEqual({
                tfFillOrKill: true,
                tfImmediateOrCancel: true,
                tfPassive: false,
                tfSell: false,
            });
        });

        it('should return proper flag settings for ledger entry when flags set', () => {
            const parser = new FlagParser(LedgerEntryTypes.NFTokenOffer, 1);

            expect(parser.get()).toEqual({
                lsfSellNFToken: true,
            });
        });

        it('should return empty object when no flags set', () => {
            const parser = new FlagParser(TransactionTypes.OfferCreate);
            expect(parser.get()).toEqual({});
        });
    });

    describe('set method', () => {
        it('should set and return proper flags when valid data provided', () => {
            const parser = new FlagParser(TransactionTypes.OfferCreate);
            expect(parser.set({ tfFillOrKill: true, tfImmediateOrCancel: true })).toEqual(393216);
        });

        it('should throw error for unsupported transaction type', () => {
            // @ts-expect-error
            const parser = new FlagParser('UnsupportedTransaction');
            expect(() => parser.set({ flag1: true })).toThrow();
        });

        it('should throw if setting invalid flag', () => {
            const parser = new FlagParser(TransactionTypes.OfferCreate);
            expect(() => parser.set({ tfFillOrKill: true, someUnknownFlag: true })).toThrow();
        });
    });

    describe('setIndices method', () => {
        it('should set and return proper indices when valid data provided', () => {
            const parser = new FlagParser(TransactionTypes.AccountSet);
            expect(parser.setIndices('asfAccountTxnID')).toEqual(5);
            expect(parser.setIndices('asfRequireDest')).toEqual(1);
        });

        it('should throw error for unsupported transaction type', () => {
            // @ts-expect-error
            const parser = new FlagParser('UnsupportedType');
            expect(() => parser.setIndices('asfAccountTxnID')).toThrow();
        });

        it('should throw error for invalid flag name', () => {
            const parser = new FlagParser(TransactionTypes.AccountSet);
            expect(() => parser.setIndices('invalidFlagName')).toThrow();
        });
    });

    describe('getIndices method', () => {
        it('should return the flag name that matches the flag value', () => {
            const parser = new FlagParser(TransactionTypes.AccountSet, 4);
            expect(parser.getIndices()).toEqual('asfDisableMaster');
        });

        it('should throw error for unsupported transaction type', () => {
            // @ts-expect-error
            const parser = new FlagParser('UnsupportedType', 1);
            expect(() => parser.getIndices()).toThrow();
        });
    });
});
