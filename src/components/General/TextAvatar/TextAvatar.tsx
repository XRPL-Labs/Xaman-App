/**
 * Text Avatar
 *
    <Spacer size={10} />
 *
 */
import React from 'react';

import { View, Text } from 'react-native';

import styles from './styles';

/* Types ==================================================================== */
interface Props {
    label: string;
}

const getInitials = (label: string) => {
    const name = label.toUpperCase().split(' ');
    let avatarName = '';
    if (name.length === 1) {
        avatarName = `${name[0].charAt(0)}`;
    } else if (name.length > 1) {
        avatarName = `${name[0].charAt(0)}${name[1].charAt(0)}`;
    }

    return avatarName;
};
/* Component ==================================================================== */
const TextAvatar: React.SFC<Props> = ({ label }) => (
    <View style={[styles.container]}>
        <Text style={[styles.text]}>{getInitials(label)}</Text>
    </View>
);

/* Export Component ==================================================================== */
export default TextAvatar;
