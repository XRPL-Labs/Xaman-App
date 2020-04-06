/**
 * Edit Contact Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, KeyboardAvoidingView, Text, Alert, Keyboard, Platform } from 'react-native';
import { StringType, XrplDestination } from 'xumm-string-decode';
import * as AccountLib from 'xrpl-accountlib';
import { Decode } from 'xrpl-tagged-address-codec';

import { Navigator, Toast, Prompt, getAccountName } from '@common/helpers';
import { AppScreens } from '@common/constants';

import { ContactRepository } from '@store/repositories';
import { ContactSchema } from '@store/schemas/latest';

import { Header, Spacer, Button, TextInput, InfoMessage, Footer } from '@components';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    contact: ContactSchema;
}

export interface State {
    xAddress?: string;
    address: string;
    name: string;
    tag: string;
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
            xAddress: undefined,
            address: props.contact.address,
            tag: props.contact.destinationTag,
            name: props.contact.name,
        };
    }

    showScanner = () => {
        Navigator.showModal(
            AppScreens.Modal.Scan,
            {},
            {
                type: StringType.XrplDestination,
                onRead: this.onScannerRead,
            },
        );
    };

    onScannerRead = (result: XrplDestination) => {
        let address = result.to;
        let tag = result.tag && result.tag.toString();
        let xAddress;

        // decode if it's x address
        if (result.to.startsWith('X')) {
            const decoded = Decode(result.to);
            address = decoded.account;
            tag = decoded.tag && decoded.tag.toString();
            xAddress = result.to;
        }
        this.setState({
            address,
            tag,
            xAddress,
        });
    };

    saveContact = () => {
        const { contact } = this.props;
        const { name, address, tag } = this.state;

        if (!name) {
            return Alert.alert(Localize.t('settings.enterName'));
        }

        if (!AccountLib.utils.isValidAddress(address)) {
            return Alert.alert(Localize.t('global.invalidAddress'));
        }

        ContactRepository.update({
            id: contact.id,
            name,
            address,
            destinationTag: tag || '',
        });

        // update catch for this account
        getAccountName.cache.set(
            address,
            new Promise(resolve => {
                resolve({ name, source: 'internal:contacts' });
            }),
        );

        Toast(Localize.t('settings.contactSuccessUpdated'));

        Navigator.pop();

        return null;
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
                        ContactRepository.deleteBy('id', contact.id);
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

        if (Number(destinationTag) < Number.MAX_SAFE_INTEGER) {
            this.setState({
                tag: destinationTag,
            });
        }
    };

    onAddressChange = (text: string) => {
        const address = text.replace(/[^a-z0-9]/gi, '');
        // decode if it's x address
        if (address.startsWith('X')) {
            try {
                const decoded = Decode(address);
                if (decoded) {
                    this.setState({
                        address: decoded.account,
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

    render() {
        const { name, address, tag, xAddress } = this.state;
        return (
            <View
                testID="address-book-edit"
                onResponderRelease={() => Keyboard.dismiss()}
                onStartShouldSetResponder={() => true}
                style={[AppStyles.container]}
            >
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                    centerComponent={{ text: Localize.t('settings.editContact') }}
                    rightComponent={{ iconSize: 25, icon: 'IconTrash', onPress: this.deleteContact }}
                />

                <View style={[AppStyles.flex1, AppStyles.paddingSml]}>
                    <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}>
                        <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.name')}: </Text>
                        <Spacer size={10} />
                        <TextInput
                            inputStyle={styles.textInput}
                            placeholder={Localize.t('settings.contactName')}
                            onChangeText={value => this.setState({ name: value })}
                            value={name}
                            maxLength={30}
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
                        />
                        <Spacer size={10} />
                        <TextInput
                            placeholder={Localize.t('global.destinationTag')}
                            inputStyle={styles.textInput}
                            onChangeText={this.onDestinationTagChange}
                            value={tag}
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
                    </KeyboardAvoidingView>
                </View>
                <SafeAreaView>
                    <Footer>
                        <Button label={Localize.t('global.save')} onPress={this.saveContact} />
                    </Footer>
                </SafeAreaView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default EditContactView;
