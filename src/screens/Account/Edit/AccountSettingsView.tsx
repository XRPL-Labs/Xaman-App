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
import { AccessLevels, EncryptionLevels, AccountTypes } from '@store/types';

import { Header, Spacer, Icon, Button } from '@components/General';

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

    componentWillUnmount() {
        AccountRepository.off('accountUpdate', this.onAccountUpdate);
    }

    onAccountUpdate = (updateAccount: AccountSchema) => {
        const { account } = this.state;
        if (account?.isValid() && updateAccount.address === account.address) {
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
            new Promise((resolve) => {
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
                    testID: 'yes-iam-sure-button',
                    onPress: () => {
                        Navigator.push(AppScreens.Account.Import, {}, { upgrade: account });
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

    showChangeTangemSecurity = () => {
        const { account } = this.props;
        Navigator.push(AppScreens.Account.Edit.ChangeTangemSecurityEnforce, {}, { account });
    };

    removeAccount = () => {
        const { account } = this.state;

        Prompt(
            Localize.t('global.warning'),
            Localize.t('account.accountRemoveWarning'),
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
            <View testID="account-settings-screen" style={[styles.container]}>
                <Header
                    leftComponent={{
                        testID: 'back-button',
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

                        <View style={styles.row}>
                            <View style={[AppStyles.flex3]}>
                                <Text style={styles.label} testID="address-label">
                                    {Localize.t('global.address')}
                                </Text>
                            </View>

                            <View style={[AppStyles.centerAligned, AppStyles.row]}>
                                <Text selectable style={[styles.address]}>
                                    {account.address}
                                </Text>
                            </View>
                        </View>

                        {/* Account Label */}
                        <TouchableOpacity
                            testID="account-label-button"
                            style={styles.row}
                            onPress={this.accountLabelPressed}
                        >
                            <View style={[AppStyles.flex3]}>
                                <Text style={styles.label}>{Localize.t('account.accountLabel')}</Text>
                            </View>

                            <View style={[AppStyles.centerAligned, AppStyles.row]}>
                                <Text style={[styles.value]}>{account.label}</Text>
                                <Icon size={20} style={[styles.rowIcon]} name="IconChevronRight" />
                            </View>
                        </TouchableOpacity>

                        {/* Account Access Level */}
                        <TouchableOpacity
                            testID="account-access-level-button"
                            style={[styles.row]}
                            onPress={this.showAccessLevelPicker}
                        >
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
                        {/* <Text style={styles.descriptionText}>{Localize.t('account.passwordOptionDesc')}</Text> */}
                        {account.accessLevel === AccessLevels.Full && (
                            <Fragment key="security">
                                {/* Encryption Label */}
                                <View style={[styles.row]}>
                                    <View style={[AppStyles.flex3]}>
                                        <Text style={styles.label}>{Localize.t('account.securityLevel')}</Text>
                                    </View>

                                    <View style={[AppStyles.centerAligned, AppStyles.row]}>
                                        <Text style={[styles.value]}>{account.encryptionLevel}</Text>
                                    </View>
                                </View>

                                {/* Change passphrase */}
                                {account.encryptionLevel === EncryptionLevels.Passphrase && (
                                    <TouchableOpacity
                                        testID="change-password-button"
                                        style={styles.row}
                                        onPress={this.showChangePassphrase}
                                    >
                                        <View style={[AppStyles.flex3]}>
                                            <Text style={styles.label}>{Localize.t('account.changePassword')}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </Fragment>
                        )}

                        {account.type === AccountTypes.Tangem && (
                            <TouchableOpacity style={[styles.row]} onPress={this.showChangeTangemSecurity}>
                                <View style={[AppStyles.flex3]}>
                                    <Text style={styles.label}>{Localize.t('account.cardEnforcedSecurity')}</Text>
                                </View>

                                <View style={[AppStyles.centerAligned, AppStyles.row]}>
                                    <Text style={[styles.value]}>
                                        {/*
                                        // @ts-ignore */}
                                        {account.additionalInfo?.isPin2Default
                                            ? Localize.t('global.longTap')
                                            : Localize.t('global.passcode')}
                                    </Text>
                                </View>
                                <Icon size={20} style={[styles.rowIcon]} name="IconChevronRight" />
                            </TouchableOpacity>
                        )}

                        <Spacer size={50} />

                        <Button
                            label={Localize.t('account.removeFromXUMM')}
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
