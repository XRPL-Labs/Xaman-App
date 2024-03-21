import NetworkRepository from '@store/repositories/network';

import NetworkService from '../NetworkService';

import * as FeeUtils from '@common/utils/fee';

describe('NetworkService', () => {
    const networkService = NetworkService;

    beforeAll(() => {
        const logFn = console.warn;
        jest.spyOn(console, 'warn').mockImplementation((...args) => {
            if (typeof args[0] === 'string' && args[0].match(/server_definitions got invalid/)) {
                return;
            }

            logFn(...args);
        });
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

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

    describe('Update network definitions', () => {
        it('updates network definitions correctly', async () => {
            const returnedResponse = {
                TYPES: {},
                TRANSACTION_RESULTS: {},
                TRANSACTION_TYPES: {},
                LEDGER_ENTRY_TYPES: {},
                FIELDS: [],
                hash: 'DEFINITIONS_HASH',
                // other
                id: 'id',
                __replyMs: 0,
                __command: '__command',
                __networkId: 0,
                inLedger: 0,
            };

            jest.replaceProperty(networkService, 'network', {
                // @ts-ignore
                id: 'object_id',
                networkId: 1337,
            });

            const spy0 = jest.spyOn(networkService, 'send').mockImplementation(() => Promise.resolve(returnedResponse));
            const spy1 = jest.spyOn(NetworkRepository, 'update').mockImplementation(jest.fn());

            await networkService.updateNetworkDefinitions();

            expect(spy0).toHaveBeenCalledWith({ command: 'server_definitions' });
            expect(spy1).toHaveBeenCalledWith({
                id: 'object_id',
                definitionsString: JSON.stringify({
                    TYPES: returnedResponse.TYPES,
                    TRANSACTION_RESULTS: returnedResponse.TRANSACTION_RESULTS,
                    TRANSACTION_TYPES: returnedResponse.TRANSACTION_TYPES,
                    LEDGER_ENTRY_TYPES: returnedResponse.LEDGER_ENTRY_TYPES,
                    FIELDS: returnedResponse.FIELDS,
                    hash: returnedResponse.hash,
                }),
            });

            spy0.mockRestore();
            spy1.mockRestore();
        });

        it('warns on invalid response', async () => {
            const invalidResponses = [{ error: 'some error' }, 'invalid resp', {}] as any;

            // eslint-disable-next-line guard-for-in
            for (const resp of invalidResponses) {
                const spy0 = jest.spyOn(networkService, 'send').mockImplementation(() => Promise.resolve(resp));
                // @ts-ignore
                const spy1 = jest.spyOn(NetworkService.logger, 'warn');
                const spy2 = jest.spyOn(NetworkRepository, 'update');

                await networkService.updateNetworkDefinitions();

                expect(spy0).toHaveBeenCalledWith({ command: 'server_definitions' });
                expect(spy1).toHaveBeenCalledWith('server_definitions got invalid response:', resp);
                expect(spy2).not.toHaveBeenCalled();

                spy0.mockRestore();
                spy1.mockRestore();
            }
        });

        it('returns early when hash has not changed', async () => {
            const returnedResponse = {
                TYPES: {},
                TRANSACTION_RESULTS: {},
                TRANSACTION_TYPES: {},
                LEDGER_ENTRY_TYPES: {},
                FIELDS: [],
                hash: 'SOME_HASH',
                // other
                id: 'id',
                __replyMs: 0,
                __command: '__command',
                __networkId: 0,
                inLedger: 0,
            };

            const spy0 = jest.spyOn(networkService, 'send').mockImplementation(() => Promise.resolve(returnedResponse));
            const spy1 = jest.spyOn(NetworkRepository, 'update');

            // @ts-ignore
            jest.replaceProperty(networkService, 'network', {
                definitions: {
                    hash: 'SOME_HASH',
                },
                isFeatureEnabled: jest.fn(),
            });

            await networkService.updateNetworkDefinitions();

            expect(spy0).toHaveBeenCalledWith({ command: 'server_definitions', hash: 'SOME_HASH' });
            expect(spy1).toHaveBeenCalledTimes(0);

            spy0.mockRestore();
            spy1.mockRestore();
        });

        it('validates the response object', async () => {
            const returnedResponse = {
                TYPES: 'should be object',
                TRANSACTION_RESULTS: {},
                TRANSACTION_TYPES: {},
                LEDGER_ENTRY_TYPES: {},
                FIELDS: [],
                hash: 'SOME_HASH',
                // other
                id: 'id',
                __replyMs: 0,
                __command: '__command',
                __networkId: 0,
                inLedger: 0,
            };

            // @ts-ignore
            jest.replaceProperty(networkService, 'network', {
                definitions: undefined,
                isFeatureEnabled: jest.fn(),
            });

            const spy0 = jest.spyOn(networkService, 'send').mockImplementation(() => Promise.resolve(returnedResponse));
            const spy1 = jest.spyOn(NetworkRepository, 'update');
            // @ts-ignore
            const spy2 = jest.spyOn(NetworkService.logger, 'warn');

            await networkService.updateNetworkDefinitions();

            expect(spy0).toHaveBeenCalledWith({ command: 'server_definitions' });
            expect(spy1).not.toHaveBeenCalled();
            expect(spy2).toHaveBeenCalledWith('server_definitions got invalid format:', returnedResponse);

            spy0.mockRestore();
            spy1.mockRestore();
            spy2.mockRestore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });
    });

    describe('Calculate fee', () => {
        describe('Not Hooks enabled network', () => {
            let isFeatureEnabledSpy: any;
            let prepareTxForHookFeeSpy: any;

            beforeAll(() => {
                // set the network as normal network without hooks amendment
                isFeatureEnabledSpy = jest
                    .spyOn(networkService.network, 'isFeatureEnabled')
                    .mockImplementation(() => false);
                isFeatureEnabledSpy = jest
                    .spyOn(networkService.network, 'isFeatureEnabled')
                    .mockImplementation(() => true);
                prepareTxForHookFeeSpy = jest
                    .spyOn(FeeUtils, 'PrepareTxForHookFee')
                    .mockImplementation(() => 'SIGNED_TX');
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
                    } as any),
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
                isFeatureEnabledSpy = jest
                    .spyOn(networkService.network, 'isFeatureEnabled')
                    .mockImplementation(() => true);
                prepareTxForHookFeeSpy = jest
                    .spyOn(FeeUtils, 'PrepareTxForHookFee')
                    .mockImplementation(() => 'SIGNED_TX');
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
                            base_fee: '6176',
                        },
                        fee_hooks_feeunits: '6186',
                    } as any),
                );

                const availableFees = await networkService.getAvailableNetworkFee({
                    TransactionType: 'Payment',
                });

                expect(availableFees).toStrictEqual({
                    availableFees: [
                        { type: 'LOW', value: '6176' },
                        { type: 'MEDIUM', value: '7500' },
                        { type: 'HIGH', value: '11000' },
                    ],
                    feeHooks: 10,
                    suggested: 'LOW',
                });

                spy0.mockRestore();
            });
        });
    });
});
