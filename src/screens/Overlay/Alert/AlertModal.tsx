/**
 * Alert Modal
 */

import React, { Component } from 'react';
import { View, Animated, Text } from 'react-native';

import { Navigator } from '@common/helpers';
import { AppScreens } from '@common/constants';

// components
import { Button, Spacer, Icon } from '@components';
import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    type: 'success' | 'info' | 'warning' | 'error';
    text: string;
    title?: string;
    buttons: { text: string; onPress: () => void; type?: 'continue' | 'dismiss'; light?: boolean }[];
    onDismissed?: () => void;
}

export interface State {}
/* Component ==================================================================== */
class AlertModal extends Component<Props, State> {
    static screenName = AppScreens.Overlay.Alert;

    private animate: Animated.Value;
    private animatedColor: Animated.Value;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.animate = new Animated.Value(0);
        this.animatedColor = new Animated.Value(0);
    }

    componentDidMount() {
        Animated.parallel([
            Animated.spring(this.animate, {
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

    dismiss = (callback?: () => void) => {
        const { onDismissed } = this.props;

        Animated.parallel([
            Animated.timing(this.animate, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(this.animatedColor, {
                toValue: 0,
                duration: 100,
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
        const { type } = this.props;

        switch (type) {
            case 'error':
                return <Text style={[styles.title, styles.titleError]}>{Localize.t('global.error')}</Text>;
            case 'info':
                return <Text style={[styles.title, styles.titleInfo]}>{Localize.t('global.info')}</Text>;
            case 'warning':
                return <Text style={[styles.title, styles.titleWarning]}>{Localize.t('global.warning')}</Text>;
            case 'success':
                return <Text style={[styles.title, styles.titleSuccess]}>{Localize.t('global.success')}</Text>;
            default:
                return <Text style={[styles.title, styles.titleSuccess]}>{Localize.t('global.success')}</Text>;
        }
    };

    renderButtons = () => {
        const { buttons } = this.props;

        if (!buttons) {
            return <Button onPress={this.dismiss} light label={Localize.t('global.back')} />;
        }

        return (
            <View style={[AppStyles.row]}>
                {buttons.map((b: any, index: number) => {
                    return (
                        <View style={[AppStyles.flex1, index === 0 && buttons.length > 1 && AppStyles.paddingRightSml]}>
                            <Button
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
        );
    };

    render() {
        const { text } = this.props;
        const transform = [
            {
                scale: this.animate.interpolate({
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
            // @ts-ignore
            <Animated.View
                onResponderRelease={this.dismiss}
                onStartShouldSetResponder={() => true}
                style={[styles.container, { backgroundColor: interpolateColor }]}
            >
                <Animated.View style={[styles.visibleContent, { transform }]}>
                    <View style={[AppStyles.centerAligned]}>{this.renderIcon()}</View>

                    <View style={AppStyles.centerAligned}>{this.renderTitle()}</View>

                    <Spacer size={20} />

                    <View style={AppStyles.centerAligned}>
                        <Text style={styles.subTitle}>{text}</Text>
                    </View>

                    <Spacer size={30} />

                    {this.renderButtons()}
                </Animated.View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default AlertModal;
