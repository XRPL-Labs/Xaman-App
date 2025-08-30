import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { Button, TouchableDebounce, Icon } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    reorderEnabled: boolean;
    showTokenAddButton: boolean;
    onTokenAddPress: () => void;
    onReorderSavePress: () => void;
    onTitlePress: () => void;
}

// interface State {
//     category:
// }

/* Component ==================================================================== */
class ListHeader extends PureComponent<Props> {
    onAddPress = () => {
        const { onTokenAddPress } = this.props;

        if (typeof onTokenAddPress === 'function') {
            onTokenAddPress();
        }
    };

    onReorderSavePress = () => {
        const { onReorderSavePress } = this.props;

        if (typeof onReorderSavePress === 'function') {
            onReorderSavePress();
        }
    };

    onTitlePress = () => {
        const { onTitlePress } = this.props;

        if (typeof onTitlePress === 'function') {
            onTitlePress();
        }
    };

    renderButtons = () => {
        const { showTokenAddButton, reorderEnabled } = this.props;

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
                    style={AppStyles.rightSelf}
                />
            );
        }

        if (showTokenAddButton) {
            return (
                <Button
                    light
                    roundedMini
                    numberOfLines={1}
                    testID="add-token-button"
                    label={Localize.t('home.addAsset')}
                    onPress={this.onAddPress}
                    icon="IconPlus"
                    iconSize={19}
                    style={AppStyles.rightSelf}
                />
            );
        }

        return null;
    };

    renderTitle = () => {
        return (
            <TouchableDebounce
                style={[AppStyles.row, AppStyles.flex5, AppStyles.centerAligned]}
                onPress={this.onTitlePress}
            >
                <Text numberOfLines={1} style={styles.tokenText}>
                    {Localize.t('global.assets')}
                </Text>
                <Icon name="IconChevronDown" size={22} style={styles.pickerIcon} />
            </TouchableDebounce>
        );
    };

    render() {
        return (
            <View style={styles.container}>
                {this.renderTitle()}
                <View style={AppStyles.flex5}>{this.renderButtons()}</View>
            </View>
        );
    }
}

export default ListHeader;
