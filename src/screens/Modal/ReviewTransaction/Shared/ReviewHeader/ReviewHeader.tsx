/**
 * Review transaction header
 */

import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { Button } from '@components/General';
import { NetworkLabel } from '@components/Modules';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */

interface Props {
    title: string;
    onClose: () => void;
}

interface State {}

/* Component ==================================================================== */
class ReviewHeader extends PureComponent<Props, State> {
    render() {
        const { title, onClose } = this.props;

        return (
            <View style={styles.container}>
                <View style={AppStyles.row}>
                    <View style={[AppStyles.flex1, AppStyles.leftAligned, AppStyles.paddingRightSml]}>
                        <Text numberOfLines={1} style={[AppStyles.h5, AppStyles.textCenterAligned]}>
                            {title}
                        </Text>
                        <NetworkLabel type="both" />
                    </View>
                    <View style={AppStyles.rightAligned}>
                        <Button
                            contrast
                            testID="close-button"
                            numberOfLines={1}
                            roundedSmall
                            label={Localize.t('global.close')}
                            onPress={onClose}
                        />
                    </View>
                </View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default ReviewHeader;
