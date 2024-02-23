/**
 * Participant Menu overlay
 */
import { toString } from 'lodash';

import React, { Component } from 'react';
import { View, Share, Linking, Alert, InteractionManager } from 'react-native';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

import { ContactRepository } from '@store/repositories';

// components
import { Button, Spacer, ActionPanel } from '@components/General';
import { AccountElement } from '@components/Modules';

import { GetAccountLink } from '@common/utils/explorer';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import { AccountNameType } from '@common/helpers/resolver';
/* types ==================================================================== */

export interface Props {
    address: string;
    tag?: number;
    onClose: () => void;
}

export interface State {
    recipientName?: string;
    contactExist: boolean;
}

/* Component ==================================================================== */
class ParticipantMenuOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.ParticipantMenu;

    private actionPanelRef: React.RefObject<ActionPanel>;

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
            recipientName: undefined,
            contactExist: false,
        };

        this.actionPanelRef = React.createRef();
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.checkContactExist);
    }

    checkContactExist = () => {
        const { address, tag } = this.props;

        this.setState({
            contactExist: ContactRepository.exist(address, toString(tag)),
        });
    };

    onClose = () => {
        const { onClose } = this.props;

        if (typeof onClose === 'function') {
            onClose();
        }

        Navigator.dismissOverlay();
    };

    onRecipientInfoUpdate = (info: AccountNameType) => {
        if (info?.name) {
            this.setState({
                recipientName: info.name,
            });
        }
    };

    addContact = () => {
        const { address, tag } = this.props;
        const { recipientName } = this.state;

        this.actionPanelRef?.current?.slideDown();

        setTimeout(() => {
            Navigator.push(AppScreens.Settings.AddressBook.Add, { address, tag, name: recipientName });
        }, 500);
    };

    shareAddress = () => {
        const { address } = this.props;

        this.actionPanelRef?.current?.slideDown();

        setTimeout(() => {
            Share.share({
                title: Localize.t('home.shareAccount'),
                message: address,
                url: undefined,
            }).catch(() => {});
        }, 1000);
    };

    openAccountLink = () => {
        const { address } = this.props;

        const url = GetAccountLink(address);

        this.actionPanelRef?.current?.slideDown();

        setTimeout(() => {
            Linking.openURL(url).catch(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('global.cannotOpenLink'));
            });
        }, 500);
    };

    render() {
        const { address, tag } = this.props;
        const { contactExist } = this.state;

        return (
            <ActionPanel
                height={AppSizes.moderateScale(50) * (!contactExist ? 7 : 6)}
                onSlideDown={this.onClose}
                extraBottomInset
                ref={this.actionPanelRef}
            >
                <View style={[AppStyles.paddingHorizontalSml, AppStyles.centerContent]}>
                    <AccountElement
                        address={address}
                        tag={tag}
                        visibleElements={{ avatar: true, tag: false, menu: false, source: false }}
                        onInfoUpdate={this.onRecipientInfoUpdate}
                    />

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
                        label={Localize.t('events.openInExplorer')}
                        iconStyle={AppStyles.imgColorWhite}
                    />
                </View>
            </ActionPanel>
        );
    }
}

/* Export Component ==================================================================== */
export default ParticipantMenuOverlay;
