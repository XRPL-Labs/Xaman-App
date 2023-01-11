/**
 * Critical Processing Modal
 */

import React, { Component } from 'react';
import { View, Animated, Text, BackHandler, NativeEventSubscription, Platform, InteractionManager } from 'react-native';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';

// components
import { Spacer, Icon, LoadingIndicator, BlurView } from '@components/General';

import { StyleService } from '@services';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    testID?: string;
    task: () => Promise<void>;
    onSuccess: () => void;
    onError: () => void;
}

export interface State {}
/* Constants ==================================================================== */
const WARMUP_TIMEOUT_SEC = 1500; // wait time before running the task
const LONG_LAST_TASK_TIMEOUT_SEC = 5000; // set long lasting process after five seconds

/* Component ==================================================================== */
class CriticalProcessing extends Component<Props, State> {
    static screenName = AppScreens.Overlay.CriticalProcessing;

    private longTaskTimeout: NodeJS.Timeout;
    private backHandler: NativeEventSubscription;
    private animateScale: Animated.Value;
    private animateFade: Animated.Value;
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

        this.longTaskTimeout = undefined;
        this.animateScale = new Animated.Value(0);
        this.animatedOpacity = new Animated.Value(1);
        this.animateFade = new Animated.Value(0);
    }

    componentDidMount() {
        // prevent from hardware back in android devices
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

        // timeout for setting long lasting task flag
        this.longTaskTimeout = setTimeout(this.setLongLastingTask, LONG_LAST_TASK_TIMEOUT_SEC);

        // show animated scale
        Animated.spring(this.animateScale, {
            toValue: 1,
            velocity: 0,
            tension: 65,
            friction: 7,
            useNativeDriver: true,
        }).start();

        // run the task
        InteractionManager.runAfterInteractions(this.runTask);
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
        if (this.longTaskTimeout) {
            clearTimeout(this.longTaskTimeout);
        }
    }

    dismiss = (callback: () => void) => {
        Animated.timing(this.animatedOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(async () => {
            await Navigator.dismissOverlay();

            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    onTaskSuccess = () => {
        const { onSuccess } = this.props;

        // close the overlay with callback
        this.dismiss(onSuccess);
    };

    onTaskError = () => {
        const { onError } = this.props;

        // close the overlay with callback
        this.dismiss(onError);
    };

    runTask = async () => {
        const { task } = this.props;
        // wait for 1,5 seconds to make sure user is paying attention the critical message
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((r) => setTimeout(r, WARMUP_TIMEOUT_SEC));

        // run the task
        task().then(this.onTaskSuccess).catch(this.onTaskError);
    };

    setLongLastingTask = () => {
        const fadeInAndOut = Animated.sequence([
            Animated.timing(this.animateFade, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            }),
            Animated.timing(this.animateFade, {
                toValue: 0,
                duration: 1200,
                useNativeDriver: true,
            }),
        ]);

        Animated.loop(fadeInAndOut).start();
    };

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

        return (
            <BlurView style={styles.blurView} blurAmount={Platform.OS === 'ios' ? 5 : 10} blurType="dark">
                <Animated.View
                    testID={testID}
                    style={[styles.visibleContent, { transform, opacity: this.animatedOpacity }]}
                >
                    <View style={[AppStyles.centerAligned]}>
                        <Icon style={styles.icon} name="IconAlertTriangle" size={60} />
                    </View>
                    <View style={AppStyles.centerAligned}>
                        <Text style={styles.title}>Encrypting...</Text>
                    </View>

                    <Animated.View style={[AppStyles.centerAligned, { opacity: this.animateFade }]}>
                        <Text style={styles.title2}>Still working on it</Text>
                    </Animated.View>

                    <Spacer size={30} />
                    <LoadingIndicator size="large" color={StyleService.isDarkMode() ? 'dark' : 'light'} />
                    <Spacer size={30} />
                    <View style={AppStyles.centerAligned}>
                        <Text style={styles.subTitle}>Do NOT close Xumm{'\n'}Do NOT lock your device</Text>
                    </View>
                    <Spacer size={30} />
                </Animated.View>
            </BlurView>
        );
    }
}

/* Export Component ==================================================================== */
export default CriticalProcessing;
