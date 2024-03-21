/**
 * Account Details model
 *
 * @class
 * @extends Realm.Object
 */

import Realm from 'realm';

import { AccountDetailsSchema } from '@store/models/schemas/latest';

import TrustLineModel from './trustLine';

/* Model  ==================================================================== */
class AccountDetails extends Realm.Object<AccountDetails> {
    public static schema: Realm.ObjectSchema = AccountDetailsSchema.schema;

    public declare id: string;
    public declare network: any;
    public declare balance: number;
    public declare ownerCount: number;
    public declare sequence: number;
    public declare regularKey?: string;
    public declare domain?: string;
    public declare emailHash?: string;
    public declare messageKey?: string;
    public declare flagsString?: string;
    public declare lines: Realm.Results<TrustLineModel>;
    public declare registerAt?: Date;
    public declare updatedAt?: Date;

    /**
     * Returns the parsed flags as an object.
     * @type {Object}
     */
    get flags(): { [key: string]: boolean } {
        return this.flagsString ? JSON.parse(this.flagsString) : {};
    }

    /**
     * Set the flags after stringify them.
     */
    set flags(data: { [key: string]: boolean }) {
        this.flagsString = JSON.stringify(data);
    }
}

export default AccountDetails;
