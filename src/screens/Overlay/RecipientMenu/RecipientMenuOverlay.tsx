/**
 * Recipient Menu overlay
 */
import { toString } from 'lodash';

import React, { Component } from 'react';
import { View, Share, Linking, Alert } from 'react-native';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

import { ContactRepository } from '@store/repositories';

// components
import { Button, Spacer, ActionPanel } from '@components/General';
import { RecipientElement } from '@components/Modules';

import { GetAccountLink, GetExplorer, ExplorerDetails } from '@common/utils/explorer';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';

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

    private actionPanel: ActionPanel;

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
    }

    onClose = () => {
        const { onClose } = this.props;

        if (typeof onClose === 'function') {
            onClose();
        }

        Navigator.dismissOverlay();
    };

    getAccountLink = () => {
        const { explorer } = this.state;
        const { recipient } = this.props;

        return GetAccountLink(recipient.address, explorer);
    };

    addContact = () => {
        const { recipient } = this.props;

        if (this.actionPanel) {
            this.actionPanel.slideDown();
        }

        setTimeout(() => {
            Navigator.push(AppScreens.Settings.AddressBook.Add, recipient);
        }, 500);
    };

    shareAddress = () => {
        const { recipient } = this.props;

        if (this.actionPanel) {
            this.actionPanel.slideDown();
        }
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

        if (this.actionPanel) {
            this.actionPanel.slideDown();
        }
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

        return (
            <ActionPanel
                height={AppSizes.moderateScale(50) * (!contactExist ? 7 : 6)}
                onSlideDown={this.onClose}
                extraBottomInset
                ref={(r) => {
                    this.actionPanel = r;
                }}
            >
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
            </ActionPanel>
        );
    }
}

/* Export Component ==================================================================== */
export default RecipientMenuOverlay;
