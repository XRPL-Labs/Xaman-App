/**
 * Recipient Menu overlay
 */
import { toString } from 'lodash';

import React, { Component } from 'react';
import { Animated, View, Keyboard, TouchableWithoutFeedback, Share, Linking, Alert } from 'react-native';

import Interactable from 'react-native-interactable';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

import { ContactRepository } from '@store/repositories';

// components
import { Button, Spacer } from '@components/General';
import { RecipientElement } from '@components/Modules';

import { GetAccountLink, GetExplorer, ExplorerDetails } from '@common/utils/explorer';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export type RecipientType = {
    id?: string;
    address: string;
    tag?: number;
    name: string;
    source?: string;
};

export interface Props {
    recipient: RecipientType;
    onClose: () => void;
}

export interface State {
    explorer: ExplorerDetails;
    contactExist: boolean;
}

/* Component ==================================================================== */
class RecipientMenuOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.RecipientMenu;

    panel: any;
    deltaY: Animated.Value;
    deltaX: Animated.Value;
    isOpening: boolean;

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
            contactExist: ContactRepository.exist(props.recipient.address, toString(props.recipient.tag)),
            explorer: GetExplorer(),
        };

        this.deltaY = new Animated.Value(AppSizes.screen.height);
        this.deltaX = new Animated.Value(0);
    }

    componentDidMount() {
        this.slideUp();
    }

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

    onAlert = (event: any) => {
        const { top, bottom } = event.nativeEvent;

        if (top && bottom) return;

        if (top === 'enter' && this.isOpening) {
            this.isOpening = false;
        }

        if (bottom === 'leave' && !this.isOpening) {
            const { onClose } = this.props;

            if (typeof onClose === 'function') {
                onClose();
            }

            Navigator.dismissOverlay();
        }
    };

    getAccountLink = () => {
        const { explorer } = this.state;
        const { recipient } = this.props;

        return GetAccountLink(recipient.address, explorer);
    };

    addContact = () => {
        const { recipient } = this.props;

        this.slideDown();

        setTimeout(() => {
            Navigator.push(AppScreens.Settings.AddressBook.Add, {}, recipient);
        }, 500);
    };

    shareAddress = () => {
        const { recipient } = this.props;

        this.slideDown();

        setTimeout(() => {
            Share.share({
                title: Localize.t('home.shareAccount'),
                message: recipient.address,
                url: undefined,
            }).catch(() => {});
        }, 1000);
    };

    openAccountLink = () => {
        const url = this.getAccountLink();

        this.slideDown();

        setTimeout(() => {
            Linking.canOpenURL(url).then((supported) => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    Alert.alert(Localize.t('global.error'), Localize.t('global.cannotOpenLink'));
                }
            });
        }, 500);
    };

    render() {
        const { recipient } = this.props;
        const { contactExist, explorer } = this.state;

        const contentHeight = AppSizes.scale(50) * (!contactExist ? 7 : 6);

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
                    verticalOnly
                    onAlert={this.onAlert}
                    snapPoints={[
                        { y: AppSizes.screen.height + 3 },
                        { y: AppSizes.screen.height - contentHeight - AppSizes.navigationBarHeight },
                    ]}
                    alertAreas={[
                        { id: 'bottom', influenceArea: { bottom: AppSizes.screen.height } },
                        {
                            id: 'top',
                            influenceArea: {
                                top: AppSizes.screen.height - contentHeight - AppSizes.navigationBarHeight,
                            },
                        },
                    ]}
                    boundaries={{
                        top: AppSizes.screen.height - contentHeight - AppSizes.navigationBarHeight - 50,
                    }}
                    initialPosition={{ y: AppSizes.screen.height + 3 }}
                    animatedValueY={this.deltaY}
                    animatedValueX={this.deltaX}
                >
                    <View
                        style={[styles.container, { height: contentHeight + 50 }]}
                        onResponderRelease={() => Keyboard.dismiss()}
                        onStartShouldSetResponder={() => true}
                    >
                        <View style={AppStyles.panelHeader}>
                            <View style={AppStyles.panelHandle} />
                        </View>

                        <View style={[AppStyles.paddingHorizontalSml, AppStyles.centerContent]}>
                            <RecipientElement showTag={false} recipient={recipient} />

                            <Spacer size={20} />

                            {!contactExist && (
                                <>
                                    <Spacer size={10} />
                                    <Button
                                        numberOfLines={1}
                                        onPress={this.addContact}
                                        icon="IconPlus"
                                        label={Localize.t('send.addToContacts')}
                                        iconStyle={AppStyles.imgColorWhite}
                                    />
                                </>
                            )}

                            <Spacer size={10} />
                            <Button
                                secondary
                                numberOfLines={1}
                                onPress={this.shareAddress}
                                icon="IconShare"
                                label={Localize.t('events.shareAccount')}
                                iconStyle={AppStyles.imgColorWhite}
                            />

                            <Spacer size={10} />
                            <Button
                                secondary
                                numberOfLines={1}
                                onPress={this.openAccountLink}
                                icon="IconLink"
                                label={Localize.t('events.openWithExplorer', { explorer: explorer.title })}
                                iconStyle={AppStyles.imgColorWhite}
                            />
                        </View>
                    </View>
                </Interactable.View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default RecipientMenuOverlay;
