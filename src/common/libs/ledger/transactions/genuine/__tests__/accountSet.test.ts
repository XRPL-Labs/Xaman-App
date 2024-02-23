import { MutationsMixin } from '@common/libs/ledger/mixin';

import { AccountSet, AccountSetInfo } from '../AccountSet';
import txTemplates from './fixtures/AccountSetTx.json';

jest.mock('@services/LedgerService');
jest.mock('@services/NetworkService');

const MixedAccountSet = MutationsMixin(AccountSet);

describe('AccountSet', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new AccountSet();
            expect(instance.TransactionType).toBe('AccountSet');
            expect(instance.Type).toBe('AccountSet');
        });

        it('Should return right parsed values', () => {
            const {
                Set: { tx },
            }: any = txTemplates;
            const instance = new AccountSet(tx);

            expect(instance.Domain).toBe('example.com');
            expect(instance.MessageKey).toBe('03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB');
            expect(instance.SetFlag).toBe('asfAccountTxnID');
            expect(instance.ClearFlag).toBe('asfDisableMaster');
            expect(instance.EmailHash).toBe('0bc83cb571cd1c50ba6f3e8a78ef1346');
            expect(instance.TransferRate).toBe(0.2);
            expect(instance.TickSize).toBe(0);
            expect(instance.NFTokenMinter).toBe('rMinterxxxxxxxxxxxxxxxxxxxxxxxxxx');
            expect(instance.WalletLocator).toBe('ABCDEF123456789');
            expect(instance.WalletSize).toBe(1337);
        });
    });

    describe('Info', () => {
        it('NoOperation', () => {
            const {
                Set: { tx },
            }: any = txTemplates;

            const instance = new MixedAccountSet({
                ...tx,
                ...{
                    SetFlag: undefined,
                    ClearFlag: undefined,
                    Domain: undefined,
                    EmailHash: undefined,
                    MessageKey: undefined,
                    TransferRate: undefined,
                    TickSize: undefined,
                    NFTokenMinter: undefined,
                    WalletLocator: undefined,
                    WalletSize: undefined,
                },
            });
            const info = new AccountSetInfo(instance, {} as any);

            const expectedDescription = `This is an AccountSet transaction${'\n'}This transaction doesn't affect any account settings.`;

            expect(info.generateDescription()).toEqual(expectedDescription);
        });

        it('CancelTicket', () => {
            const {
                Set: { tx },
            }: any = txTemplates;

            const instance = new MixedAccountSet({
                ...tx,
                ...{
                    TicketSequence: 1337,
                    Sequence: 0,
                    SetFlag: undefined,
                    ClearFlag: undefined,
                    Domain: undefined,
                    EmailHash: undefined,
                    MessageKey: undefined,
                    TransferRate: undefined,
                    TickSize: undefined,
                    NFTokenMinter: undefined,
                    WalletLocator: undefined,
                    WalletSize: undefined,
                },
            });
            const accountSetInfo = new AccountSetInfo(instance, {} as any);

            const expectedDescription = `This is an AccountSet transaction${'\n'}This transaction clears (consumes & removes) ticket #1337`;

            expect(accountSetInfo.generateDescription()).toEqual(expectedDescription);
        });

        it('Set', () => {
            const {
                Set: { tx },
            }: any = txTemplates;

            const instance = new MixedAccountSet(tx);
            const info = new AccountSetInfo(instance, {} as any);

            const expectedDescription = `This is an AccountSet transaction${'\n'}It sets the account domain to example.com${'\n'}It sets the account's email hash to 0bc83cb571cd1c50ba6f3e8a78ef1346${'\n'}It sets the account message key to 03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB${'\n'}It sets the account transfer rate to 0.2${'\n'}It sets the account minter to rMinterxxxxxxxxxxxxxxxxxxxxxxxxxx${'\n'}It set the account flag asfAccountTxnID${'\n'}It clears the account flag asfDisableMaster${'\n'}It sets the account wallet locator to ABCDEF123456789${'\n'}It sets the account wallet size to 1337`;
            expect(info.generateDescription()).toEqual(expectedDescription);
        });

        it('Clear', () => {
            const {
                Clear: { tx },
            }: any = txTemplates;

            const instance = new MixedAccountSet(tx);
            const info = new AccountSetInfo(instance, {} as any);

            const expectedDescription = `This is an AccountSet transaction${'\n'}It removes the account domain${'\n'}It removes the account's email hash${'\n'}It removes the account message key${'\n'}It removes the account transfer rate${'\n'}It removes the account minter${'\n'}It removes the account's wallet locator${'\n'}It removes the account's wallet size`;

            expect(info.generateDescription()).toEqual(expectedDescription);
        });
    });

    describe('Validation', () => {});
});
