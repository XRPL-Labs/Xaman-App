/**
 * InfoMessage
 *
    <InfoMessage />
 *
 */
import React, { PureComponent } from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';

import { Images } from '@common/helpers/images';

import { Button } from '@components/General/Button';
import { Icon } from '@components/General/Icon';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */

interface Props {
    children?: React.ReactNode;
    containerStyle?: ViewStyle | ViewStyle[];
    labelStyle?: TextStyle | TextStyle[];
    icon?: Extract<keyof typeof Images, string>;
    iconSize?: number;
    label?: string;
    type: 'info' | 'warning' | 'error' | 'success' | 'neutral';
    flat?: boolean;
    hideActionButton?: boolean;
    actionButtonLabel?: string;
    actionButtonIcon?: Extract<keyof typeof Images, string>;
    actionButtonIconSize?: number;
    onActionButtonPress?: () => void;
    isActionButtonLoading?: boolean;
}

/* Component ==================================================================== */
class InfoMessage extends PureComponent<Props> {
    static defaultProps = {
        iconSize: 20,
    };

    onActionButtonPress = () => {
        const { onActionButtonPress } = this.props;

        if (typeof onActionButtonPress === 'function') {
            onActionButtonPress();
        }
    };

    getContainerStyle = () => {
        const { type, containerStyle } = this.props;

        if (containerStyle) return containerStyle;

        switch (type) {
            case 'info':
                return styles.info;
            case 'warning':
                return styles.warning;
            case 'error':
                return styles.error;
            case 'success':
                return styles.success;
            case 'neutral':
                return styles.neutral;
            default:
                return null;
        }
    };

    renderIcon = () => {
        const { type, icon, iconSize } = this.props;

        if (typeof icon !== 'string') {
            return null;
        }

        const style = [];

        switch (type) {
            case 'info':
                style.push(styles.infoIcon);
                break;
            case 'warning':
                style.push(styles.warningIcon);
                break;
            case 'error':
                style.push(styles.errorIcon);
                break;
            case 'success':
                style.push(styles.successIcon);
                break;
            case 'neutral':
                style.push(styles.neutralIcon);
                break;
            default:
                break;
        }

        return (
            <View style={[styles.iconContainer]}>
                <Icon size={iconSize} name={icon} style={style} />
            </View>
        );
    };

    renderContent = () => {
        const { children, icon, label, labelStyle, type } = this.props;

        if (children && !label) {
            return <View style={[styles.labelContainer]}>{children}</View>;
        }

        const style = [styles.label];

        if (labelStyle) {
            style.push(labelStyle);
        } else {
            switch (type) {
                case 'info':
                    style.push(AppStyles.colorBlue);
                    break;
                case 'warning':
                    style.push(AppStyles.colorOrange);
                    break;
                case 'error':
                    style.push(AppStyles.colorRed);
                    break;
                case 'success':
                    style.push(AppStyles.colorGreen);
                    break;
                case 'neutral':
                    style.push(AppStyles.colorGrey);
                    break;
                default:
                    break;
            }
        }

        style.push({ textAlign: icon ? 'left' : 'center' });

        return (
            <View style={styles.labelContainer}>
                <Text style={style}>{label}</Text>
            </View>
        );
    };

    renderFooter = () => {
        const { hideActionButton, actionButtonLabel, actionButtonIcon, actionButtonIconSize, isActionButtonLoading } =
            this.props;

        if (typeof actionButtonLabel === 'string' && !hideActionButton) {
            return (
                <Button
                    onPress={this.onActionButtonPress}
                    style={styles.moreInfoButton}
                    icon={actionButtonIcon}
                    iconSize={actionButtonIconSize}
                    label={actionButtonLabel}
                    isLoading={isActionButtonLoading}
                    light
                    roundedSmallBlock
                />
            );
        }

        return null;
    };

    render() {
        const { flat } = this.props;

        return (
            <View style={[styles.container, flat && styles.containerFlat, this.getContainerStyle()]}>
                <View style={styles.contentContainer}>
                    {this.renderIcon()}
                    {this.renderContent()}
                </View>

                {this.renderFooter()}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default InfoMessage;
