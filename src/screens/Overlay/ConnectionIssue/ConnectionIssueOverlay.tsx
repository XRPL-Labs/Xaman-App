/**
 * Connection Issue Modal
 */

import React, { Component } from 'react';
import { Animated, Text } from 'react-native';

import NetworkService from '@services/NetworkService';
import StyleService from '@services/StyleService';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

// components
import { Button, Spacer, Icon } from '@components/General';
import Localize from '@locale';

// style
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {}
/* Component ==================================================================== */
class ConnectionIssueOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.ConnectionIssue;

    private animatedColor: Animated.Value;
    private animatedOpacity: Animated.Value;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.animatedColor = new Animated.Value(0);
        this.animatedOpacity = new Animated.Value(1);
    }

    componentDidMount() {
        Animated.timing(this.animatedColor, {
            toValue: 150,
            duration: 350,
            useNativeDriver: false,
        }).start();
    }

    dismiss = () => {
        Animated.parallel([
            Animated.timing(this.animatedOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(this.animatedColor, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start(() => {
            Navigator.dismissOverlay();
        });
    };

    render() {
        const interpolateColor = this.animatedColor.interpolate({
            inputRange: [0, 150],
            outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)'],
        });

        return (
            <Animated.View style={[styles.container, { backgroundColor: interpolateColor }]}>
                <Animated.View style={[styles.visibleContent, { opacity: this.animatedOpacity }]}>
                    <Icon name={StyleService.isDarkMode() ? 'ImageCloudAlertLight' : 'ImageCloudAlert'} size={100} />
                    <Spacer size={30} />
                    <Text style={styles.title}>{Localize.t('global.looksLikeYouAreOffline')}</Text>
                    <Spacer size={5} />
                    <Text style={styles.subTitle}>
                        {Localize.t('global.unableToConnectToLedgerNodePleaseCheckYourConnection', {
                            network: NetworkService.getNetwork().name,
                        })}
                    </Text>
                    <Spacer size={30} />
                    <Button onPress={this.dismiss} label={Localize.t('global.close')} light />
                </Animated.View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default ConnectionIssueOverlay;
