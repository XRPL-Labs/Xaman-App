import NetworkService from '../NetworkService';

import * as FeeUtils from '@common/utils/fee';

describe('NetworkService', () => {
    const networkService = NetworkService;

    it('should properly initialize', async () => {
        const coreSettings = {
            network: { baseReserve: 10, ownerReserve: 2, isFeatureEnabled: () => {}, definitions: {} },
        } as any;

        await networkService.initialize(coreSettings);

        // check  sets network reserves
        expect(networkService.getNetworkReserve()).toStrictEqual({
            BaseReserve: 10,
            OwnerReserve: 2,
        });
    });

    describe('Not Hooks enabled network', () => {
        let isFeatureEnabledSpy: any;
        let prepareTxForHookFeeSpy: any;

        beforeAll(() => {
            // set the network as normal network without hooks amendment
            isFeatureEnabledSpy = jest
                .spyOn(networkService.network, 'isFeatureEnabled')
                .mockImplementation(() => false);
            isFeatureEnabledSpy = jest.spyOn(networkService.network, 'isFeatureEnabled').mockImplementation(() => true);
            prepareTxForHookFeeSpy = jest.spyOn(FeeUtils, 'PrepareTxForHookFee').mockImplementation(() => 'SIGNED_TX');
        });

        afterAll(() => {
            isFeatureEnabledSpy.mockRestore();
            prepareTxForHookFeeSpy.mockRestore();
        });

        it('should return right calculated available fees', async () => {
            // normal network fees
            const spy0 = jest.spyOn(networkService, 'send').mockImplementation(() =>
                Promise.resolve({
                    drops: { base_fee: '15' },
                }),
            );

            const availableFees = await networkService.getAvailableNetworkFee({});

            expect(availableFees).toStrictEqual({
                availableFees: [
                    { type: 'LOW', value: '15' },
                    { type: 'MEDIUM', value: '20' },
                    { type: 'HIGH', value: '30' },
                ],
                feeHooks: 0,
                suggested: 'LOW',
            });

            spy0.mockRestore();
        });
    });

    describe('Hooks enabled network', () => {
        let isFeatureEnabledSpy: any;
        let prepareTxForHookFeeSpy: any;

        beforeAll(() => {
            // set the network as hook enabled network
            isFeatureEnabledSpy = jest.spyOn(networkService.network, 'isFeatureEnabled').mockImplementation(() => true);
            prepareTxForHookFeeSpy = jest.spyOn(FeeUtils, 'PrepareTxForHookFee').mockImplementation(() => 'SIGNED_TX');
        });

        afterAll(() => {
            isFeatureEnabledSpy.mockRestore();
            prepareTxForHookFeeSpy.mockRestore();
        });

        it('should return right calculated available fees', async () => {
            // normal network fees
            const spy0 = jest.spyOn(networkService, 'send').mockImplementation(() =>
                Promise.resolve({
                    drops: {
                        base_fee: 6186,
                    },
                    fee_hooks_feeunits: 6176,
                }),
            );

            const availableFees = await networkService.getAvailableNetworkFee({
                TransactionType: 'Payment',
            });

            expect(availableFees).toStrictEqual({
                availableFees: [
                    { type: 'LOW', value: '6186' },
                    { type: 'MEDIUM', value: '7500' },
                    { type: 'HIGH', value: '11000' },
                ],
                feeHooks: 6176,
                suggested: 'LOW',
            });

            spy0.mockRestore();
        });
    });
});
