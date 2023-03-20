import React, { Component } from 'react';
import { View, Text, Animated, Image } from 'react-native';

import { TouchableDebounce } from '@components/General';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export type AppType = {
    icon: string;
    identifier: string;
    title: string;
};

export interface Props {
    item?: AppType;
    onPress: (app: AppType) => void;
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
            onPress(item);
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
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Animated.Text>
                </View>
            </View>
        );
    };

    render() {
        const { item } = this.props;

        if (!item) {
            return this.renderPlaceholder();
        }

        return (
            <TouchableDebounce onPress={this.onPress} activeOpacity={0.6}>
                <Animated.View style={[styles.container, { opacity: this.fadeAnimation }]}>
                    <View style={AppStyles.flex1}>
                        <Image source={{ uri: item.icon }} style={styles.appIcon} />
                    </View>
                    <View style={[AppStyles.flex5, AppStyles.centerContent]}>
                        <Text numberOfLines={1} style={styles.appTitle}>
                            {item.title}
                        </Text>
                    </View>
                </Animated.View>
            </TouchableDebounce>
        );
    }
}

export default AppItem;
