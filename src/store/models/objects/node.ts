/**
 * Node Model
 *
 * @class
 * @extends Realm.Object
 */

import Realm from 'realm';

import { NodeSchema } from '@store/models/schemas/latest';

import NetworkModel from './network';

/* Model  ==================================================================== */
class Node extends Realm.Object<Node> {
    public static schema: Realm.ObjectSchema = NodeSchema.schema;

    /** Unique identifier representing this specific node. */
    public id: Realm.BSON.ObjectId;
    /** The endpoint or URL for this node. */
    public endpoint: string;
    /** Date when the node was initially registered in the system. */
    public registerAt?: Date;
    /** Date when the node's data was last updated in the system. */
    public updatedAt?: Date;

    /**
     * Retrieves and returns the associated network for this node.
     *
     * If the node is linked to an existing Network model, it will
     * return that network. Otherwise, it will return undefined.
     *
     * @returns {NetworkModel | undefined} The associated network or undefined if not linked.
     */
    get network(): NetworkModel | undefined {
        const networks = this.linkingObjects<NetworkModel>('Network', 'nodes');
        if (!networks.isEmpty()) {
            return networks[0];
        }
        return undefined;
    }
}

export default Node;
