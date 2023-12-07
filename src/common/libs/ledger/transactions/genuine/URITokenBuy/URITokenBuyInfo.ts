import { AccountModel } from '@store/models';

import Localize from '@locale';

import URITokenBuy from './URITokenBuyClass';

/* Descriptor ==================================================================== */
const URITokenBuyInfo = {
    getLabel: (): string => {
        return Localize.t('events.buyURIToken');
    },

    getDescription: (tx: URITokenBuy): string => {
        const { Account, Amount, URITokenID } = tx;

        return Localize.t('events.uriTokenBuyExplain', {
            address: Account.address,
            amount: Amount.value,
            currency: Amount.currency,
            tokenID: URITokenID,
        });
    },

    getRecipient: (tx: URITokenBuy, account: AccountModel): { address: string; tag?: number } => {
        const { Account } = tx;

        if (Account.address !== account.address) {
            return Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default URITokenBuyInfo;
