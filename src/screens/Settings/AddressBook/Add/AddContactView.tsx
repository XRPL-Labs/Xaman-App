/**
 * Add Contact Screen
 */
import { v4 as uuidv4 } from 'uuid';

import React, { Component } from 'react';
import { View, Text, Alert, Keyboard } from 'react-native';

import { StringType, XrplDestination } from 'xumm-string-decode';
import * as AccountLib from 'xrpl-accountlib';
import { Decode } from 'xrpl-tagged-address-codec';

import { NormalizeDestination } from '@common/utils/codec';
import { getAccountName, getPayIdInfo } from '@common/helpers/resolver';
import { Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

import { ContactRepository } from '@store/repositories';
// import { ContactSchema } from '@store/schemas/latest';

import { Header, Spacer, Button, TextInput, InfoMessage, KeyboardAwareScrollView, Footer } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';

/* types ==================================================================== */
export interface Props {
    address?: string;
    name?: string;
    tag?: string;
}

export interface State {
    isLoading: boolean;
    address: string;
    name: string;
    tag: string;
    xAddress: string;
}

/* Component ==================================================================== */
class AddContactView extends Component<Props, State> {
    static screenName = AppScreens.Settings.AddressBook.Add;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: false,
            address: props.address,
            tag: props.tag && props.tag.toString(),
            name: props.name,
            xAddress: undefined,
        };
    }

    doNameLookup = async (result: XrplDestination) => {
        const { name } = this.state;
        // normalize
        const { to, tag, xAddress } = NormalizeDestination(result);

        // if everything is fine try to fetch the account name
        if (to) {
            const accountInfo = await getAccountName(to, tag);

            this.setState({
                xAddress,
                address: to,
                tag: tag && tag.toString(),
                name: name || accountInfo.name,
            });
        }
    };

    onScannerRead = async (result: any) => {
        try {
            this.setState({
                isLoading: true,
            });

            // if payId try to resolve
            if (result.payId) {
                const payIdInfo = await getPayIdInfo(result.payId);
                await this.doNameLookup({ to: payIdInfo.account, tag: payIdInfo.tag && Number(payIdInfo.tag) });
            } else {
                await this.doNameLookup(result);
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
        const existContacts = ContactRepository.query({ address, destinationTag: tag });

        if (!existContacts.isEmpty()) {
            Alert.alert(Localize.t('settings.contactAlreadyExist'));
            return;
        }

        // everything is fine, save contact
        this.saveContact();
    };

    saveContact = () => {
        const { name, address, tag } = this.state;

        ContactRepository.create({
            id: uuidv4(),
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

        Toast(Localize.t('settings.contactSuccessSaved'));

        // force re-render the app
        Navigator.reRender();

        // close screen
        Navigator.pop();
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
        const { isLoading, name, address, tag, xAddress } = this.state;

        return (
            <View
                testID="address-book-add"
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
                    centerComponent={{ text: Localize.t('settings.addContact') }}
                />
                <KeyboardAwareScrollView style={[AppStyles.flex1, AppStyles.paddingSml]}>
                    <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.name')}: </Text>
                    <Spacer size={10} />
                    <TextInput
                        placeholder={Localize.t('settings.contactName')}
                        onChangeText={(value) => this.setState({ name: value })}
                        value={name}
                        maxLength={30}
                        isLoading={isLoading}
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
export default AddContactView;
