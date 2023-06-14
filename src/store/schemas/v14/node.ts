import Realm from 'realm';
import { AppConfig } from '@common/constants';

/**
 * Node Model
 */
class Node extends Realm.Object {
    public static schema: Realm.ObjectSchema = {
        name: 'Node',
        properties: {
            endpoint: { type: 'string' },
            network: { type: 'Network' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    };

    public endpoint: string;
    public network: any;
    public registerAt?: Date;
    public updatedAt?: Date;

    public static populate(realm: any) {
        const networks = realm.objects('Network') as any[];

        for (let i = 0; i < networks.length; i++) {
            const network = networks[i];
            const networkConfig = AppConfig.networks.find((net) => net.networkId === network.networkId);
            const createdNodes = [] as any[];
            networkConfig.nodes.forEach((n) => {
                createdNodes.push(
                    realm.create(Node.schema.name, {
                        endpoint: n,
                        network,
                        registerAt: new Date(),
                        updatedAt: new Date(),
                    }),
                );
            });

            // set the created nodes to the network
            network.nodes = createdNodes;
            // eslint-disable-next-line prefer-destructuring
            network.defaultNode = createdNodes[0];
        }
    }

    public static migration(oldRealm: any, newRealm: any) {
        /*  eslint-disable-next-line */
        console.log('migrating Network model to 14');

        // populate nodes
        this.populate(newRealm);
    }
}

export default Node;
