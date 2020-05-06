/**
 * Accounts Edit Screen
 */

import React, { Component, Fragment } from 'react';
import { Alert, View, Text, TouchableOpacity, ScrollView } from 'react-native';

import { Prompt } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { getAccountName } from '@common/helpers/resolver';

import { AppScreens } from '@common/constants';

import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';
import { AccessLevels, EncryptionLevels } from '@store/types';

import { Header, Spacer, Icon, Button } from '@components';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account?: AccountSchema;
}

export interface State {
    account: AccountSchema;
}

/* Component ==================================================================== */
class AccountSettingsView extends Component<Props, State> {
    static screenName = AppScreens.Account.Edit.Settings;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            account: props.account || AccountRepository.getDefaultAccount(),
        };
    }

    componentDidMount() {
        AccountRepository.on('accountUpdate', this.onAccountUpdate);
    }

    onAccountUpdate = (updateAccount: AccountSchema) => {
        const { account } = this.state;
        if (account.isValid() && updateAccount.address === account.address) {
            this.setState({ account: updateAccount });
        }
    };

    accountLabelPressed = () => {
        const { account } = this.state;

        Prompt(
            Localize.t('account.accountLabel'),
            Localize.t('account.pleaseEnterLabel'),
            [
                { text: Localize.t('global.cancel') },
                {
                    text: Localize.t('global.save'),
                    onPress: this.changeAccountLabel,
                },
            ],
            { type: 'plain-text', defaultValue: account.label },
        );
    };

    changeAccountLabel = (newLabel: string) => {
        const { account } = this.state;

        if (!newLabel || newLabel === account.label) return;

        if (newLabel.length > 16) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.accountMaxLabelLengthError'));
            return;
        }

        AccountRepository.update({
            address: account.address,
            label: newLabel,
        });

        // update catch for this account
        getAccountName.cache.set(
            account.address,
            new Promise(resolve => {
                resolve({ name: newLabel, source: 'internal:accounts' });
            }),
        );
    };

    showAccessLevelPicker = () => {
        const { account } = this.state;

        Navigator.push(
            AppScreens.Modal.Picker,
            {},
            {
                title: Localize.t('account.accessLevel'),
                description: Localize.t('account.accessLevelChangeAlert'),
                items: [
                    { title: Localize.t('account.readOnly'), value: AccessLevels.Readonly },
                    { title: Localize.t('account.fullAccess'), value: AccessLevels.Full },
                ],
                selected: account.accessLevel,
                onSelect: this.onAccessLevelSelected,
            },
        );
    };

    onAccessLevelSelected = (item: any) => {
        const { account } = this.state;

        const accessLevel = item.value;

        // nothing changed
        if (accessLevel === account.accessLevel) return;

        // downgrading
        if (accessLevel === AccessLevels.Readonly && account.accessLevel === AccessLevels.Full) {
            Prompt(
                Localize.t('global.pleaseNote'),
                Localize.t('account.downgradingAccessLevelWarning'),
                [
                    { text: Localize.t('global.cancel') },
                    {
                        text: Localize.t('global.doIt'),

                        onPress: () => {
                            // downgrade the access level
                            AccountRepository.downgrade(account);
                        },
                        style: 'destructive',
                    },
                ],
                { type: 'default' },
            );
            return;
        }

        // upgrading
        Prompt(
            Localize.t('global.notice'),
            Localize.t('account.upgradingAccessLevelWarning'),
            [
                { text: Localize.t('global.cancel') },
                {
                    text: Localize.t('global.doIt'),
                    onPress: () => {
                        Navigator.push(AppScreens.Account.Import, {}, { upgrade: true });
                    },
                },
            ],
            { type: 'default' },
        );
    };

    showChangePassphrase = () => {
        const { account } = this.props;
        Navigator.push(AppScreens.Account.Edit.ChangePassphrase, {}, { account });
    };

    showChangeSecurityLevel = () => {
        Alert.alert(Localize.t('global.unavailable'), Localize.t('account.unavailableChangeSecurityLevel'));
    };

    removeAccount = () => {
        const { account } = this.state;

        Prompt(
            Localize.t('global.warning'),
            Localize.t('account.accountDestroyWarning'),
            [
                { text: Localize.t('global.cancel') },
                {
                    text: Localize.t('global.doIt'),
                    onPress: () => {
                        // downgrade the access level
                        AccountRepository.purge(account);
                        Navigator.pop();
                    },
                    style: 'destructive',
                },
            ],
            { type: 'default' },
        );
    };

    render() {
        const { account } = this.state;

        return (
            <View testID="account-edit-view" style={[styles.container]}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                    centerComponent={{
                        text: Localize.t('account.accountSettings'),
                    }}
                />

                <View style={[AppStyles.contentContainer]}>
                    <ScrollView>
                        {/* Account Label */}
                        <Text style={styles.descriptionText}>{Localize.t('account.accountSettingsDescription')}</Text>
                        <TouchableOpacity style={styles.row} onPress={this.accountLabelPressed}>
                            <View style={[AppStyles.flex3]}>
                                <Text style={styles.label}>{Localize.t('account.accountLabel')}</Text>
                            </View>

                            <View style={[AppStyles.centerAligned, AppStyles.row]}>
                                <Text style={[styles.value]}>{account.label}</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Account Label */}
                        <TouchableOpacity style={[styles.row]} onPress={this.showAccessLevelPicker}>
                            <View style={[AppStyles.flex3]}>
                                <Text style={styles.label}>{Localize.t('account.accessLevel')}</Text>
                            </View>

                            <View style={[AppStyles.centerAligned, AppStyles.row]}>
                                <Text style={[styles.value]}>
                                    {account.accessLevel === AccessLevels.Full
                                        ? Localize.t('account.fullAccess')
                                        : Localize.t('account.readOnly')}
                                </Text>
                                <Icon size={20} style={[styles.rowIcon]} name="IconChevronRight" />
                            </View>
                        </TouchableOpacity>
                        {/* <Text style={styles.descriptionText}>{Localize.t('account.passphraseOptionDesc')}</Text> */}
                        {account.accessLevel === AccessLevels.Full && (
                            <Fragment key="security">
                                {/* Encryption Label */}
                                <TouchableOpacity style={[styles.row]} onPress={this.showChangeSecurityLevel}>
                                    <View style={[AppStyles.flex3]}>
                                        <Text style={styles.label}>{Localize.t('account.securityLevel')}</Text>
                                    </View>

                                    <View style={[AppStyles.centerAligned, AppStyles.row]}>
                                        <Text style={[styles.value]}>{account.encryptionLevel}</Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Change passphrase */}
                                {account.encryptionLevel === EncryptionLevels.Passphrase && (
                                    <TouchableOpacity style={styles.row} onPress={this.showChangePassphrase}>
                                        <View style={[AppStyles.flex3]}>
                                            <Text style={styles.label}>{Localize.t('account.changePassphrase')}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </Fragment>
                        )}

                        <Spacer size={50} />
                        {/* Remove Account */}
                        {/* <TouchableOpacity style={[AppStyles.buttonRed]} onPress={this.removeAccount}>
                            <View style={[AppStyles.flex3]}>
                                <Text style={styles.destructionLabel}>{Localize.t('account.destroyAccount')}</Text>
                            </View>
                        </TouchableOpacity> */}
                        <Button
                            label={Localize.t('account.destroyAccount')}
                            icon="IconTrash"
                            iconStyle={AppStyles.imgColorWhite}
                            style={[AppStyles.marginSml, AppStyles.buttonRed]}
                            onPress={this.removeAccount}
                        />
                    </ScrollView>
                </View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default AccountSettingsView;
