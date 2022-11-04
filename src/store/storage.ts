/**
 * Storage
 *
 * Store storage back end
 *
 */

import Realm from 'realm';
import { sortBy, omit, values } from 'lodash';

import Vault from '@common/libs/vault';

import { AppConfig } from '@common/constants';

import { LoggerService } from '@services';

import * as repositories from './repositories';
import schemas from './schemas';

/* Module ==================================================================== */
export default class Storage {
    keyName: string;
    path: string;
    compactionThreshold: number;
    db: Realm;
    logger: any;

    constructor(path?: string) {
        this.keyName = AppConfig.storage.keyName;
        this.path = path || AppConfig.storage.path;
        this.compactionThreshold = 30;
        this.db = undefined;
        this.logger = LoggerService.createLogger('Storage');
    }

    /**
     * Initialize the storage
     */
    initialize = () => {
        return new Promise<void>((resolve, reject) => {
            this.configure()
                .then((config) => {
                    this.open(config)
                        .then((instance) => {
                            // set the db instance
                            this.db = instance;

                            // initialize repositories
                            this.initRepositories(instance)
                                .then(() => {
                                    resolve();
                                })
                                .catch((e) => {
                                    reject(e);
                                });
                        })
                        .catch((e) => {
                            this.logger.error('Storage open error', e);
                            reject(e);
                        });
                })
                .catch((e) => {
                    this.logger.error('Storage configure error', e);
                    reject(e);
                });
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
        this.db.close();
    };

    /**
     * WIPTE everything
     * WARNING: This will delete all objects in the Realm!
     */
    wipe = (): void => {
        Realm.deleteFile({ path: this.path });
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
        const encryptionKeyExist = await Vault.exist(this.keyName);
        const dbFileExist = Realm.exists({ path: this.path });

        // if the database file exist but we cannot get the encryption key then throw an error
        if (!encryptionKeyExist && dbFileExist) {
            throw new Error('Realm file decryption failed');
        }

        // set encryption key
        return Vault.getStorageEncryptionKey(this.keyName).then((key: Buffer) => {
            return {
                encryptionKey: key,
                path: this.path,
                shouldCompact: this.shouldCompactOnLaunch,
            };
        });
    };
}
