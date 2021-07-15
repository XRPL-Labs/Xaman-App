import { get, isUndefined } from 'lodash';

import BaseTransaction from './base';
import Amount from '../parser/common/amount';
import LedgerDate from '../parser/common/date';

/* Types ==================================================================== */
import { AmountType, Destination } from '../parser/types';
import { LedgerTransactionType } from '../types';

/* Class ==================================================================== */
class PaymentChannelCreate extends BaseTransaction {
    [key: string]: any;

    constructor(tx?: LedgerTransactionType) {
        super(tx);
        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'PaymentChannelCreate';
        }

        this.fields = this.fields.concat([
            'Amount',
            'Destination',
            'SettleDelay',
            'PublicKey',
            'CancelAfter',
            'DestinationTag',
        ]);
    }

    get Amount(): AmountType {
        const amount = get(this, ['tx', 'Amount']);

        if (isUndefined(amount)) return undefined;

        return {
            currency: 'XRP',
            value: new Amount(amount).dropsToXrp(),
        };
    }

    get Destination(): Destination {
        const destination = get(this, ['tx', 'Destination'], undefined);
        const destinationTag = get(this, ['tx', 'DestinationTag'], undefined);
        const destinationName = get(this, ['tx', 'DestinationName'], undefined);

        if (isUndefined(destination)) return undefined;

        return {
            name: destinationName,
            address: destination,
            tag: destinationTag,
        };
    }

    get SettleDelay(): string {
        return get(this, ['tx', 'SettleDelay']);
    }

    get PublicKey(): string {
        return get(this, ['tx', 'PublicKey']);
    }

    get CancelAfter(): string {
        const date = get(this, ['tx', 'CancelAfter'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }

    get ChannelID(): string {
        let channelID;

        const affectedNodes = get(this.meta, 'AffectedNodes', []);

        affectedNodes.map((node: any) => {
            if (node.CreatedNode?.LedgerEntryType === 'PayChannel') {
                channelID = node.CreatedNode?.LedgerIndex;
                return true;
            }
            return false;
        });

        return channelID;
    }
}

/* Export ==================================================================== */
export default PaymentChannelCreate;
