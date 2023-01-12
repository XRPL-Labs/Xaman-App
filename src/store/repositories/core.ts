import { assign } from 'lodash';
import { Platform } from 'react-native';
import Realm, { ObjectSchema, Results } from 'realm';

import { AppConfig } from '@common/constants';
import { GetDeviceUniqueId } from '@common/helpers/device';
import { SHA512, HMAC256 } from '@common/libs/crypto';
import { UUIDEncoding } from '@common/utils/string';

import { CoreSchema } from '@store/schemas/latest';
import { NodeChain } from '@store/types';

import BaseRepository from './base';

/* types  ==================================================================== */

// events
declare interface CoreRepository {
    on(event: 'updateSettings', listener: (settings: CoreSchema, changes: Partial<CoreSchema>) => void): this;
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

    saveSettings = (settings: Partial<CoreSchema>) => {
        const current = this.getSettings(true);

        if (current) {
            this.safeWrite(() => {
                assign(current, settings);

                this.emit('updateSettings', current, settings);
            });
        } else {
            this.create(settings);
        }
    };

    getChainFromNode = (node: string) => {
        let chain = NodeChain.Main;

        // it is a verified type
        if (AppConfig.nodes.main.indexOf(node) > -1) {
            chain = NodeChain.Main;
        } else if (AppConfig.nodes.test.indexOf(node) > -1) {
            chain = NodeChain.Test;
        } else if (AppConfig.nodes.dev.indexOf(node) > -1) {
            chain = NodeChain.Dev;
        } else {
            chain = NodeChain.Custom;
        }

        return chain;
    };

    getAppCurrency = (): string => {
        const settings = this.getSettings();

        if (settings && settings.currency) {
            return settings.currency;
        }

        return AppConfig.defaultCurrency;
    };

    getDefaultNode = () => {
        let defaultNode = AppConfig.nodes.main[0];

        const settings = this.getSettings();

        if (settings && settings.defaultNode) {
            defaultNode = settings.defaultNode;
        }

        const chain = this.getChainFromNode(defaultNode);

        return {
            node: defaultNode,
            chain,
        };
    };

    setDefaultNode = (node: string, chain?: NodeChain) => {
        if (!chain) {
            chain = this.getChainFromNode(node);
        }

        this.saveSettings({
            defaultNode: node,
        });

        return {
            node,
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

    encryptPasscode = async (passcode: string): Promise<string> => {
        try {
            // for better security we mix passcode with device unique id
            let deviceUniqueId = GetDeviceUniqueId();

            if (!deviceUniqueId) {
                return '';
            }

            // as device unique id will pass to the HMAC256 method as hex we need to normalize its value
            if (Platform.OS === 'android') {
                if (deviceUniqueId.length < 16) {
                    // in android, it's 64-bit hex, in some devices it can be 15 length
                    deviceUniqueId = '0'.repeat(16 - deviceUniqueId.length) + deviceUniqueId;
                }
            }

            // we need to normalize the UUID value to hex before passing to HMAC256 function
            if (Platform.OS === 'ios') {
                deviceUniqueId = UUIDEncoding.toHex(deviceUniqueId);
            }

            // hash the passcode
            const hashPasscode = await SHA512(passcode);
            const encPasscode = await HMAC256(hashPasscode, deviceUniqueId);

            return encPasscode;
        } catch (e) {
            return '';
        }
    };

    setPasscode = async (passcode: string): Promise<string> => {
        try {
            const encryptedPasscode = await this.encryptPasscode(passcode);

            // unable to encrypt passcode
            if (!encryptedPasscode) {
                return '';
            }

            // save in the store
            this.saveSettings({ passcode: encryptedPasscode });

            return encryptedPasscode;
        } catch (e) {
            return '';
        }
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
