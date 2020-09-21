/**
 * Request decline overlay
 */
import React, { Component, createRef } from 'react';
import { Animated, View, Text, Platform, Keyboard, Image, TouchableWithoutFeedback, KeyboardEvent } from 'react-native';

import Interactable from 'react-native-interactable';

import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';

import { AppScreens } from '@common/constants';

// components
import { Button, TextInput } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    buttonType: 'next' | 'set';
    destination: any;
    onClose?: () => void;
    onFinish: (destinationTag: string) => void;
}

export interface State {
    offsetBottom: number;
    destinationTag: string;
}

/* Component ==================================================================== */
class EnterDestinationTagOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.EnterDestinationTag;
    private textInputView: React.RefObject<View>;

    panel: any;
    deltaY: Animated.Value;
    deltaX: Animated.Value;

    static options() {
        return {
            statusBar: {
                visible: true,
                style: 'light',
            },
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            offsetBottom: 0,
            destinationTag: props.destination.tag || '',
        };

        this.textInputView = createRef<View>();

        this.deltaY = new Animated.Value(AppSizes.screen.height);
        this.deltaX = new Animated.Value(0);
    }

    componentDidMount() {
        this.slideUp();

        if (Platform.OS === 'ios') {
            Keyboard.addListener('keyboardWillShow', this.onKeyboardShow);
            Keyboard.addListener('keyboardWillHide', this.onKeyboardHide);
        } else {
            Keyboard.addListener('keyboardDidShow', this.onKeyboardShow);
            Keyboard.addListener('keyboardDidHide', this.onKeyboardHide);
        }
    }

    componentWillUnmount() {
        if (Platform.OS === 'ios') {
            Keyboard.removeListener('keyboardWillShow', this.onKeyboardShow);
            Keyboard.removeListener('keyboardWillHide', this.onKeyboardHide);
        } else {
            Keyboard.removeListener('keyboardDidShow', this.onKeyboardShow);
            Keyboard.removeListener('keyboardDidHide', this.onKeyboardHide);
        }
    }

    onKeyboardShow = (e: KeyboardEvent) => {
        if (this.textInputView && this.textInputView.current) {
            this.textInputView.current.measure((x, y, width, height, pageX, pageY) => {
                if (!pageY) return;

                const extraOffset = Platform.OS === 'android' ? 35 : 0;

                const bottomView = (AppSizes.screen.height - pageY) / 2;
                const KeyboardHeight = e.endCoordinates.height + extraOffset;

                this.setState({ offsetBottom: KeyboardHeight - bottomView }, () => {
                    this.panel.snapTo({ index: 2 });
                });
            });
        }
    };

    onKeyboardHide = () => {
        this.setState({ offsetBottom: 0 }, () => {
            this.panel.snapTo({ index: 1 });
        });
    };

    slideUp = () => {
        setTimeout(() => {
            if (this.panel) {
                this.panel.snapTo({ index: 1 });
            }
        }, 10);
    };

    slideDown = () => {
        Keyboard.dismiss();

        setTimeout(() => {
            if (this.panel) {
                this.panel.snapTo({ index: 0 });
            }
        }, 10);
    };

    onSnap = async (event: any) => {
        const { onClose } = this.props;

        const { index } = event.nativeEvent;

        if (index === 0) {
            Navigator.dismissOverlay();

            if (typeof onClose === 'function') {
                onClose();
            }
        }
    };

    onFinish = async () => {
        const { destinationTag } = this.state;
        const { onFinish } = this.props;

        // close overlay
        Navigator.dismissOverlay();

        if (typeof onFinish === 'function') {
            onFinish(destinationTag);
        }
    };

    onDestinationTagChange = (text: string) => {
        const destinationTag = text.replace(/[^0-9]/g, '');

        if (Number(destinationTag) < Number.MAX_SAFE_INTEGER) {
            this.setState({
                destinationTag,
            });
        }
    };

    render() {
        const { destination, buttonType } = this.props;
        const { offsetBottom, destinationTag } = this.state;

        return (
            <View style={AppStyles.flex1}>
                <TouchableWithoutFeedback
                    onPress={() => {
                        this.slideDown();
                    }}
                >
                    <Animated.View
                        style={[
                            AppStyles.shadowContent,
                            {
                                opacity: this.deltaY.interpolate({
                                    inputRange: [0, AppSizes.screen.height],
                                    outputRange: [1.1, 0],
                                    extrapolateRight: 'clamp',
                                }),
                            },
                        ]}
                    />
                </TouchableWithoutFeedback>

                <Interactable.View
                    ref={(r) => {
                        this.panel = r;
                    }}
                    animatedNativeDriver
                    onSnap={this.onSnap}
                    verticalOnly
                    snapPoints={[
                        { y: AppSizes.screen.height + 3 },
                        { y: AppSizes.screen.height - AppSizes.moderateScale(450) - AppSizes.navigationBarHeight },
                        {
                            y:
                                AppSizes.screen.height -
                                AppSizes.moderateScale(450) -
                                AppSizes.navigationBarHeight -
                                offsetBottom,
                        },
                    ]}
                    boundaries={{
                        top:
                            AppSizes.screen.height -
                            AppSizes.moderateScale(500) -
                            AppSizes.navigationBarHeight -
                            offsetBottom,
                    }}
                    initialPosition={{ y: AppSizes.screen.height + 3 }}
                    animatedValueY={this.deltaY}
                    animatedValueX={this.deltaX}
                >
                    <View
                        style={[styles.container, { height: AppSizes.moderateScale(500) }]}
                        onResponderRelease={() => Keyboard.dismiss()}
                        onStartShouldSetResponder={() => true}
                    >
                        <View style={AppStyles.panelHeader}>
                            <View style={AppStyles.panelHandle} />
                        </View>

                        <View style={[AppStyles.row, AppStyles.centerAligned, AppStyles.paddingBottomSml]}>
                            <View style={[AppStyles.flex1, AppStyles.paddingLeftSml]}>
                                <Text style={[AppStyles.h5, AppStyles.strong]}>
                                    {Localize.t('global.destinationTag')}
                                </Text>
                            </View>
                            <View
                                style={[AppStyles.row, AppStyles.flex1, AppStyles.paddingRightSml, AppStyles.flexEnd]}
                            >
                                <Button
                                    light
                                    roundedSmall
                                    isDisabled={false}
                                    onPress={() => {
                                        this.slideDown();
                                    }}
                                    textStyle={[AppStyles.subtext, AppStyles.bold]}
                                    label={Localize.t('global.cancel')}
                                />
                            </View>
                        </View>
                        <View style={[AppStyles.paddingHorizontalSml]}>
                            <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                                {buttonType === 'next'
                                    ? Localize.t('send.thisAddressRequiredDestinationTag')
                                    : Localize.t('send.pleaseEnterTheDestinationTag')}
                            </Text>
                        </View>

                        <View style={[AppStyles.paddingHorizontalSml, AppStyles.paddingVerticalSml]}>
                            <View style={[styles.itemRow]}>
                                <View style={styles.avatarContainer}>
                                    <Image source={Images.IconInfo} style={styles.avatarImage} />
                                </View>
                                <View>
                                    <View style={AppStyles.row}>
                                        <Text style={[styles.title]}>
                                            {destination.name || Localize.t('global.noNameFound')}
                                        </Text>
                                    </View>
                                    <Text style={[styles.subtitle]}>{destination.address}</Text>
                                </View>
                            </View>
                        </View>

                        <View
                            ref={this.textInputView}
                            onLayout={() => {}}
                            style={[
                                AppStyles.paddingHorizontalSml,
                                AppStyles.paddingVertical,
                                AppStyles.centerContent,
                                AppStyles.centerAligned,
                            ]}
                        >
                            <TextInput
                                value={destinationTag}
                                onChangeText={this.onDestinationTagChange}
                                keyboardType="number-pad"
                                returnKeyType="done"
                                placeholder={Localize.t('send.enterDestinationTag')}
                                numberOfLines={1}
                                inputStyle={styles.textInput}
                            />
                        </View>

                        <View
                            style={[
                                AppStyles.centerContent,
                                AppStyles.paddingHorizontalSml,
                                AppStyles.paddingVertical,
                                { marginBottom: AppSizes.navigationBarHeight },
                            ]}
                        >
                            <Button
                                isDisabled={
                                    Number(destinationTag) > Number.MAX_SAFE_INTEGER || Number(destinationTag) <= 0
                                }
                                onPress={this.onFinish}
                                style={styles.nextButton}
                                label={buttonType === 'next' ? Localize.t('global.next') : Localize.t('global.apply')}
                            />
                        </View>
                    </View>
                </Interactable.View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default EnterDestinationTagOverlay;
