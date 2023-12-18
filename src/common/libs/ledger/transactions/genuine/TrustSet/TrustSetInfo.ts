import { AccountModel } from '@store/models';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import Localize from '@locale';

import TrustSet from './TrustSetClass';

/* Descriptor ==================================================================== */
const TrustSetInfo = {
    getLabel: (tx: TrustSet, account: AccountModel): string => {
        // incoming TrustLine
        if (tx.Account.address !== account.address) {
            if (tx.Limit === 0) {
                return Localize.t('events.incomingTrustLineRemoved');
            }
            return Localize.t('events.incomingTrustLineAdded');
        }
        const ownerCountChange = tx.OwnerCountChange(account.address);
        if (ownerCountChange) {
            if (ownerCountChange.action === 'INC') {
                return Localize.t('events.addedATrustLine');
            }
            return Localize.t('events.removedATrustLine');
        }
        return Localize.t('events.updatedATrustLine');
    },

    getDescription: (tx: TrustSet, account: AccountModel): string => {
        const ownerCountChange = tx.OwnerCountChange(account.address);

        if (ownerCountChange && ownerCountChange.action === 'DEC') {
            return Localize.t('events.itRemovedTrustLineCurrencyTo', {
                currency: NormalizeCurrencyCode(tx.Currency),
                issuer: tx.Issuer,
            });
        }

        return Localize.t('events.itEstablishesTrustLineTo', {
            limit: tx.Limit,
            currency: NormalizeCurrencyCode(tx.Currency),
            issuer: tx.Issuer,
            address: tx.Account.address,
        });
    },

    getRecipient: (tx: TrustSet, account: AccountModel): { address: string; tag?: number } => {
        // incoming trustline
        if (tx.Issuer === account.address) {
            return tx.Account;
        }

        return {
            address: tx.Issuer,
        };
    },
};

/* Export ==================================================================== */
export default TrustSetInfo;
