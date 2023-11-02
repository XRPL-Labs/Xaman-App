import { AccountModel } from '@store/models';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import Localize from '@locale';

import CheckCreate from './CheckCreateClass';

/* Descriptor ==================================================================== */
const CheckCreateInfo = {
    getLabel: (): string => {
        return Localize.t('events.createCheck');
    },

    getDescription: (tx: CheckCreate): string => {
        let content = Localize.t('events.theCheckIsFromTo', {
            address: tx.Account.address,
            destination: tx.Destination.address,
        });

        if (tx.Account.tag) {
            content += '\n';
            content += Localize.t('events.theCheckHasASourceTag', { tag: tx.Account.tag });
        }
        if (tx.Destination.tag) {
            content += '\n';
            content += Localize.t('events.theCheckHasADestinationTag', { tag: tx.Destination.tag });
        }

        content += '\n\n';
        content += Localize.t('events.maximumAmountCheckIsAllowToDebit', {
            value: tx.SendMax.value,
            currency: NormalizeCurrencyCode(tx.SendMax.currency),
        });

        return content;
    },

    getRecipient: (tx: CheckCreate, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account?.address !== account.address) {
            return tx.Account;
        }
        return tx.Destination;
    },
};

/* Export ==================================================================== */
export default CheckCreateInfo;
