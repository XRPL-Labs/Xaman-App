import Realm from 'realm';

import { AppConfig, NetworkConfig } from '@common/constants';

import SampleDataV1 from '../fixture/v1.test.data';

import RealmTestUtils from '../utils';

import { AccountTypes, MonetizationStatus } from '../../types';

describe('Storage', () => {
    describe('Migrations', () => {
        beforeAll(() => {
            // populate the first schema version
            const initInstance = RealmTestUtils.getRealmInstanceWithVersion(1);

            // populate
            initInstance.write(() => {
                Object.keys(SampleDataV1).forEach((schemaName) => {
                    // @ts-ignore
                    initInstance.create(schemaName, SampleDataV1[schemaName], Realm.UpdateMode.All);
                });
            });

            // should be the first schema version
            expect(initInstance.schemaVersion).toBe(1);

            // close
            initInstance.close();
        });

        it('should run v2 migrations successfully', async () => {
            const instance = RealmTestUtils.getRealmInstanceWithVersion(2);

            expect(instance.schemaVersion).toBe(2);

            const account = RealmTestUtils.getFirstModelItem(instance, 'Account');
            expect(account.order).toBe(0);

            const core = RealmTestUtils.getFirstModelItem(instance, 'Core');
            expect(core.lastPasscodeFailedTimestamp).toBe(0);
            expect(core.passcodeFailedAttempts).toBe(0);
            expect(core.lastUnlockedTimestamp).toBe(0);
            expect(core.purgeOnBruteForce).toBe(false);
            expect(core.theme).toBe(AppConfig.defaultTheme);

            instance.close();
        });

        it('should run v3 migrations successfully', async () => {
            const instance = RealmTestUtils.getRealmInstanceWithVersion(3);
            expect(instance.schemaVersion).toBe(3);

            const core = RealmTestUtils.getFirstModelItem(instance, 'Core');
            expect(core.hapticFeedback).toBe(true);
            expect(core.defaultExplorer).toBe(NetworkConfig.legacy.defaultExplorer);

            instance.close();
        });

        it('should run v4 migrations successfully', async () => {
            const instance = RealmTestUtils.getRealmInstanceWithVersion(4);
            expect(instance.schemaVersion).toBe(4);

            const core = RealmTestUtils.getFirstModelItem(instance, 'Core');
            expect(core.discreetMode).toBe(false);

            const counterParty = RealmTestUtils.getFirstModelItem(instance, 'CounterParty');
            expect(counterParty.shortlist).toBe(true);

            const currency = RealmTestUtils.getFirstModelItem(instance, 'Currency');
            expect(currency.shortlist).toBe(true);

            const profile = RealmTestUtils.getFirstModelItem(instance, 'Profile');
            expect(profile.deviceUUID).toBe('');

            const trustLine = RealmTestUtils.getFirstModelItem(instance, 'TrustLine');
            expect(trustLine.limit_peer).toBe(0);
            expect(trustLine.authorized).toBe(false);
            expect(trustLine.peer_authorized).toBe(false);
            expect(trustLine.freeze).toBe(false);
            expect(trustLine.freeze_peer).toBe(false);
            expect(trustLine.obligation).toBe(false);

            instance.close();
        });

        it('should run v5 migrations successfully', async () => {
            const instance = RealmTestUtils.getRealmInstanceWithVersion(5);
            expect(instance.schemaVersion).toBe(5);

            const core = RealmTestUtils.getFirstModelItem(instance, 'Core');
            expect(core.useSystemSeparators).toBe(true);

            instance.close();
        });

        it('should run v6 migrations successfully', async () => {
            const instance = RealmTestUtils.getRealmInstanceWithVersion(6);
            expect(instance.schemaVersion).toBe(6);

            const account = RealmTestUtils.getFirstModelItem(instance, 'Account');
            expect(account.type).toBe(AccountTypes.Regular);

            const profile = RealmTestUtils.getFirstModelItem(instance, 'Profile');
            expect(profile.hasPro).toBe(false);

            instance.close();
        });

        it('should run v7 migrations successfully', async () => {
            const instance = RealmTestUtils.getRealmInstanceWithVersion(7);
            expect(instance.schemaVersion).toBe(7);

            const account = RealmTestUtils.getFirstModelItem(instance, 'Account');
            expect(account.hidden).toBe(false);

            const core = RealmTestUtils.getFirstModelItem(instance, 'Core');
            expect(core.currency).toBe(AppConfig.defaultCurrency);
            expect(core.developerMode).toBe(false);

            instance.close();
        });

        it('should run v8 migrations successfully', async () => {
            const instance = RealmTestUtils.getRealmInstanceWithVersion(8);
            expect(instance.schemaVersion).toBe(8);

            instance.close();
        });

        it('should run v9 migrations successfully', async () => {
            const instance = RealmTestUtils.getRealmInstanceWithVersion(9);
            expect(instance.schemaVersion).toBe(9);

            const currency = RealmTestUtils.getFirstModelItem(instance, 'Currency');
            expect(currency.id).toBe(`${currency.issuer}.${currency.currency}`);

            const trustLine = RealmTestUtils.getFirstModelItem(instance, 'TrustLine');
            const account = trustLine.linkingObjects('Account', 'lines')[0] as any;
            expect(trustLine.id).toBe(`${account.address}.${trustLine.currency.id}`);

            instance.close();
        });

        it('should run v10 migrations successfully', async () => {
            const instance = RealmTestUtils.getRealmInstanceWithVersion(10);
            expect(instance.schemaVersion).toBe(10);

            const core = RealmTestUtils.getFirstModelItem(instance, 'Core');
            expect(core.baseReserve).toBe(NetworkConfig.baseReserve);
            expect(core.ownerReserve).toBe(NetworkConfig.ownerReserve);

            instance.close();
        });

        it('should run v11 migrations successfully', async () => {
            const instance = RealmTestUtils.getRealmInstanceWithVersion(11);
            expect(instance.schemaVersion).toBe(11);

            const trustLine = RealmTestUtils.getFirstModelItem(instance, 'TrustLine');
            expect(trustLine.order).toBe(0);
            expect(trustLine.favorite).toBe(false);

            instance.close();
        });

        it('should run v12 migrations successfully', async () => {
            // for the check if migration running fine
            const oldInstance = RealmTestUtils.getRealmInstanceWithVersion(11);
            const oldCore = RealmTestUtils.getFirstModelItem(oldInstance, 'Core');
            oldInstance.write(() => {
                oldCore.defaultExplorer = 'xrplorer';
            });
            oldInstance.close();

            const instance = RealmTestUtils.getRealmInstanceWithVersion(12);
            expect(instance.schemaVersion).toBe(12);

            const account = RealmTestUtils.getFirstModelItem(instance, 'Account');
            expect(account.encryptionVersion).toBe(1);

            const core = RealmTestUtils.getFirstModelItem(instance, 'Core');
            expect(core.showFiatPanel).toBe(true);
            expect(core.defaultExplorer).toBe('bithomp');

            const currency = RealmTestUtils.getFirstModelItem(instance, 'Currency');
            expect(currency.xapp_identifier).toBe(null);

            instance.close();
        });

        it('should run v13 migrations successfully', async () => {
            const instance = RealmTestUtils.getRealmInstanceWithVersion(13);
            expect(instance.schemaVersion).toBe(13);

            const profile = RealmTestUtils.getFirstModelItem(instance, 'Profile');
            expect(profile.refreshToken).toBe(null);
            expect(profile.bearerHash).toBe(null);

            instance.close();
        });

        it('should run v14 migrations successfully', async () => {
            // enable developer mode before running migrations as we need for tests
            const v13Instance = RealmTestUtils.getRealmInstanceWithVersion(13);
            v13Instance.write(() => {
                RealmTestUtils.getFirstModelItem(v13Instance, 'Core').developerMode = true;
            });
            v13Instance.close();

            const instance = RealmTestUtils.getRealmInstanceWithVersion(14);
            expect(instance.schemaVersion).toBe(14);

            const account = RealmTestUtils.getFirstModelItem(instance, 'Account');
            const accountDetails = RealmTestUtils.getFirstModelItem(instance, 'AccountDetails');
            const core = RealmTestUtils.getFirstModelItem(instance, 'Core');

            expect(instance.objects('Network').length).toBeGreaterThan(0);
            expect(instance.objects('Node').length).toBeGreaterThan(0);

            expect(core.developerMode).toBe(false);
            expect(core.network.id).toBe(0);
            expect(core.account.address).toBe(account.address);
            expect(core.showReservePanel).toBe(true);

            expect(accountDetails.id).toBe(`${account.address}.${core.network.id}`);
            expect(accountDetails.network.id).toBe(core.network.id);
            expect(accountDetails.balance).toBe(0);
            expect(accountDetails.lines.length).toBeGreaterThan(0);

            instance.close();
        });

        it('should run v15 migrations successfully', async () => {
            const instance = RealmTestUtils.getRealmInstanceWithVersion(15);
            expect(instance.schemaVersion).toBe(15);

            const network = RealmTestUtils.getFirstModelItem(instance, 'Network');
            expect(network.networkId).toBe(0);

            instance.close();
        });

        it('should run v16 migrations successfully', async () => {
            const instance = RealmTestUtils.getRealmInstanceWithVersion(16);
            expect(instance.schemaVersion).toBe(16);

            const currency = RealmTestUtils.getFirstModelItem(instance, 'Currency');
            expect(currency.currency).toBeUndefined();
            expect(currency.currencyCode).toBe('EUR');

            instance.close();
        });

        it('should run v17 migrations successfully', async () => {
            const instance = RealmTestUtils.getRealmInstanceWithVersion(17);
            expect(instance.schemaVersion).toBe(17);

            const profile = RealmTestUtils.getFirstModelItem(instance, 'Profile');
            expect(profile.monetization.toJSON()).toStrictEqual({
                monetizationStatus: MonetizationStatus.NONE,
            });

            const accountDetails = RealmTestUtils.getFirstModelItem(instance, 'AccountDetails');
            expect(accountDetails.reward.toJSON()).toStrictEqual({});

            instance.close();
        });

        it('should run v18 migrations successfully', async () => {
            const instance = RealmTestUtils.getRealmInstanceWithVersion(18);
            expect(instance.schemaVersion).toBe(18);

            const currency = RealmTestUtils.getFirstModelItem(instance, 'Currency');

            // renamed fields
            expect(currency.xappIdentifier).toBeDefined();
            expect(currency.avatarUrl).toBeDefined();
            // force the token to update
            expect(currency.updatedAt).toStrictEqual(new Date(0));

            instance.close();
        });

        afterAll(() => {
            RealmTestUtils.cleanup();
        });
    });
});
