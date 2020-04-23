/**
 * Storage
 *
 * Store storage back end
 *
 */

import Realm from 'realm';
import { sortBy, flatMap } from 'lodash';

import Vault from '@common/libs/vault';

import { AppConfig } from '@common/constants';

import { LoggerService } from '@services';

import * as repositories from './repositories';
import schemas from './schemas';

/* Module ==================================================================== */
export default class Storage {
    keyName: string;
    path: string;
    db: Realm;
    logger: any;

    constructor(path?: string) {
        this.keyName = AppConfig.storage.keyName;
        this.path = path || AppConfig.storage.path;
        this.db = undefined;
        this.logger = LoggerService.createLogger('Storage');
    }

    /**
     * Initialize the storage
     */
    initialize = () => {
        return new Promise((resolve, reject) => {
            return this.open()
                .then((instance) => {
                    // set the db instance
                    this.db = instance;

                    // initialize repositories
                    this.initRepositories(instance)
                        .then(() => {
                            return resolve();
                        })
                        .catch((e) => {
                            return reject(e);
                        });
                })
                .catch((e) => {
                    this.logger.error('Storage configure error', e);
                    return reject(e);
                });
        });
    };

    /**
     * Configure Database
     */
    open = async (): Promise<Realm> => {
        // get the config
        const defaultConfig = await this.getDefaultConfig();

        const currentVersion = Realm.schemaVersion(defaultConfig.path, defaultConfig.encryptionKey);

        this.logger.debug(`Storage current schema version: ${currentVersion}`);

        const sorted = sortBy(schemas, [(v) => v.schemaVersion]);
        const target = sorted.slice(-1)[0];

        // no need to migrate anything just return database instance
        if (currentVersion === -1 || currentVersion >= target.schemaVersion) {
            this.logger.debug('Storage is on latest schema version');

            return new Realm({
                ...defaultConfig,
                schema: flatMap(target.schema, (s) => s),
                schemaVersion: target.schemaVersion,
            });
        }

        this.logger.warn('Storage needs migration, running ...');
        this.logger.warn(`Latest schema version ${target.schemaVersion}`);

        for (const current of sorted) {
            if (current.schemaVersion <= currentVersion) {
                continue;
            }

            // create migrations
            const migrations = [] as Array<(oldRealm: any, newRealm: any) => void>;
            Object.keys(current.schema).map((key) => {
                // @ts-ignore
                const model = current.schema[key];
                if (typeof model.migration === 'function') {
                    migrations.push(model.migration);
                }

                return migrations;
            });

            // build migration function
            const migration = (oldRealm: any, newRealm: any) => migrations.forEach((fn) => fn(oldRealm, newRealm));

            // migrate and create database instance
            const migrationRealm = new Realm({
                ...defaultConfig,
                schema: flatMap(target.schema, (s) => s),
                schemaVersion: target.schemaVersion,
                migration,
            });

            this.logger.warn(`Successfully migrate to ${current.schemaVersion}`);

            // if last migration then return instance
            if (current.schemaVersion === target.schemaVersion) {
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
     * Initialize repositories
     */
    async initRepositories(db: Realm): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                return Object.keys(repositories).map((key) => {
                    // @ts-ignore
                    const repository = repositories[key];
                    if (typeof repository.initialize === 'function') {
                        repository.initialize(db);
                    }
                    return resolve();
                });
            } catch (e) {
                this.logger.error('initRepositories Error:', e);
                return reject();
            }
        });
    }

    /**
     * Get Default Database config
     */
    async getDefaultConfig(): Promise<Realm.Configuration> {
        // set encryption key
        return Vault.getStorageEncryptionKey(this.keyName).then((key: Buffer) => {
            return {
                encryptionKey: key,
                path: this.path,
            };
        });
    }
}
