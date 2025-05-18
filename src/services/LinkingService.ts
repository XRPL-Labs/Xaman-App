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
import { TrustSet } from '@common/libs/ledger/transactions';
import NetworkService from './NetworkService';
import { NetworkRepository } from '@store/repositories';
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

        let amount: any;

        const { to, tag } = NormalizeDestination(destination);

        // if amount present as native currency and valid amount
        if (
            !destination.currency &&
            typeof destination.amount !== 'undefined' &&
            StringTypeCheck.isValidAmount(destination.amount)
        ) {
            amount = destination.amount;
        }

        const _continue = async () => {
            // console.log('continue');
            await this.routeUser(
                AppScreens.Transaction.Payment,
                {
                    scanResult: {
                        to,
                        tag,
                    },
                    amount,
                },
                {},
                ComponentTypes.Screen,
            );
        };

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
