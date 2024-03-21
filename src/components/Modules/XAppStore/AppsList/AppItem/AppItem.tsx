import React, { Component } from 'react';
import { View, Text, Animated } from 'react-native';

import StyleService from '@services/StyleService';

import { AppStyles } from '@theme';
import { TouchableDebounce, Avatar, Button } from '@components/General';

import styles from './styles';
import Locale from '@locale';

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
    onPress: (app: AppType) => void;
    action: AppActions;
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

    onPress = () => {
        const { item, onPress } = this.props;

        if (typeof onPress === 'function') {
            onPress(item!);
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
                <Button onPress={this.onPress} light roundedMini label={actionLabel} />
            </View>
        );
    };

    render() {
        const { item } = this.props;

        if (!item) {
            return this.renderPlaceholder();
        }

        return (
            <TouchableDebounce onPress={this.onPress} activeOpacity={0.9}>
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
