/**
 * Recipient Menu overlay
 */
import { find, toString } from 'lodash';
import React, { Component } from 'react';
import { Animated, View, Keyboard, TouchableWithoutFeedback, Share, Linking, Alert } from 'react-native';

import Interactable from 'react-native-interactable';

import { SocketService } from '@services';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens, AppConfig } from '@common/constants';

import { NodeChain } from '@store/types';
import { CoreRepository, ContactRepository } from '@store/repositories';

// components
import { Button, Spacer } from '@components/General';
import { RecipientElement } from '@components/Modules';

import Localize from '@locale';

// style
import { AppStyles, AppSizes, AppColors } from '@theme';
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
    explorer: any;
    contactExist: boolean;
}

/* Component ==================================================================== */
class RecipientMenuOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.RecipientMenu;

    panel: any;
    deltaY: Animated.Value;

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

        const coreSettings = CoreRepository.getSettings();

        this.state = {
            contactExist: ContactRepository.exist(props.recipient.address, toString(props.recipient.tag)),
            explorer: find(AppConfig.explorer, { value: coreSettings.defaultExplorer }),
        };

        this.deltaY = new Animated.Value(AppSizes.screen.height);
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

    getAccountLink = () => {
        const { recipient } = this.props;
        const { explorer } = this.state;

        const net = SocketService.chain === NodeChain.Main ? 'main' : 'test';

        return `${explorer.account[net]}${recipient.address}`;
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
        }, 500);
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
                    onSnap={this.onSnap}
                    verticalOnly
                    snapPoints={[
                        { y: AppSizes.screen.height + 3 },
                        { y: AppSizes.screen.height - contentHeight - AppSizes.navigationBarHeight },
                    ]}
                    boundaries={{
                        top: AppSizes.screen.height - contentHeight - AppSizes.navigationBarHeight - 50,
                    }}
                    initialPosition={{ y: AppSizes.screen.height + 3 }}
                    animatedValueY={this.deltaY}
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

                            {!contactExist && (
                                <>
                                    <Spacer size={20} />
                                    <Button
                                        onPress={this.addContact}
                                        icon="IconPlus"
                                        block
                                        rounded
                                        label={Localize.t('send.addToContacts')}
                                        style={[styles.button, { backgroundColor: AppColors.blue }]}
                                        iconStyle={AppStyles.imgColorWhite}
                                    />
                                </>
                            )}

                            <Spacer size={20} />
                            <Button
                                onPress={this.shareAddress}
                                icon="IconShare"
                                block
                                rounded
                                label={Localize.t('events.shareAccount')}
                                style={styles.button}
                                iconStyle={AppStyles.imgColorWhite}
                            />

                            <Spacer size={20} />
                            <Button
                                onPress={this.openAccountLink}
                                icon="IconLink"
                                label={Localize.t('events.openWithExplorer', { explorer: explorer.title })}
                                block
                                rounded
                                style={styles.button}
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
