import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { Button } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    reorderEnabled: boolean;
    showAddButton: boolean;
    onAddPress: () => void;
    onReorderSavePress: () => void;
}

/* Component ==================================================================== */
class ListHeader extends PureComponent<Props> {
    onAddPress = () => {
        const { onAddPress } = this.props;

        if (typeof onAddPress === 'function') {
            onAddPress();
        }
    };

    onReorderSavePress = () => {
        const { onReorderSavePress } = this.props;

        if (typeof onReorderSavePress === 'function') {
            onReorderSavePress();
        }
    };

    renderButtons = () => {
        const { showAddButton, reorderEnabled } = this.props;

        if (reorderEnabled) {
            return (
                <Button
                    roundedMini
                    numberOfLines={1}
                    testID="reorder-save-button"
                    label={Localize.t('global.save')}
                    onPress={this.onReorderSavePress}
                    icon="IconCheck"
                    iconSize={19}
                    style={[AppStyles.rightSelf]}
                />
            );
        }

        if (showAddButton) {
            return (
                <Button
                    secondary
                    roundedMini
                    numberOfLines={1}
                    testID="add-token-button"
                    label={Localize.t('home.addAsset')}
                    onPress={this.onAddPress}
                    icon="IconPlus"
                    iconSize={19}
                    style={[AppStyles.rightSelf]}
                />
            );
        }

        return null;
    };

    render() {
        return (
            <View style={[styles.container]}>
                <View style={[AppStyles.row, AppStyles.flex5, AppStyles.centerAligned]}>
                    <Text numberOfLines={1} style={[styles.tokenText]}>
                        {Localize.t('global.assets')}
                    </Text>
                </View>

                <View style={[AppStyles.flex5]}>{this.renderButtons()}</View>
            </View>
        );
    }
}

export default ListHeader;
