/**
 * Switch Account Overlay
 */
import React, { Component } from 'react';
import { Animated, View, Text, TouchableWithoutFeedback } from 'react-native';

import Share from 'react-native-share';

import Interactable from 'react-native-interactable';

import { AccountSchema } from '@store/schemas/latest';

import { Navigator, getNavigationBarHeight } from '@common/helpers';
import { AppScreens } from '@common/constants';

// components
import { Button, QRCode, Spacer } from '@components';

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
    onDismiss: () => void;

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
    }

    componentDidMount() {
        this.slideUp();
    }

    slideUp = () => {
        setTimeout(() => {
            this.panel.snapTo({ index: 1 });
        }, 10);
    };

    slideDown = () => {
        setTimeout(() => {
            this.panel.snapTo({ index: 0 });
        }, 10);
    };

    onSnap = async (event: any) => {
        const { index } = event.nativeEvent;

        if (index === 0) {
            Navigator.dismissOverlay();
        }
    };

    onSharePress = () => {
        const { account } = this.props;

        this.slideDown();

        const shareOptions = {
            title: Localize.t('home.shareAccount'),
            message: account.address,
        };

        Share.open(shareOptions).catch(() => {});
    };

    render() {
        const { account } = this.props;
        return (
            <View style={AppStyles.flex1}>
                <TouchableWithoutFeedback
                    onPress={() => {
                        this.slideDown();
                    }}
                >
                    <Animated.View
                        style={[
                            AppStyles.shadowContent,
                            {
                                opacity: this.deltaY.interpolate({
                                    inputRange: [0, AppSizes.screen.height],
                                    outputRange: [1.3, 0],
                                    extrapolateRight: 'clamp',
                                }),
                            },
                        ]}
                    />
                </TouchableWithoutFeedback>

                <Interactable.View
                    ref={r => {
                        this.panel = r;
                    }}
                    animatedNativeDriver
                    onSnap={this.onSnap}
                    verticalOnly
                    snapPoints={[
                        { y: AppSizes.screen.height + 3 },
                        { y: AppSizes.screen.height - (AppSizes.moderateScale(370) + getNavigationBarHeight()) },
                    ]}
                    boundaries={{
                        top: AppSizes.screen.height - (AppSizes.moderateScale(390) + getNavigationBarHeight()),
                    }}
                    initialPosition={{ y: AppSizes.screen.height }}
                    animatedValueY={this.deltaY}
                >
                    <View style={[AppStyles.visibleContent]}>
                        <View style={AppStyles.panelHeader}>
                            <View style={AppStyles.panelHandle} />
                        </View>
                        <View style={styles.qrCodeContainer}>
                            <QRCode
                                size={AppSizes.moderateScale(150)}
                                value={`${account.address}`}
                                style={styles.qrCode}
                            />
                        </View>

                        <Text style={styles.addressText}>{account.address}</Text>

                        <Spacer size={20} />
                        <Button
                            light
                            rounded
                            icon="IconShare"
                            iconStyle={AppStyles.imgColorBlue}
                            label={Localize.t('global.share')}
                            onPress={this.onSharePress}
                        />
                    </View>
                </Interactable.View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default ShareAccountModal;
