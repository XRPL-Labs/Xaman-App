/**
 * Accounts cipher migration Screen
 */

import React, { Component } from 'react';
import { Alert, InteractionManager, SectionList, Text, View } from 'react-native';

import { AppScreens } from '@common/constants';

// service
import LoggerService, { LogEvents } from '@services/LoggerService';

// helpers
import { Navigator } from '@common/helpers/navigator';
import Screens from '@common/constants/screens';

import Vault from '@common/libs/vault';

// store
import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountModel, CoreModel } from '@store/models';
import { EncryptionLevels } from '@store/types';

// components
import { Button, Header } from '@components/General';

import Localize from '@locale';
// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    coreSettings: CoreModel;
    dataSource: any;
}

/* Component ==================================================================== */
class CipherMigrationView extends Component<Props, State> {
    static screenName = AppScreens.Account.Migration.CipherMigration;

    static options() {
        return {
            topBar: { visible: false },
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            coreSettings: CoreRepository.getSettings(),
            dataSource: [],
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.setDataSource);
    }

    setDataSource = () => {
        const accounts = AccountRepository.getAccounts();

        const requiredMigration = [];
        const doneMigration = [];

        // get latest cipher version from vault module
        const latestVaultCipherVersion = Vault.getLatestCipherVersion();

        for (const account of accounts) {
            if ([EncryptionLevels.Passcode, EncryptionLevels.Passphrase].includes(account.encryptionLevel)) {
                if (account.encryptionVersion < latestVaultCipherVersion) {
                    requiredMigration.push(account);
                } else {
                    doneMigration.push(account);
                }
            }
        }

        this.setState({
            dataSource: [
                { type: 'requiredMigration', data: requiredMigration },
                { type: 'doneMigration', data: doneMigration },
            ],
        });
    };

    onMigrationSuccess = () => {
        // log the success event
        LoggerService.logEvent(LogEvents.EncryptionMigrationSuccess);

        // update the list
        this.setDataSource();
    };

    onMigrationError = (exception: any) => {
        // record the error in the session logs
        LoggerService.recordError('Encryption migration error', exception);

        // log the event
        LoggerService.logEvent(LogEvents.EncryptionMigrationException, {
            message: exception?.message,
        });

        // show alert
        Alert.alert(
            Localize.t('global.unexpectedErrorOccurred'),
            Localize.t('global.pleaseCheckSessionLogForMoreInfo'),
        );
    };

    processMigrateAccount = async (account: AccountModel, key: string) => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                // reKey the account with same key
                await Vault.reKey(account.publicKey, key, key);

                // update the account encryption version
                await AccountRepository.update({
                    address: account.address,
                    encryptionVersion: Vault.getLatestCipherVersion(),
                });

                resolve(true);
            } catch (e) {
                reject(e);
            }
        });
    };

    onSuccessAuth = (account: AccountModel, key: string) => {
        // start the migration
        Navigator.showOverlay(AppScreens.Overlay.CriticalProcessing, {
            task: this.processMigrateAccount.bind(null, account, key),
            onSuccess: this.onMigrationSuccess,
            onError: this.onMigrationError,
        });
    };

    onMigrationPress = (account: AccountModel) => {
        const { coreSettings } = this.state;

        // start the authentication base on encryption level
        if (account.encryptionLevel === EncryptionLevels.Passphrase) {
            Navigator.showOverlay(AppScreens.Overlay.PassphraseAuthentication, {
                account,
                onSuccess: (passphrase: string) => {
                    this.onSuccessAuth(account, passphrase);
                },
            });
        }
        if (account.encryptionLevel === EncryptionLevels.Passcode) {
            Navigator.showOverlay(AppScreens.Overlay.Auth, {
                canAuthorizeBiometrics: false,
                onSuccess: () => {
                    this.onSuccessAuth(account, coreSettings.passcode);
                },
            });
        }
    };

    onHelpPress = () => {
        Navigator.showModal(Screens.Modal.MigrationExplain);
    };

    renderMigrationRequiredItem = (item: AccountModel) => {
        return (
            <View style={[styles.rowContainer, styles.rowContent]}>
                <View style={[AppStyles.row, styles.rowHeader, AppStyles.centerContent]}>
                    <View style={[AppStyles.flex6]}>
                        <Text style={[styles.accountLabel]}>{item.label}</Text>
                    </View>
                    <View>
                        <Button
                            roundedMini
                            label={Localize.t('account.updateEncryption')}
                            onPress={() => {
                                this.onMigrationPress(item);
                            }}
                        />
                    </View>
                </View>
                <View style={[AppStyles.row, styles.subRow]}>
                    <View style={[AppStyles.flex1]}>
                        <Text style={[AppStyles.monoBold, AppStyles.colorGrey, styles.subLabel]}>
                            {Localize.t('global.address')}:
                        </Text>
                        <Text style={[AppStyles.monoSubText, AppStyles.colorBlue]}>{item.address}</Text>
                    </View>
                </View>
            </View>
        );
    };

    renderDoneItem = (item: AccountModel) => {
        return (
            <View style={styles.rowContainer}>
                <View style={styles.rowFade} />
                <View style={styles.rowContent}>
                    <View style={[AppStyles.row, styles.rowHeader, AppStyles.centerContent]}>
                        <View style={[AppStyles.flex6]}>
                            <Text style={[styles.accountLabel]}>{item.label}</Text>
                        </View>
                        <View>
                            <Button
                                roundedMini
                                icon="IconCheck"
                                style={styles.doneButton}
                                label={Localize.t('global.done')}
                            />
                        </View>
                    </View>
                    <View style={[AppStyles.row, styles.subRow]}>
                        <View style={[AppStyles.flex1]}>
                            <Text style={[AppStyles.monoBold, AppStyles.colorGrey, styles.subLabel]}>
                                {Localize.t('global.address')}:
                            </Text>
                            <Text style={[AppStyles.monoSubText, AppStyles.colorBlue]}>{item.address}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    renderItem = ({ item, section }: { item: AccountModel; section: any }) => {
        if (!item?.isValid()) return null;

        switch (section.type) {
            case 'requiredMigration':
                return this.renderMigrationRequiredItem(item);
            case 'doneMigration':
                return this.renderDoneItem(item);
            default:
                return null;
        }
    };

    render() {
        const { dataSource } = this.state;

        return (
            <View testID="accounts-cipher-migration-list-screen" style={AppStyles.container}>
                <Header
                    centerComponent={{ text: Localize.t('account.updateEncryption') }}
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        testID: 'back-button',
                        onPress: Navigator.pop,
                    }}
                    rightComponent={{
                        icon: 'IconHelpCircle',
                        iconSize: 25,
                        testID: 'help-button',
                        onPress: this.onHelpPress,
                    }}
                />
                <View style={AppStyles.flex1}>
                    <SectionList
                        style={AppStyles.paddingHorizontalSml}
                        sections={dataSource}
                        renderItem={this.renderItem}
                        keyExtractor={(item, index) => `${index}`}
                    />
                </View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default CipherMigrationView;
