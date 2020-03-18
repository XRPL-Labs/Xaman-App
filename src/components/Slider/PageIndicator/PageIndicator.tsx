import React, { PureComponent } from 'react';
import { View, Animated, SafeAreaView, ViewStyle } from 'react-native';

// components
import { Button } from '@components';

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

export default class Indicator extends PureComponent<Props> {
    currentIndex: number;
    skipButtonVisibility: Animated.Value;

    constructor(props: Props) {
        super(props);
        this.currentIndex = 1;
        this.skipButtonVisibility = new Animated.Value(1);
    }

    componentDidMount() {
        const { progress, pages } = this.props;
        progress.addListener(obj => {
            if (this.currentIndex !== Math.floor(obj.value) + 1) {
                this.currentIndex = Math.floor(obj.value) + 1;

                // hide skip button
                if (this.currentIndex >= pages) {
                    Animated.timing(this.skipButtonVisibility, {
                        toValue: 0,
                        duration: 300,
                    }).start();
                } else {
                    Animated.timing(this.skipButtonVisibility, {
                        toValue: 1,
                        duration: 300,
                    }).start();
                }

                this.forceUpdate();
            }
        });
    }

    componentWillUnmount() {
        const { progress } = this.props;
        progress.removeAllListeners();
    }

    renderSkipButton = () => {
        const { pages, scrollTo, onFinish } = this.props;

        if (this.currentIndex < pages) {
            return (
                <Button
                    testID="skip-slider"
                    label={Localize.t('global.skip')}
                    rounded
                    onPress={() => {
                        scrollTo(pages);
                    }}
                    style={[AppStyles.rightSelf]}
                />
            );
        }
        return (
            <Button
                testID="ready-slider"
                label={Localize.t('global.ready')}
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
