/**
 * InfoMessage
 *
    <InfoMessage />
 *
 */
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { Images } from '@common/helpers/images';
import { Icon } from '@components/General/Icon';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */

interface Props {
    icon?: Extract<keyof typeof Images, string>;
    iconSize?: number;
    label?: string;
    type: 'info' | 'warning' | 'error' | 'success' | 'neutral';
    flat?: boolean;
}

/* Component ==================================================================== */
class InfoMessage extends Component<Props> {
    render() {
        const { children, icon, iconSize, label, type, flat } = this.props;

        return (
            <View
                style={[
                    styles.messageBox,
                    flat && styles.messageBoxFlat,
                    type === 'info' ? styles.info : null,
                    type === 'warning' ? styles.warning : null,
                    type === 'error' ? styles.error : null,
                    type === 'success' ? styles.success : null,
                    type === 'neutral' ? styles.neutral : null,
                ]}
            >
                {icon && (
                    <View style={[styles.iconContainer]}>
                        <Icon
                            size={iconSize || 20}
                            name={icon}
                            style={[
                                type === 'info' ? styles.infoIcon : null,
                                type === 'warning' ? styles.warningIcon : null,
                                type === 'error' ? styles.errorIcon : null,
                                type === 'success' ? styles.successIcon : null,
                                type === 'neutral' ? styles.neutralIcon : null,
                            ]}
                        />
                    </View>
                )}

                <View style={[styles.labelContainer]}>
                    {children && !label ? (
                        children
                    ) : (
                        <Text
                            style={[
                                styles.label,
                                type === 'info' ? AppStyles.colorBlue : null,
                                type === 'warning' ? AppStyles.colorOrange : null,
                                type === 'error' ? AppStyles.colorRed : null,
                                type === 'success' ? AppStyles.colorGreen : null,
                                type === 'neutral' ? AppStyles.colorGrey : null,
                                // eslint-disable-next-line
                                { textAlign: icon ? 'left' : 'center' },
                            ]}
                        >
                            {label}
                        </Text>
                    )}
                </View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default InfoMessage;
