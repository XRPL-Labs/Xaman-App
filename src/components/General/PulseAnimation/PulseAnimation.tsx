/**
 * Pulse Animation
 *
    <PulseAnimation>{children}</PulseAnimation>
 *
 */
import React, { PureComponent } from 'react';
import { Animated, ViewStyle } from 'react-native';

/* Types ==================================================================== */
interface Props {
    children: React.ReactNode;
    containerStyle?: ViewStyle | ViewStyle[];
}

/* Component ==================================================================== */
class PulseAnimation extends PureComponent<Props> {
    private scaleAnimation: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.scaleAnimation = new Animated.Value(0);
    }

    componentDidMount() {
        this.startAnimation();
    }

    startAnimation = () => {
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

    render() {
        const { children, containerStyle } = this.props;

        return (
            <Animated.View
                style={[
                    containerStyle,
                    {
                        transform: [
                            {
                                scale: this.scaleAnimation.interpolate({
                                    inputRange: [0.5, 1],
                                    outputRange: [1, 0.95],
                                }),
                            },
                        ],
                    },
                ]}
            >
                {children}
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default PulseAnimation;
