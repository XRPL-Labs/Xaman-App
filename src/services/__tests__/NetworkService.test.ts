import NetworkService from '../NetworkService';

describe('LedgerService', () => {
    const networkService = NetworkService;

    it('should properly initialize', async () => {
        const coreSettings = { network: { baseReserve: 10, ownerReserve: 2 } } as any;

        await networkService.initialize(coreSettings);

        // check  sets network reserves
        expect(networkService.getNetworkReserve()).toStrictEqual({
            BaseReserve: 10,
            OwnerReserve: 2,
        });
    });

    it('should return right calculated available fees', async () => {
        // normal network fees
        const spy = jest.spyOn(networkService, 'send').mockImplementation(() =>
            Promise.resolve({
                current_queue_size: '1924',
                drops: { median_fee: '5000', minimum_fee: '10', open_ledger_fee: '5343' },
                max_queue_size: '2000',
            }),
        );

        const availableFees = await networkService.getAvailableNetworkFee();

        expect(availableFees).toStrictEqual({
            availableFees: [
                { type: 'low', value: 15, suggested: false },
                { type: 'medium', value: 225, suggested: true },
                { type: 'high', value: 5877, suggested: false },
            ],
        });

        spy.mockRestore();
    });

    it('should not exceed the max fees when network report high fees', async () => {
        // normal network fees
        const spy = jest.spyOn(networkService, 'send').mockImplementation(() =>
            Promise.resolve({
                current_queue_size: '2000',
                drops: { median_fee: '100000', minimum_fee: '100000', open_ledger_fee: '1000000' },
                max_queue_size: '2000',
            }),
        );

        const availableFees = await networkService.getAvailableNetworkFee();

        expect(availableFees).toStrictEqual({
            availableFees: [
                { type: 'low', value: 1000, suggested: false },
                { type: 'medium', value: 10000, suggested: false },
                { type: 'high', value: 100000, suggested: true },
            ],
        });

        spy.mockRestore();
    });
});
