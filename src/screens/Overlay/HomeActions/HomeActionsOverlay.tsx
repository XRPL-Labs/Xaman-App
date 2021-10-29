/**
 * home actions overlay
 */
import React, { Component } from 'react';
import { View, Text, Image, TouchableOpacity, InteractionManager } from 'react-native';

import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { Navigator } from '@common/helpers/navigator';

import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';

import { BackendService, StyleService } from '@services';

import { AppScreens } from '@common/constants';

// components
import { Button, Spacer, LoadingIndicator, ActionPanel } from '@components/General';

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

    private actionPanel: ActionPanel;

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
    }

    componentDidMount() {
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

    onScanButtonPress = () => {
        if (this.actionPanel) {
            this.actionPanel.slideDown();
        }

        setTimeout(() => {
            Navigator.showModal(
                AppScreens.Modal.Scan,
                {},
                {
                    modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                    modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                },
            );
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

        if (this.actionPanel) {
            this.actionPanel.slideDown();
        }

        setTimeout(() => {
            Navigator.showModal(
                AppScreens.Modal.XAppBrowser,
                {
                    identifier,
                    title,
                    account,
                },
                {
                    modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                    modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                },
            );
        }, 800);
    };

    render() {
        const { apps, isLoading } = this.state;

        return (
            <ActionPanel
                height={AppSizes.moderateScale(380)}
                onSlideDown={Navigator.dismissOverlay}
                extraBottomInset
                ref={(r) => {
                    this.actionPanel = r;
                }}
            >
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
                                    <Text numberOfLines={2} style={styles.appTitle}>
                                        {app.title}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                <View style={[AppStyles.row]}>
                    <Button
                        contrast
                        numberOfLines={1}
                        label={Localize.t('global.scanAQRCode')}
                        onPress={this.onScanButtonPress}
                        icon="IconScan"
                        style={[AppStyles.flex1]}
                    />
                </View>
            </ActionPanel>
        );
    }
}

/* Export Component ==================================================================== */
export default HomeActionsOverlay;
