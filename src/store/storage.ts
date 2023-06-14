/**
 * Storage
 *
 * Secure encrypted datastore for storing non-critical data
 *
 */

import Realm from 'realm';
import { sortBy, omit, values } from 'lodash';

import Vault from '@common/libs/vault';

import { AppConfig } from '@common/constants';

import LoggerService from '@services/LoggerService';

import * as repositories from './repositories';
import { NetworkSchema, NodeSchema, CoreSchema } from './schemas/latest';
import schemas from './schemas';

/* Module ==================================================================== */
export default class Storage {
    private readonly compactionThreshold: number;
    private dataStore: Realm;
    private logger: any;

    constructor() {
        this.compactionThreshold = 30;
        this.dataStore = undefined;
        this.logger = LoggerService.createLogger('Storage');
    }

    /**
     * Initialize the storage
     */
    initialize = () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
            try {
                // fetch the configuration
                const configuration = await this.configure();
                // open the datastore and get instance
                this.dataStore = await this.open(configuration);

                // initiate the repository
                await this.initRepositories(this.dataStore);

                // populate the data store if needed
                // NOTE: this method should be represented in onFirstOpen but as this method is causing in the current
                // version of realm we do it manually
                await this.populateDataStoreIfNeeded();
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    };

    /**
     * Configure Database
     */
    open = async (config: Realm.Configuration): Promise<Realm> => {
        // get current version
        const currentVersion = Realm.schemaVersion(config.path, config.encryptionKey);

        this.logger.debug(`Current schema version: v${currentVersion}`);

        // sort migrations and get latest schema version
        const sorted = sortBy(schemas, [(v) => v.schemaVersion]);
        const latest = sorted.slice(-1)[0];

        // no need to migrate anything just return database instance
        if (currentVersion === -1 || currentVersion >= latest.schemaVersion) {
            this.logger.debug('Schema version is latest, No migration needed.');

            // @ts-ignore
            return new Realm({
                ...config,
                schema: values(omit(latest.schema, ['migration'])),
                schemaVersion: latest.schemaVersion,
            });
        }

        this.logger.warn(`Needs migration (latest v${latest.schemaVersion}), preforming migrations ... `);

        for (const current of sorted) {
            // if schema is lower than our current schema ignore & continue
            if (current.schemaVersion <= currentVersion) {
                continue;
            }

            // migrate and create database instance
            // @ts-ignore
            const migrationRealm = new Realm({
                ...config,
                schema: values(omit(current.schema, ['migration'])),
                schemaVersion: current.schemaVersion,
                onMigration: current.migration,
            });

            this.logger.warn(`Successfully migrate to v${current.schemaVersion}`);

            // if last migration then return instance
            if (current.schemaVersion === latest.schemaVersion) {
                return migrationRealm;
            }
            // close the database for next migration
            migrationRealm.close();
        }

        return undefined;
    };

    /**
     * Close db instance
     */
    close = (): void => {
        this.dataStore.close();
    };

    /**
     * WIPE everything
     * WARNING: This will delete all objects in the Realm!
     */
    static wipe = (): void => {
        Realm.deleteFile({ path: AppConfig.storage.path });
    };

    /**
     * check if data store file exist
     */
    static isDataStoreFileExist = () => {
        return Realm.exists({ path: AppConfig.storage.path });
    };

    /**
     * Initialize repositories
     */
    initRepositories = async (db: Realm): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            try {
                Object.keys(repositories).forEach((key) => {
                    // @ts-ignore
                    const repository = repositories[key];
                    if (typeof repository.initialize === 'function') {
                        repository.initialize(db);
                    }
                });
                resolve();
            } catch (e) {
                this.logger.error('initRepositories Error:', e);
                reject();
            }
        });
    };

    /**
     * Populate the dataStore if needed
     */
    populateDataStoreIfNeeded = () => {
        return new Promise<void>((resolve, reject) => {
            try {
                // data store is not empty
                if (!this.dataStore.isEmpty) {
                    resolve();
                    return;
                }

                // NOTE: the order is important
                [NetworkSchema, NodeSchema, CoreSchema].forEach((schema) => {
                    this.dataStore.write(() => {
                        schema.populate(this.dataStore);
                    });
                });

                resolve();
            } catch (e) {
                this.logger.error('populateDataStoreIfNeeded Error:', e);
                reject();
            }
        });
    };

    /**
     * Check if we need to clean up the data store
     */
    shouldCompactOnLaunch = (totalSize: number, usedSize: number) => {
        const usedSizeMB = usedSize / 1024 ** 2;
        const totalSizeMB = totalSize / 1024 ** 2;

        const shouldCompact = totalSizeMB - usedSizeMB > this.compactionThreshold;

        this.logger.debug(
            `Storage compact: ${totalSizeMB.toFixed(2)} MB / ${usedSizeMB.toFixed(
                2,
            )} MB - Should compact ${shouldCompact}`,
        );

        return shouldCompact;
    };

    /**
     * Get Default Database config
     */
    configure = async (): Promise<Realm.Configuration> => {
        // check if we need to start a clean realm
        const encryptionKeyExist = await Vault.isStorageEncryptionKeyExist();
        const dbFileExist = Storage.isDataStoreFileExist();

        // if the database file exist but we cannot get the encryption key then throw an error
        if (!encryptionKeyExist && dbFileExist) {
            throw new Error('Realm file decryption failed');
        }

        // set encryption key
        return Vault.getStorageEncryptionKey().then((key: Buffer) => {
            return {
                encryptionKey: key,
                path: AppConfig.storage.path,
                shouldCompact: this.shouldCompactOnLaunch,
            };
        });
    };
}
