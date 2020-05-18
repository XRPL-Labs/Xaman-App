/**
 * Scan Modal
 */

import React, { Component } from 'react';
import { View, ImageBackground, Text, ActivityIndicator, Alert, Linking, BackHandler } from 'react-native';

import { StringTypeDetector, StringDecoder, StringType, XrplDestination, PayId } from 'xumm-string-decode';

import { RNCamera } from 'react-native-camera';

import { AccountRepository } from '@store/repositories';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';
import { Payload } from '@common/libs/payload';

import { NormalizeDestination } from '@common/libs/utils';

import Localize from '@locale';

// components
import { Button, Spacer, Icon } from '@components';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    onRead: (decoded: any) => void;
    type: StringType;
    fallback?: boolean;
}

export interface State {
    isLoading: boolean;
}

/* Component ==================================================================== */
class ScanView extends Component<Props, State> {
    static screenName = AppScreens.Modal.Scan;

    private camera: RNCamera;
    private shouldRead: boolean;
    private backHandler: any;

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
        };

        this.shouldRead = true;
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
    }

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.onClose);
    }

    setShouldRead = (value: boolean) => {
        this.shouldRead = value;
    };

    routeUser = async (screen: string, options: any, passProps: any) => {
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
                Navigator.showModal(screen, options, passProps);
            }, 10);
        } else {
            setTimeout(() => {
                Navigator.push(screen, options, passProps);
            }, 10);
        }

        // close scan modal
    };

    handlePayloadReference = async (uuid: string) => {
        this.setState({
            isLoading: true,
        });

        try {
            // fetch the payload
            const payload = await Payload.from(uuid);

            // review the transaction
            this.routeUser(
                AppScreens.Modal.ReviewTransaction,
                { modalPresentationStyle: 'fullScreen' },
                {
                    payload,
                },
            );
        } catch (e) {
            Alert.alert(
                Localize.t('global.error'),
                e.message,
                [{ text: 'OK', onPress: () => this.setShouldRead(true) }],
                { cancelable: false },
            );
            this.setState({
                isLoading: false,
            });
        }
    };

    handleSignedTransaction = (txblob: string) => {
        Alert.alert(
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
                        this.routeUser(
                            AppScreens.Modal.Submit,
                            { modalPresentationStyle: 'fullScreen' },
                            {
                                txblob,
                            },
                        );
                    },
                    style: 'default',
                },
            ],
            { cancelable: false },
        );
    };

    handleXrplDestination = async (destination: XrplDestination & PayId) => {
        // check if any account is configured
        const availableAccounts = AccountRepository.getSpendableAccounts();

        if (availableAccounts.length > 0) {
            if (destination.payId) {
                this.routeUser(
                    AppScreens.Transaction.Payment,
                    {},
                    {
                        scanResult: {
                            to: destination.payId,
                        },
                    },
                );
                return;
            }

            let amount;

            const { to, tag } = NormalizeDestination(destination);

            // if amount present as XRP pass the amount
            if (!destination.currency && destination.amount) {
                amount = destination.amount;
            }

            this.routeUser(
                AppScreens.Transaction.Payment,
                {},
                {
                    scanResult: {
                        to,
                        tag,
                    },
                    amount,
                },
            );
        } else {
            Alert.alert(
                Localize.t('global.error'),
                Localize.t('global.noSpendableAccountIsAvailableForSendingPayment'),
                [{ text: 'OK', onPress: () => this.setShouldRead(true) }],
                { cancelable: false },
            );
        }
    };

    handle = (content: string) => {
        const { onRead, type, fallback } = this.props;

        const detected = new StringTypeDetector(content);

        // normalize detected type
        let detectedType = detected.getType();

        if (detectedType === StringType.PayId) {
            detectedType = StringType.XrplDestination;
        }

        // just return scanned content
        if (!type && onRead) {
            Navigator.dismissModal();
            onRead(content);
            return;
        }

        const parsed = new StringDecoder(detected).getAny();

        // the other component wants to handle the decoded content
        if (detectedType === type && onRead) {
            onRead(parsed);
            Navigator.dismissModal();
            return;
        }

        // fallback is not set
        // this is not the type we expected
        if (type && !fallback) {
            let message;

            switch (type) {
                case StringType.XrplDestination:
                    message = Localize.t('scan.scannedQRIsNotXRPAddress');
                    break;
                // @ts-ignore
                case StringType.XummPayloadReference:
                    message = Localize.t('scan.scannedQRIsNotXummPayload');
                    break;
                default:
                    message = Localize.t('scan.theQRIsNotWhatWeExpect');
            }

            Alert.alert(
                Localize.t('global.warning'),
                message,
                [{ text: 'OK', onPress: () => this.setShouldRead(true) }],
                { cancelable: false },
            );
            return;
        }

        // the screen will handle the content
        switch (detected.getType()) {
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
            default:
                Alert.alert(
                    Localize.t('global.warning'),
                    Localize.t('scan.invalidQRTryNewOneOrTryAgain'),
                    [{ text: 'OK', onPress: () => this.setShouldRead(true) }],
                    {
                        cancelable: false,
                    },
                );
        }
    };

    onReadCode = ({ data }: { data: string }) => {
        if (data) {
            // return if we don't need to read again
            if (!this.shouldRead) return;

            // should not read anymore until we decide about detect value
            this.setShouldRead(false);

            // handle the content
            this.handle(data);
        }
    };

    onClose = () => {
        Navigator.dismissModal();
        return true;
    };

    requestPermissions = async () => {
        Linking.openSettings();
    };

    renderNotAuthorizedView = () => {
        return (
            <ImageBackground source={Images.BackgroundShapes} style={[AppStyles.container, AppStyles.paddingSml]}>
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
                        style={{ backgroundColor: AppColors.green }}
                        label={Localize.t('global.approvePermissions')}
                        onPress={this.requestPermissions}
                    />
                    <Spacer size={20} />
                    <Button light label={Localize.t('global.close')} onPress={this.onClose} />
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
                description = Localize.t('scan.pleaseScanXRPAddress');
                break;
            default:
                description = Localize.t('scan.aimAtTheCode');
                break;
        }

        if (isLoading) {
            return (
                <ImageBackground source={Images.BackgroundShapes} style={[AppStyles.container, AppStyles.paddingSml]}>
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        <ActivityIndicator color={AppColors.blue} size="large" />
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
                    ref={(ref) => {
                        this.camera = ref;
                    }}
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
                    onBarCodeRead={this.onReadCode}
                    barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
                >
                    <View style={[styles.rectangleContainer]}>
                        <View style={styles.topLeft} />
                        <View style={styles.topRight} />
                        <View style={styles.bottomLeft} />
                        <View style={styles.bottomRight} />
                    </View>
                    <View style={[AppStyles.centerSelf, styles.tip]}>
                        <Text style={[AppStyles.p, AppStyles.colorWhite]}>{description}</Text>
                    </View>
                    <View style={[AppStyles.centerSelf]}>
                        <Button
                            activeOpacity={0.9}
                            label={Localize.t('global.close')}
                            rounded
                            onPress={this.onClose}
                            style={styles.close}
                        />
                    </View>
                </RNCamera>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default ScanView;
