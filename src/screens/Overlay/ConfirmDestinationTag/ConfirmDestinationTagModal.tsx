/**
 * Confirm Destination Tag modal
 */

import React, { Component } from 'react';
import { View, Animated, Text } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

// components
import { Button, Spacer, Icon } from '@components/General';
import Localize from '@locale';

import { Keyboard } from '@common/helpers/keyboard';
// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    destinationTag: string;
    onConfirm: () => void;
    onChange: () => void;
    onDismissed?: () => void;
}

export interface State {}
/* Component ==================================================================== */
class ConfirmDestinationTagModal extends Component<Props, State> {
    static screenName = AppScreens.Overlay.ConfirmDestinationTag;

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

    onConfirmPress = () => {
        const { onConfirm } = this.props;

        this.dismiss(onConfirm);
    };

    onChangePress = () => {
        const { onChange } = this.props;

        this.dismiss(onChange);
    };

    render() {
        const { destinationTag } = this.props;

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
            <Animated.View style={[styles.container, { backgroundColor: interpolateColor }]}>
                <Animated.View
                    onResponderRelease={() => Keyboard.dismiss()}
                    onStartShouldSetResponder={() => true}
                    style={[styles.visibleContent, { transform, opacity: this.animatedOpacity }]}
                >
                    <View style={[AppStyles.centerAligned]}>
                        <Icon style={styles.iconWarning} name="IconInfo" size={60} />
                    </View>
                    <Spacer size={20} />

                    <View style={AppStyles.centerAligned}>
                        <Text style={[styles.title]}>{Localize.t('send.doubleCheckDestinationTag')}</Text>
                    </View>

                    <Spacer size={20} />

                    <View style={AppStyles.centerAligned}>
                        <Text style={styles.subTitle}>{Localize.t('send.destinationTagWarningConfirm')}</Text>
                    </View>

                    <Spacer size={30} />

                    <View style={[AppStyles.centerAligned, AppStyles.paddingHorizontalSml]}>
                        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.destinationTagText}>
                            {String(destinationTag).split('').join(' ')}
                        </Text>
                    </View>

                    <Spacer size={30} />

                    <Button onPress={this.onConfirmPress} label={Localize.t('global.looksGood')} />
                    <Spacer size={10} />
                    <Button secondary onPress={this.onChangePress} label={Localize.t('global.change')} />
                </Animated.View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default ConfirmDestinationTagModal;
