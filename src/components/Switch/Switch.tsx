import React, { Component } from 'react';
import { View, Text, Platform, Switch as RNSwitch } from 'react-native';

import { AppColors } from '@theme';
import styles from './styles';
/* Types ==================================================================== */
interface Props {
    title?: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}

/* Component ==================================================================== */
class Switch extends Component<Props> {
    onValueChange = (value: boolean) => {
        const { onChange } = this.props;
        if (onChange) {
            onChange(value);
        }
    };

    render() {
        const { title, checked } = this.props;

        let props = {};

        if (Platform.OS === 'android') {
            props = {
                trackColor: { true: AppColors.blue, false: AppColors.grey },
                thumbColor: AppColors.light,
            };
        }
        return (
            <View style={styles.container}>
                <Text style={styles.title}>{title}</Text>
                <View style={styles.switch}>
                    <View>
                        {/* eslint-disable-next-line */}
                        <RNSwitch onValueChange={this.onValueChange} style={styles.switch} value={checked} {...props} />
                    </View>
                </View>
            </View>
        );
    }
}

export default Switch;
