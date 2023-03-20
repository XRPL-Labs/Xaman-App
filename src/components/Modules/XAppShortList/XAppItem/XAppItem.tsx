import React, { Component } from 'react';
import { View, Text, Animated, Image } from 'react-native';

import { TouchableDebounce } from '@components/General';

import styles from './styles';
/* types ==================================================================== */
export type AppType = {
    icon: string;
    identifier: string;
    title: string;
};

export interface Props {
    app?: AppType;
    onPress?: (app: any) => void;
}

/* component ==================================================================== */
class XAppItem extends Component<Props> {
    private readonly placeholderAnimation: Animated.Value;
    private readonly fadeAnimation: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.placeholderAnimation = new Animated.Value(1);
        this.fadeAnimation = new Animated.Value(0);
    }

    componentDidMount() {
        const { app } = this.props;

        // if no app present start placeholder animation
        if (!app) {
            this.startPlaceholderAnimation();
        } else {
            this.startFadeAnimation();
        }
    }

    startFadeAnimation = () => {
        Animated.timing(this.fadeAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    };

    startPlaceholderAnimation = () => {
        const { app } = this.props;

        // if app provided stop the placeholder animation
        if (app) {
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
        const { app, onPress } = this.props;

        if (typeof onPress === 'function') {
            onPress(app);
        }
    };

    renderPlaceholder = () => {
        return (
            <View style={styles.container}>
                <Animated.View
                    style={[
                        styles.appIcon,
                        styles.appIconPlaceholder,
                        {
                            opacity: this.placeholderAnimation,
                        },
                    ]}
                />

                <Animated.Text
                    numberOfLines={1}
                    style={[styles.appTitle, styles.appTitlePlaceholder, { opacity: this.placeholderAnimation }]}
                >
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </Animated.Text>
                <Animated.Text
                    numberOfLines={1}
                    style={[styles.appTitle, styles.appTitlePlaceholder, { opacity: this.placeholderAnimation }]}
                >
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </Animated.Text>
            </View>
        );
    };

    render() {
        const { app } = this.props;

        if (!app) {
            return this.renderPlaceholder();
        }

        return (
            <Animated.View style={[styles.container, { opacity: this.fadeAnimation }]}>
                <TouchableDebounce activeOpacity={0.8} onPress={this.onPress}>
                    <Image source={{ uri: app.icon }} style={styles.appIcon} />
                    <Text numberOfLines={2} style={styles.appTitle}>
                        {app.title}
                    </Text>
                </TouchableDebounce>
            </Animated.View>
        );
    }
}

export default XAppItem;
