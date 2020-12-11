/**
 * Account Model
 */

import BigNumber from 'bignumber.js';
import Realm from 'realm';

import TrustLineSchema from '@store/schemas/v1/trustLine';

import { EncryptionLevels, AccessLevels } from '@store/types';

class Account extends Realm.Object {
    public static schema: Realm.ObjectSchema = {
        name: 'Account',
        primaryKey: 'address',
        properties: {
            address: { type: 'string', indexed: true },
            label: { type: 'string', default: 'Personal account' },
            balance: { type: 'double', default: 0 },
            ownerCount: { type: 'int', default: 0 },
            sequence: { type: 'int', default: 0 },
            publicKey: 'string?',
            regularKey: 'string?',
            accessLevel: 'string',
            encryptionLevel: 'string',
            flags: { type: 'int', default: 0 },
            default: { type: 'bool', default: false },
            lines: { type: 'list', objectType: 'TrustLine' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    };

    public address?: string;
    public label?: string;
    public balance?: number;
    public ownerCount?: number;
    public sequence?: number;
    public publicKey?: string;
    public regularKey?: string;
    public accessLevel?: AccessLevels;
    public encryptionLevel?: EncryptionLevels;
    public flags?: number;
    public default?: boolean;
    public lines?: any;
    public registerAt?: Date;
    public updatedAt?: Date;

    [index: string]: any;

    constructor(obj: Partial<Account>) {
        super();
        Object.assign(this, obj);
    }

    /**
     * get account reserve
     */
    get accountReserve(): number {
        const RESERVER_ITEM = 5;
        const RESERVER_BASE = 20;

        return RESERVER_BASE + this.ownerCount * RESERVER_ITEM;
    }

    /**
     * get account available balance
     */
    get availableBalance(): number {
        if (this.balance === 0) {
            return 0;
        }
        // TODO: get reserve amount from ledger reserveBaseXRP
        const RESERVER_ITEM = 5;
        const RESERVER_BASE = 20;

        // calculate the spendable amount
        const spendable = this.balance - RESERVER_BASE - this.ownerCount * RESERVER_ITEM;

        const availableBalance = new BigNumber(spendable).decimalPlaces(6).toNumber();

        if (availableBalance < 0) {
            return 0;
        }

        return availableBalance;
    }

    /**
     * check if account have specific trustline
     */
    hasCurrency = (trustLine: TrustLineSchema): boolean => {
        let found = false;
        this.lines.forEach((t: TrustLineSchema) => {
            if (
                t.currency.issuer === trustLine.currency.issuer &&
                t.currency.currency === trustLine.currency.currency
            ) {
                found = true;
            }
        });

        return found;
    };
}

export default Account;
