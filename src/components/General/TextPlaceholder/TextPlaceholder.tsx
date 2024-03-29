import React, { PureComponent } from 'react';
import { Text, Animated, InteractionManager, TextStyle, View } from 'react-native';

import { TouchableDebounce } from '@components/General/TouchableDebounce';

import styles from './styles';
/* types ==================================================================== */
export interface Props {
    children: React.ReactNode;
    isLoading: boolean;
    length?: number;
    style?: TextStyle | TextStyle[];
    selectable?: boolean;
    numberOfLines?: number;
    onPress?: () => void;
}

/* component ==================================================================== */
class TextPlaceholder extends PureComponent<Props> {
    private readonly animatedPulse: Animated.Value;
    private readonly animatedFadeIn: Animated.Value;
    private mounted = false;

    declare readonly props: Props & Required<Pick<Props, keyof typeof TextPlaceholder.defaultProps>>;

    static defaultProps: Partial<Props> = {
        length: 12,
    };

    constructor(props: Props) {
        super(props);

        this.animatedPulse = new Animated.Value(0.3);
        this.animatedFadeIn = new Animated.Value(props.isLoading ? 0.3 : 1);
    }

    componentDidMount() {
        // track component mount state
        this.mounted = true;

        // start the placeholder
        InteractionManager.runAfterInteractions(this.startPlaceholderAnimation);
    }

    componentWillUnmount() {
        // track component mount state
        this.mounted = true;
    }

    componentDidUpdate(prevProps: Readonly<Props>) {
        const { isLoading } = this.props;

        // start the pulse animation
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

        // if not loading anymore then show the
        if (!isLoading || !this.mounted) {
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

    onPress = () => {
        const { onPress } = this.props;

        if (typeof onPress === 'function') {
            onPress();
        }
    };

    render() {
        const { style, onPress, isLoading, length, numberOfLines, selectable, children } = this.props;

        if (isLoading) {
            return (
                <Animated.Text
                    numberOfLines={numberOfLines}
                    style={[style, styles.placeholder, { opacity: this.animatedPulse }]}
                >
                    {'\u00A0'.repeat(length)}
                </Animated.Text>
            );
        }

        const isPressable = typeof onPress === 'function';

        const ContainerComponent = Animated.createAnimatedComponent(isPressable ? TouchableDebounce : View);
        const ContainerProps = isPressable ? { activeOpacity: 0.8, onPress: this.onPress } : {};

        return (
            // eslint-disable-next-line react/jsx-props-no-spreading
            <ContainerComponent {...ContainerProps} style={{ opacity: this.animatedFadeIn }}>
                <Text selectable={selectable} numberOfLines={numberOfLines} style={style}>
                    {children}
                </Text>
            </ContainerComponent>
        );
    }
}

export default TextPlaceholder;
