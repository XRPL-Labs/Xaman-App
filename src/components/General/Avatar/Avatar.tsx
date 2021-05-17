/**
 * Image Avatar
 *
    <Avatar source={{uri: ""}} size={45} border />
 *
 */
import React, { PureComponent } from 'react';

import { View, Image, ImageSourcePropType } from 'react-native';

import { Images } from '@common/helpers/images';

import { Icon } from '@components/General/Icon';

import { AppSizes } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    source: ImageSourcePropType;
    size?: number;
    border?: boolean;
    badge?: (() => React.ReactNode) | Extract<keyof typeof Images, string>;
    badgeColor?: string;
}

/* Component ==================================================================== */
class Avatar extends PureComponent<Props> {
    static defaultProps = {
        size: 40,
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
        const { source, size, border } = this.props;

        return (
            <Image
                resizeMode="cover"
                borderRadius={25}
                source={source}
                style={[
                    styles.image,
                    { height: AppSizes.scale(size), width: AppSizes.scale(size) },
                    border && styles.border,
                ]}
            />
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
