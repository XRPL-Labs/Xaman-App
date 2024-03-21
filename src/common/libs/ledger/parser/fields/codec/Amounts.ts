import AmountParser from '@common/libs/ledger/parser/common/amount';

import { AmountType } from '@common/libs/ledger/parser/types';
import { LedgerAmount } from '@common/libs/ledger/types/common';

import NetworkService from '@services/NetworkService';

/* Codec ==================================================================== */
export const Amounts = {
    decode: (_self: any, value: { AmountEntry: { Amount: LedgerAmount } }[]): AmountType[] => {
        return value.map(({ AmountEntry }) => {
            const { Amount } = AmountEntry;

            if (typeof Amount === 'string') {
                return {
                    currency: NetworkService.getNativeAsset(),
                    value: new AmountParser(Amount).dropsToNative().toString(),
                };
            }

            return {
                currency: Amount.currency,
                value: Amount.value,
                issuer: Amount.issuer,
            };
        });
    },
    encode: (_self: any, value: AmountType[]): { AmountEntry: { Amount: LedgerAmount } }[] => {
        return value.map((amount) => {
            if (amount.currency === NetworkService.getNativeAsset()) {
                return {
                    AmountEntry: { Amount: new AmountParser(amount.value, false).nativeToDrops().toString() },
                };
            }

            return {
                AmountEntry: {
                    Amount: {
                        issuer: amount.issuer!,
                        currency: amount.currency,
                        value: amount.value,
                    },
                },
            };
        });
    },
};
