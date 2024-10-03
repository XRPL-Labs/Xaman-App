/**
 * App Change log modal
 */
import React, { Component } from 'react';
import { View, Text, Animated } from 'react-native';

import { CoreRepository } from '@store/repositories';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';
import { WebLinks } from '@common/constants/endpoints';

import { WebViewBrowser, Button } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
import { Props, State } from './types';

/* Component ==================================================================== */
class ChangeLogOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.ChangeLog;

    private animatedColor: Animated.Value;
    private animatedOpacity: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.animatedColor = new Animated.Value(0);
        this.animatedOpacity = new Animated.Value(0);

        this.state = {
            coreSettings: CoreRepository.getSettings(),
        };
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
        Navigator.dismissOverlay();
    };

    getHeaders = () => {
        const { coreSettings } = this.state;

        return {
            'X-Xaman-Style': coreSettings.theme,
        };
    };

    getURI = () => {
        const { version } = this.props;

        return `${WebLinks.ChangeLogURL}/${Localize.getCurrentLocale()}/?update=${version}`;
    };

    render() {
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
                        <View style={AppStyles.flex1}>
                            <Text numberOfLines={1} style={[AppStyles.p, AppStyles.bold]}>
                                {Localize.t('global.whatsNew')}
                            </Text>
                        </View>
                        <View style={[AppStyles.row, AppStyles.flex1, AppStyles.flexEnd]}>
                            <Button
                                numberOfLines={1}
                                testID="close-change-log-button"
                                label={Localize.t('global.close')}
                                roundedSmall
                                secondary
                                onPress={this.dismiss}
                            />
                        </View>
                    </View>
                    <View style={[AppStyles.flex1, styles.contentContainer]}>
                        <WebViewBrowser
                            startInLoadingState
                            source={{ uri: this.getURI(), headers: this.getHeaders() }}
                            errorMessage={Localize.t('errors.unableToLoadChangeLogs')}
                        />
                    </View>
                </Animated.View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default ChangeLogOverlay;
