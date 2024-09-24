import { has, get, set, isUndefined, isNumber, toInteger } from 'lodash';
import { utils as AccountLibUtils } from 'xrpl-accountlib';

import NetworkService from '@services/NetworkService';

import Amount from '@common/libs/ledger/parser/common/amount';
import LedgerDate from '@common/libs/ledger/parser/common/date';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { AmountType, Destination } from '@common/libs/ledger/parser/types';
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class EscrowCreate extends BaseTransaction {
    public static Type = TransactionTypes.EscrowCreate as const;
    public readonly Type = EscrowCreate.Type;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = EscrowCreate.Type;
        }

        this.fields = this.fields.concat([
            'Amount',
            'Destination',
            'CancelAfter',
            'FinishAfter',
            'Condition',
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

    set Destination(destination: Destination) {
        if (has(destination, 'address')) {
            if (!AccountLibUtils.isValidAddress(destination.address)) {
                throw new Error(`${destination.address} is not a valid Address`);
            }
            set(this, 'tx.Destination', destination.address);
        }

        if (has(destination, 'tag')) {
            if (!isNumber(destination.tag)) {
                // try to convert to number
                set(this, 'tx.DestinationTag', toInteger(destination.tag));
            } else {
                set(this, 'tx.DestinationTag', destination.tag);
            }
        } else {
            set(this, 'tx.DestinationTag', undefined);
        }
    }

    get Condition(): string {
        return get(this, ['tx', 'Condition']);
    }

    get CancelAfter(): any {
        const date = get(this, ['tx', 'CancelAfter'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }

    get FinishAfter(): any {
        const date = get(this, ['tx', 'FinishAfter'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }
}

/* Export ==================================================================== */
export default EscrowCreate;
