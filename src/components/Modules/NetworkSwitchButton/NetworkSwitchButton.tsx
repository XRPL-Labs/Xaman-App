import React, { PureComponent } from 'react';
import { Animated, Easing, InteractionManager, Text, View, ViewStyle } from 'react-native';

import { AppScreens } from '@common/constants';

import NetworkService, { NetworkStateStatus } from '@services/NetworkService';

import { Navigator } from '@common/helpers/navigator';

import { NetworkModel } from '@store/models';

import { TouchableDebounce } from '@components/General';

import { AppSizes, AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    network: NetworkModel;
    containerStyle?: ViewStyle | ViewStyle[];
    hidden: boolean;
}

interface State {
    networkState: NetworkStateStatus;
}

/* Component ==================================================================== */
class NetworkSwitchButton extends PureComponent<Props, State> {
    public static CircleSize = AppSizes.scale(12);
    private animation: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.state = {
            networkState: NetworkService.getConnectionStatus(),
        };

        this.animation = new Animated.Value(0);
    }

    componentDidMount() {
        const { networkState } = this.state;

        // network service state change listener
        NetworkService.on('stateChange', this.onNetworkStateChange);

        // start the pulse animation if
        if (networkState === NetworkStateStatus.Connecting) {
            InteractionManager.runAfterInteractions(this.startPulseAnimation);
        }
    }

    componentWillUnmount() {
        NetworkService.off('stateChange', this.onNetworkStateChange);
    }

    onNetworkStateChange = (state: NetworkStateStatus) => {
        const { networkState } = this.state;

        if (state === networkState) {
            // nothing changed
            return;
        }

        this.setState(
            {
                networkState: state,
            },
            () => {
                if (state === NetworkStateStatus.Connecting) {
                    this.startPulseAnimation();
                }
            },
        );
    };

    startPulseAnimation = () => {
        const { networkState } = this.state;

        // set animation value to zero
        this.animation.setValue(0);

        Animated.timing(this.animation, {
            toValue: 1,
            duration: 1500,
            easing: Easing.sin,
            useNativeDriver: true,
        }).start(() => {
            if (networkState === NetworkStateStatus.Connecting) {
                this.startPulseAnimation();
            }
        });
    };

    onButtonPress = () => {
        Navigator.showOverlay(AppScreens.Overlay.SwitchNetwork);
    };

    render() {
        const { network, hidden, containerStyle } = this.props;
        const { networkState } = this.state;

        if (hidden || !network) {
            return null;
        }

        return (
            <View style={containerStyle}>
                <TouchableDebounce
                    accessibilityRole="button"
                    delayPressIn={0}
                    style={styles.buttonContainer}
                    onPress={this.onButtonPress}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText} numberOfLines={1}>
                        {network.name}
                    </Text>

                    <View style={styles.pulseWrapper}>
                        <Animated.View
                            style={[
                                styles.pulseCircle,
                                {
                                    backgroundColor: network.color,
                                    borderRadius: (NetworkSwitchButton.CircleSize * 1.4) / 2,
                                    width: NetworkSwitchButton.CircleSize,
                                    height: NetworkSwitchButton.CircleSize,
                                    transform: [
                                        {
                                            scale: this.animation.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [1, 1.7],
                                            }),
                                        },
                                    ],
                                    opacity: this.animation.interpolate({
                                        inputRange: [0.02, 1],
                                        outputRange: [1, 0],
                                    }),
                                },
                            ]}
                        />
                        <View
                            key={network.id}
                            style={[
                                AppStyles.centerContent,
                                AppStyles.centerAligned,
                                {
                                    width: NetworkSwitchButton.CircleSize,
                                    height: NetworkSwitchButton.CircleSize,
                                    borderRadius: NetworkSwitchButton.CircleSize / 2,
                                    backgroundColor: network.color,
                                },
                            ]}
                        >
                            {networkState === NetworkStateStatus.Disconnected && (
                                <Text adjustsFontSizeToFit style={styles.exclamationMarkText}>
                                    !
                                </Text>
                            )}
                        </View>
                    </View>
                </TouchableDebounce>
            </View>
        );
    }
}

export default NetworkSwitchButton;
