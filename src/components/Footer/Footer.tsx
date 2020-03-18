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
}

/* Component ==================================================================== */
const Footer: React.SFC<Props> = ({ children, style }) => <View style={[styles.container, style]}>{children}</View>;

/* Export Component ==================================================================== */
export default Footer;
