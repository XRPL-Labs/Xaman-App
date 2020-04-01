/**
 * Footer
 *
    <Footer></Footer>
 *
 */
import React from 'react';

import { View, ViewStyle } from 'react-native';

import styles from './styles';

/* Types ==================================================================== */
interface Props {
    style?: ViewStyle | ViewStyle[];
    safeArea?: boolean;
}

/* Component ==================================================================== */
const Footer: React.SFC<Props> = ({ children, style, safeArea }) => (
    <View style={[styles.container, safeArea && styles.safeArea, style]}>{children}</View>
);

/* Export Component ==================================================================== */
export default Footer;
