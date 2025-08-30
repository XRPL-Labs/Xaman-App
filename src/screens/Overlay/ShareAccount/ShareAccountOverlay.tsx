/**
 * Switch Account Overlay
 */
import React, { Component } from 'react';
import { View, Text, Share } from 'react-native';

import { AppScreens } from '@common/constants';

import { Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { Clipboard } from '@common/helpers/clipboard';
// import ScreenBrightness from 'react-native-screen-brightness';

import { AccountModel } from '@store/models';

// import DeviceBrightness from '@adrianso/react-native-device-brightness';

import { Footer, ActionPanel, Button, QRCode } from '@components/General';

import Localize from '@locale';

import { RequestViewProps } from '@screens/Request';

import { AppStyles, AppSizes } from '@theme';
import styles from './styles';
// import AppService, { AppStateStatus } from '@services/AppService';

/* types ==================================================================== */
export interface Props {
    account: AccountModel;
    timestamp?: number;
}

export interface State {
    ogBrightness: number | null;
    // keepBrightness: boolean;
}


/* Component ==================================================================== */
class ShareAccountOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.ShareAccount;

    private actionPanelRef: React.RefObject<ActionPanel>;

    static options() {
        return {
            statusBar: {
                visible: true,
                style: 'light',
            },
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            ogBrightness: null,
            // keepBrightness: false,
        };

        this.actionPanelRef = React.createRef();
    }

    // appStateChange(status: AppStateStatus) {
    //     const { ogBrightness } = this.state;

    //     console.log('x', status, ogBrightness)
        
    //     if (status !== AppStateStatus.Active) {
    //         if (typeof ogBrightness === 'number') {
    //             DeviceBrightness.setBrightnessLevel(Platform.OS === 'android' ? -1 : ogBrightness);
    //         }
    //     }
    //     if (status === AppStateStatus.Active) {
    //         DeviceBrightness.setBrightnessLevel(1);
    //     }
    // }

    componentDidMount() {
        // const { ogBrightness } = this.state;

        // DeviceBrightness.getBrightnessLevel().then(brightness => {
        //     // if (typeof ogBrightness !== 'number') {
        //     //     this.setState({ ogBrightness: brightness });
        //     // }
        //     // setTimeout(() => {
        //     //     DeviceBrightness.setBrightnessLevel(1);
        //     // }, 400);
        // });

        // AppService.on('appStateChange', status => this.appStateChange(status));
    }

    componentWillUnmount(): void {
        // const { ogBrightness, keepBrightness } = this.state;
        // if (!keepBrightness) {
        //     DeviceBrightness.setBrightnessLevel(Number(Platform.OS === 'android' ? -1 : ogBrightness));
        // }
        // AppService.off('appStateChange', status => this.appStateChange(status));
    }

    onSharePress = () => {
        const { account } = this.props;

        // this.actionPanelRef?.current?.slideDown();

        // setTimeout(() => {
        Share.share({
            title: Localize.t('home.shareAccount'),
            message: account.address,
            url: undefined,
        }).catch(() => {});
        // }, 1000);
    };

    onCopyAddressPress = () => {
        const { account } = this.props;

        // this.actionPanelRef?.current?.slideDown();

        Clipboard.setString(account.address);

        // setTimeout(() => {
        Toast(Localize.t('account.publicKeyCopiedToClipboard'));
        // }, 10);
    };

    onPaymentRequestPress = () => {
        const { ogBrightness } = this.state;

        this.actionPanelRef?.current?.slideDown();

        // this.setState({ keepBrightness: true });

        setTimeout(() => {
            Navigator.push<RequestViewProps>(AppScreens.Transaction.Request, {
                ogBrightness: Number(ogBrightness || 1),
            });
        }, 500);
    };

    onClosePress = () => {
        this.actionPanelRef?.current?.slideDown();
    };

    render() {
        const { account, timestamp } = this.props;

        return (
            <ActionPanel
                ref={this.actionPanelRef}
                height={AppSizes.moderateScale(570)}
                onSlideDown={Navigator.dismissOverlay}
                contentStyle={[
                    styles.panelContent,
                ]}
                extraBottomInset
            >
                <View style={[
                    AppStyles.row,
                    AppStyles.flex1,
                    AppStyles.paddingBottomSml,
                    AppStyles.centerAligned,
                    AppStyles.paddingHorizontalSml,
                ]}>
                    <View style={[
                        AppStyles.flex5,
                    ]}>
                        <Text numberOfLines={1} style={[AppStyles.h5, AppStyles.strong]}>
                            {Localize.t('send.accountInfo')}
                        </Text>
                    </View>
                    <View style={[
                        AppStyles.row,
                        AppStyles.flex3,
                        AppStyles.flexEnd,
                    ]}>
                        <Button
                            light
                            roundedSmall
                            isDisabled={false}
                            onPress={this.onClosePress}
                            textStyle={[AppStyles.subtext, AppStyles.bold]}
                            label={Localize.t('global.close')}
                        />
                    </View>
                </View>

                <View style={[AppStyles.paddingHorizontalExtraSml, AppStyles.flex8]}>
                    <View style={[AppStyles.paddingBottomSml, AppStyles.paddingHorizontalExtraSml]}>
                        <Text style={AppStyles.colorGrey}>
                            {Localize.t('global.address')} ({Localize.t('global.holdToCopy')}):
                        </Text>
                        <View style={styles.addressTextContainer}>
                            <Text selectable adjustsFontSizeToFit numberOfLines={1} style={styles.addressText}>
                                {account.address}
                            </Text>
                            <View style={[AppStyles.row, styles.sharebtnContainer]}>
                                <Button
                                    light
                                    roundedMini
                                    key={`share-account-overlay-${timestamp}-btn1`}
                                    numberOfLines={1}
                                    icon="IconShare"
                                    // iconStyle={AppStyles.imgColorBlue}
                                    label={Localize.t('global.share')}
                                    onPress={this.onSharePress}
                                    style={[AppStyles.flex1, styles.sharebtn]}
                                />
                                <Button
                                    light
                                    roundedMini
                                    key={`share-account-overlay-${timestamp}-btn2`}
                                    numberOfLines={1}
                                    icon="IconClipboard"
                                    // iconStyle={AppStyles.imgColorBlue}
                                    label={Localize.t('global.copy')}
                                    onPress={this.onCopyAddressPress}
                                    style={[AppStyles.flex1, styles.sharebtn]}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={[AppStyles.paddingHorizontalExtraSml]}>
                        <Text style={AppStyles.colorGrey}>
                            {Localize.t('global.orShareQr')}:
                        </Text>
                        <View style={[
                            styles.qrCodeContainer,
                        ]}>
                            <View style={styles.qrCode}>
                                <View style={styles.qrImgContainer}>
                                    <QRCode size={150} value={`${account.address}`} />
                                </View>
                            </View>
                        </View>                    
                    </View>
                </View>

                <Footer style={[
                    styles.footer,
                ]}>
                    <Button
                        numberOfLines={1}
                        nonBlock
                        label={Localize.t('global.createPaymentRequestLink')}
                        onPress={this.onPaymentRequestPress}
                        style={[
                            styles.requestLink,
                        ]}
                    />
                </Footer>
            </ActionPanel>
        );
    }
}

/* Export Component ==================================================================== */
export default ShareAccountOverlay;
