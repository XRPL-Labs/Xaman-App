/**
 * Animated Dialog component
 */
import React, { PureComponent } from 'react';
import { Animated, InteractionManager, ViewStyle } from 'react-native';
import { GestureResponderEvent } from 'react-native/Libraries/Types/CoreEventTypes';

// style
import styles from './styles';

/* types ==================================================================== */
interface Props extends React.PropsWithChildren {
    testID?: string;
    height?: number;
    containerStyle?: ViewStyle | ViewStyle[];
    onDismiss?: () => void;
    onStartShouldSetResponder?: ((event: GestureResponderEvent) => boolean) | undefined;
}

interface State {}

/* Component ==================================================================== */
class AnimatedDialog extends PureComponent<Props, State> {
    private animatedHeight: Animated.Value;
    private animatedColor: Animated.Value;
    private animatedOpacity: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.animatedHeight = new Animated.Value(props.height ?? 0);
        this.animatedColor = new Animated.Value(0);
        this.animatedOpacity = new Animated.Value(1);
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.show);
    }

    componentDidUpdate(prevProps: Readonly<Props>) {
        const { height } = this.props;

        if (height && height !== prevProps.height) {
            this.updateHeight();
        }
    }

    updateHeight = () => {
        const { height } = this.props;

        if (typeof height === 'number') {
            Animated.spring(this.animatedHeight, {
                toValue: height,
                useNativeDriver: false,
            }).start();
        }
    };

    show = () => {
        Animated.timing(this.animatedColor, {
            toValue: 150,
            duration: 350,
            useNativeDriver: false,
        }).start();
    };

    public dismiss = () => {
        const { onDismiss } = this.props;

        Animated.parallel([
            Animated.timing(this.animatedOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }),
            Animated.timing(this.animatedColor, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start(() => {
            if (typeof onDismiss === 'function') {
                onDismiss();
            }
        });
    };

    render() {
        const { children, containerStyle, onStartShouldSetResponder, height } = this.props;

        const interpolateColor = this.animatedColor.interpolate({
            inputRange: [0, 150],
            outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)'],
        });

        return (
            <Animated.View
                onStartShouldSetResponder={onStartShouldSetResponder}
                style={[styles.container, { backgroundColor: interpolateColor }]}
            >
                <Animated.View
                    style={[
                        styles.visibleContent,
                        containerStyle,
                        { opacity: this.animatedOpacity, ...(height && { height: this.animatedHeight }) },
                    ]}
                >
                    {children}
                </Animated.View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default AnimatedDialog;
