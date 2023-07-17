/**
 * Account Details Model
 */

import Realm from 'realm';

import { AccountDetailsSchema } from '@store/models/schemas/latest';

import TrustLineModel from './trustLine';

/* Model  ==================================================================== */
class AccountDetails extends Realm.Object<AccountDetails> {
    public static schema: Realm.ObjectSchema = AccountDetailsSchema.schema;

    public id: string;
    public network: any;
    public balance: number;
    public ownerCount: number;
    public sequence: number;
    public regularKey?: string;
    public domain?: string;
    public emailHash?: string;
    public messageKey?: string;
    public flagsString?: string;
    public lines: TrustLineModel[];
    public registerAt?: Date;
    public updatedAt?: Date;

    get flags(): { [key: string]: boolean } {
        return JSON.parse(this.flagsString);
    }

    set flags(data: { [key: string]: boolean }) {
        this.flagsString = JSON.stringify(data);
    }
}

export default AccountDetails;
