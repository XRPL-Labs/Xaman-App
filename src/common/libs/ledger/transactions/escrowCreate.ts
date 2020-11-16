import { has, get, set, isUndefined, isNumber, toInteger } from 'lodash';

import * as AccountLib from 'xrpl-accountlib';

import BaseTransaction from './base';
import Amount from '../parser/common/amount';
import LedgerDate from '../parser/common/date';

/* Types ==================================================================== */
import { AmountType, Destination } from '../parser/types';
import { LedgerTransactionType } from '../types';

/* Class ==================================================================== */
class EscrowCreate extends BaseTransaction {
    [key: string]: any;

    constructor(tx?: LedgerTransactionType) {
        super(tx);
        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'EscrowCreate';
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

    set Destination(destination: Destination) {
        if (has(destination, 'address')) {
            if (!AccountLib.utils.isValidAddress(destination.address)) {
                throw new Error(`${destination.address} is not a valid XRP Address`);
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

        if (has(destination, 'name')) {
            set(this, 'tx.DestinationName', destination.name);
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
