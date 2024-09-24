/**
 * AMM pair model
 *
 * @class
 * @extends Realm.Object
 */

import Realm from 'realm';

import Currency from './currency';
import TrustLine from './trustLine';

import { AmmPairSchema } from '@store/models/schemas/latest';

/* Model  ==================================================================== */
class AMMPair extends Realm.Object<AMMPair> {
    static schema: Realm.ObjectSchema = AmmPairSchema.schema;

    /** Unique identifier representing this pair */
    public declare id: string;
    /** Represents the pairs for this pair. */
    public declare pairs: Realm.List<string | Currency>;
    /** Represents the Trustline for this pair. */
    public declare line: TrustLine;
    /** Date when the record was initially registered. */
    public declare registerAt?: Date;
    /** Date when the record data was last updated. */
    public declare updatedAt?: Date;
}

export default AMMPair;
