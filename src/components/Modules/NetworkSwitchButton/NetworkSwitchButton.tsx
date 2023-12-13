import { debounce } from 'lodash';
import React, { PureComponent } from 'react';
import { Animated, Easing, InteractionManager, Text, View, ViewStyle, DimensionValue } from 'react-native';

import { AppScreens } from '@common/constants';

import NetworkService, { NetworkStateStatus } from '@services/NetworkService';

import { Navigator } from '@common/helpers/navigator';

import { NetworkModel } from '@store/models';

import { Icon, TouchableDebounce } from '@components/General';

import { AppSizes, AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    hidden?: boolean;
    showChevronIcon?: boolean;
    loadingAnimation?: boolean;
    height?: DimensionValue;
    onNetworkChange?: (network: NetworkModel) => void;
    onSwitcherClose?: () => void;
    containerStyle?: ViewStyle | ViewStyle[];
}

interface State {
    network: NetworkModel;
    networkState: NetworkStateStatus;
    isSwitcherOpen: boolean;
}

/* Component ==================================================================== */
class NetworkSwitchButton extends PureComponent<Props, State> {
    public static CircleSize = AppSizes.scale(13);
    public static ButtonHeight = AppSizes.scale(30);
    private animation: Animated.Value;

    static defaultProps = {
        loadingAnimation: true,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            network: NetworkService.getNetwork(),
            networkState: NetworkService.getConnectionStatus(),
            isSwitcherOpen: false,
        };

        this.animation = new Animated.Value(0);
    }

    componentDidMount() {
        const { networkState } = this.state;

        // network service state change listener
        NetworkService.on('stateChange', this.onNetworkStateChange);
        // network switch events
        NetworkService.on('networkChange', this.debouncedOnNetworkChange);

        // start the pulse animation if
        if (networkState === NetworkStateStatus.Connecting) {
            InteractionManager.runAfterInteractions(this.startPulseAnimation);
        }
    }

    componentWillUnmount() {
        NetworkService.off('stateChange', this.onNetworkStateChange);
        NetworkService.off('networkChange', this.onNetworkChange);
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
        const { loadingAnimation } = this.props;
        const { networkState } = this.state;

        if (!loadingAnimation) {
            return;
        }

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

    onNetworkChange = (switchedNetwork: NetworkModel) => {
        const { onNetworkChange } = this.props;
        const { network } = this.state;

        // check if it's necessary to set the state
        if (switchedNetwork.key === network.key) {
            return;
        }

        this.setState(
            {
                network: switchedNetwork,
            },
            () => {
                if (typeof onNetworkChange === 'function') {
                    onNetworkChange(switchedNetwork);
                }
            },
        );
    };

    debouncedOnNetworkChange = debounce(this.onNetworkChange, 300, {
        leading: true,
        trailing: false,
    });

    onSwitcherClose = () => {
        const { onSwitcherClose } = this.props;

        this.setState({
            isSwitcherOpen: false,
        });

        if (typeof onSwitcherClose === 'function') {
            onSwitcherClose();
        }
    };

    onButtonPress = () => {
        this.setState({
            isSwitcherOpen: true,
        });

        Navigator.showOverlay(AppScreens.Overlay.SwitchNetwork, {
            onChangeNetwork: this.debouncedOnNetworkChange,
            onClose: this.onSwitcherClose,
        });
    };

    render() {
        const { height, containerStyle, hidden, showChevronIcon } = this.props;
        const { network, networkState, isSwitcherOpen } = this.state;

        if (hidden || !network) {
            return null;
        }

        return (
            <TouchableDebounce
                testID="network-switch-button"
                accessibilityRole="button"
                delayPressIn={0}
                style={[styles.buttonContainer, containerStyle, { height: height || NetworkSwitchButton.ButtonHeight }]}
                onPress={this.onButtonPress}
                activeOpacity={0.8}
            >
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
                        key={`${network.id.toHexString()}`}
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

                <Text style={[styles.buttonText, showChevronIcon && AppStyles.flex4]} numberOfLines={1}>
                    {network.name}
                </Text>

                {showChevronIcon && (
                    <View style={[AppStyles.flex1, AppStyles.rightAligned]}>
                        <Icon
                            style={styles.iconChevron}
                            size={25}
                            name={isSwitcherOpen ? 'IconChevronUp' : 'IconChevronDown'}
                        />
                    </View>
                )}
            </TouchableDebounce>
        );
    }
}

export default NetworkSwitchButton;
