import React, { PureComponent } from 'react';
import { Text, TextStyle, View, ViewStyle } from 'react-native';

import NetworkService from '@services/NetworkService';

import { NetworkModel } from '@store/models';

import { TouchableDebounce } from '@components/General';

import { AppSizes } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    type: 'circle' | 'text' | 'both';
    size?: number;
    containerStyle?: ViewStyle | ViewStyle[];
    textStyle?: TextStyle | TextStyle[];
    onPress?: (network: NetworkModel) => void;
}

interface State {
    network: NetworkModel;
    size: number;
}

/* Component ==================================================================== */
class NetworkLabel extends PureComponent<Props, State> {
    static defaultProps = {
        size: 10,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            network: NetworkService.getNetwork(),
            size: AppSizes.scale(props.size),
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
        const { size, network } = this.state;

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
                {['circle', 'both'].includes(type) && (
                    <View
                        style={[
                            {
                                backgroundColor: network.color,
                                borderRadius: (size * 1.4) / 2,
                                width: size,
                                height: size,
                            },
                        ]}
                    />
                )}
                {['text', 'both'].includes(type) && (
                    <Text style={[styles.textStyle, textStyle]} numberOfLines={1}>
                        {network.name}
                    </Text>
                )}
            </TouchableDebounce>
        );
    }
}

export default NetworkLabel;
