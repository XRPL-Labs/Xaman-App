import Advisory from '../advisory';

import { TransactionTypes } from '@common/libs/ledger/types/enums';

import LedgerService from '@services/LedgerService';

jest.mock('@services/LedgerService');

describe('Advisory Helper', () => {
    describe('checkRequireDestinationTag', () => {
        beforeAll(() => {
            jest.replaceProperty(Advisory, 'HIGH_SENDER_COUNT', 5);
        });

        const mockIncomingTransaction = (destination: string, amount: any, tag?: number, account?: string) => ({
            tx: {
                TransactionType: 'Payment' as TransactionTypes,
                Destination: destination,
                Amount: amount,
                DestinationTag: tag,
                Account: account || '',
                date: 0,
                hash: '',
            },
            ledger_index: 0,
            meta: {
                AffectedNodes: [],
                TransactionIndex: 0,
                TransactionResult: 'tesSUCCESS',
            },
            validated: true,
        });

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should return true if advisory.force_dtag is true', async () => {
            const result = await Advisory.checkRequireDestinationTag('address', { force_dtag: true });
            expect(result).toBe(true);
        });

        it('should return true if accountFlags.requireDestinationTag is true', async () => {
            const result = await Advisory.checkRequireDestinationTag(
                'address',
                { force_dtag: false },
                // @ts-ignore
                {
                    requireDestinationTag: true,
                },
            );

            expect(result).toBe(true);
        });

        it('should return true if there are incoming transactions with tags meeting requirements', async () => {
            const address = 'testAddress';

            // @ts-ignore
            const spy = jest.spyOn(LedgerService, 'getTransactions').mockResolvedValue({
                transactions: [
                    mockIncomingTransaction(address, '2000', 99999, 'sender1'),
                    mockIncomingTransaction(address, '3000', 99999, 'sender2'),
                    mockIncomingTransaction(address, '1500', 99999, 'sender3'),
                    mockIncomingTransaction(address, '2000', 99999, 'sender4'),
                    mockIncomingTransaction(address, '2500', undefined, 'sender5'),
                ],
            });

            const result = await Advisory.checkRequireDestinationTag(
                address,
                { force_dtag: false },
                // @ts-ignore
                { requireDestinationTag: false },
            );

            expect(result).toBe(true);

            spy.mockRestore();
        });

        it('should return false for non native token transactions', async () => {
            const address = 'testAddress';

            // @ts-ignore
            const spy = jest.spyOn(LedgerService, 'getTransactions').mockResolvedValue({
                transactions: [
                    mockIncomingTransaction(address, { value: '1', currency: 'EUR' }, 99999, 'sender1'),
                    mockIncomingTransaction(address, { value: '200', currency: 'EUR' }, 99999, 'sender2'),
                    mockIncomingTransaction(address, { value: '1337', currency: 'EUR' }, 99999, 'sender3'),
                    mockIncomingTransaction(address, { value: '89', currency: 'EUR' }, 99999, 'sender4'),
                ],
            });

            const result = await Advisory.checkRequireDestinationTag(
                address,
                { force_dtag: false },
                // @ts-ignore
                { requireDestinationTag: false },
            );

            expect(result).toBe(false);

            spy.mockRestore();
        });

        it('should return false for transactions with low amount transaction', async () => {
            const address = 'testAddress';

            // @ts-ignore
            const spy = jest.spyOn(LedgerService, 'getTransactions').mockResolvedValue({
                transactions: [
                    mockIncomingTransaction(address, '1', 99999, 'sender1'),
                    mockIncomingTransaction(address, '100', 99999, 'sender2'),
                    mockIncomingTransaction(address, '50', 99999, 'sender3'),
                    mockIncomingTransaction(address, '500', 99999, 'sender4'),
                ],
            });

            const result = await Advisory.checkRequireDestinationTag(
                address,
                { force_dtag: false },
                // @ts-ignore
                { requireDestinationTag: false },
            );

            expect(result).toBe(false);

            spy.mockRestore();
        });

        it('should return false if transactions have less than required unique senders', async () => {
            const address = 'testAddress';

            // @ts-ignore
            const spy = jest.spyOn(LedgerService, 'getTransactions').mockResolvedValue({
                transactions: [
                    mockIncomingTransaction(address, '2000', 99999, 'sender1'),
                    mockIncomingTransaction(address, '3000', 99999, 'sender1'),
                    mockIncomingTransaction(address, '1500', 99999, 'sender1'),
                ],
            });

            const result = await Advisory.checkRequireDestinationTag(
                address,
                { force_dtag: false },
                // @ts-ignore
                { requireDestinationTag: false },
            );

            expect(result).toBe(false);

            spy.mockRestore();
        });

        it('should return false if percentage of tagged transactions is too low', async () => {
            const address = 'testAddress';

            // @ts-ignore
            const spy = jest.spyOn(LedgerService, 'getTransactions').mockResolvedValue({
                transactions: [
                    mockIncomingTransaction(address, '2000', undefined, 'sender1'),
                    mockIncomingTransaction(address, '3000', undefined, 'sender2'),
                    mockIncomingTransaction(address, '1500', undefined, 'sender3'),
                ],
            });

            const result = await Advisory.checkRequireDestinationTag(
                address,
                { force_dtag: false },
                // @ts-ignore
                { requireDestinationTag: false },
            );

            expect(result).toBe(false);
            spy.mockRestore();
        });

        it('should return false if there are no relevant transactions', async () => {
            const address = 'testAddress';

            // @ts-ignore
            const spy = jest.spyOn(LedgerService, 'getTransactions').mockResolvedValue({
                transactions: [],
            });

            const result = await Advisory.checkRequireDestinationTag(
                address,
                { force_dtag: false },
                // @ts-ignore
                { requireDestinationTag: false },
            );

            expect(result).toBe(false);

            spy.mockRestore();
        });

        it('should return false if LedgerService returns an error', async () => {
            const address = 'testAddress';

            // @ts-ignore
            const spy = jest.spyOn(LedgerService, 'getTransactions').mockResolvedValue({
                error: 'account_not_found',
            });

            // Mock LedgerService to return an error
            (LedgerService.getTransactions as jest.Mock).mockResolvedValue({ error: 'Some error' });

            const result = await Advisory.checkRequireDestinationTag(
                address,
                { force_dtag: false },
                // @ts-ignore
                { requireDestinationTag: false },
            );

            expect(result).toBe(false);

            spy.mockRestore();
        });
    });
});
