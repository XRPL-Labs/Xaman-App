/**
 * Scan Modal
 */

import React, { Component } from 'react';
import { View, Platform, ImageBackground, Text, Linking, BackHandler, NativeEventSubscription } from 'react-native';

import {
    Navigation,
    EventSubscription,
    OptionsModalPresentationStyle,
    OptionsModalTransitionStyle,
} from 'react-native-navigation';
import { RNCamera, GoogleVisionBarcodesDetectedEvent, BarCodeReadEvent } from 'react-native-camera';
import { StringTypeDetector, StringDecoder, StringType, XrplDestination, PayId } from 'xumm-string-decode';

import { StyleService, BackendService, NetworkService } from '@services';

import { AccountRepository, CoreRepository } from '@store/repositories';

import { AppScreens } from '@common/constants';

import { VibrateHapticFeedback, Prompt } from '@common/helpers/interface';
import { AppScreenKeys, Navigator } from '@common/helpers/navigator';
import { Clipboard } from '@common/helpers/clipboard';

import { NormalizeDestination } from '@common/utils/codec';
import { StringTypeCheck } from '@common/utils/string';

import { Payload, PayloadOrigin, XAppOrigin } from '@common/libs/payload';

import Localize from '@locale';

// components
import { Button, Spacer, Icon, LoadingIndicator } from '@components/General';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
import { Props, State } from './types';
import { TrustSet } from '@common/libs/ledger/transactions';
import { ReviewTransactionModalProps } from '../ReviewTransaction';

/* Component ==================================================================== */
class ScanModal extends Component<Props, State> {
    static screenName = AppScreens.Modal.Scan;

    private shouldRead: boolean;
    private screenVisible: boolean;
    private backHandler: NativeEventSubscription | undefined;
    private shouldReadTimeout: NodeJS.Timeout | undefined;
    private navigationListener?: EventSubscription;

    static options() {
        return {
            topBar: {
                visible: false,
            },
            statusBar: {
                style: 'light',
            },
        };
    }

    constructor(props: Props) {
        super(props);
        this.state = {
            isLoading: false,
            coreSettings: CoreRepository.getSettings(),
        };

        // flag to check if we need to read the QR
        this.shouldRead = true;

        // keep track of component visibility
        this.screenVisible = false;
    }

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.onClose);
        this.navigationListener = Navigation.events().bindComponent(this);
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }

        if (this.shouldReadTimeout) clearTimeout(this.shouldReadTimeout);

        if (this.navigationListener) {
            this.navigationListener.remove();
        }
    }

    componentDidAppear() {
        this.screenVisible = true;
    }

    componentDidDisappear() {
        // disable qr code reading if component is not visible
        this.screenVisible = false;
    }

    setShouldRead = (value: boolean) => {
        this.shouldRead = value;
    };

    routeUser = async (screen: AppScreenKeys, passProps?: any, options?: any) => {
        // close scan modal
        await Navigator.dismissModal();

        // got to the root, this is for fallback option
        try {
            await Navigator.popToRoot();
        } catch {
            // ignore
        }

        if (screen.indexOf('modal.') !== -1) {
            setTimeout(() => {
                Navigator.showModal(screen, passProps, options);
            }, 10);
        } else {
            setTimeout(() => {
                Navigator.push(screen, passProps, options);
            }, 10);
        }
    };

    loadTranslation = (uuid: string) => {
        this.setState({
            isLoading: true,
        });

        BackendService.getTranslation(uuid)
            .then((res: any) => {
                const { meta, translation } = res;

                if (meta && meta.valid) {
                    // set the new local bundle
                    Localize.setLocaleBundle(meta.language, translation);
                    // re-render the app
                    Navigator.reRender();
                    // close scan modal
                    Navigator.dismissModal();
                } else {
                    Prompt(
                        'Error',
                        'Unable to load the translations, the request is not valid!',
                        [{ text: 'OK', onPress: () => this.setShouldRead(true) }],
                        { cancelable: false, type: 'default' },
                    );
                }
            })
            .catch(() => {
                // ignore
                Prompt(
                    'Error',
                    'Unable to load the translations, Please try again!',
                    [{ text: 'OK', onPress: () => this.setShouldRead(true) }],
                    { cancelable: false, type: 'default' },
                );
            })
            .finally(() => {
                this.setState({
                    isLoading: false,
                });
            });
    };

    handleTranslationBundle = async (uuid: string) => {
        // no uuid exist
        if (!uuid) {
            this.setShouldRead(true);
            return;
        }

        Prompt(
            'Translation detected',
            'XUMM Translation Portal language file detected. Do you want to load it into the app?' +
                '(To revert to the default translation, force quit XUMM and start XUMM again)',
            [
                {
                    text: 'Cancel',
                    onPress: () => {
                        this.setShouldRead(true);
                    },
                },
                {
                    text: 'Do it',
                    onPress: () => {
                        this.loadTranslation(uuid);
                    },
                    style: 'default',
                },
            ],
            { cancelable: false, type: 'default' },
        );
    };

    handlePayloadReference = async (uuid: string) => {
        // double check if uuid is valid string
        if (!StringTypeCheck.isValidUUID(uuid)) {
            return;
        }

        this.setState({
            isLoading: true,
        });

        try {
            // fetch the payload
            const payload = await Payload.from(uuid, PayloadOrigin.QR);

            // review the transaction
            await this.routeUser(
                AppScreens.Modal.ReviewTransaction,
                {
                    payload,
                },
                { modalPresentationStyle: 'fullScreen' },
            );
        } catch (e: any) {
            Prompt(Localize.t('global.error'), e.message, [{ text: 'OK', onPress: () => this.setShouldRead(true) }], {
                cancelable: false,
                type: 'default',
            });
            this.setState({
                isLoading: false,
            });
        }
    };

    handleTransactionTemplate = (parsed: any) => {
        try {
            const str = Buffer.from(String(parsed?.jsonhex || ''), 'hex').toString('utf-8');   
            const json = JSON.parse(str);
            if (json?.TransactionType === 'TrustSet') {
                const trustSet = new TrustSet(json);
        
                const payload = Payload.build(
                    trustSet.JsonForSigning,
                    Localize.t('asset.addingAssetReserveDescription', {
                        ownerReserve: NetworkService.getNetworkReserve().OwnerReserve,
                        nativeAsset: NetworkService.getNativeAsset(),
                    }),
                );
        
                this.setShouldRead(false);

                setTimeout(() => {
                    Navigator.showModal<ReviewTransactionModalProps<TrustSet>>(
                        AppScreens.Modal.ReviewTransaction,
                        {
                            payload,
                        },
                        { modalPresentationStyle: OptionsModalPresentationStyle.fullScreen },
                    );
                }, 800);

                this.onClose();

                return;
            }
            
            throw new Error('Invalid transaction template');
        } catch (e) {
            //
        }

        Prompt(
            Localize.t('global.error'),
            Localize.t('global.theQRIsNotWhatWeExpect'),
            [{ text: 'OK', onPress: () => this.setShouldRead(true) }],
            {
                cancelable: false,
                type: 'default',
            },
        );
    };

    handleSignedTransaction = (txblob: string) => {
        // normalize input
        let cleanBlob = txblob;

        // Bithomp txBlob contains json
        try {
            const parsedBlob = JSON.parse(txblob);
            cleanBlob = parsedBlob.signedTransaction;
        } catch {
            // ignore
        }

        Prompt(
            Localize.t('global.signedTransaction'),
            Localize.t('global.signedTransactionDetectedSubmit'),
            [
                {
                    text: Localize.t('global.cancel'),
                    onPress: () => {
                        this.setShouldRead(true);
                    },
                },
                {
                    text: Localize.t('global.submit'),
                    onPress: async () => {
                        await this.routeUser(
                            AppScreens.Modal.Submit,
                            {
                                txblob: cleanBlob,
                            },
                            { modalPresentationStyle: 'fullScreen' },
                        );
                    },
                    style: 'default',
                },
            ],
            { cancelable: false, type: 'default' },
        );
    };

    handleXrplDestination = async (destination: XrplDestination & PayId) => {
        // check if any account is configured
        const availableAccounts = AccountRepository.getSpendableAccounts();

        if (availableAccounts.length > 0) {
            // if it's payId do nothing
            if (destination.payId) {
                await this.routeUser(
                    AppScreens.Transaction.Payment,
                    {
                        scanResult: {
                            to: destination.payId,
                        },
                    },
                    {},
                );
                return;
            }

            let amount;

            // normal address scanned
            // try to decode X Address
            const { to, tag } = NormalizeDestination(destination);

            // unable to parse the address, probably not a valid address
            if (!to) {
                Prompt(
                    Localize.t('global.warning'),
                    Localize.t('scan.invalidQRTryNewOneOrTryAgain'),
                    [{ text: 'OK', onPress: () => this.setShouldRead(true) }],
                    {
                        cancelable: false,
                        type: 'default',
                    },
                );
                return;
            }

            // if amount present as native pass the amount
            if (destination.amount && !destination.currency && StringTypeCheck.isValidAmount(destination.amount)) {
                amount = destination.amount;
            }

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
            );
        } else {
            Prompt(
                Localize.t('global.error'),
                Localize.t('global.noSpendableAccountIsAvailableForSendingPayment'),
                [{ text: 'OK', onPress: () => this.setShouldRead(true) }],
                { cancelable: false, type: 'default' },
            );
        }
    };

    handleXAPPLink = (content: string, parsed: { xapp: string; path: string; params: any }) => {
        this.routeUser(
            AppScreens.Modal.XAppBrowser,
            {
                identifier: parsed.xapp,
                origin: XAppOrigin.QR,
                originData: { content },
                path: parsed.path,
                params: parsed.params,
            },
            {
                modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
            },
        );
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
            );
        } else {
            this.handleUndetectedType();
        }
    };

    handleXummFeature = (parsed: { feature: string; type: string; params?: Record<string, string> }) => {
        const { feature, type } = parsed;

        // Feature: allow import of Secret Numbers without Checksum
        if (feature === 'secret' && type === 'offline-secret-numbers') {
            Prompt(
                Localize.t('global.warning'),
                Localize.t('account.importSecretWithoutChecksumWarning'),
                [
                    {
                        text: Localize.t('global.cancel'),
                        onPress: () => this.setShouldRead(true),
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
                            );
                        },
                    },
                ],
                { type: 'default' },
            );
        }
    };

    handleUndetectedType = (content?: string, clipboard?: boolean) => {
        // some users scan QR on tangem card, navigate them to the account add screen
        if (content && ['https://xumm.app/tangem', 'https://xaman.app/tangem'].some((url) => content.startsWith(url))) {
            this.routeUser(AppScreens.Account.Add);
            return;
        }

        // To make sure users scanning our Knowledge Base / etc QRs with Xumm instead of OS (regular URLs)
        if (
            content &&
            ['https://xumm.app', 'https://help.xumm.app', 'https://xaman.app', 'https://help.xaman.app'].some((url) =>
                content.startsWith(url),
            )
        ) {
            if (StringTypeCheck.isValidURL(content)) {
                Linking.openURL(content);
                return;
            }
        }

        // show error message base on origin
        Prompt(
            Localize.t('global.warning'),
            clipboard
                ? Localize.t('scan.invalidClipboardDateTryNewOneOrTryAgain')
                : Localize.t('scan.invalidQRTryNewOneOrTryAgain'),
            [{ text: 'OK', onPress: () => this.setShouldRead(true) }],
            {
                cancelable: false,
                type: 'default',
            },
        );
    };

    handle = (content: string, clipboard?: boolean) => {
        const { onRead, type, fallback, blackList } = this.props;

        const detected = new StringTypeDetector(content);

        // normalize detected type
        let detectedType = detected.getType();

        if (detectedType === StringType.PayId) {
            detectedType = StringType.XrplDestination;
        }

        // if any black list defined check in the list
        if (!type && typeof onRead === 'function' && blackList) {
            if (blackList.indexOf(detectedType) === -1) {
                Navigator.dismissModal();
                onRead(content);
            } else {
                // if detected in black list just return and enable reading after 1 sec
                this.shouldReadTimeout = setTimeout(() => {
                    this.setShouldRead(true);
                }, 1000);
            }
            return;
        }

        // just return scanned content
        if (!type && typeof onRead === 'function') {
            Navigator.dismissModal();
            onRead(content);
            return;
        }

        const parsed = new StringDecoder(detected).getAny();

        // the other component wants to handle the decoded content
        if (detectedType === type && typeof onRead === 'function') {
            onRead(parsed);
            Navigator.dismissModal();
            return;
        }

        // fallback is not set
        // this is not the type we expected
        if (type && !fallback) {
            let message;

            switch (+type) {
                case StringType.XrplDestination:
                    message = clipboard
                        ? Localize.t('scan.theClipboardDataIsNotContainXamanPayload')
                        : Localize.t('scan.scannedQRIsNotAccountAddress', {
                              nativeAsset: NetworkService.getNativeAsset(),
                          });
                    break;
                case StringType.XummPayloadReference:
                    message = clipboard
                        ? Localize.t('scan.theClipboardDataIsNotContainAccountAddress', {
                              nativeAsset: NetworkService.getNativeAsset(),
                          })
                        : Localize.t('scan.scannedQRIsNotXamanPayload');
                    break;
                default:
                    message = clipboard
                        ? Localize.t('scan.theClipboardDataIsNotWhatWeExpect')
                        : Localize.t('scan.theQRIsNotWhatWeExpect');
            }

            Prompt(Localize.t('global.error'), message, [{ text: 'OK', onPress: () => this.setShouldRead(true) }], {
                cancelable: false,
                type: 'default',
            });
            return;
        }

        switch (detected.getType()) {
            case StringType.XummPayloadReference:
                this.handlePayloadReference(parsed.uuid);
                break;
            case StringType.XrplSignedTransaction:
                this.handleSignedTransaction(parsed.txblob);
                break;
            case StringType.XrplTransactionTemplate:
                this.handleTransactionTemplate(parsed);
                break;
            case StringType.XrplDestination:
            case StringType.PayId:
                this.handleXrplDestination(parsed);
                break;
            case StringType.XummTranslation:
                this.handleTranslationBundle(parsed.uuid);
                break;
            case StringType.XummXapp:
                this.handleXAPPLink(content, parsed);
                break;
            case StringType.XrplAltFamilySeedAlphabet:
                this.handleAlternativeSeedCodec(parsed);
                break;
            case StringType.XummFeature:
                this.handleXummFeature(parsed);
                break;
            default:
                this.handleUndetectedType(content, clipboard);
                break;
        }
    };

    onGoogleVisionBarcodesDetected = ({ barcodes }: GoogleVisionBarcodesDetectedEvent) => {
        // should ba array and not empty
        if (!Array.isArray(barcodes) || barcodes.length === 0) {
            return;
        }
        // get first barcode that exist
        const barcode = barcodes[0];

        // type check
        if (typeof barcode === 'object' && barcode?.data) {
            this.onReadCode(barcode?.data);
        }
    };

    onBarCodeRead = ({ data }: BarCodeReadEvent) => {
        if (data) {
            this.onReadCode(data);
        }
    };

    onReadCode = (data: string) => {
        const { coreSettings } = this.state;

        if (data) {
            // return if we don't need to read again
            if (!this.shouldRead || !this.screenVisible) return;

            // should not read anymore until we decide about detect value
            this.setShouldRead(false);

            // vibrate
            if (coreSettings.hapticFeedback) {
                VibrateHapticFeedback('impactLight');
            }

            // handle the content
            this.handle(data);
        }
    };

    checkClipboardContent = async () => {
        // get clipboard content
        const clipboardContent = await Clipboard.getString();

        if (clipboardContent) {
            // return if we don't need to read again
            if (!this.shouldRead) return;

            // should not read anymore until we decide about detect value
            this.setShouldRead(false);

            // handle the content
            this.handle(clipboardContent, true);
        }
    };

    onClose = () => {
        const { onClose } = this.props;

        // close scan modal
        Navigator.dismissModal();

        // call callback function
        if (typeof onClose === 'function') {
            onClose();
        }

        return true;
    };

    requestPermissions = () => {
        Linking.openSettings();
    };

    renderNotAuthorizedView = () => {
        return (
            <ImageBackground
                resizeMode="cover"
                source={
                    StyleService.getImageIfLightModeIfDarkMode('BackgroundShapesLight', 'BackgroundShapes')
                }
                style={[AppStyles.container, AppStyles.paddingSml]}
            >
                <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                    <Icon name="IconCamera" size={150} style={styles.scanIconTransparent} />
                </View>
                <View style={[AppStyles.flex1, AppStyles.centerAligned, AppStyles.stretchSelf]}>
                    <Text style={[AppStyles.p, AppStyles.bold]}>
                        {Localize.t('global.needPermissionToAccessCamera')}
                    </Text>
                    <Spacer />
                    <Text style={[AppStyles.subtext, AppStyles.bold]}>
                        {Localize.t('global.pleaseApproveCameraPermission')}
                    </Text>
                    <Spacer size={50} />
                    <Button
                        secondary
                        label={Localize.t('global.close')}
                        onPress={this.onClose}
                        style={{ backgroundColor: AppColors.silver }}
                        icon="IconX"
                    />
                    <Spacer size={15} />
                    <Button
                        style={{ backgroundColor: AppColors.green }}
                        label={Localize.t('global.approvePermissions')}
                        // nonBlock
                        onPress={this.requestPermissions}
                        icon="IconCheck"
                    />
                </View>
            </ImageBackground>
        );
    };

    render() {
        const { type } = this.props;
        const { isLoading } = this.state;

        let description;

        switch (type) {
            case StringType.XrplDestination:
                description = Localize.t('scan.pleaseScanAccountAddress', {
                    nativeAsset: NetworkService.getNativeAsset(),
                });
                break;
            default:
                description = '';
                break;
        }

        if (isLoading) {
            return (
                <ImageBackground
                    resizeMode="cover"
                    source={
                        StyleService.getImageIfLightModeIfDarkMode('BackgroundShapesLight', 'BackgroundShapes')
                    }
                    style={[AppStyles.container, AppStyles.paddingSml]}
                >
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        <LoadingIndicator size="large" />
                        <Spacer />
                        <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                            {Localize.t('global.pleaseWait')}
                        </Text>
                    </View>
                </ImageBackground>
            );
        }

        return (
            <View style={styles.container}>
                <RNCamera
                    style={AppStyles.flex1}
                    type={RNCamera.Constants.Type.back}
                    flashMode={RNCamera.Constants.FlashMode.on}
                    androidCameraPermissionOptions={{
                        title: Localize.t('global.permissionToUseCamera'),
                        message: Localize.t('global.weNeedYourPermissionToUseYourCamera'),
                        buttonPositive: Localize.t('global.ok'),
                        buttonNegative: Localize.t('global.cancel'),
                    }}
                    notAuthorizedView={this.renderNotAuthorizedView()}
                    captureAudio={false}
                    onGoogleVisionBarcodesDetected={
                        Platform.OS === 'android' ? this.onGoogleVisionBarcodesDetected : undefined
                    }
                    onBarCodeRead={Platform.OS === 'ios' ? this.onBarCodeRead : undefined}
                    barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
                >
                    <View style={styles.rectangleContainer}>
                        <View style={styles.topLeft} />
                        <View style={styles.topRight} />
                        <View style={styles.bottomLeft} />
                        <View style={styles.bottomRight} />
                    </View>
                    {
                        description && description !== '' && (
                            <View style={[AppStyles.centerSelf, styles.tip]}>
                                <Text numberOfLines={1} style={[AppStyles.p, AppStyles.colorWhite]}>
                                    {description}
                                </Text>
                            </View>
                        )
                    }
                    <Spacer size={20} />
                    <View style={AppStyles.centerSelf}>
                        <Button
                            numberOfLines={1}
                            onPress={this.checkClipboardContent}
                            label={Localize.t('scan.importFromClipboard')}
                            // icon="IconClipboard"
                            secondary
                            roundedMini
                            style={[
                                AppStyles.paddingHorizontal,
                            ]}
                        />
                        <Spacer size={15} />
                        <Button
                            numberOfLines={1}
                            activeOpacity={0.9}
                            label={Localize.t('global.close')}
                            onPress={this.onClose}
                            icon="IconX"
                            style={[
                                styles.close,
                                AppStyles.paddingHorizontal,
                            ]}
                        />
                    </View>
                </RNCamera>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default ScanModal;
