import Realm from 'realm';
import { flatMap, find } from 'lodash';

// eslint-disable-next-line
import { AppConfig, NetworkConfig } from '../../../common/constants';

import SampleData from '../fixture/data';
import { AccountTypes } from '../../types';

const path = './.jest/realmTemp';

const getSchema = (version: number) => {
    return find(require('../../models/schemas').default, { schemaVersion: version });
};

const getObject = (instance: Realm, type: string): any => {
    return instance.objects(type)[0] as any;
};

const getInstance = (version: number): Realm => {
    return new Realm({
        path,
        schema: flatMap(getSchema(version).schemas, 'schema'),
        schemaVersion: getSchema(version).schemaVersion,
        onMigration: getSchema(version).migration,
    });
};

describe('Storage', () => {
    describe('Migrations', () => {
        beforeAll(() => {
            // populate the first schema version
            const instance = new Realm({
                path,
                schema: flatMap(getSchema(1).schemas, 'schema'),
                schemaVersion: getSchema(1).schemaVersion,
            });

            // should be the first schema version
            expect(instance.schemaVersion).toBe(1);

            // populate sample data
            instance.write(() => {
                Object.keys(SampleData).forEach((schemaName) => {
                    // @ts-ignore
                    instance.create(schemaName, SampleData[schemaName], Realm.UpdateMode.All);
                });
            });

            instance.close();
        });

        it('should run v2 migrations successfully', async () => {
            const instance = getInstance(2);
            expect(instance.schemaVersion).toBe(2);

            const account = getObject(instance, 'Account');
            expect(account.order).toBe(0);

            const core = getObject(instance, 'Core');
            expect(core.lastPasscodeFailedTimestamp).toBe(0);
            expect(core.passcodeFailedAttempts).toBe(0);
            expect(core.lastUnlockedTimestamp).toBe(0);
            expect(core.purgeOnBruteForce).toBe(false);
            expect(core.theme).toBe(AppConfig.defaultTheme);

            instance.close();
        });

        it('should run v3 migrations successfully', async () => {
            const instance = getInstance(3);
            expect(instance.schemaVersion).toBe(3);

            const core = getObject(instance, 'Core');
            expect(core.hapticFeedback).toBe(true);
            expect(core.defaultExplorer).toBe(NetworkConfig.legacy.defaultExplorer);

            instance.close();
        });

        it('should run v4 migrations successfully', async () => {
            const instance = getInstance(4);
            expect(instance.schemaVersion).toBe(4);

            const core = getObject(instance, 'Core');
            expect(core.discreetMode).toBe(false);

            const counterParty = getObject(instance, 'CounterParty');
            expect(counterParty.shortlist).toBe(true);

            const currency = getObject(instance, 'Currency');
            expect(currency.shortlist).toBe(true);

            const profile = getObject(instance, 'Profile');
            expect(profile.deviceUUID).toBe('');

            const trustLine = getObject(instance, 'TrustLine');
            expect(trustLine.limit_peer).toBe(0);
            expect(trustLine.authorized).toBe(false);
            expect(trustLine.peer_authorized).toBe(false);
            expect(trustLine.freeze).toBe(false);
            expect(trustLine.freeze_peer).toBe(false);
            expect(trustLine.obligation).toBe(false);

            instance.close();
        });

        it('should run v5 migrations successfully', async () => {
            const instance = getInstance(5);
            expect(instance.schemaVersion).toBe(5);

            const core = getObject(instance, 'Core');
            expect(core.useSystemSeparators).toBe(true);

            instance.close();
        });

        it('should run v6 migrations successfully', async () => {
            const instance = getInstance(6);
            expect(instance.schemaVersion).toBe(6);

            const account = getObject(instance, 'Account');
            expect(account.type).toBe(AccountTypes.Regular);

            const profile = getObject(instance, 'Profile');
            expect(profile.hasPro).toBe(false);

            instance.close();
        });

        it('should run v7 migrations successfully', async () => {
            const instance = getInstance(7);
            expect(instance.schemaVersion).toBe(7);

            const account = getObject(instance, 'Account');
            expect(account.hidden).toBe(false);

            const core = getObject(instance, 'Core');
            expect(core.currency).toBe(AppConfig.defaultCurrency);
            expect(core.developerMode).toBe(false);

            instance.close();
        });

        it('should run v8 migrations successfully', async () => {
            const instance = getInstance(8);
            expect(instance.schemaVersion).toBe(8);

            instance.close();
        });

        it('should run v9 migrations successfully', async () => {
            const instance = getInstance(9);
            expect(instance.schemaVersion).toBe(9);

            const currency = getObject(instance, 'Currency');
            expect(currency.id).toBe(`${currency.issuer}.${currency.currency}`);

            const trustLine = getObject(instance, 'TrustLine');
            const account = trustLine.linkingObjects('Account', 'lines')[0] as any;
            expect(trustLine.id).toBe(`${account.address}.${trustLine.currency.id}`);

            instance.close();
        });

        it('should run v10 migrations successfully', async () => {
            const instance = getInstance(10);
            expect(instance.schemaVersion).toBe(10);

            const core = getObject(instance, 'Core');
            expect(core.baseReserve).toBe(NetworkConfig.baseReserve);
            expect(core.ownerReserve).toBe(NetworkConfig.ownerReserve);

            instance.close();
        });

        it('should run v11 migrations successfully', async () => {
            const instance = getInstance(11);
            expect(instance.schemaVersion).toBe(11);

            const trustLine = getObject(instance, 'TrustLine');
            expect(trustLine.order).toBe(0);
            expect(trustLine.favorite).toBe(false);

            instance.close();
        });

        it('should run v12 migrations successfully', async () => {
            // for the check if migration running fine
            const oldInstance = getInstance(11);
            const oldCore = getObject(oldInstance, 'Core');
            oldInstance.write(() => {
                oldCore.defaultExplorer = 'xrplorer';
            });
            oldInstance.close();

            const instance = getInstance(12);
            expect(instance.schemaVersion).toBe(12);

            const account = getObject(instance, 'Account');
            expect(account.encryptionVersion).toBe(1);

            const core = getObject(instance, 'Core');
            expect(core.showFiatPanel).toBe(true);
            expect(core.defaultExplorer).toBe('bithomp');

            const currency = getObject(instance, 'Currency');
            expect(currency.xapp_identifier).toBe(null);

            instance.close();
        });

        it('should run v13 migrations successfully', async () => {
            const instance = getInstance(13);
            expect(instance.schemaVersion).toBe(13);

            const profile = getObject(instance, 'Profile');
            expect(profile.refreshToken).toBe(null);
            expect(profile.bearerHash).toBe(null);

            instance.close();
        });

        it('should run v14 migrations successfully', async () => {
            const instance = getInstance(14);
            expect(instance.schemaVersion).toBe(14);

            const account = getObject(instance, 'Account');
            const accountDetails = getObject(instance, 'AccountDetails');
            const core = getObject(instance, 'Core');

            expect(instance.objects('Network').length).toBeGreaterThan(0);
            expect(instance.objects('Node').length).toBeGreaterThan(0);

            expect(core.network.id).toBe(1);
            expect(core.account.address).toBe(account.address);
            expect(core.showReservePanel).toBe(true);

            expect(accountDetails.id).toBe(`${account.address}.${core.network.id}`);
            expect(accountDetails.network.id).toBe(core.network.id);
            expect(accountDetails.balance).toBe(0);
            expect(accountDetails.lines.length).toBeGreaterThan(0);

            instance.close();
        });

        afterAll(() => {
            // sort the migrations
            Realm.deleteFile({ path });
        });
    });
});
