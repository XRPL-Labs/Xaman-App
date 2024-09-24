import React, { PureComponent } from 'react';

import { View, Animated } from 'react-native';

import styles from './styles';

/* Types ==================================================================== */
interface Props {
    children: React.ReactNode;
    progress?: Animated.Value;
}

/* Component ==================================================================== */

export default class Slide extends PureComponent<Props> {
    render() {
        const { progress, children } = this.props;
        return (
            <View style={[styles.container]}>
                <Animated.View
                    style={[
                        styles.animatedView,
                        {
                            opacity: progress?.interpolate({
                                inputRange: [-0.25, 0, 1],
                                outputRange: [0, 1, 1],
                            }),
                        },
                    ]}
                >
                    {children}
                </Animated.View>
            </View>
        );
    }
}
