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
    ActivityIndicator,
} from 'react-native';

import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import Interactable from 'react-native-interactable';

import { Navigator } from '@common/helpers/navigator';

import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';

import { BackendService } from '@services';

import { AppScreens } from '@common/constants';

// components
import { Button, Spacer, HorizontalLine } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes, AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    account: AccountSchema;
    isLoading: boolean;
    apps: any;
    moreUrl: string;
}

/* Component ==================================================================== */
class HomeActionsOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.HomeActions;

    panel: any;
    deltaY: Animated.Value;
    deltaX: Animated.Value;

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
            moreUrl: '',
        };

        this.deltaY = new Animated.Value(AppSizes.screen.height);
        this.deltaX = new Animated.Value(0);
    }

    componentDidMount() {
        this.slideUp();

        InteractionManager.runAfterInteractions(this.fetchApps);
    }

    fetchApps = () => {
        const { account } = this.state;

        BackendService.getXAppShortList(account.address).then((resp: any) => {
            const { apps, moreUrl } = resp;

            this.setState({
                apps,
                isLoading: false,
                moreUrl,
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

    onSnap = async (event: any) => {
        const { index } = event.nativeEvent;

        if (index === 0) {
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
        const { moreUrl } = this.state;

        this.openURL(moreUrl, 'XApps');
    };

    onAppPress = (index: number) => {
        const { apps } = this.state;

        const { location, title } = apps[index];

        this.openURL(location, title);
    };

    openURL = (location: string, title: string) => {
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
                    uri: location,
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
                    onSnap={this.onSnap}
                    verticalOnly
                    snapPoints={[
                        { y: AppSizes.screen.height + 3 },
                        { y: AppSizes.screen.height - AppSizes.moderateScale(430) - AppSizes.navigationBarHeight },
                        {
                            y: AppSizes.screen.height - AppSizes.moderateScale(430) - AppSizes.navigationBarHeight,
                        },
                    ]}
                    boundaries={{
                        top: AppSizes.screen.height - AppSizes.moderateScale(480) - AppSizes.navigationBarHeight,
                    }}
                    initialPosition={{ y: AppSizes.screen.height + 3 }}
                    animatedValueY={this.deltaY}
                    animatedValueX={this.deltaX}
                >
                    <View
                        style={[styles.container, { height: AppSizes.moderateScale(480) }]}
                        onStartShouldSetResponder={() => true}
                    >
                        <View style={AppStyles.panelHeader}>
                            <View style={AppStyles.panelHandle} />
                        </View>

                        <View style={[AppStyles.centerAligned, AppStyles.paddingBottomSml]}>
                            <Text style={[AppStyles.h5, AppStyles.strong]}>
                                {Localize.t('payload.whatDoYouWantToDo')}
                            </Text>
                        </View>

                        <View style={[AppStyles.row, AppStyles.centerAligned]}>
                            <View style={[AppStyles.flex1]}>
                                <Text style={[AppStyles.h5]}>xApps</Text>
                            </View>
                            <View style={[AppStyles.row, AppStyles.flex1, AppStyles.flexEnd]}>
                                <Button
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
                            <ActivityIndicator color={AppColors.blue} style={styles.activityIndicator} />
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

                        <HorizontalLine />

                        <View
                            style={[
                                AppStyles.row,
                                AppStyles.paddingVertical,
                                { marginBottom: AppSizes.navigationBarHeight },
                            ]}
                        >
                            <View style={[AppStyles.flex1]}>
                                <Button
                                    label={Localize.t('global.scanAQRCode')}
                                    onPress={this.onScanButtonPress}
                                    style={styles.actionButtonBlack}
                                    icon="IconScan"
                                    iconStyle={AppStyles.imgColorWhite}
                                />
                            </View>
                        </View>
                    </View>
                </Interactable.View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default HomeActionsOverlay;
