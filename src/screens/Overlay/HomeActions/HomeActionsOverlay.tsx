/**
 * home actions overlay
 */
import React, { Component } from 'react';
import { View, Text, Image, InteractionManager } from 'react-native';

import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { Navigator } from '@common/helpers/navigator';

import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';

import { BackendService, StyleService } from '@services';

import { AppScreens } from '@common/constants';

import { XAppOrigin } from '@common/libs/payload';

// components
import { Button, ActionPanel } from '@components/General';
import { XAppShortList } from '@components/Modules';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    account: AccountSchema;
    apps: any;
    featured: any;
}

/* Component ==================================================================== */
class HomeActionsOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.HomeActions;

    private actionPanel: React.RefObject<ActionPanel>;
    private mounted: boolean;

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
            apps: undefined,
            featured: undefined,
        };

        this.actionPanel = React.createRef();
    }

    componentDidMount() {
        // keep track of component mounted statue
        this.mounted = true;

        // fetch the apps short list
        InteractionManager.runAfterInteractions(this.fetchApps);
    }

    componentWillUnmount() {
        // keep track of component mounted statue
        this.mounted = false;
    }

    fetchApps = () => {
        BackendService.getXAppShortList().then((resp: any) => {
            const { apps, featured } = resp;

            if (!this.mounted) {
                return;
            }

            this.setState({
                apps,
                featured,
            });
        });
    };

    onScanButtonPress = () => {
        if (this.actionPanel.current) {
            this.actionPanel.current.slideDown();
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

    onAppPress = (app: any) => {
        const { identifier, title } = app;

        this.openXApp(identifier, title);
    };

    openXApp = (identifier: string, title: string) => {
        const { account } = this.state;

        if (this.actionPanel.current) {
            this.actionPanel.current.slideDown();
        }

        setTimeout(() => {
            Navigator.showModal(
                AppScreens.Modal.XAppBrowser,
                {
                    identifier,
                    title,
                    account,
                    origin: XAppOrigin.XAPP_SHORT_LIST,
                },
                {
                    modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                    modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                },
            );
        }, 800);
    };

    render() {
        const { apps, featured } = this.state;

        return (
            <ActionPanel
                height={AppSizes.moderateScale(470)}
                onSlideDown={Navigator.dismissOverlay}
                extraBottomInset
                ref={this.actionPanel}
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

                <XAppShortList apps={apps} onAppPress={this.onAppPress} containerStyle={styles.rowListContainer} />
                <XAppShortList apps={featured} onAppPress={this.onAppPress} containerStyle={styles.rowListContainer} />

                <View style={styles.actionButtonContainer}>
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
