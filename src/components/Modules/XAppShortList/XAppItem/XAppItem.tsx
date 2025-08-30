import React, { Component } from 'react';
import { View, Text, Animated, Image } from 'react-native';

import { TouchableDebounce } from '@components/General';

import Localize from '@locale';

import styles from './styles';
// import { AppStyles } from '@theme/index';

/* types ==================================================================== */
export type AppType = {
    icon: string;
    identifier: string;
    title: string;
};

export interface Props {
    app?: AppType;
    index?: number;
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

    render() {
        const { app, index } = this.props;

        if (typeof app === 'object' && !app?.title) {
            //  Nada
            const invisible: {
                opacity: number;
            } = { opacity: 0 };
            const none: {
                flex: number;
                alignItems: 'center';
                justifyContent: 'center';
            } = { 
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
            };
            return (
                <View style={styles.container}>
                    <View
                        style={[
                            styles.appIcon,
                            styles.appIconPlaceholder,
                            Number(index || 0) > 0 ? invisible : none,
                        ]}
                    >
                        {
                            Number(index || 0) === 0 && (
                                <View style={[
                                    // AppStyles.column,
                                    // AppStyles.borderGreen,
                                ]}>
                                    <Text style={[
                                        // styles.appTitle,
                                        styles.appIconPlaceholderText,
                                    ]}>
                                        { Localize.t('global.none') }
                                    </Text>
                                </View>
                            )
                        }
                    </View>
                    <View style={[
                        styles.appTitlePlaceholderContainer,
                    ]}>
                        <Text
                            numberOfLines={2}
                            style={[
                                styles.appTitle, styles.appTitlePlaceholder,
                                Number(index || 0) > 0 ? invisible : undefined,
                            ]}
                        >
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        </Text>
                    </View>
                </View>
            );
        }

        return (
            <>
                { !app &&
                    <View style={[
                        styles.container,
                    ]}>
                        <Animated.View
                            style={[
                                styles.appIcon,
                                styles.appIconPlaceholder,
                                {
                                    opacity: this.placeholderAnimation,
                                },
                            ]}
                        />
                        <View style={[
                            styles.appTitlePlaceholderContainer,
                        ]}>
                            <Animated.Text
                                numberOfLines={2}
                                style={[
                                    styles.appTitle,
                                    styles.appTitlePlaceholder,
                                    { opacity: this.placeholderAnimation },
                                ]}
                            >
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            </Animated.Text>
                        </View>
                    </View>
                }
                { app &&
                    <Animated.View style={[styles.container, { opacity: this.fadeAnimation }]}>
                        <TouchableDebounce activeOpacity={0.8} onPress={this.onPress}>
                            <Image source={{ uri: app.icon }} style={styles.appIcon} />
                            <View style={[
                                styles.appTitleContainer,
                            ]}>
                                <Text numberOfLines={2} style={styles.appTitle}>
                                    {app.title}
                                </Text>
                            </View>
                        </TouchableDebounce>
                    </Animated.View>
                }
            </>
        );
    }
}

export default XAppItem;
