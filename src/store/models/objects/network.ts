/**
 * Network Model
 *
 * @class
 * @extends Realm.Object
 */

import Realm from 'realm';

import { Amendments } from '@common/constants';

import { NetworkType } from '@store/types';
import { NetworkSchema } from '@store/models/schemas/latest';

import NodeModel from '@store/models/objects/node';

/* Dictionary  ==================================================================== */
interface NativeAsset {
    asset: string;
    icon: string;
    iconSquare: string;
}

/* Model  ==================================================================== */
class Network extends Realm.Object<Network> {
    static schema: Realm.ObjectSchema = NetworkSchema.schema;

    /** Unique identifier representing this specific network */
    public declare id: Realm.BSON.ObjectId;
    /** A unique key identifier for the network. (ex: TESTNET) */
    public declare key: string;
    /** A number representing network/chain id */
    public declare networkId: number;
    /** Descriptive name of the network. */
    public declare name: string;
    /** Hex Color associated with the network. */
    public declare color: string;
    /** Specifies the type or category of the network. */
    public declare type: NetworkType;
    /** Details of the network's native asset, including its visual representation. */
    public declare nativeAsset: NativeAsset;
    /** The basic reserve required on this network. */
    public declare baseReserve: number;
    /** The owner's reserve requirement for this network. */
    public declare ownerReserve: number;
    /** Default node associated with this network. */
    public declare defaultNode: any;
    /** Collection of nodes that belong to this network. */
    public declare nodes: Realm.List<NodeModel>;
    /** List of amendments that apply to this network. */
    public declare amendments?: string[];
    /** Serialized string representation of network definitions. */
    public declare definitionsString?: string;
    /** Date when the network was initially registered in the system. */
    public declare registerAt?: Date;
    /** Date when the network's data was last updated in the system. */
    public declare updatedAt?: Date;

    /**
     * Determines if a given feature, represented by an amendment, is enabled for this network.
     *
     * @param amendment - The amendment or feature to check.
     * @returns {boolean} - True if the feature is enabled, false otherwise.
     */
    public isFeatureEnabled(amendment: keyof typeof Amendments): boolean {
        return this.amendments ? this.amendments.indexOf(Amendments[amendment]) > -1 : false;
    }

    /**
     * Retrieves the network definitions as a parsed object.
     *
     * @returns {Record<string, any> | undefined} - The parsed definitions or undefined if not set.
     */
    get definitions(): Record<string, any> | undefined {
        if (this.definitionsString) {
            return JSON.parse(this.definitionsString);
        }

        return undefined;
    }

    /**
     * Serializes and sets the network definitions from an object.
     *
     * @param data - The definitions data to set.
     */
    set definitions(data: Record<string, any>) {
        this.definitionsString = JSON.stringify(data);
    }
}

export default Network;
