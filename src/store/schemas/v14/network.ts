import Realm from 'realm';

import { NetworkType } from '@store/types';
import { AppConfig } from '@common/constants';

/**
 * Network Model
 */
class Network extends Realm.Object {
    public static schema: Realm.ObjectSchema = {
        name: 'Network',
        primaryKey: 'networkId',
        properties: {
            networkId: { type: 'int' },
            name: { type: 'string' },
            color: { type: 'string' },
            type: { type: 'string' },
            baseReserve: { type: 'double', default: AppConfig.network.baseReserve },
            ownerReserve: { type: 'double', default: AppConfig.network.ownerReserve },
            defaultNode: { type: 'Node' },
            nodes: { type: 'list', objectType: 'Node' },
            definitionsString: { type: 'string?' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    };

    public name: string;
    public networkId: number;
    public color: string;
    public type: NetworkType;
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
        const { networks } = AppConfig;
        // create networks
        for (let i = 0; i < networks.length; i++) {
            realm.create(Network.schema.name, {
                name: networks[i].name,
                networkId: networks[i].networkId,
                color: networks[i].color,
                type: networks[i].type,
                baseReserve: AppConfig.network.baseReserve,
                ownerReserve: AppConfig.network.ownerReserve,
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
