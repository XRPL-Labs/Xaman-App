/**
 * Switch Account Overlay
 */
import React, { Component } from 'react';
import { Animated, View, Text, TouchableWithoutFeedback, Share } from 'react-native';

import Clipboard from '@react-native-community/clipboard';
import Interactable from 'react-native-interactable';

import { Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { AccountSchema } from '@store/schemas/latest';

// components
import { Button, QRCode } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
interface Props {
    account: AccountSchema;
}

interface State {}

/* Component ==================================================================== */
class ShareAccountModal extends Component<Props, State> {
    static screenName = AppScreens.Overlay.ShareAccount;

    panel: any;
    deltaY: Animated.Value;
    deltaX: Animated.Value;
    isOpening: boolean;

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

        this.deltaY = new Animated.Value(AppSizes.screen.height);
        this.deltaX = new Animated.Value(0);

        this.isOpening = true;
    }

    componentDidMount() {
        this.slideUp();
    }

    slideUp = () => {
        setTimeout(() => {
            if (this.panel) {
                this.panel.snapTo({ index: 1 });
            }
        }, 10);
    };

    slideDown = () => {
        setTimeout(() => {
            if (this.panel) {
                this.panel.snapTo({ index: 0 });
            }
        }, 10);
    };

    onAlert = (event: any) => {
        const { top, bottom } = event.nativeEvent;

        if (top && bottom) return;

        if (top === 'enter' && this.isOpening) {
            this.isOpening = false;
        }

        if (bottom === 'leave' && !this.isOpening) {
            Navigator.dismissOverlay();
        }
    };

    onSharePress = () => {
        const { account } = this.props;

        this.slideDown();

        setTimeout(() => {
            Share.share({
                title: Localize.t('home.shareAccount'),
                message: account.address,
                url: undefined,
            }).catch(() => {});
        }, 1000);
    };

    onCopyAddressPress = () => {
        const { account } = this.props;

        this.slideDown();

        Clipboard.setString(account.address);

        setTimeout(() => {
            Toast(Localize.t('account.publicKeyCopiedToClipboard'));
        }, 1000);
    };

    onPaymentRequestPress = () => {
        this.slideDown();

        setTimeout(() => {
            Navigator.push(AppScreens.Transaction.Request);
        }, 1000);
    };

    render() {
        const { account } = this.props;

        return (
            <View style={AppStyles.flex1}>
                <TouchableWithoutFeedback onPress={this.slideDown}>
                    <Animated.View
                        style={[
                            AppStyles.shadowContent,
                            {
                                opacity: this.deltaY.interpolate({
                                    inputRange: [0, AppSizes.screen.height],
                                    outputRange: [1.2, 0],
                                    extrapolateRight: 'clamp',
                                }),
                            },
                        ]}
                    />
                </TouchableWithoutFeedback>

                <Interactable.View
                    ref={(r) => {
                        this.panel = r;
                    }}
                    animatedNativeDriver
                    onAlert={this.onAlert}
                    verticalOnly
                    snapPoints={[
                        { y: AppSizes.screen.height + 3 },
                        { y: AppSizes.screen.height - (AppSizes.moderateScale(600) + AppSizes.navigationBarHeight) },
                    ]}
                    boundaries={{
                        top: AppSizes.screen.height - (AppSizes.moderateScale(620) + AppSizes.navigationBarHeight),
                    }}
                    alertAreas={[
                        { id: 'bottom', influenceArea: { bottom: AppSizes.screen.height } },
                        {
                            id: 'top',
                            influenceArea: {
                                top:
                                    AppSizes.screen.height -
                                    (AppSizes.moderateScale(600) + AppSizes.navigationBarHeight),
                            },
                        },
                    ]}
                    initialPosition={{ y: AppSizes.screen.height }}
                    animatedValueY={this.deltaY}
                    animatedValueX={this.deltaX}
                >
                    <View style={[styles.visibleContent]}>
                        <View style={AppStyles.panelHeader}>
                            <View style={AppStyles.panelHandle} />
                        </View>

                        <View style={[AppStyles.row, AppStyles.centerAligned, AppStyles.paddingBottomSml]}>
                            <View style={[AppStyles.flex1, AppStyles.paddingLeftSml]}>
                                <Text numberOfLines={1} style={[AppStyles.h5, AppStyles.strong]}>
                                    {Localize.t('send.myAccount')}
                                </Text>
                            </View>
                            <View
                                style={[AppStyles.row, AppStyles.flex1, AppStyles.paddingRightSml, AppStyles.flexEnd]}
                            >
                                <Button
                                    light
                                    roundedSmall
                                    isDisabled={false}
                                    onPress={this.slideDown}
                                    textStyle={[AppStyles.subtext, AppStyles.bold]}
                                    label={Localize.t('global.close')}
                                />
                            </View>
                        </View>

                        <View style={styles.qrCodeContainer}>
                            <View style={styles.qrCode}>
                                <QRCode size={AppSizes.moderateScale(150)} value={`${account.address}`} />
                            </View>
                        </View>

                        <View style={[AppStyles.paddingBottom, AppStyles.paddingHorizontalSml]}>
                            <Text style={[AppStyles.pbold, AppStyles.textCenterAligned]}>
                                {Localize.t('global.address')}:
                            </Text>
                            <Text selectable adjustsFontSizeToFit numberOfLines={1} style={styles.addressText}>
                                {account.address}
                            </Text>
                        </View>

                        <View style={[AppStyles.row, AppStyles.centerContent, AppStyles.paddingHorizontalSml]}>
                            <Button
                                light
                                rounded
                                numberOfLines={1}
                                icon="IconShare"
                                iconStyle={AppStyles.imgColorBlue}
                                label={Localize.t('global.share')}
                                onPress={this.onSharePress}
                                style={[AppStyles.flex1, AppStyles.marginRight]}
                            />
                            <Button
                                light
                                rounded
                                numberOfLines={1}
                                icon="IconClipboard"
                                iconStyle={AppStyles.imgColorBlue}
                                label={Localize.t('global.copy')}
                                onPress={this.onCopyAddressPress}
                                style={[AppStyles.flex1]}
                            />
                        </View>

                        <View style={[AppStyles.paddingTop, AppStyles.paddingHorizontalSml]}>
                            <Button
                                numberOfLines={1}
                                label={Localize.t('global.createPaymentRequestLink')}
                                onPress={this.onPaymentRequestPress}
                                style={AppStyles.buttonGreen}
                            />
                        </View>
                    </View>
                </Interactable.View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default ShareAccountModal;
