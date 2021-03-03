/**
 * Account Model
 */

import BigNumber from 'bignumber.js';
import Realm from 'realm';

import { CurrencySchema, TrustLineSchema } from '@store/schemas/v5';

import { EncryptionLevels, AccessLevels, AccountTypes } from '@store/types';

class Account extends Realm.Object {
    public static schema: Realm.ObjectSchema = {
        name: 'Account',
        primaryKey: 'address',
        properties: {
            type: { type: 'string', default: AccountTypes.Regular },
            address: { type: 'string', indexed: true },
            label: { type: 'string', default: 'Personal account' },
            balance: { type: 'double', default: 0 },
            ownerCount: { type: 'int', default: 0 },
            sequence: { type: 'int', default: 0 },
            publicKey: 'string?',
            regularKey: 'string?',
            accessLevel: 'string',
            encryptionLevel: 'string',
            additionalInfoString: 'string?',
            flags: { type: 'int', default: 0 },
            default: { type: 'bool', default: false },
            order: { type: 'int', default: 0 },
            hidden: { type: 'bool', default: false },
            lines: { type: 'list', objectType: 'TrustLine' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    };

    public type?: AccountTypes;
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
    public order?: number;
    public hidden?: boolean;
    public lines?: any;
    public registerAt?: Date;
    public updatedAt?: Date;

    public isValid: () => boolean;
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

        const availableBalance = new BigNumber(spendable).decimalPlaces(8).toNumber();

        if (availableBalance < 0) {
            return 0;
        }

        return availableBalance;
    }

    /**
     * check if account have specific trustline
     */
    hasCurrency = (currency: CurrencySchema): boolean => {
        let found = false;

        this.lines.forEach((t: TrustLineSchema) => {
            if (t.currency.issuer === currency.issuer && t.currency.currency === currency.currency) {
                found = true;
            }
        });

        return found;
    };

    get additionalInfo(): Object {
        return JSON.parse(this.additionalInfoString);
    }

    set additionalInfo(data: Object) {
        this.additionalInfoString = JSON.stringify(data);
    }

    public static migration(oldRealm: any, newRealm: any) {
        /*  eslint-disable-next-line */
        console.log('Migrating Account model to v7');

        const newObjects = newRealm.objects('Account') as Account[];

        for (let i = 0; i < newObjects.length; i++) {
            // set empty destination tag
            newObjects[i].hidden = false;
        }
    }
}

export default Account;
