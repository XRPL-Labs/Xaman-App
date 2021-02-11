/**
 * Footer
 *
    <Footer></Footer>
 *
 */
import React from 'react';

import { View, ViewStyle } from 'react-native';

import { hasNotch } from '@common/helpers/device';

import { AppSizes } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    style?: ViewStyle | ViewStyle[];
    safeArea?: boolean;
}

/* Component ==================================================================== */
const Footer: React.SFC<Props> = ({ children, style, safeArea }) => (
    <View
        style={[
            styles.container,
            { paddingBottom: safeArea && (hasNotch() ? 34 : 0) + AppSizes.paddingExtraSml },
            style,
        ]}
    >
        {children}
    </View>
);

/* Export Component ==================================================================== */
export default Footer;
