/**
 * Request decline overlay
 */
import React, { Component } from 'react';
import { Animated, View, Text, TouchableWithoutFeedback } from 'react-native';

import Interactable from 'react-native-interactable';

import { Navigator, getNavigationBarHeight } from '@common/helpers';
import { AppScreens } from '@common/constants';

// components
import { Button, Spacer } from '@components';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    onDecline: () => void;
    onClose: () => void;
}

export interface State {}

/* Component ==================================================================== */
class RequestDeclineOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.RequestDecline;

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

        this.state = {};

        this.deltaY = new Animated.Value(AppSizes.screen.height);
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

    onSnap = async (event: any) => {
        const { index } = event.nativeEvent;

        if (index === 0) {
            Navigator.dismissOverlay();
        }
    };

    onClose = async () => {
        const { onClose } = this.props;
        // close overlay
        await Navigator.dismissOverlay();

        if (typeof onClose === 'function') {
            onClose();
        }
    };

    onDecline = async () => {
        const { onDecline } = this.props;
        // close overlay
        await Navigator.dismissOverlay();

        if (typeof onDecline === 'function') {
            onDecline();
        }
    };

    render() {
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
                                    outputRange: [1.5, 0],
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
                        { y: AppSizes.screen.height - AppSizes.moderateScale(350) },
                    ]}
                    boundaries={{ top: AppSizes.screen.height - AppSizes.moderateScale(400) }}
                    initialPosition={{ y: AppSizes.screen.height + 3 }}
                    animatedValueY={this.deltaY}
                >
                    <View style={[styles.container]}>
                        <View style={[AppStyles.row, AppStyles.centerContent, AppStyles.paddingVerticalSml]}>
                            <Text style={[AppStyles.h5, AppStyles.textCenterAligned]}>
                                {Localize.t('payload.whatDoYouWantToDo')}
                            </Text>
                        </View>
                        <View style={[AppStyles.flex1, AppStyles.paddingHorizontalSml]}>
                            <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                                <Text style={[AppStyles.bold, AppStyles.colorGreyDark]}>
                                    {Localize.t('global.close')}{' '}
                                </Text>
                                {Localize.t('payload.willIgnoreTheRequestAndClose')}{' '}
                                <Text style={[AppStyles.bold, AppStyles.colorRed]}>
                                    {Localize.t('global.decline')}{' '}
                                </Text>
                                {Localize.t('payload.willRejectTheSignRequest')}
                            </Text>
                        </View>
                        <View
                            style={[
                                AppStyles.flex2,
                                AppStyles.paddingHorizontalSml,
                                { marginBottom: getNavigationBarHeight() },
                            ]}
                        >
                            <Button
                                onPress={this.onClose}
                                style={styles.closeButton}
                                label={Localize.t('global.close')}
                            />
                            <Spacer size={20} />
                            <Button
                                onPress={this.onDecline}
                                style={styles.declineButton}
                                label={Localize.t('global.decline')}
                                icon="IconTrash"
                                iconStyle={AppStyles.imgColorWhite}
                            />
                        </View>
                    </View>
                </Interactable.View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default RequestDeclineOverlay;
