import React, { PureComponent } from 'react';
import { Text, Animated, InteractionManager, TextStyle } from 'react-native';

import { TouchableDebounce } from '@components/General/TouchableDebounce';

import styles from './styles';
/* types ==================================================================== */
export interface Props {
    children: React.ReactNode;
    isLoading: boolean;
    style: TextStyle | TextStyle[];
    onPress?: () => void;
}

/* component ==================================================================== */
class TextPlaceholder extends PureComponent<Props> {
    private readonly animatedFade: Animated.Value;

    constructor(props: Props) {
        super(props);
        this.animatedFade = new Animated.Value(1);
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.startPlaceholderAnimation);
    }

    startPlaceholderAnimation = () => {
        const { isLoading } = this.props;

        // if app provided stop the placeholder animation
        if (!isLoading) {
            return;
        }

        Animated.sequence([
            Animated.timing(this.animatedFade, {
                toValue: 0.1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(this.animatedFade, {
                toValue: 0.3,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]).start(this.startPlaceholderAnimation);
    };

    onPress = () => {
        const { onPress } = this.props;

        if (typeof onPress === 'function') {
            onPress();
        }
    };

    render() {
        const { style, isLoading, children } = this.props;

        if (isLoading) {
            return (
                <Animated.Text numberOfLines={1} style={[style, styles.placeholder, { opacity: this.animatedFade }]}>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </Animated.Text>
            );
        }

        return (
            <TouchableDebounce activeOpacity={0.8} onPress={this.onPress}>
                <Text numberOfLines={2} style={style}>
                    {children}
                </Text>
            </TouchableDebounce>
        );
    }
}

export default TextPlaceholder;
