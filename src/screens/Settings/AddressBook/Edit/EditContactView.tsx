/**
 * Edit Contact Screen
 */
import { filter, isEmpty } from 'lodash';
import React, { Component } from 'react';
import { View, Text, Alert, Keyboard, Platform, Share } from 'react-native';

import { StringType } from 'xumm-string-decode';
import * as AccountLib from 'xrpl-accountlib';
import { xAddressToClassicAddress } from 'ripple-address-codec';

import { StyleService } from '@services';

import { NormalizeDestination } from '@common/utils/codec';
import { getAccountName, getPayIdInfo } from '@common/helpers/resolver';
import { Toast, Prompt, ActionSheet } from '@common/helpers/interface';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { ContactRepository } from '@store/repositories';
import { ContactModel } from '@store/models';

import { Header, Spacer, Button, TextInput, InfoMessage, KeyboardAwareScrollView, Footer } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    contact: ContactModel;
}

export interface State {
    isLoading: boolean;
    address: string;
    name: string;
    tag: string;
    xAddress: string;
}

/* Component ==================================================================== */
class EditContactView extends Component<Props, State> {
    static screenName = AppScreens.Settings.AddressBook.Edit;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: false,
            xAddress: undefined,
            address: props.contact.address,
            tag: props.contact.destinationTag,
            name: props.contact.name,
        };
    }

    showScanner = () => {
        Navigator.showModal(AppScreens.Modal.Scan, {
            type: StringType.XrplDestination,
            onRead: this.onScannerRead,
        });
    };

    onScannerRead = async (result: any) => {
        try {
            // if payId try to resolve
            if (result.payId) {
                this.setState({
                    isLoading: true,
                });

                const payIdInfo = await getPayIdInfo(result.payId);

                this.setState({
                    address: payIdInfo.account,
                    tag: payIdInfo.tag,
                });
            } else {
                const { to, tag, xAddress } = NormalizeDestination(result);

                this.setState({
                    address: to,
                    tag: tag && tag.toString(),
                    xAddress,
                });
            }
        } catch {
            // ignore
        } finally {
            this.setState({
                isLoading: false,
            });
        }
    };

    onSavePress = () => {
        const { contact } = this.props;
        const { name, address, tag } = this.state;

        if (!name) {
            Alert.alert(Localize.t('settings.enterName'));
            return;
        }

        if (!AccountLib.utils.isValidAddress(address)) {
            Alert.alert(Localize.t('global.invalidAddress'));
            return;
        }

        // check if any contact is already exist with this address and tag
        const existContacts = ContactRepository.query({ address, destinationTag: tag || '' });

        if (!existContacts.isEmpty()) {
            const filtered = filter(existContacts, (c) => c.id !== contact.id);

            if (!isEmpty(filtered)) {
                Alert.alert(Localize.t('global.error'), Localize.t('settings.contactAlreadyExist'));
                return;
            }
        }

        this.saveContact();
    };

    saveContact = () => {
        const { contact } = this.props;
        const { name, address, tag } = this.state;

        ContactRepository.update({
            id: contact.id,
            name,
            address,
            destinationTag: tag || '',
        });

        // update catch for this contact
        getAccountName.cache.set(
            `${address}${tag || ''}`,
            new Promise((resolve) => {
                resolve({ name, source: 'contacts' });
            }),
        );

        Toast(Localize.t('settings.contactSuccessUpdated'));

        // force re-render the app
        Navigator.reRender();

        // close screen
        Navigator.pop();
    };

    deleteContact = () => {
        const { contact } = this.props;

        Prompt(
            Localize.t('global.warning'),
            Localize.t('settings.areYouSureRemoveContact'),
            [
                { text: Localize.t('global.cancel') },
                {
                    text: Localize.t('global.doIt'),
                    onPress: () => {
                        ContactRepository.deleteById(contact.id);
                        Toast(Localize.t('settings.contactSuccessDeleted'));

                        Navigator.pop();
                    },
                    style: 'destructive',
                },
            ],
            { type: 'default' },
        );
    };

    onDestinationTagChange = (text: string) => {
        const destinationTag = text.replace(/[^0-9]/g, '');

        if (Number(destinationTag) < 2 ** 32) {
            this.setState({
                tag: destinationTag,
            });
        }
    };

    onAddressChange = (text: string) => {
        const address = text.replace(/[^a-z0-9]/gi, '');
        // decode if it's x address
        if (address && address.startsWith('X')) {
            try {
                const decoded = xAddressToClassicAddress(address);
                if (decoded) {
                    this.setState({
                        address: decoded.classicAddress,
                        tag: decoded.tag && decoded.tag.toString(),
                        xAddress: address,
                    });
                }
            } catch {
                // continue regardless of error
            }
        } else {
            this.setState({
                address,
            });
        }
    };

    shareContactAddress = () => {
        const { name, address, tag } = this.state;

        Share.share({
            title: name,
            message: tag ? `${address}:${tag}` : `${address}`,
            url: undefined,
        }).catch(() => {});
    };

    showActionMenu = () => {
        const buttons = [Localize.t('global.share'), Localize.t('global.remove')];
        if (Platform.OS === 'ios') {
            buttons.push(Localize.t('global.cancel'));
        }

        ActionSheet(
            {
                options: buttons,
                destructiveButtonIndex: 1,
                cancelButtonIndex: 2,
            },
            (buttonIndex: number) => {
                if (buttonIndex === 0) {
                    this.shareContactAddress();
                }
                if (buttonIndex === 1) {
                    this.deleteContact();
                }
            },
            StyleService.isDarkMode() ? 'dark' : 'light',
        );
    };

    render() {
        const { isLoading, name, address, tag, xAddress } = this.state;
        return (
            <View
                testID="address-book-edit"
                onResponderRelease={Keyboard.dismiss}
                onStartShouldSetResponder={() => true}
                style={AppStyles.container}
            >
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: Navigator.pop,
                    }}
                    centerComponent={{ text: Localize.t('settings.editContact') }}
                    rightComponent={{ icon: 'IconMoreHorizontal', onPress: this.showActionMenu }}
                />

                <KeyboardAwareScrollView style={[AppStyles.flex1, AppStyles.paddingSml]}>
                    <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.name')}: </Text>
                    <Spacer size={10} />
                    <TextInput
                        inputStyle={styles.textInput}
                        placeholder={Localize.t('settings.contactName')}
                        onChangeText={(value) => this.setState({ name: value })}
                        value={name}
                        maxLength={30}
                        autoCapitalize="sentences"
                    />

                    <Spacer size={20} />
                    <View style={AppStyles.hr} />
                    <Spacer size={20} />

                    <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.address')}: </Text>
                    <Spacer size={10} />
                    <TextInput
                        placeholder={Localize.t('global.address')}
                        onChangeText={this.onAddressChange}
                        value={address}
                        showScanner
                        scannerType={StringType.XrplDestination}
                        onScannerRead={this.onScannerRead}
                        isLoading={isLoading}
                    />
                    <Spacer size={10} />
                    <TextInput
                        placeholder={Localize.t('global.destinationTag')}
                        inputStyle={styles.textInput}
                        onChangeText={this.onDestinationTagChange}
                        value={tag}
                        isLoading={isLoading}
                    />

                    {xAddress && (
                        <>
                            <Spacer size={10} />
                            <InfoMessage type="info">
                                <Text style={AppStyles.subtext}>
                                    {Localize.t('global.decodedFrom')}:
                                    <Text style={AppStyles.monoBold}> {xAddress}</Text>
                                </Text>
                            </InfoMessage>
                        </>
                    )}
                    <Spacer size={50} />
                </KeyboardAwareScrollView>

                <Footer safeArea>
                    <Button label={Localize.t('global.save')} onPress={this.onSavePress} />
                </Footer>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default EditContactView;
