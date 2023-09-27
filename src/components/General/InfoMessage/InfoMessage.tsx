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

import Localize from '@locale';

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
    moreButtonLabel?: string;
    moreButtonIcon?: Extract<keyof typeof Images, string>;
    onMoreButtonPress?: () => void;
    isMoreButtonLoading?: boolean;
}

/* Component ==================================================================== */
class InfoMessage extends PureComponent<Props> {
    static defaultProps = {
        iconSize: 20,
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
        const { onMoreButtonPress, moreButtonLabel, moreButtonIcon, isMoreButtonLoading } = this.props;

        if (typeof onMoreButtonPress === 'function') {
            return (
                <Button
                    onPress={onMoreButtonPress}
                    style={styles.moreInfoButton}
                    icon={moreButtonIcon || 'IconInfo'}
                    label={moreButtonLabel || Localize.t('global.moreInfo')}
                    isLoading={isMoreButtonLoading}
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
