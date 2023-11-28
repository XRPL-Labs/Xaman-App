import { set, get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import Amount from '@common/libs/ledger/parser/common/amount';
import LedgerDate from '@common/libs/ledger/parser/common/date';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { Destination, AmountType } from '@common/libs/ledger/parser/types';
import { TransactionJSONType, TransactionTypes } from '@common/libs/ledger/types';

/* Class ==================================================================== */
class PaymentChannelCreate extends BaseTransaction {
    public static Type = TransactionTypes.PaymentChannelCreate as const;
    public readonly Type = PaymentChannelCreate.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = PaymentChannelCreate.Type;
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

        if (typeof amount === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(amount).dropsToNative(),
            };
        }

        return {
            currency: amount.currency,
            value: amount.value,
            issuer: amount.issuer,
        };
    }

    get Destination(): Destination {
        const destination = get(this, ['tx', 'Destination'], undefined);
        const destinationTag = get(this, ['tx', 'DestinationTag'], undefined);

        if (isUndefined(destination)) return undefined;

        return {
            address: destination,
            tag: destinationTag,
        };
    }

    get SettleDelay(): string {
        return get(this, ['tx', 'SettleDelay']);
    }

    set PublicKey(publicKey: string) {
        set(this, 'tx.PublicKey', publicKey);
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
