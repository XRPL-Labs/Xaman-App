import { assign } from 'lodash';
import Realm from 'realm';

import { Platform } from 'react-native';

import { AppConfig } from '@common/constants';
import { GetDeviceUniqueId } from '@common/helpers/device';
import { SHA512, HMAC256 } from '@common/libs/crypto';
import { UUIDEncoding } from '@common/utils/string';

import CoreModel from '@store/models/objects/core';
import NetworkModel from '@store/models/objects/network';

import BaseRepository from './base';

/* Events  ==================================================================== */
export type CoreRepositoryEvent = {
    updateSettings: (settings: CoreModel, changes: Partial<CoreModel>) => void;
};

declare interface CoreRepository {
    on<U extends keyof CoreRepositoryEvent>(event: U, listener: CoreRepositoryEvent[U]): this;
    off<U extends keyof CoreRepositoryEvent>(event: U, listener: CoreRepositoryEvent[U]): this;
    emit<U extends keyof CoreRepositoryEvent>(event: U, ...args: Parameters<CoreRepositoryEvent[U]>): boolean;
}
/* Repository  ==================================================================== */
class CoreRepository extends BaseRepository<CoreModel> {
    /**
     * Initialize the CoreRepository with the Realm instance.
     * @param realm - The Realm database instance.
     */
    initialize(realm: Realm) {
        this.realm = realm;
        this.model = CoreModel;
    }

    /**
     * Save the application settings.
     * @param settings - The settings changes to be saved.
     */
    saveSettings = (settings: Partial<CoreModel>) => {
        const current = this.getSettings();

        if (current) {
            this.safeWrite(() => {
                assign(current, settings);

                this.emit('updateSettings', current, settings);
            });
        } else {
            this.create(settings);
        }
    };

    /**
     * Get the app currency from settings.
     * @returns {string} - The app currency.
     */
    getAppCurrency = (): string => {
        const settings = this.getSettings();

        if (settings && settings.currency) {
            return settings.currency;
        }

        return AppConfig.defaultCurrency;
    };

    /**
     * Get the selected network from settings.
     * @returns {NetworkModel | undefined} - The selected network.
     */
    getSelectedNetwork = (): NetworkModel => {
        const settings = this.getSettings();

        if (settings && settings.network) {
            return settings.network;
        }

        return undefined;
    };

    /**
     * Get the default account from settings.
     * @returns {any | undefined} - The default account.
     */
    getDefaultAccount = (): any => {
        const settings = this.getSettings();

        if (settings && settings.account) {
            return settings.account;
        }

        return undefined;
    };

    /**
     * Set the default account in settings.
     * @param account - The default account to set.
     */
    setDefaultAccount = (account: any) => {
        this.saveSettings({
            account,
        });
    };

    /**
     * Set the default network in settings.
     * @param network - The default network to set.
     */
    setDefaultNetwork = (network: NetworkModel) => {
        this.saveSettings({
            network,
        });
    };

    /**
     * Get the app settings.
     * @returns {CoreModel | undefined} - The application settings.
     */
    getSettings = (): CoreModel => {
        const result = this.findAll();

        // settings exist
        if (!result.isEmpty()) {
            return result[0];
        }

        return undefined;
    };

    /**
     * Hash the passcode
     * @param passcode - The passcode to hash.
     * @returns {Promise<string>} - A promise that resolves to the hashed passcode.
     */
    hashPasscode = async (passcode: string): Promise<string> => {
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
            const sha512Passcode = await SHA512(passcode);
            return await HMAC256(sha512Passcode, deviceUniqueId);
        } catch (e) {
            return '';
        }
    };

    /**
     * Set the passcode for the app.
     * @param passcode - The passcode to set.
     * @returns {Promise<string>} - A promise that resolves to the hashed passcode.
     */
    setPasscode = async (passcode: string): Promise<string> => {
        try {
            const hashedPasscode = await this.hashPasscode(passcode);

            // unable to hash the passcode
            if (!hashedPasscode) {
                return '';
            }

            // save in the store
            this.saveSettings({ passcode: hashedPasscode });

            return hashedPasscode;
        } catch (e) {
            return '';
        }
    };

    /**
     * Purge all data from the Realm database.
     * WARNING: This will delete all objects in the Realm!
     */
    purge = (): void => {
        this.realm.write(() => {
            this.realm.deleteAll();
        });
    };
}

export default new CoreRepository();
