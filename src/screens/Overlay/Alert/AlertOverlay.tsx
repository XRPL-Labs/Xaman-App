/**
 * Alert Modal
 */

import React, { Component } from 'react';
import { View, Animated, Text, StyleSheet, BackHandler, NativeEventSubscription } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

// components
import { Button, Spacer, Icon } from '@components/General';
import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
import { Props, State } from './types';

/* Component ==================================================================== */
class AlertOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.Alert;

    private backHandler?: NativeEventSubscription;
    private animateScale: Animated.Value;
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

        this.animateScale = new Animated.Value(0);
        this.animatedColor = new Animated.Value(0);
        this.animatedOpacity = new Animated.Value(1);
    }

    componentDidMount() {
        // prevent from hardware back in android devices
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

        Animated.parallel([
            Animated.spring(this.animateScale, {
                toValue: 1,
                velocity: 0,
                tension: 65,
                friction: 7,
                useNativeDriver: true,
            }),

            Animated.timing(this.animatedColor, {
                toValue: 150,
                duration: 350,
                useNativeDriver: false,
            }),
        ]).start();
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
    }

    dismiss = (callback?: () => void) => {
        const { onDismissed } = this.props;

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

            if (typeof onDismissed === 'function') {
                onDismissed();
            }

            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    renderIcon = () => {
        const { type } = this.props;

        switch (type) {
            case 'error':
                return <Icon style={styles.iconError} name="IconInfo" size={60} />;
            case 'info':
                return <Icon style={styles.iconInfo} name="IconInfo" size={60} />;
            case 'warning':
                return <Icon style={styles.iconWarning} name="IconInfo" size={60} />;
            case 'success':
                return <Icon style={styles.iconSuccess} name="IconCheck" size={60} />;
            default:
                return <Icon style={styles.iconSuccess} name="IconCheck" size={60} />;
        }
    };

    renderTitle = () => {
        const { type, title } = this.props;

        let style;
        let text;

        switch (type) {
            case 'error':
                style = StyleSheet.flatten([styles.title, styles.titleError]);
                text = Localize.t('global.error');
                break;
            case 'info':
                style = StyleSheet.flatten([styles.title, styles.titleInfo]);
                text = Localize.t('global.info');
                break;
            case 'warning':
                style = StyleSheet.flatten([styles.title, styles.titleWarning]);
                text = Localize.t('global.warning');
                break;
            case 'success':
                style = StyleSheet.flatten([styles.title, styles.titleSuccess]);
                text = Localize.t('global.success');
                break;
            default:
                style = StyleSheet.flatten([styles.title, styles.titleSuccess]);
                text = Localize.t('global.success');
                break;
        }

        return <Text style={style}>{title || text}</Text>;
    };

    renderButtons = () => {
        const { buttons } = this.props;

        if (!buttons) {
            return (
                <>
                    <Spacer size={30} />
                    <Button testID="back-button" onPress={this.dismiss} light label={Localize.t('global.back')} />;
                </>
            );
        }

        const totalTextLength = buttons.reduce((acc, cur) => acc + cur.text.length, 0);
        const maxLengthForSideBySide = 15;

        return (
            <>
                <Spacer size={totalTextLength >= maxLengthForSideBySide ? 15 : 30} />
                <View style={[
                    totalTextLength < maxLengthForSideBySide && AppStyles.row,
                    // AppStyles.borderGreen,
                ]}>
                    {buttons.map((b: any, index: number) => {
                        return (
                            <View
                                key={`${index}`}
                                style={[
                                    totalTextLength >= maxLengthForSideBySide && styles.marginTop,
                                    totalTextLength < maxLengthForSideBySide && AppStyles.flex1,
                                    index === 0 &&
                                        buttons.length > 1 &&
                                        totalTextLength < maxLengthForSideBySide &&
                                        AppStyles.paddingRightSml,
                                ]}
                            >
                                <Button
                                    testID={b.testID}
                                    onPress={() => {
                                        this.dismiss(b.onPress);
                                    }}
                                    light={b.light}
                                    label={b.text}
                                />
                            </View>
                        );
                    })}
                </View>
            </>
        );
    };

    render() {
        const { testID, text } = this.props;
        const transform = [
            {
                scale: this.animateScale.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                }),
            },
        ];

        const interpolateColor = this.animatedColor.interpolate({
            inputRange: [0, 150],
            outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)'],
        });

        return (
            <Animated.View
                testID={testID}
                onStartShouldSetResponder={() => true}
                style={[styles.container, { backgroundColor: interpolateColor }]}
            >
                <Animated.View style={[styles.visibleContent, { transform, opacity: this.animatedOpacity }]}>
                    {this.renderIcon()}
                    {this.renderTitle()}
                    <Spacer size={20} />
                    <Text style={styles.subTitle}>{text}</Text>
                    <View style={[
                        // AppStyles.borderRed,
                        styles.fullWidth,
                    ]}>
                        {this.renderButtons()}
                    </View>
                </Animated.View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default AlertOverlay;
