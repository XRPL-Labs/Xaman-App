import { AccountModel } from '@store/models';
import Localize from '@locale';

import Invoke from './InvokeClass';
import { isUndefined } from 'lodash';

/* Descriptor ==================================================================== */
const InvokeInfo = {
    getLabel: (): string => {
        return Localize.t('events.invoke');
    },

    getDescription: (tx: Invoke): string => {
        const { Account, Destination, InvoiceID } = tx;

        let content = Localize.t('events.invokeInitiatorExplain', {
            address: Account.address,
        });

        if (!isUndefined(Destination)) {
            content += '\n';
            content += Localize.t('events.theTransactionHasADestination', {
                destination: Destination.address,
            });
        }

        if (!isUndefined(Destination?.tag)) {
            content += '\n';
            content += Localize.t('events.theTransactionHasADestinationTag', {
                tag: Destination.tag,
            });
        }

        if (!isUndefined(InvoiceID)) {
            content += '\n';
            content += Localize.t('events.theTransactionHasAInvoiceId', {
                invoiceId: InvoiceID,
            });
        }

        return content;
    },

    getRecipient: (tx: Invoke, account: AccountModel): { address: string; tag?: number } => {
        const { Account, Destination } = tx;
        if (Account.address !== account.address) {
            return Account;
        }

        return Destination;
    },
};

/* Export ==================================================================== */
export default InvokeInfo;
