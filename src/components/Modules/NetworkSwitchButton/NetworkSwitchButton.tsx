import React, { PureComponent } from 'react';
import { View, ViewStyle } from 'react-native';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';

import { NetworkSchema } from '@store/schemas/latest';

import { Button } from '@components/General';

import styles from './styles';
/* Types ==================================================================== */
interface Props {
    network: NetworkSchema;
    containerStyle?: ViewStyle | ViewStyle[];
    hidden: boolean;
}

/* Component ==================================================================== */
class NetworkSwitchButton extends PureComponent<Props> {
    onButtonPress = () => {
        Navigator.showOverlay(AppScreens.Overlay.SwitchNetwork);
    };

    renderNetworkColor = () => {
        const { network } = this.props;

        return <View style={[styles.networkColorCircle, { backgroundColor: network.color }]} />;
    };

    render() {
        const { network, hidden, containerStyle } = this.props;

        if (hidden || !network) {
            return null;
        }

        return (
            <View style={containerStyle}>
                <Button
                    light
                    roundedMini
                    onPress={this.onButtonPress}
                    style={styles.switchNetworkButton}
                    label={network.name}
                    textStyle={styles.switchNetworkButtonTextStyle}
                    extraComponent={this.renderNetworkColor()}
                />
            </View>
        );
    }
}

export default NetworkSwitchButton;
