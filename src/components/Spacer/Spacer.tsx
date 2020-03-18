/**
 * Spacer
 *
    <Spacer size={10} />
 *
 */
import React from 'react';

import { View } from 'react-native';

import styles from './styles';

/* Types ==================================================================== */
interface Props {
    size?: number;
}

/* Component ==================================================================== */
const Spacer: React.SFC<Props> = ({ size = 10 }) => <View style={[styles.container, { marginTop: size }]} />;

/* Export Component ==================================================================== */
export default Spacer;
