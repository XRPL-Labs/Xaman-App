import StorageBackend from '../../storage';

import AccountRepository from '../../repositories/account';

import { EncryptionLevels, AccessLevels } from '../../types';

import { xrplAccount1, xrplAccount2 } from '../fixture';

let storage: StorageBackend;

describe.skip('Storage', () => {
    describe('Account Repository', () => {
        beforeAll(async () => {
            const path = '.jest/cache/INTEGRATION_TEST.realm';
            storage = new StorageBackend(path);
            await storage.initialize();
        });

        it('should add account as FullAccess/Passphrase and default', async () => {
            const result = await AccountRepository.add(
                {
                    registerAt: new Date(),
                    updatedAt: new Date(),
                    publicKey: xrplAccount1.keypair.publicKey,
                    address: xrplAccount1.address,
                    readonly: false,
                    default: true,
                    label: 'test',
                    encryptionLevel: EncryptionLevels.Passphrase,
                    accessLevel: AccessLevels.Full,
                },
                xrplAccount1.keypair.privateKey,
                'passphrase',
            );

            const createdAccount = AccountRepository.findOne({ address: xrplAccount1.address });

            expect(result).toBeDefined();
            expect(createdAccount.address).toBe(xrplAccount1.address);
            expect(createdAccount.accessLevel).toBe('Full');
            expect(createdAccount.encryptionLevel).toBe('Passphrase');
            expect(createdAccount.default).toBe(true);
        });

        it('should add account as readonly and change default', async () => {
            // @ts-ignore
            const result = await AccountRepository.add({ account: xrplAccount2, readonly: true });

            const createdAccount = AccountRepository.findOne({ address: xrplAccount2.address });

            const account1 = AccountRepository.findOne({ address: xrplAccount1.address });

            expect(result).toBeDefined();
            expect(createdAccount.address).toBe(xrplAccount2.address);
            expect(createdAccount.accessLevel).toBe('Readonly');
            expect(createdAccount.encryptionLevel).toBe('None');
            expect(createdAccount.default).toBe(true);
            expect(account1.default).toBe(false);
        });

        it('should get accounts', async () => {
            // @ts-ignore
            const accounts = AccountRepository.getAccounts();
            expect(accounts).toHaveLength(2);
        });

        it('should change default account', async () => {
            AccountRepository.setDefaultAccount(xrplAccount1.address);

            const account1 = AccountRepository.findOne({ address: xrplAccount1.address });
            const account2 = AccountRepository.findOne({ address: xrplAccount2.address });

            expect(account1.default).toEqual(true);
            expect(account2.default).toEqual(false);
        });

        it('should downgrade the access level', async () => {
            const account1 = AccountRepository.findOne({ address: xrplAccount1.address });

            expect(account1.accessLevel).toBe('Full');

            AccountRepository.downgrade(account1);

            expect(account1.accessLevel).toBe('Readonly');
        });

        it('should purge default account and switch default account', async () => {
            const account1 = AccountRepository.findOne({ address: xrplAccount1.address });

            expect(account1.default).toEqual(true);

            const result = await AccountRepository.purge(account1);

            const account1AfterDelete = AccountRepository.findOne({ address: xrplAccount1.address });
            const account2 = AccountRepository.findOne({ address: xrplAccount2.address });

            expect(result).toEqual(true);
            expect(Object.keys(account1AfterDelete).length).toEqual(0);
            expect(account2.default).toEqual(true);
        });

        afterAll(() => {
            storage.purge();
            storage.close();
        });
    });
});
