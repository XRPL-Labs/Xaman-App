import LedgerService from '../LedgerService';

describe('LedgerService', () => {
    const ledgerService = LedgerService;

    it('should properly initialize', async () => {
        expect(ledgerService).toBeDefined();
    });
});
