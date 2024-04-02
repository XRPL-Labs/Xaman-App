/**
 * User Interaction Model
 *
 * @class
 * @extends Realm.Object
 */

import Realm from 'realm';

import { UserInteractionSchema } from '@store/models/schemas/latest';

/* Dictionary  ==================================================================== */
export enum InteractionTypes {}

/* Model  ==================================================================== */
class UserInteraction extends Realm.Object<UserInteraction> {
    static schema: Realm.ObjectSchema = UserInteractionSchema.schema;

    /** Unique identifier representing this  interaction */
    public declare id: Realm.BSON.ObjectId;
    /** Represents the type of interaction. */
    public declare type: InteractionTypes;
    /** Represents the details of the interaction. */
    public declare details: Record<string, any>;
    /** Date when the network was initially registered. */
    public declare registerAt?: Date;
    /** Date when the network's data was last updated. */
    public declare updatedAt?: Date;
}

export default UserInteraction;
