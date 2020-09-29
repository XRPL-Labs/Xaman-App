import React, { PureComponent } from 'react';
import { View, Animated, SafeAreaView, ViewStyle } from 'react-native';

// components
import { Button } from '@components/General/Button';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';
/* Types ==================================================================== */
interface Props {
    style: ViewStyle;
    pages: number;
    progress: Animated.Value;
    indicatorColor: string;
    indicatorOpacity: number;
    scrollTo: (index: number) => void;
    onFinish: () => void;
}

interface State {
    currentIndex: number;
}

export default class Indicator extends PureComponent<Props, State> {
    currentIndex: number;

    componentWillUnmount() {
        const { progress } = this.props;
        progress.removeAllListeners();
    }

    renderSkipButton = () => {
        const { onFinish } = this.props;

        return (
            <Button
                testID="slider-start-button"
                label={Localize.t('global.start')}
                rounded
                onPress={onFinish}
                style={[AppStyles.buttonGreen, AppStyles.rightSelf]}
            />
        );
    };

    render() {
        const { pages, progress, indicatorOpacity, style } = this.props;

        const dots = Array.from(new Array(pages), (page, index) => {
            const opacity = progress.interpolate({
                inputRange: [-Infinity, index - 1, index, index + 1, Infinity],
                outputRange: [indicatorOpacity, indicatorOpacity, 1.0, indicatorOpacity, indicatorOpacity],
            });

            const viewStyle = { opacity };

            return <Animated.View style={[styles.dot, viewStyle]} key={index} />;
        });

        return (
            <SafeAreaView style={[styles.container, style]}>
                <View style={[styles.leftContent]}>{dots}</View>
                <View style={[styles.rightContent]}>{this.renderSkipButton()}</View>
            </SafeAreaView>
        );
    }
}
