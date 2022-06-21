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

export interface State {
    app?: AppType;
}

/* component ==================================================================== */
class XAppItem extends Component<Props, State> {
    private readonly animatedFade: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.state = {
            app: props.app,
        };

        this.animatedFade = new Animated.Value(1);
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        if (!prevState.app && nextProps.app) {
            return {
                app: nextProps.app,
            };
        }
        return null;
    }

    componentDidMount() {
        const { app } = this.state;

        // if no app present start placeholder animation
        if (!app) {
            this.startPlaceholderAnimation();
        }
    }

    startPlaceholderAnimation = () => {
        const { app } = this.props;

        // if app provided stop the placeholder animation
        if (app) {
            return;
        }

        Animated.sequence([
            Animated.timing(this.animatedFade, {
                toValue: 0.4,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(this.animatedFade, {
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

    render() {
        const { app } = this.props;

        if (!app) {
            return (
                <View style={styles.container}>
                    <Animated.View
                        style={[
                            styles.appIcon,
                            styles.appIconPlaceholder,
                            {
                                opacity: this.animatedFade,
                            },
                        ]}
                    />

                    <Animated.Text
                        numberOfLines={1}
                        style={[styles.appTitle, styles.appTitlePlaceholder, { opacity: this.animatedFade }]}
                    >
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Animated.Text>
                    <Animated.Text
                        numberOfLines={1}
                        style={[styles.appTitle, styles.appTitlePlaceholder, { opacity: this.animatedFade }]}
                    >
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Animated.Text>
                </View>
            );
        }

        return (
            <TouchableDebounce activeOpacity={0.8} style={styles.container} onPress={this.onPress}>
                <Image source={{ uri: app.icon }} style={styles.appIcon} />
                <Text numberOfLines={2} style={styles.appTitle}>
                    {app.title}
                </Text>
            </TouchableDebounce>
        );
    }
}

export default XAppItem;
