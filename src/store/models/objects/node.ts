/**
 * Node Model
 */

import Realm from 'realm';

import { NodeSchema } from '@store/models/schemas/latest';

import NetworkModel from './network';

/* Model  ==================================================================== */
class Node extends Realm.Object<Node> {
    public static schema: Realm.ObjectSchema = NodeSchema.schema;

    public id: Realm.BSON.ObjectId;
    public endpoint: string;
    public registerAt?: Date;
    public updatedAt?: Date;

    get network(): NetworkModel {
        const networks = this.linkingObjects<NetworkModel>('Network', 'nodes');
        if (!networks.isEmpty()) {
            return networks[0];
        }
        return undefined;
    }
}

export default Node;
