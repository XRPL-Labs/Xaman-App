/**
 * DeepLink service
 * handle app deep linking
 */
import { Linking, Alert, EmitterSubscription } from 'react-native';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { StringTypeDetector, StringDecoder, StringType, XrplDestination, PayId } from 'xumm-string-decode';

import NavigationService, { ComponentTypes, RootType } from '@services/NavigationService';

import { Payload, PayloadOrigin, XAppOrigin } from '@common/libs/payload';
import { Navigator, AppScreenKeys } from '@common/helpers/navigator';
import { Prompt } from '@common/helpers/interface';
import { AppScreens } from '@common/constants';

import { NormalizeDestination } from '@common/utils/codec';
import { StringTypeCheck } from '@common/utils/string';

import Localize from '@locale';
import { Payment, PaymentValidation, TrustSet } from '@common/libs/ledger/transactions';
import NetworkService from './NetworkService';
import { CoreRepository, NetworkRepository } from '@store/repositories';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
// import { ReviewTransactionModalProps } from '@screens/Modal/ReviewTransaction';
import { AmountParser } from '@common/libs/ledger/parser/common';
// import { ReviewTransactionModalProps } from '@screens/Modal/ReviewTransaction';

/* Service  ==================================================================== */
class LinkingService {
    private initialURL?: string;
    private eventListener: EmitterSubscription | undefined;

    initialize = () => {
        return new Promise<void>((resolve, reject) => {
            try {
                // listen for root changes
                NavigationService.on('setRoot', this.onRootChange);
                // resolve
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    };

    onRootChange = (root: RootType) => {
        if (root === RootType.DefaultRoot) {
            // Listen for deep link as the app is open
            this.addDeepLinkListeners();
        } else {
            this.removeDeepLinkListeners();
        }
    };

    addDeepLinkListeners = () => {
        this.eventListener = Linking.addEventListener('url', this.handleDeepLink);
    };

    removeDeepLinkListeners = () => {
        if (this.eventListener) {
            this.eventListener.remove();
        }
    };

    checkInitialDeepLink = () => {
        // handle if app opens with link
        Linking.getInitialURL().then((url) => {
            if (url && this.initialURL !== url) {
                this.initialURL = url;

                setTimeout(() => {
                    this.handleDeepLink({ url });
                }, 100);
            }
        });
    };

    routeUser = async (screen: AppScreenKeys, passProps: any, options: any, screenType?: ComponentTypes) => {
        // close any overlay
        const currentOverlay = NavigationService.getCurrentOverlay();

        if (currentOverlay && currentOverlay !== AppScreens.Overlay.Lock) {
            // dismiss overlay
            await Navigator.dismissOverlay();
        }

        if (!screenType) {
            screenType = NavigationService.getComponentType(screen);
        }

        if (screenType === ComponentTypes.Modal) {
            setTimeout(() => {
                Navigator.showModal(screen, passProps, options);
            }, 10);
        } else if (screenType === ComponentTypes.Screen) {
            setTimeout(() => {
                Navigator.push(screen, passProps, options);
            }, 10);
        }
    };

    handlePayloadReference = async (uuid: string) => {
        try {
            // check if uuid is valid uuidv4 string
            if (!StringTypeCheck.isValidUUID(uuid)) {
                return;
            }

            // fetch the payload
            const payload = await Payload.from(uuid, PayloadOrigin.DEEP_LINK);

            // review the transaction
            await this.routeUser(
                AppScreens.Modal.ReviewTransaction,
                { payload },
                { modalPresentationStyle: 'fullScreen' },
                ComponentTypes.Modal,
            );
        } catch (error: any) {
            Alert.alert(Localize.t('global.error'), error?.message, [{ text: 'OK' }], { cancelable: false });
        }
    };

    handleSignedTransaction = (txblob: string) => {
        Alert.alert(
            Localize.t('global.signedTransaction'),
            Localize.t('global.signedTransactionDetectedSubmit'),
            [
                {
                    text: Localize.t('global.cancel'),
                },
                {
                    text: Localize.t('global.submit'),
                    onPress: () => {
                        this.routeUser(
                            AppScreens.Modal.Submit,
                            { txblob },
                            { modalPresentationStyle: 'fullScreen' },
                            ComponentTypes.Modal,
                        );
                    },
                    style: 'default',
                },
            ],
            { cancelable: false },
        );
    };

    handleXrplDestination = async (destination: XrplDestination & PayId): Promise<any> => {
        if (destination.payId) {
            await this.routeUser(
                AppScreens.Transaction.Payment,
                {
                    scanResult: {
                        to: destination.payId,
                    },
                },
                {},
                ComponentTypes.Screen,
            );
            return;
        }

        const { to, tag } = NormalizeDestination(destination);

        const _continue = async () => {
            // console.log('c', to, tag);
            // console.log('continue');
            // Traditional regular payment
            // await this.routeUser(
            //     AppScreens.Transaction.Payment,
            //     {
            //         scanResult: {
            //             to,
            //             tag,
            //         },
            //         amount,
            //     },
            //     {},
            //     ComponentTypes.Screen,
            // );
            // We do partial now
            // console.log(to, tag, amount, destination.currency, destination.issuer);

            const payment = new Payment({
                TransactionType: TransactionTypes.Payment,
                Account: CoreRepository.getDefaultAccount().address,
                Destination: to,
                Amount: !destination?.amount
                    ? '1'
                    : destination?.currency && destination?.issuer
                      ? {
                            currency: destination?.currency,
                            issuer: destination?.issuer,
                            value: String(destination?.amount),
                        }
                      : new AmountParser(destination.amount || 0, false).nativeToDrops().toString(),
            });

            // const p = Payload.build(
            //     {
            //         TransactionType: TransactionTypes.Payment,
            //         Account: CoreRepository.getDefaultAccount().address,
            //         Destination: to,
            //         Amount: !destination?.amount
            //             ? '1'
            //             : destination?.currency && destination?.issuer
            //               ? {
            //                     currency: destination?.currency,
            //                     issuer: destination?.issuer,
            //                     value: String(destination?.amount),
            //                 }
            //               : new AmountParser(destination.amount || 0).nativeToDrops().toString(),
            //     },
            //     undefined, // Custom instruction
            //     true, // Submit
            //     true, // Pathfinding
            // );

            // console.log(p.getTransaction().JsonForSigning);
            // console.log(p.getTransaction().JsonRaw);

            if (typeof tag !== 'undefined' && tag !== 0) {
                payment.DestinationTag = Number(destination.tag);
            }

            // payment.Flags = {
            //     tfPartialPayment: true,
            // };

            // console.log(destination);
            if (
                destination?.invoiceid &&
                String(destination?.invoiceid)
                    .trim()
                    .match(/^[A-F0-9]{64}$/i)
            ) {
                payment.InvoiceID = destination.invoiceid.trim();
            }

            // console.log('x', payment);

            // // set the amount
            // if (typeof destination.currency === 'string') {
            //     // IOU
            //     // if issuer has transfer fee and sender/destination is not issuer, add partial payment flag
            // } else {
            //     payment.DeliverMin = {
            //         currency: NetworkService.getNativeAsset(),
            //         value: amount,
            //     };
            // }

            // set the calculated and selected fee
            // payment.Fee = {
            //     currency: NetworkService.getNativeAsset(),
            //     value: new AmountParser(selectedFee!.value).dropsToNative().toFixed(),
            // };

            // // set memo if any
            // if (memo) {
            //     payment.Memos = [Memo.Encode(memo)];
            // } else if (payment.Memos) {
            //     payment.Memos = [];
            // }

            // console.log(payment);
            // validate payment for all possible mistakes
            try {
                await PaymentValidation(payment);
                // console.log(validation);
            } catch (error: any) {
                // console.log(error);
                Alert.alert(Localize.t('global.error'), error?.message, [{ text: 'OK' }], { cancelable: false });
                return;
            }

            // console.log('e');

            // sign the transaction and then submit
            // await payment.sign(source!).then(this.submit);
            const payload = Payload.build(
                {
                    ...payment.JsonForSigning,
                    ...(!destination?.amount ? { Amount: undefined } : {}),
                },
                undefined, // Custom instruction
                true, // Submit
                true, // Pathfinding
            );

            Navigator.showModal(
                AppScreens.Modal.ReviewTransaction,
                {
                    payload,
                    // onResolve: (e) => console.log('yesyes', e), // Done here
                    // onClose: (e) => console.log('lolno', e), // Done here
                },
                { modalPresentationStyle: OptionsModalPresentationStyle.fullScreen },
            );
        };

        // console.log('a');

        if (destination?.network) {
            const currentNetwork = NetworkService.getNetwork();
            if (destination.network !== currentNetwork?.key) {
                const wantsNetwork = await NetworkRepository.findBy('key', destination.network.toUpperCase());
                if (wantsNetwork?.[0]?.key) {
                    // eslint-disable-next-line consistent-return
                    return Navigator.showAlertModal({
                        type: 'warning',
                        title: Localize.t('global.switchNetwork'),
                        text: Localize.t('settings.disableDeveloperModeRevertNetworkWarning', {
                            currentNetwork: currentNetwork.name,
                            defaultNetwork: wantsNetwork[0].name,
                        }),
                        buttons: [
                            {
                                text: Localize.t('global.cancel'),
                                type: 'dismiss',
                                light: true,
                            },
                            {
                                text: Localize.t('global.continue'),
                                onPress: async () => {
                                    // console.log('switchnetwork, then request');
                                    await NetworkService.switchNetwork(wantsNetwork[0]);
                                    requestAnimationFrame(() => {
                                        _continue();
                                    });
                                },
                                type: 'continue',
                                light: false,
                            },
                        ],
                    });
                }
            }
        }
        // console.log('b');
        // eslint-disable-next-line consistent-return
        return _continue();
    };

    handleXAPPLink = async (url: string, parsed: { xapp: string; params: any }) => {
        const { xapp, params } = parsed;

        if (!xapp) return;

        let delay = 0;
        // if already in xapp try to load the xApp from notification
        if (NavigationService.getCurrentModal() === AppScreens.Modal.XAppBrowser) {
            await Navigator.dismissModal();
            // looks like a bug in navigation library, need to add a delay before showing the modal
            delay = 300;
        }

        setTimeout(() => {
            this.routeUser(
                AppScreens.Modal.XAppBrowser,
                {
                    identifier: xapp,
                    origin: XAppOrigin.DEEP_LINK,
                    originData: { url },
                    params,
                },
                {
                    modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                    modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                },
                ComponentTypes.Modal,
            );
        }, delay);
    };

    handleAlternativeSeedCodec = (parsed: {
        name: string;
        alphabet: string | boolean;
        params?: Record<string, unknown>;
    }) => {
        const { alphabet } = parsed;
        if (alphabet) {
            this.routeUser(
                AppScreens.Account.Import,
                {
                    alternativeSeedAlphabet: parsed,
                },
                {},
                ComponentTypes.Screen,
            );
        }
    };

    handleXamanFeature = (parsed: { feature: string; type: string; params?: Record<string, unknown> }) => {
        const { feature, type } = parsed;

        // Feature: allow import of Secret Numbers without Checksum
        if (feature === 'secret' && type === 'offline-secret-numbers') {
            Prompt(
                Localize.t('global.warning'),
                Localize.t('account.importSecretWithoutChecksumWarning'),
                [
                    {
                        text: Localize.t('global.cancel'),
                    },
                    {
                        text: Localize.t('global.continue'),
                        style: 'destructive',
                        onPress: () => {
                            this.routeUser(
                                AppScreens.Account.Import,
                                {
                                    importOfflineSecretNumber: true,
                                },
                                {},
                                ComponentTypes.Screen,
                            );
                        },
                    },
                ],
                { type: 'default' },
            );
        }
    };

    handleTransactionTemplate = (parsed: any) => {
        let errorMsg = Localize.t('global.theQRIsNotWhatWeExpect');

        try {
            const str = Buffer.from(String(parsed?.jsonhex || ''), 'hex').toString('utf-8');
            const json = JSON.parse(str);

            if (
                json?.NetworkID !== NetworkService.getNetwork().networkId ||
                (NetworkService.getNetwork().networkId > 1024 && !json?.NetworkID)
            ) {
                errorMsg = Localize.t('payload.payloadForceNetworkError');
                throw new Error('Invalid network');
            }

            if (json?.TransactionType === 'TrustSet') {
                const trustSet = new TrustSet(json);

                const payload = Payload.build(
                    trustSet.JsonForSigning,
                    Localize.t('asset.addingAssetReserveDescription', {
                        ownerReserve: NetworkService.getNetworkReserve().OwnerReserve,
                        nativeAsset: NetworkService.getNativeAsset(),
                    }),
                );

                setTimeout(() => {
                    Navigator.showModal(
                        AppScreens.Modal.ReviewTransaction,
                        {
                            payload,
                        },
                        { modalPresentationStyle: OptionsModalPresentationStyle.fullScreen },
                    );
                }, 800);

                return;
            }

            throw new Error('Invalid transaction template');
        } catch (e) {
            //
        }

        setTimeout(() => {
            Prompt(Localize.t('global.error'), errorMsg, [{ text: 'OK' }], {
                cancelable: false,
                type: 'default',
            });
        }, 800);
    };

    handle = (url: string) => {
        const detected = new StringTypeDetector(url);
        const parsed = new StringDecoder(detected).getAny();

        // the screen will handle the content
        switch (detected.getType()) {
            case StringType.XrplTransactionTemplate:
                this.handleTransactionTemplate(parsed);
                break;
            case StringType.XummPayloadReference:
                this.handlePayloadReference(parsed.uuid);
                break;
            case StringType.XrplSignedTransaction:
                this.handleSignedTransaction(parsed.txblob);
                break;
            case StringType.XrplDestination:
            case StringType.PayId:
                this.handleXrplDestination(parsed);
                break;
            case StringType.XummXapp:
                this.handleXAPPLink(url, parsed);
                break;
            case StringType.XrplAltFamilySeedAlphabet:
                this.handleAlternativeSeedCodec(parsed);
                break;
            case StringType.XummFeature:
                this.handleXamanFeature(parsed);
                break;
            default:
                break;
        }
    };

    handleDeepLink = async ({ url }: { url: string }) => {
        // ignore if the app is not initialized or not url
        if (!url || typeof url !== 'string') return;

        this.handle(url);
    };
}

export default new LinkingService();
