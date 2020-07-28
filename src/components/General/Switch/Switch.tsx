import React, { Component } from 'react';
import { View, Text, Platform, Switch as RNSwitch, TextStyle } from 'react-native';

import { AppColors } from '@theme';
import styles from './styles';
/* Types ==================================================================== */
interface Props {
    title?: string;
    titleStyle?: TextStyle;
    direction?: 'right' | 'left';
    checked: boolean;
    onChange: (value: boolean) => void;
}

/* Component ==================================================================== */
class Switch extends Component<Props> {
    static defaultProps = {
        direction: 'left',
    };

    onValueChange = (value: boolean) => {
        const { onChange } = this.props;
        if (onChange) {
            onChange(value);
        }
    };

    render() {
        const { title, direction, checked } = this.props;

        let props = {};

        if (Platform.OS === 'android') {
            props = {
                trackColor: { true: AppColors.blue, false: AppColors.grey },
                thumbColor: AppColors.light,
            };
        }
        return (
            <View style={styles.container}>
                {direction === 'right' && title && <Text style={styles.title}>{title}</Text>}
                <View style={styles.switch}>
                    <View>
                        {/* eslint-disable-next-line */}
                        <RNSwitch onValueChange={this.onValueChange} style={styles.switch} value={checked} {...props} />
                    </View>
                </View>
                {direction === 'left' && title && <Text style={styles.title}>{title}</Text>}
            </View>
        );
    }
}

export default Switch;
