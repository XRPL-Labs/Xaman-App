/**
 *  Line
 *
    <Avatar source={{uri: ""}} size={45} />
 *
 */
import React from 'react';

import { View } from 'react-native';

/* Types ==================================================================== */
interface Props {
    width: number;
    height: number;
    color: string;
}

/* Component ==================================================================== */
const HorizontalLine: React.SFC<Props> = ({ width, height, color }) => (
    <View
        style={{
            borderBottomColor: color,
            borderBottomWidth: height,
            width,
        }}
    />
);

/* Export Component ==================================================================== */
export default HorizontalLine;
