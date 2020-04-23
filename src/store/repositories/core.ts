import Realm, { ObjectSchema, Results } from 'realm';

import assign from 'lodash/assign';

import DeviceInfo from 'react-native-device-info';
import { SHA512, HMAC256 } from '@common/libs/crypto';

import { AppConfig } from '@common/constants';

import { CoreSchema } from '@store/schemas/latest';
import { NodeChain } from '@store/types';

import BaseRepository from './base';

/* types  ==================================================================== */

// events
declare interface CoreRepository {
    on(event: 'updateSettings', listener: (settings: CoreSchema) => void): this;
    on(event: string, listener: Function): this;
}

/* repository  ==================================================================== */
class CoreRepository extends BaseRepository {
    realm: Realm;
    schema: ObjectSchema;

    initialize(realm: Realm) {
        this.realm = realm;
        this.schema = CoreSchema.schema;
    }

    saveSettings = (object: Partial<CoreSchema>) => {
        const current = this.getSettings(true);
        if (current) {
            this.safeWrite(() => {
                assign(current, object);

                this.emit('updateSettings', current);
            });
        } else {
            this.create(object);
        }
    };

    getDefaultNode = () => {
        let defaultNode = __DEV__ ? AppConfig.nodes.test[0] : AppConfig.nodes.main[0];
        let chain = NodeChain.Main;

        const settings = this.getSettings();

        if (settings && settings.defaultNode) {
            defaultNode = settings.defaultNode;
        }

        // it is a verified type
        if (AppConfig.nodes.main.indexOf(defaultNode) > -1) {
            chain = NodeChain.Main;
        } else if (AppConfig.nodes.test.indexOf(defaultNode) > -1) {
            chain = NodeChain.Test;
        }

        return {
            node: defaultNode,
            chain,
        };
    };

    getSettings = (plain?: boolean): CoreSchema => {
        const result = this.findAll() as Results<CoreSchema>;

        // settings exist
        if (!result.isEmpty()) {
            if (plain) {
                return result[0];
            }
            // @ts-ignore
            return result[0].toJSON();
        }

        return undefined;
    };

    encryptedPasscode = async (passcode: string): Promise<string> => {
        // for better security we mix passcode with device uuid
        // because it will be used to encrypt private key and storing just passcode-hash is not a good idea
        const deviceUUID = DeviceInfo.getUniqueId();

        // hash the passcode
        const hashPasscode = await SHA512(passcode);
        const encPasscode = await HMAC256(hashPasscode, deviceUUID);

        return encPasscode;
    };

    setPasscode = async (passcode: string): Promise<string> => {
        // save in the store
        const encryptedPasscode = await this.encryptedPasscode(passcode);

        this.saveSettings({ passcode: encryptedPasscode });

        return encryptedPasscode;
    };

    /**
     * Purge everything
     * WARNING: This will delete all objects in the Realm!
     */
    purge = (): void => {
        this.realm.write(() => {
            this.realm.deleteAll();
        });
    };
}

export default new CoreRepository();
