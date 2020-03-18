/**
 * Scan Modal
 */

import React, { Component } from 'react';
import {
    SafeAreaView,
    View,
    ImageBackground,
    Text,
    ActivityIndicator,
    Alert,
    Linking,
    BackHandler,
} from 'react-native';
import { RNCamera } from 'react-native-camera';

import { StringTypeDetector, StringDecoder, StringType } from 'xumm-string-decode';

import { AppScreens } from '@common/constants';
import { Navigator, Images } from '@common/helpers';
import { Payload } from '@common/libs/payload';

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

    handle = (content: any, detected: any) => {
        const { onRead, type } = this.props;

        if (type && detected.getType() !== type) {
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
            Navigator.dismissModal();
            onRead(parsed);
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
                <SafeAreaView style={styles.container}>
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        <ActivityIndicator color={AppColors.blue} size="large" />
                    </View>
                </SafeAreaView>
            );
        }

        return (
            <View style={styles.container}>
                <RNCamera
                    ref={ref => {
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
