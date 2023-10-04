import React, { PureComponent } from 'react';
import { Text, TextStyle, View, ViewStyle } from 'react-native';

import NetworkService from '@services/NetworkService';

import { NetworkModel } from '@store/models';

import { TouchableDebounce } from '@components/General';

import { AppSizes } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    containerStyle?: ViewStyle | ViewStyle[];
    textStyle?: TextStyle | TextStyle[];
    type: 'circle' | 'text' | 'both';
    onPress?: (network: NetworkModel) => void;
}

interface State {
    network: NetworkModel;
}

/* Component ==================================================================== */
class NetworkLabel extends PureComponent<Props, State> {
    public static CircleSize = AppSizes.scale(10);

    constructor(props: Props) {
        super(props);

        this.state = {
            network: NetworkService.getNetwork(),
        };
    }

    componentDidMount() {
        NetworkService.on('networkChange', this.onNetworkChange);
    }

    componentWillUnmount() {
        NetworkService.off('networkChange', this.onNetworkChange);
    }

    onNetworkChange = (network: NetworkModel) => {
        this.setState({
            network,
        });
    };

    onPress = () => {
        const { onPress } = this.props;
        const { network } = this.state;

        if (typeof onPress === 'function') {
            onPress(network);
        }
    };

    render() {
        const { type, containerStyle, textStyle } = this.props;
        const { network } = this.state;

        if (!network) {
            return null;
        }

        return (
            <TouchableDebounce
                accessibilityRole="button"
                delayPressIn={0}
                style={[styles.container, containerStyle]}
                onPress={this.onPress}
                activeOpacity={0.8}
            >
                {['text', 'both'].includes(type) && (
                    <Text style={[styles.textStyle, textStyle]} numberOfLines={1}>
                        {network.name}
                    </Text>
                )}
                {['circle', 'both'].includes(type) && (
                    <View
                        style={[
                            {
                                backgroundColor: network.color,
                                borderRadius: (NetworkLabel.CircleSize * 1.4) / 2,
                                width: NetworkLabel.CircleSize,
                                height: NetworkLabel.CircleSize,
                            },
                        ]}
                    />
                )}
            </TouchableDebounce>
        );
    }
}

export default NetworkLabel;
