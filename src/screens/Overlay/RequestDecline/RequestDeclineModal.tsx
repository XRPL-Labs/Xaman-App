/**
 * Request decline overlay
 */
import React, { Component } from 'react';
import { Animated, View, Text, TouchableWithoutFeedback } from 'react-native';

import Interactable from 'react-native-interactable';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

// components
import { Button, Spacer } from '@components/General';

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

        this.state = {};

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

    onClose = async () => {
        const { onClose } = this.props;

        if (typeof onClose === 'function') {
            onClose();
        }

        // close overlay
        await Navigator.dismissOverlay();
    };

    onDecline = async () => {
        const { onDecline } = this.props;

        if (typeof onDecline === 'function') {
            onDecline();
        }
        // close overlay
        await Navigator.dismissOverlay();
    };

    render() {
        return (
            <View style={AppStyles.flex1}>
                <TouchableWithoutFeedback onPress={this.slideDown}>
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
                    ref={(r) => {
                        this.panel = r;
                    }}
                    animatedNativeDriver
                    onAlert={this.onAlert}
                    verticalOnly
                    snapPoints={[
                        { y: AppSizes.screen.height + 3 },
                        { y: AppSizes.screen.height - (AppSizes.moderateScale(350) + AppSizes.navigationBarHeight) },
                    ]}
                    boundaries={{
                        top: AppSizes.screen.height - (AppSizes.moderateScale(400) + AppSizes.navigationBarHeight),
                    }}
                    alertAreas={[
                        { id: 'bottom', influenceArea: { bottom: AppSizes.screen.height } },
                        {
                            id: 'top',
                            influenceArea: {
                                top:
                                    AppSizes.screen.height -
                                    (AppSizes.moderateScale(350) + AppSizes.navigationBarHeight),
                            },
                        },
                    ]}
                    initialPosition={{ y: AppSizes.screen.height + 3 }}
                    animatedValueY={this.deltaY}
                    animatedValueX={this.deltaX}
                >
                    <View style={[styles.container]}>
                        <View style={[AppStyles.row, AppStyles.centerContent, AppStyles.paddingVerticalSml]}>
                            <Text numberOfLines={1} style={[AppStyles.h5, AppStyles.textCenterAligned]}>
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
                        <View style={[AppStyles.flex2, AppStyles.paddingHorizontalSml]}>
                            <Button
                                numberOfLines={1}
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
