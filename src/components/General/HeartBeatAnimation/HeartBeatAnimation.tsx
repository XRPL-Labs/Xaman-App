/**
 * Heart beat Animation
 *
    <HeartBeatAnimation>{children}</HeartBeatAnimation>
 *
 */
import React, { PureComponent } from 'react';
import { View, Animated, ViewStyle, InteractionManager } from 'react-native';

/* Types ==================================================================== */
interface Props {
    animated?: boolean;
    children: React.ReactNode;
    containerStyle?: ViewStyle | ViewStyle[];
}

/* Component ==================================================================== */
class HeartBeatAnimation extends PureComponent<Props> {
    declare readonly props: Props & Required<Pick<Props, keyof typeof HeartBeatAnimation.defaultProps>>;

    static defaultProps: Partial<Props> = {
        animated: true,
    };

    private scaleAnimation: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.scaleAnimation = new Animated.Value(0);
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.startAnimation);
    }

    componentDidUpdate(prevProps: Props) {
        const { animated } = this.props;

        if (animated !== prevProps.animated) {
            if (animated) {
                this.startAnimation();
            } else {
                this.stopAnimation();
            }
        }
    }

    startAnimation = () => {
        const { animated } = this.props;

        if (!animated) return;

        Animated.loop(
            Animated.sequence([
                Animated.timing(this.scaleAnimation, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(this.scaleAnimation, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    };

    stopAnimation = () => {
        this.scaleAnimation.stopAnimation();
    };

    render() {
        const { children, containerStyle } = this.props;

        return (
            <View style={[containerStyle]}>
                <Animated.View
                    style={{
                        transform: [
                            {
                                scale: this.scaleAnimation.interpolate({
                                    inputRange: [0.5, 1],
                                    outputRange: [1, 0.95],
                                }),
                            },
                        ],
                    }}
                >
                    {children}
                </Animated.View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default HeartBeatAnimation;
