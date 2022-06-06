/**
 * Image Avatar
 *
    <Avatar source={{uri: ""}} size={45} border />
 *
 */
import React, { PureComponent } from 'react';

import { View, Image, ImageSourcePropType, ViewStyle } from 'react-native';

import { Images } from '@common/helpers/images';

import { Icon } from '@components/General/Icon';

import { AppSizes } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
export interface Props {
    source: ImageSourcePropType;
    size?: number;
    imageScale?: number;
    border?: boolean;
    badge?: (() => React.ReactNode) | Extract<keyof typeof Images, string>;
    badgeColor?: string;
    containerStyle?: ViewStyle | ViewStyle[];
    backgroundColor?: string;
}

/* Component ==================================================================== */
class Avatar extends PureComponent<Props> {
    static defaultProps = {
        size: 40,
        imageScale: 1,
        border: false,
        badgeBorder: true,
    };

    renderBadge = () => {
        const { badge, badgeColor, size } = this.props;

        if (!badge) return null;

        if (typeof badge === 'function') {
            return (
                <View
                    style={[
                        styles.badgeContainer,
                        {
                            bottom: -size * 0.12,
                            right: -size * 0.15,
                        },
                    ]}
                >
                    {badge()}
                </View>
            );
        }

        if (typeof badge === 'string') {
            return (
                <View
                    style={[
                        styles.badgeContainerText,
                        {
                            borderRadius: size / 2,
                            padding: size * 0.07,
                            bottom: -size * 0.12,
                            right: -size * 0.15,
                        },
                        badgeColor && { backgroundColor: badgeColor },
                    ]}
                >
                    <Icon name={badge} size={size * 0.18} style={styles.badge} />
                </View>
            );
        }

        return null;
    };

    renderAvatar = () => {
        const { source, size, imageScale, border, containerStyle } = this.props;

        return (
            <View
                style={[
                    styles.container,
                    border && styles.border,
                    {
                        height: AppSizes.scale(size) + (border ? 1.3 : 0),
                        width: AppSizes.scale(size) + (border ? 1.3 : 0),
                    },
                    containerStyle,
                ]}
            >
                <Image
                    resizeMode="cover"
                    source={source}
                    style={[
                        styles.image,
                        { height: AppSizes.scale(size) * imageScale, width: AppSizes.scale(size) * imageScale },
                    ]}
                />
            </View>
        );
    };

    render() {
        return (
            <View>
                {this.renderAvatar()}
                {this.renderBadge()}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default Avatar;
