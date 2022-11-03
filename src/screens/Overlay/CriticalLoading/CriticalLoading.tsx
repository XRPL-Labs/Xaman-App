/**
 * Critical Loading Modal
 */

import React, { Component } from 'react';
import { View, Animated, Text, BackHandler, NativeEventSubscription } from 'react-native';

import { AppScreens } from '@common/constants';

// components
import { Spacer, Icon, LoadingIndicator } from '@components/General';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    testID?: string;
    text: string;
    title?: string;
}

export interface State {}
/* Component ==================================================================== */
class CriticalLoading extends Component<Props, State> {
    static screenName = AppScreens.Overlay.CriticalLoading;

    private backHandler: NativeEventSubscription;
    private animateScale: Animated.Value;
    private animatedColor: Animated.Value;
    private animatedOpacity: Animated.Value;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.animateScale = new Animated.Value(0);
        this.animatedColor = new Animated.Value(0);
        this.animatedOpacity = new Animated.Value(1);
    }

    componentDidMount() {
        // prevent from hardware back in android devices
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

        Animated.parallel([
            Animated.spring(this.animateScale, {
                toValue: 1,
                velocity: 0,
                tension: 65,
                friction: 7,
                useNativeDriver: true,
            }),

            Animated.timing(this.animatedColor, {
                toValue: 150,
                duration: 350,
                useNativeDriver: false,
            }),
        ]).start();
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
    }

    render() {
        const { testID } = this.props;
        const transform = [
            {
                scale: this.animateScale.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                }),
            },
        ];

        const interpolateColor = this.animatedColor.interpolate({
            inputRange: [0, 150],
            outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)'],
        });

        return (
            <Animated.View
                testID={testID}
                onStartShouldSetResponder={() => true}
                style={[styles.container, { backgroundColor: interpolateColor }]}
            >
                <Animated.View style={[styles.visibleContent, { transform, opacity: this.animatedOpacity }]}>
                    <View style={[AppStyles.centerAligned]}>
                        <Icon style={styles.icon} name="IconAlertTriangle" size={60} />
                    </View>

                    <View style={AppStyles.centerAligned}>
                        <Text style={[styles.title, styles.titleError]}>Processing...</Text>
                    </View>

                    <Spacer size={20} />

                    <LoadingIndicator size="large" />

                    <Spacer size={20} />

                    <View style={AppStyles.centerAligned}>
                        <Text style={styles.subTitle}>Please do NOT close the app or lock your device</Text>
                    </View>

                    <Spacer size={30} />
                </Animated.View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default CriticalLoading;
