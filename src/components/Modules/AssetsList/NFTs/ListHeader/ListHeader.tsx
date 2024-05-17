import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { TouchableDebounce, Icon } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    onTitlePress: () => void;
}

/* Component ==================================================================== */
class ListHeader extends PureComponent<Props> {
    onTitlePress = () => {
        const { onTitlePress } = this.props;

        if (typeof onTitlePress === 'function') {
            onTitlePress();
        }
    };

    renderTitle = () => {
        return (
            <TouchableDebounce
                style={[AppStyles.row, AppStyles.flex5, AppStyles.centerAligned]}
                onPress={this.onTitlePress}
            >
                <Text numberOfLines={1} style={styles.tokenText}>
                    {Localize.t('global.nfts')}
                </Text>
                <Icon name="IconChevronDown" size={22} style={styles.pickerIcon} />
            </TouchableDebounce>
        );
    };

    render() {
        return <View style={styles.container}>{this.renderTitle()}</View>;
    }
}

export default ListHeader;
