/**
 * App Change log modal
 */
import React, { Component } from 'react';
import { View, Text, Animated, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens, AppConfig } from '@common/constants';

import { Button } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    version: string;
}

export interface State {}

/* Component ==================================================================== */
class ChangeLogModalView extends Component<Props, State> {
    static screenName = AppScreens.Overlay.ChangeLog;

    private animatedColor: Animated.Value;
    private animatedOpacity: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.animatedColor = new Animated.Value(0);
        this.animatedOpacity = new Animated.Value(0);
    }

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    componentDidMount() {
        Animated.parallel([
            Animated.timing(this.animatedColor, {
                toValue: 150,
                duration: 350,
                useNativeDriver: false,
            }),
            Animated.timing(this.animatedOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }

    dismiss = () => {
        Animated.parallel([
            Animated.timing(this.animatedColor, {
                toValue: 0,
                duration: 350,
                useNativeDriver: false,
            }),
            Animated.timing(this.animatedOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            Navigator.dismissOverlay();
        });
    };

    render() {
        const { version } = this.props;

        const interpolateColor = this.animatedColor.interpolate({
            inputRange: [0, 150],
            outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)'],
        });

        return (
            <Animated.View
                testID="change-log-overlay"
                style={[styles.container, { backgroundColor: interpolateColor }]}
            >
                <Animated.View style={[styles.visibleContent, { opacity: this.animatedOpacity }]}>
                    <View style={styles.headerContainer}>
                        <View style={[AppStyles.flex1]}>
                            <Text style={[AppStyles.p, AppStyles.bold]}>{Localize.t('global.whatsNew')}</Text>
                        </View>
                        <View style={[AppStyles.row, AppStyles.flex1, AppStyles.flexEnd]}>
                            <Button
                                testID="close-change-log-button"
                                label={Localize.t('global.close')}
                                roundedSmall
                                secondary
                                onPress={this.dismiss}
                            />
                        </View>
                    </View>
                    <View style={[AppStyles.flex1, styles.contentContainer]}>
                        <WebView
                            containerStyle={[AppStyles.flex1]}
                            startInLoadingState
                            renderLoading={() => (
                                <ActivityIndicator color={AppColors.blue} style={styles.loadingStyle} size="large" />
                            )}
                            source={{ uri: `${AppConfig.changeLogURL}${version}` }}
                        />
                    </View>
                </Animated.View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default ChangeLogModalView;
