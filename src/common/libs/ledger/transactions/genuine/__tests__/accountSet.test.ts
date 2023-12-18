import Localize from '@locale';

import { AccountSet, AccountSetInfo } from '../AccountSet';
import txTemplates from './fixtures/AccountSetTx.json';

jest.mock('@services/LedgerService');
jest.mock('@services/NetworkService');

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
            } = txTemplates;
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
            } = txTemplates;
            const instance = new AccountSet({
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

            const expectedDescription = `${Localize.t('events.thisIsAnAccountSetTransaction')}\n${Localize.t(
                'events.thisTransactionDoesNotEffectAnyAccountSettings',
            )}`;

            expect(AccountSetInfo.getDescription(instance)).toEqual(expectedDescription);
        });

        it('CancelTicket', () => {
            const {
                Set: { tx },
            } = txTemplates;
            const instance = new AccountSet({
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

            const expectedDescription = `${Localize.t('events.thisIsAnAccountSetTransaction')}\n${Localize.t(
                'events.thisTransactionClearTicket',
                { ticketSequence: instance.TicketSequence },
            )}`;

            expect(AccountSetInfo.getDescription(instance)).toEqual(expectedDescription);
        });

        it('Set', () => {
            const {
                Set: { tx },
            } = txTemplates;
            const instance = new AccountSet(tx);

            const expectedDescription = `${Localize.t('events.thisIsAnAccountSetTransaction')}\n${Localize.t(
                'events.itSetsAccountDomainTo',
                { domain: instance.Domain },
            )}\n${Localize.t('events.itSetsAccountEmailHashTo', { emailHash: instance.EmailHash })}\n${Localize.t(
                'events.itSetsAccountMessageKeyTo',
                { messageKey: instance.MessageKey },
            )}\n${Localize.t('events.itSetsAccountTransferRateTo', {
                transferRate: instance.TransferRate,
            })}\n${Localize.t('events.itSetsAccountMinterTo', { minter: instance.NFTokenMinter })}\n${Localize.t(
                'events.itSetsTheAccountFlag',
                { flag: instance.SetFlag },
            )}\n${Localize.t('events.itClearsTheAccountFlag', { flag: instance.ClearFlag })}\n${Localize.t(
                'events.itSetsAccountWalletLocatorTo',
                {
                    walletLocator: instance.WalletLocator,
                },
            )}\n${Localize.t('events.itSetsAccountWalletSizeTo', { walletSize: instance.WalletSize })}`;

            expect(AccountSetInfo.getDescription(instance)).toEqual(expectedDescription);
        });

        it('Clear', () => {
            const {
                Clear: { tx },
            } = txTemplates;
            const instance = new AccountSet(tx);

            const expectedDescription = `${Localize.t('events.thisIsAnAccountSetTransaction')}\n${Localize.t(
                'events.itRemovesTheAccountDomain',
            )}\n${Localize.t('events.itRemovesTheAccountEmailHash')}\n${Localize.t(
                'events.itRemovesTheAccountMessageKey',
            )}\n${Localize.t('events.itRemovesTheAccountTransferRate')}\n${Localize.t(
                'events.itRemovesTheAccountMinter',
            )}\n${Localize.t('events.itRemovesTheAccountWalletLocator')}\n${Localize.t(
                'events.itRemovesTheAccountWalletSize',
            )}`;

            expect(AccountSetInfo.getDescription(instance)).toEqual(expectedDescription);
        });
    });

    describe('Validation', () => {});
});
