/**
 * home actions overlay
 */
import React, { Component } from 'react';
import {
    Animated,
    View,
    Text,
    Image,
    TouchableWithoutFeedback,
    TouchableOpacity,
    InteractionManager,
} from 'react-native';

import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import Interactable from 'react-native-interactable';

import { Navigator } from '@common/helpers/navigator';

import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';

import { BackendService, StyleService } from '@services';

import { AppScreens } from '@common/constants';

// components
import { Button, Spacer, LoadingIndicator } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    account: AccountSchema;
    isLoading: boolean;
    apps: any;
}

/* Component ==================================================================== */
class HomeActionsOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.HomeActions;

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

        this.state = {
            account: AccountRepository.getDefaultAccount(),
            isLoading: true,
            apps: [],
        };

        this.deltaY = new Animated.Value(AppSizes.screen.height);
        this.deltaX = new Animated.Value(0);

        this.isOpening = true;
    }

    componentDidMount() {
        this.slideUp();

        InteractionManager.runAfterInteractions(this.fetchApps);
    }

    fetchApps = () => {
        BackendService.getXAppShortList().then((resp: any) => {
            const { apps } = resp;

            this.setState({
                apps,
                isLoading: false,
            });
        });
    };

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
        }, 20);
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

    onScanButtonPress = () => {
        this.slideDown();

        setTimeout(() => {
            Navigator.showModal(AppScreens.Modal.Scan, {
                modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
            });
        }, 800);
    };

    onViewMoreAppsPress = () => {
        const moreIdentifier = 'xumm.more';

        this.openXApp(moreIdentifier, 'XApps');
    };

    onAppPress = (index: number) => {
        const { apps } = this.state;

        const { identifier, title } = apps[index];

        this.openXApp(identifier, title);
    };

    openXApp = (identifier: string, title: string) => {
        const { account } = this.state;

        this.slideDown();

        setTimeout(() => {
            Navigator.showModal(
                AppScreens.Modal.XAppBrowser,
                {
                    modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                    modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                },
                {
                    identifier,
                    title,
                    account,
                },
            );
        }, 800);
    };

    render() {
        const { apps, isLoading } = this.state;

        return (
            <View style={AppStyles.flex1}>
                <TouchableWithoutFeedback onPress={this.slideDown}>
                    <Animated.View
                        style={[
                            AppStyles.shadowContent,
                            {
                                opacity: this.deltaY.interpolate({
                                    inputRange: [0, AppSizes.screen.height],
                                    outputRange: [1.1, 0],
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
                        { y: AppSizes.screen.height - AppSizes.moderateScale(400) - AppSizes.navigationBarHeight },
                    ]}
                    alertAreas={[
                        { id: 'bottom', influenceArea: { bottom: AppSizes.screen.height } },
                        {
                            id: 'top',
                            influenceArea: {
                                top:
                                    AppSizes.screen.height - AppSizes.moderateScale(400) - AppSizes.navigationBarHeight,
                            },
                        },
                    ]}
                    boundaries={{
                        top: AppSizes.screen.height - AppSizes.moderateScale(450) - AppSizes.navigationBarHeight,
                    }}
                    initialPosition={{ y: AppSizes.screen.height + 3 }}
                    animatedValueY={this.deltaY}
                    animatedValueX={this.deltaX}
                >
                    <View
                        style={[styles.container, { height: AppSizes.moderateScale(450) }]}
                        onStartShouldSetResponder={() => true}
                    >
                        <View style={AppStyles.panelHeader}>
                            <View style={AppStyles.panelHandle} />
                        </View>

                        <View style={[AppStyles.centerAligned, AppStyles.paddingBottomSml]}>
                            <Text numberOfLines={1} style={[AppStyles.h5, AppStyles.strong]}>
                                {Localize.t('payload.whatDoYouWantToDo')}
                            </Text>
                        </View>

                        <View style={[AppStyles.row, AppStyles.centerAligned]}>
                            <View style={[AppStyles.flex1]}>
                                <Image
                                    source={StyleService.getImage('IconXApps')}
                                    resizeMode="contain"
                                    style={styles.xAppsIcon}
                                />
                            </View>
                            <View style={[AppStyles.row, AppStyles.flex1, AppStyles.flexEnd]}>
                                <Button
                                    numberOfLines={1}
                                    label={Localize.t('home.viewMoreXApps')}
                                    icon="IconApps"
                                    iconStyle={[AppStyles.imgColorBlue]}
                                    iconSize={17}
                                    roundedSmall
                                    light
                                    isDisabled={false}
                                    onPress={this.onViewMoreAppsPress}
                                />
                            </View>
                        </View>

                        {isLoading ? (
                            <LoadingIndicator style={styles.activityIndicator} />
                        ) : (
                            <View style={[AppStyles.row, AppStyles.paddingVertical]}>
                                {apps.map((app: any, index: number) => {
                                    return (
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            style={[AppStyles.flex1, AppStyles.centerAligned]}
                                            onPress={() => {
                                                this.onAppPress(index);
                                            }}
                                            key={index}
                                        >
                                            <Image source={{ uri: app.icon }} style={styles.appIcon} />
                                            <Spacer size={5} />
                                            <Text style={styles.appTitle}>{app.title}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}

                        <View style={[AppStyles.row, { marginBottom: AppSizes.navigationBarHeight }]}>
                            <Button
                                contrast
                                numberOfLines={1}
                                label={Localize.t('global.scanAQRCode')}
                                onPress={this.onScanButtonPress}
                                icon="IconScan"
                                style={[AppStyles.flex1]}
                            />
                        </View>
                    </View>
                </Interactable.View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default HomeActionsOverlay;
