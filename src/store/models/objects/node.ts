/**
 * Node Model
 *
 * @class
 * @extends Realm.Object
 */

import Realm from 'realm';

import { NodeSchema } from '@store/models/schemas/latest';

/* Model  ==================================================================== */
class Node extends Realm.Object<Node> {
    public static schema: Realm.ObjectSchema = NodeSchema.schema;

    /** Unique identifier representing this specific node. */
    public declare id: Realm.BSON.ObjectId;
    /** The endpoint or URL for this node. */
    public declare endpoint: string;
    /** Date when the node was initially registered in the system. */
    public declare registerAt?: Date;
    /** Date when the node's data was last updated in the system. */
    public declare updatedAt?: Date;
}

export default Node;
