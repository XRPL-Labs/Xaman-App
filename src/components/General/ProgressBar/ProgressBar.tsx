import React, { Component } from 'react';
import { View, Animated, ViewStyle } from 'react-native';

import { AppSizes } from '@theme';
import styles from './styles';
/* Types ==================================================================== */
interface Props {
    style?: ViewStyle | ViewStyle[];
    initialProgress: number;
    width: number;
    visible?: boolean;
}

/* Component ==================================================================== */
class ProgressBar extends Component<Props> {
    private progress: Animated.Value;

    declare readonly props: Props & Required<Pick<Props, keyof typeof ProgressBar.defaultProps>>;

    static defaultProps: Partial<Props> = {
        initialProgress: 0,
        width: AppSizes.screen.width,
        visible: true,
    };

    constructor(props: Props) {
        super(props);

        this.progress = new Animated.Value(props.initialProgress);
    }

    fill = (duration: number, callback?: any) => {
        this.progress.setValue(0);

        Animated.timing(this.progress, {
            duration,
            toValue: 1,
            useNativeDriver: false,
        }).start(() => {
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    update = (value: number) => {
        Animated.timing(this.progress, {
            duration: 10,
            toValue: value,
            useNativeDriver: false,
        }).start();
    };

    render() {
        const { visible, width, style } = this.props;

        if (!visible) {
            return null;
        }

        const fillWidth = this.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, width],
        });

        return (
            <View style={[style, styles.background]}>
                <Animated.View style={[styles.fill, { width: fillWidth }]} />
            </View>
        );
    }
}

export default ProgressBar;
