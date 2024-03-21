import AmountParser from '@common/libs/ledger/parser/common/amount';
import { AmountType } from '@common/libs/ledger/parser/types';
import { LedgerAmount } from '@common/libs/ledger/types/common';

import NetworkService from '@services/NetworkService';

/* Field ==================================================================== */
export const Amount = {
    getter: (self: any, name: string) => {
        return (): AmountType | undefined => {
            const value: LedgerAmount = self[name];

            if (typeof value === 'undefined') {
                return undefined;
            }

            // native asset in drops
            if (typeof value === 'string') {
                return {
                    currency: NetworkService.getNativeAsset(),
                    value: new AmountParser(value).dropsToNative().toString(),
                };
            }

            // issue currency
            return {
                currency: value.currency,
                value: value.value,
                issuer: value.issuer,
            };
        };
    },
    setter: (self: any, name: string) => {
        return (value: AmountType): void => {
            // resetting the value
            if (typeof value === 'undefined') {
                self[name] = undefined;
                return;
            }

            // native currency
            if (value.currency === NetworkService.getNativeAsset()) {
                self[name] = new AmountParser(value.value, false).nativeToDrops().toString();
                return;
            }

            // issued currency
            if (value.currency !== NetworkService.getNativeAsset() && value.issuer) {
                self[name] = value;
            }
        };
    },
};
