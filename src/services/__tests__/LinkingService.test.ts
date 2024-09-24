import { Alert, Linking } from 'react-native';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';
import { Payload, PayloadOrigin, XAppOrigin } from '@common/libs/payload';
import * as CodecUtils from '@common/utils/codec';

import Localize from '@locale';

import LinkingService from '../LinkingService';
import NavigationService, { ComponentTypes, RootType } from '../NavigationService';

jest.useFakeTimers();

describe('LinkinService', () => {
    const service = LinkingService;

    describe('Service initialize', () => {
        it('should initialize and set root listener', async () => {
            const navigationServiceSpy = jest.spyOn(NavigationService, 'on');
            await service.initialize();
            expect(navigationServiceSpy).toHaveBeenCalledWith('setRoot', service.onRootChange);
            navigationServiceSpy.mockRestore();
        });

        it('should handle root change to default and add deep link listeners', () => {
            service.addDeepLinkListeners = jest.fn();
            service.onRootChange(RootType.DefaultRoot);
            expect(service.addDeepLinkListeners).toHaveBeenCalled();
        });

        it('should handle root change to non-default and remove deep link listeners', () => {
            service.removeDeepLinkListeners = jest.fn();
            service.onRootChange(RootType.OnboardingRoot);
            expect(service.removeDeepLinkListeners).toHaveBeenCalled();
        });

        it('should check and handle initial deep link', async () => {
            const mockUrl = 'some-mock-url';

            const handleDeepLinkSpy = jest.spyOn(service, 'handleDeepLink');
            const handleSpy = jest.spyOn(service, 'handle');
            const linkingSpy = jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(mockUrl);

            await service.checkInitialDeepLink();
            jest.runAllTimers();
            expect(handleSpy).toHaveBeenCalledWith(mockUrl);
            expect(handleDeepLinkSpy).toBeCalledWith({ url: mockUrl });

            handleDeepLinkSpy.mockRestore();
            linkingSpy.mockRestore();
        });
    });

    describe('Handle linking', () => {
        describe('Payload', () => {
            const mockURL = 'https://xaman.app/sign/511dc0b7-ef5c-4cc6-8eb5-7071133a86b4';

            it('should handle payload reference and navigate to review transaction screen', async () => {
                const mockPayload = {};

                const navigatorSpy = jest.spyOn(Navigator, 'showModal');
                const payloadSpy = jest.spyOn(Payload, 'from').mockResolvedValue({} as any);

                await service.handle(mockURL);

                expect(payloadSpy).toBeCalledWith('511dc0b7-ef5c-4cc6-8eb5-7071133a86b4', PayloadOrigin.DEEP_LINK);

                jest.runAllTimers();
                expect(navigatorSpy).toHaveBeenCalledWith(
                    AppScreens.Modal.ReviewTransaction,
                    {
                        componentType: ComponentTypes.Modal,
                        payload: mockPayload,
                    },
                    { modalPresentationStyle: 'fullScreen' },
                );

                navigatorSpy.mockRestore();
            });
        });
        describe('Signed Transaction', () => {
            const mockURL =
                'https://xaman.app/tx/1200032280000000240000003241833237B8665D2F4E00135E8DE646589F68400000000000000C732103709723A5967EAAED571B71DB511D87FA44CC7CDDF827A37F457A25E14D862BCD74473045022100C6A6999BD33153C6A236D78438D1BFEEEC810CFE05D0E41339B577560C9143CA022074F07881F559F56593FF680049C12FC3BCBB0B73CE02338651522891D95886F981146078086881F39B191D63B528D914FEA7F8CA2293F9EA7C06636C69656E747D15426974686F6D7020746F6F6C20762E20302E302E337E0A706C61696E2F74657874E1F1';

            it('should show an alert with cancel and submit buttons', () => {
                const alertSpy = jest.spyOn(Alert, 'alert');

                service.handle(mockURL);

                expect(alertSpy).toHaveBeenCalledWith(
                    Localize.t('global.signedTransaction'),
                    Localize.t('global.signedTransactionDetectedSubmit'),
                    expect.arrayContaining([
                        expect.objectContaining({ text: Localize.t('global.cancel') }),
                        expect.objectContaining({
                            text: Localize.t('global.submit'),
                            style: 'default',
                            onPress: expect.any(Function),
                        }),
                    ]),
                    { cancelable: false },
                );

                alertSpy.mockRestore();
            });
            it('should handle signed transaction and navigate to transaction submit modal', () => {
                const navigatorSpy = jest.spyOn(Navigator, 'showModal');
                Alert.alert = (title, message, buttons) => {
                    buttons?.[1].onPress?.();
                };
                service.handle(mockURL);
                jest.runAllTimers();
                expect(navigatorSpy).toHaveBeenCalledWith(
                    AppScreens.Modal.Submit,
                    {
                        componentType: ComponentTypes.Modal,
                        // eslint-disable-next-line max-len
                        txblob: '1200032280000000240000003241833237B8665D2F4E00135E8DE646589F68400000000000000C732103709723A5967EAAED571B71DB511D87FA44CC7CDDF827A37F457A25E14D862BCD74473045022100C6A6999BD33153C6A236D78438D1BFEEEC810CFE05D0E41339B577560C9143CA022074F07881F559F56593FF680049C12FC3BCBB0B73CE02338651522891D95886F981146078086881F39B191D63B528D914FEA7F8CA2293F9EA7C06636C69656E747D15426974686F6D7020746F6F6C20762E20302E302E337E0A706C61696E2F74657874E1F1',
                    },
                    { modalPresentationStyle: 'fullScreen' },
                );
                navigatorSpy.mockRestore();
            });
        });
        describe('XRPL Destination', () => {
            it('should route user to Payment screen with payId', async () => {
                const navigatorSpy = jest.spyOn(Navigator, 'push');
                const mockDestination = {
                    payId: 'user$payid.com',
                };
                await service.handleXrplDestination(mockDestination);
                jest.runAllTimers();
                expect(navigatorSpy).toHaveBeenCalledWith(
                    AppScreens.Transaction.Payment,
                    {
                        componentType: ComponentTypes.Screen,
                        scanResult: { to: mockDestination.payId },
                    },
                    {},
                );
            });

            it('should route user to Payment screen with destination info and valid amount', async () => {
                const navigatorSpy = jest.spyOn(Navigator, 'push');
                const mockURL =
                    'https://xaman.app/detect/request:rwietsevLFg8XSmG3bEZzFein1g8RBqWDZ?dt=123&amount=1.337';

                const destination = {
                    to: 'rwietsevLFg8XSmG3bEZzFein1g8RBqWDZ',
                    tag: 123,
                    amount: '1.337',
                };

                jest.spyOn(CodecUtils, 'NormalizeDestination').mockReturnValue({
                    to: destination.to,
                    tag: destination.tag,
                });

                await service.handle(mockURL);
                jest.runAllTimers();
                expect(navigatorSpy).toHaveBeenCalledWith(
                    AppScreens.Transaction.Payment,
                    {
                        componentType: ComponentTypes.Screen,
                        scanResult: {
                            to: destination.to,
                            tag: destination.tag,
                        },
                        amount: destination.amount,
                    },
                    {},
                );
            });
        });
        describe('XApp', () => {
            const mockURL = 'https://xaman.app/detect/xapp:xumm.sample.giraffe?test=true&blah=hi';

            it('should handle xapp link and navigate to XApp browser modal', async () => {
                const mockParams = {
                    xapp: 'xumm.sample.giraffe',
                    params: {
                        test: 'true',
                        blah: 'hi',
                    },
                };

                const navigatorSpy = jest.spyOn(Navigator, 'showModal');

                await service.handle(mockURL);

                jest.runAllTimers();
                expect(navigatorSpy).toHaveBeenCalledWith(
                    AppScreens.Modal.XAppBrowser,
                    {
                        componentType: ComponentTypes.Modal,
                        identifier: mockParams.xapp,
                        origin: XAppOrigin.DEEP_LINK,
                        originData: { url: mockURL },
                        params: mockParams.params,
                    },
                    { modalTransitionStyle: 'coverVertical', modalPresentationStyle: 'fullScreen' },
                );

                navigatorSpy.mockRestore();
            });
        });
        describe('Alternative Codec', () => {
            it('should handle alternative codec and navigate to account import screen', async () => {
                const mockURL =
                    'https://xaman.app/detect/secret?type=alt-family-seed&name=CasinoCoin&alphabet=cpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2brdeCg65jkm8oFqi1tuvAxyz&someParam=true';
                const mockParsed = {
                    name: 'CasinoCoin',
                    alphabet: 'cpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2brdeCg65jkm8oFqi1tuvAxyz',
                    params: {
                        someParam: 'true',
                    },
                };

                const navigatorSpy = jest.spyOn(Navigator, 'push');
                const handlerSpy = jest.spyOn(service, 'handleAlternativeSeedCodec');

                service.handle(mockURL);

                jest.runAllTimers();

                expect(handlerSpy).toBeCalledWith(mockParsed);
                expect(navigatorSpy).toHaveBeenCalledWith(
                    AppScreens.Account.Import,
                    {
                        componentType: ComponentTypes.Screen,
                        alternativeSeedAlphabet: mockParsed,
                    },
                    {},
                );

                navigatorSpy.mockRestore();
            });
        });
        describe('Xaman Feature', () => {
            const mockURL = 'https://xaman.app/detect/feature:secret?type=offline-secret-numbers';

            it('should show an alert with cancel and continue buttons', () => {
                const alertSpy = jest.spyOn(Alert, 'alert');

                service.handle(mockURL);

                expect(alertSpy).toHaveBeenCalledWith(
                    Localize.t('global.warning'),
                    Localize.t('account.importSecretWithoutChecksumWarning'),
                    expect.arrayContaining([
                        expect.objectContaining({ text: Localize.t('global.cancel') }),
                        expect.objectContaining({
                            text: Localize.t('global.continue'),
                            style: 'destructive',
                            onPress: expect.any(Function),
                        }),
                    ]),
                    { type: 'default', userInterfaceStyle: 'light' },
                );

                alertSpy.mockRestore();
            });

            it('should handle Xaman feature and route to account import screen', () => {
                const navigatorSpy = jest.spyOn(Navigator, 'push');
                Alert.alert = (title, message, buttons) => {
                    buttons?.[1].onPress?.();
                };
                service.handle(mockURL);
                jest.runAllTimers();
                expect(navigatorSpy).toHaveBeenCalledWith(
                    AppScreens.Account.Import,
                    {
                        componentType: ComponentTypes.Screen,
                        importOfflineSecretNumber: true,
                    },
                    {},
                );
                navigatorSpy.mockRestore();
            });
        });
    });
});
