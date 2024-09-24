import React, { Component } from 'react';
import { View, Text, Animated, Share } from 'react-native';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { AppScreens } from '@common/constants';
import { XAppOrigin } from '@common/libs/payload';

import { Navigator } from '@common/helpers/navigator';
import { Props as XAppBrowserModalProps } from '@screens/Modal/XAppBrowser/types';

import StyleService from '@services/StyleService';

import { TouchableDebounce, Avatar, Button } from '@components/General';

import { XAppInfoOverlayProps, DisplayButtonTypes } from '@screens/Overlay/XAppInfo';

import Locale from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */

export type AppType = {
    title: string;
    description: string;
    identifier: string;
    icon: string;
    category?: string;
    development?: boolean;
};

export enum AppActions {
    LUNCH_APP = 'LUNCH',
    OPEN_ABOUT = 'ABOUT',
}

export interface Props {
    item?: AppType;
    action: AppActions;
    origin: XAppOrigin;
}

/* Component ==================================================================== */
class AppItem extends Component<Props> {
    private readonly placeholderAnimation: Animated.Value;
    private readonly fadeAnimation: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.placeholderAnimation = new Animated.Value(1);
        this.fadeAnimation = new Animated.Value(0);
    }

    componentDidMount() {
        const { item } = this.props;

        // if no item present start placeholder animation
        if (!item) {
            this.startPlaceholderAnimation();
        } else {
            this.startFadeAnimation();
        }
    }

    startFadeAnimation = () => {
        Animated.timing(this.fadeAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    startPlaceholderAnimation = () => {
        const { item } = this.props;

        // if item provided stop the placeholder animation
        if (item) {
            this.startFadeAnimation();
            return;
        }

        Animated.sequence([
            Animated.timing(this.placeholderAnimation, {
                toValue: 0.4,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(this.placeholderAnimation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]).start(this.startPlaceholderAnimation);
    };

    openXApp = () => {
        const { item, origin } = this.props;

        const { identifier, title, icon } = item!;

        // open xApp browser
        Navigator.showModal<XAppBrowserModalProps>(
            AppScreens.Modal.XAppBrowser,
            {
                identifier,
                title,
                icon,
                origin,
            },
            {
                modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                modalPresentationStyle: OptionsModalPresentationStyle.overFullScreen,
            },
        );
    };

    shareXApp = () => {
        const { item } = this.props;

        const { identifier, title } = item!;

        Share.share({
            title,
            message: `https://xumm.app/detect/xapp:${identifier}`,
            url: undefined,
        });
    };

    openXAppInfo = () => {
        const { item } = this.props;

        const { identifier, title, icon } = item!;

        Navigator.showOverlay<XAppInfoOverlayProps>(AppScreens.Overlay.XAppInfo, {
            identifier,
            title: title!,
            icon: icon!,
            displayButtonTypes: [DisplayButtonTypes.OPEN, DisplayButtonTypes.SHARE],
            onOpenPress: this.openXApp,
            onSharePress: this.shareXApp,
        });
    };

    onActionPress = () => {
        const { action } = this.props;

        switch (action) {
            case AppActions.LUNCH_APP:
                this.openXApp();
                break;
            case AppActions.OPEN_ABOUT:
                this.openXAppInfo();
                break;
            default:
                break;
        }
    };

    renderPlaceholder = () => {
        return (
            <View style={styles.container}>
                <View style={AppStyles.flex1}>
                    <Animated.View
                        style={[
                            styles.appIcon,
                            styles.appIconPlaceholder,
                            {
                                opacity: this.placeholderAnimation,
                            },
                        ]}
                    />
                </View>

                <View style={[AppStyles.flex5, AppStyles.centerContent]}>
                    <Animated.Text
                        numberOfLines={1}
                        style={[styles.appTitle, styles.appTitlePlaceholder, { opacity: this.placeholderAnimation }]}
                    >
                        &nbsp;&nbsp;&nbsp;&nbsp;
                    </Animated.Text>
                    <Animated.Text
                        numberOfLines={1}
                        style={[
                            styles.appDescription,
                            styles.appDescriptionPlaceholder,
                            { opacity: this.placeholderAnimation },
                        ]}
                    >
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Animated.Text>
                </View>
            </View>
        );
    };

    renderActionButton = () => {
        const { action } = this.props;

        if (!action) {
            return null;
        }

        let actionLabel;

        switch (action) {
            case AppActions.LUNCH_APP:
                actionLabel = Locale.t('xapp.openXapp');
                break;
            case AppActions.OPEN_ABOUT:
                actionLabel = Locale.t('xapp.aboutXapp');
                break;
            default:
                return null;
        }

        return (
            <View style={styles.rightPanelContainer}>
                <Button onPress={this.onActionPress} light roundedMini label={actionLabel} />
            </View>
        );
    };

    render() {
        const { item } = this.props;

        if (!item) {
            return this.renderPlaceholder();
        }

        return (
            <TouchableDebounce onPress={this.openXApp} activeOpacity={0.9}>
                <Animated.View style={[styles.container, { opacity: this.fadeAnimation }]}>
                    <Avatar
                        size={40}
                        source={{ uri: item.icon }}
                        badge={item.development ? 'IconSmartPhone' : undefined}
                        badgeColor={StyleService.value('$orange')}
                    />
                    <View style={styles.titleContainer}>
                        <Text numberOfLines={1} style={styles.appTitle}>
                            {item.title}
                        </Text>
                        <Text numberOfLines={2} style={styles.appDescription}>
                            {item.description ?? 'This is a short description'}
                        </Text>
                    </View>
                    {this.renderActionButton()}
                </Animated.View>
            </TouchableDebounce>
        );
    }
}

export default AppItem;
