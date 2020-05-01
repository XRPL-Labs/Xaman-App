/**
 * Scan Modal
 */

import React, { Component } from 'react';
import { View, ImageBackground, Text, ActivityIndicator, Alert, Linking, BackHandler } from 'react-native';

import { StringTypeDetector, StringDecoder, StringType, XrplDestination, PayId } from 'xumm-string-decode';

import { RNCamera } from 'react-native-camera';

import { AccountRepository } from '@store/repositories';
import { AccessLevels } from '@store/types';

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

    handlePayloadReference = async (uuid: string) => {
        this.setState({
            isLoading: true,
        });

        try {
            // fetch the payload
            const payload = await Payload.from(uuid);

            // dismiss scan modal
            await Navigator.dismissModal();

            // review the transaction
            setTimeout(() => {
                Navigator.showModal(
                    AppScreens.Modal.ReviewTransaction,
                    { modalPresentationStyle: 'fullScreen' },
                    {
                        payload,
                    },
                );
            }, 0);
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
                        await Navigator.dismissModal();
                        // review the transaction
                        setTimeout(() => {
                            Navigator.showModal(
                                AppScreens.Modal.Submit,
                                { modalPresentationStyle: 'fullScreen' },
                                {
                                    txblob,
                                },
                            );
                        }, 0);
                    },
                    style: 'default',
                },
            ],
            { cancelable: false },
        );
    };

    handleXrplDestination = async (destination: XrplDestination & PayId) => {
        // check if any account is configured
        const availableAccounts = AccountRepository.getAccounts({ accessLevel: AccessLevels.Full });

        if (availableAccounts.length > 0) {
            if (destination.payId) {
                await Navigator.dismissModal();

                Navigator.push(
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

            await Navigator.dismissModal();

            Navigator.push(
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
                Localize.t('global.noAccountConfigured'),
                Localize.t('global.pleaseAddAccountToSendPayments'),
                [{ text: 'OK', onPress: () => this.setShouldRead(true) }],
                { cancelable: false },
            );
        }
    };

    handle = (content: any, detected: any) => {
        const { onRead, type } = this.props;

        // normalize detected type
        let detectedType = detected.getType();

        if (detectedType === StringType.PayId) {
            detectedType = StringType.XrplDestination;
        }

        // check if this is something we expect
        if (type && detectedType !== type) {
            // this is not the type we expected
            let message = Localize.t('scan.theQRIsNotWhatWeExpect');

            if (type === StringType.XrplDestination) {
                message = Localize.t('scan.scannedQRIsNotXRPAddress');
            }

            Alert.alert(
                Localize.t('global.warning'),
                message,
                [{ text: 'OK', onPress: () => this.setShouldRead(true) }],
                { cancelable: false },
            );

            return;
        }

        // just return scanned content
        if (!type && onRead) {
            Navigator.dismissModal();
            onRead(content);
            return;
        }

        const parsed = new StringDecoder(detected).getAny();

        // the other component wants to handle the decoded content
        if (onRead) {
            onRead(parsed);
            Navigator.dismissModal();
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
                // nothing found
                this.setShouldRead(true);
        }
    };

    onReadCode = ({ data }: { data: string }) => {
        if (data) {
            // return if we don't need to read again
            if (!this.shouldRead) return;

            // should not read anymore until we decide about detect value
            this.setShouldRead(false);

            const detected = new StringTypeDetector(data);

            this.handle(data, detected);
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
