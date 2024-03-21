/**
 * Image Avatar
 *
    <Avatar source={{uri: ""}} size={45} border />
 *
 */
import React, { PureComponent } from 'react';

import { Animated, View, Image, ImageSourcePropType, ViewStyle, InteractionManager } from 'react-native';

import { Images } from '@common/helpers/images';

import { Icon } from '@components/General/Icon';

import { AppSizes } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
export interface Props {
    source: ImageSourcePropType;
    size?: number;
    isLoading?: boolean;
    imageScale?: number;
    border?: boolean;
    badge?: (() => React.ReactNode) | Extract<keyof typeof Images, string>;
    badgeColor?: string;
    containerStyle?: ViewStyle | ViewStyle[];
    backgroundColor?: string;
}

/* Component ==================================================================== */
class Avatar extends PureComponent<Props> {
    private readonly animatedPulse: Animated.Value;
    private readonly animatedFadeIn: Animated.Value;

    declare readonly props: Props & Required<Pick<Props, keyof typeof Avatar.defaultProps>>;

    static defaultProps: Partial<Props> = {
        size: 40,
        imageScale: 1,
        border: false,
    };

    constructor(props: Props) {
        super(props);

        this.animatedPulse = new Animated.Value(0.3);
        this.animatedFadeIn = new Animated.Value(props.isLoading ? 0.3 : 1);
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.startPlaceholderAnimation);
    }

    componentDidUpdate(prevProps: Readonly<Props>) {
        const { isLoading } = this.props;

        if (!prevProps.isLoading && isLoading) {
            InteractionManager.runAfterInteractions(this.startPlaceholderAnimation);
        }

        // start the pulse animation
        if (prevProps.isLoading && !isLoading) {
            InteractionManager.runAfterInteractions(this.startFadeInAnimation);
        }
    }

    startPlaceholderAnimation = () => {
        const { isLoading } = this.props;

        if (!isLoading) {
            return;
        }

        Animated.sequence([
            Animated.timing(this.animatedPulse, {
                toValue: 0.1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(this.animatedPulse, {
                toValue: 0.3,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]).start(this.startPlaceholderAnimation);
    };

    startFadeInAnimation = () => {
        Animated.timing(this.animatedFadeIn, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
        }).start();
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
                        badgeColor ? { backgroundColor: badgeColor } : {},
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
            <Animated.View
                style={[
                    styles.container,
                    border && styles.border,
                    {
                        height: AppSizes.scale(size) + (border ? 1.3 : 0),
                        width: AppSizes.scale(size) + (border ? 1.3 : 0),
                        opacity: this.animatedFadeIn,
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
            </Animated.View>
        );
    };

    renderLoading = () => {
        const { size, border, containerStyle } = this.props;

        return (
            <Animated.View
                style={[
                    styles.container,
                    styles.placeholder,
                    border && styles.border,
                    {
                        height: AppSizes.scale(size) + (border ? 1.3 : 0),
                        width: AppSizes.scale(size) + (border ? 1.3 : 0),
                    },
                    containerStyle,
                    { opacity: this.animatedPulse },
                ]}
            />
        );
    };

    render() {
        const { isLoading } = this.props;

        if (isLoading) {
            return this.renderLoading();
        }

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
