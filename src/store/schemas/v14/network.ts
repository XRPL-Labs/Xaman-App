import Realm from 'realm';

import { NetworkType } from '@store/types';
import { NetworkConfig } from '@common/constants';

/**
 * Network Model
 */
class Network extends Realm.Object {
    public static schema: Realm.ObjectSchema = {
        name: 'Network',
        primaryKey: 'key',
        properties: {
            key: { type: 'string' },
            networkId: { type: 'int' },
            name: { type: 'string' },
            color: { type: 'string' },
            type: { type: 'string' },
            nativeAsset: { type: 'string' },
            baseReserve: { type: 'double', default: NetworkConfig.baseReserve },
            ownerReserve: { type: 'double', default: NetworkConfig.ownerReserve },
            defaultNode: { type: 'Node' },
            nodes: { type: 'list', objectType: 'Node' },
            definitionsString: { type: 'string?' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    };

    public key: string;
    public networkId: number;
    public name: string;
    public color: string;
    public type: NetworkType;
    public nativeAsset: string;
    public baseReserve: number;
    public ownerReserve: number;
    public defaultNode: any;
    public nodes: any;
    public definitionsString?: string;
    public registerAt?: Date;
    public updatedAt?: Date;

    get definitions(): Object {
        if (!this.definitionsString) {
            return undefined;
        }
        return JSON.parse(this.definitionsString);
    }

    set definitions(data: Object) {
        // @ts-ignore
        this.definitionsString = JSON.stringify(data);
    }

    /*
    Populate networks to the data store
    Note: this is necessary in the process of migration and also fresh install
    */
    public static populate(realm: Realm) {
        // default supported networks list
        const { networks } = NetworkConfig;
        // create networks
        for (let i = 0; i < networks.length; i++) {
            realm.create(Network.schema.name, {
                name: networks[i].name,
                key: networks[i].key,
                nativeAsset: networks[i].nativeAsset,
                networkId: networks[i].networkId,
                color: networks[i].color,
                type: networks[i].type,
                baseReserve: NetworkConfig.baseReserve,
                ownerReserve: NetworkConfig.ownerReserve,
                definitionsString: '',
                registerAt: new Date(),
                updatedAt: new Date(),
            });
        }
    }

    public static migration(oldRealm: any, newRealm: any) {
        /*  eslint-disable-next-line */
        console.log('migrating Network model to 14');

        // populate networks
        this.populate(newRealm);
    }
}

export default Network;
