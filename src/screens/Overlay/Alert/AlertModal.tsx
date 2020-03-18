/**
 * Alert Modal
 */

import React, { Component } from 'react';
import { View, Animated, Text, TouchableOpacity } from 'react-native';

import { Navigator } from '@common/helpers';
import { AppScreens } from '@common/constants';

// components
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

    // renderIcon = () => {
    //     const { type } = this.props;

    //     switch (type) {
    //         case 'error':
    //             return <Icon style={styles.iconError} name="IconInfo" size={50} />;
    //         case 'info':
    //             return <Icon style={styles.iconInfo} name="IconInfo" size={50} />;
    //         case 'warning':
    //             return <Icon style={styles.iconWarning} name="IconInfo" size={50} />;
    //         case 'success':
    //             return <Icon style={styles.iconSuccess} name="IconCheck" size={50} />;
    //         default:
    //             return <Icon style={styles.iconSuccess} name="IconCheck" size={50} />;
    //     }
    // };

    renderTitle = () => {
        const { type, title } = this.props;

        let text = '';
        let headerStyle = styles.headerSuccess;

        switch (type) {
            case 'error':
                text = Localize.t('global.error');
                headerStyle = styles.headerError;
                break;
            case 'info':
                text = Localize.t('global.info');
                headerStyle = styles.headerInfo;
                break;
            case 'warning':
                text = Localize.t('global.warning');
                headerStyle = styles.headerWarning;
                break;
            case 'success':
                text = Localize.t('global.success');
                headerStyle = styles.headerSuccess;
                break;
            default:
                break;
        }

        if (title) {
            text = title;
        }

        return (
            <View style={[styles.header, { backgroundColor: headerStyle.backgroundColor }]}>
                <Text style={[styles.title, { color: headerStyle.color }]}>{text}</Text>
            </View>
        );
    };

    renderButtons = () => {
        const { buttons } = this.props;

        if (!buttons) {
            return (
                <View style={[styles.footer]}>
                    <View style={[AppStyles.flex1]}>
                        <TouchableOpacity onPress={() => this.dismiss()} style={styles.button}>
                            <Text style={styles.buttonText}>{Localize.t('global.back')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return (
            <View style={[styles.footer]}>
                {buttons.map((b: any, index: number) => {
                    return (
                        <View style={[AppStyles.flex1, index === 0 && buttons.length > 1 && styles.buttonSeparator]}>
                            <TouchableOpacity
                                onPress={() => {
                                    this.dismiss(b.onPress);
                                }}
                                style={[styles.button]}
                            >
                                <Text
                                    style={[
                                        styles.buttonText,
                                        b.light && styles.buttonTextLight,
                                        b.type === 'dismiss' && styles.buttonTextDismiss,
                                    ]}
                                >
                                    {b.text}
                                </Text>
                            </TouchableOpacity>
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
                    {this.renderTitle()}

                    <View style={[AppStyles.centerAligned, AppStyles.padding]}>
                        <Text style={styles.subTitle}>{text}</Text>
                    </View>

                    {this.renderButtons()}
                </Animated.View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default AlertModal;
