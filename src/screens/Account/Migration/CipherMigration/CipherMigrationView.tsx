/**
 * Accounts cipher migration Screen
 */

import React, { Component } from 'react';
import { Alert, InteractionManager, SectionList, Text, View } from 'react-native';

import { AppScreens } from '@common/constants';

// helpers
import { Navigator } from '@common/helpers/navigator';

import Vault from '@common/libs/vault';

// store
import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountSchema, CoreSchema } from '@store/schemas/latest';
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
    coreSettings: CoreSchema;
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

    componentWillUnmount() {}

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

    migrateAccount = async (account: AccountSchema, key: string) => {
        // show critical loading overlay
        Navigator.showOverlay(AppScreens.Overlay.CriticalLoading);

        // wait for 1,5 seconds to make sure user is paying attention the critical message
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((r) => setTimeout(r, 1500));

        try {
            // reKey the account with same key
            await Vault.reKey(account.publicKey, key, key);

            // update the account encryption version
            await AccountRepository.update({
                address: account.address,
                encryptionVersion: Vault.getLatestCipherVersion(),
            });

            // update the list
            this.setDataSource();
        } catch (e) {
            Alert.alert(Localize.t('global.error'), Localize.t('global.unexpectedErrorOccurred'));
        }

        // close critical loading
        await Navigator.dismissOverlay(AppScreens.Overlay.CriticalLoading);
    };

    onMigrationPress = (account: AccountSchema) => {
        const { coreSettings } = this.state;

        // start the authentication base on encryption level
        if (account.encryptionLevel === EncryptionLevels.Passphrase) {
            Navigator.showOverlay(AppScreens.Overlay.PassphraseAuthentication, {
                account,
                onSuccess: (passphrase: string) => {
                    this.migrateAccount(account, passphrase);
                },
            });
        }
        if (account.encryptionLevel === EncryptionLevels.Passcode) {
            Navigator.showOverlay(AppScreens.Overlay.Auth, {
                canAuthorizeBiometrics: false,
                onSuccess: () => {
                    this.migrateAccount(account, coreSettings.passcode);
                },
            });
        }
    };

    renderMigrationRequiredItem = (item: AccountSchema) => {
        return (
            <View style={[styles.rowContainer, styles.rowContent]}>
                <View style={[AppStyles.row, styles.rowHeader, AppStyles.centerContent]}>
                    <View style={[AppStyles.flex6]}>
                        <Text style={[styles.accountLabel]}>{item.label}</Text>
                    </View>
                    <View>
                        <Button
                            roundedMini
                            label="Start encryption"
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

    renderDoneItem = (item: AccountSchema) => {
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
                                onPress={() => {}}
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

    renderItem = ({ item, section }: { item: AccountSchema; section: any }) => {
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
                    centerComponent={{ text: 'Encryption' }}
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        testID: 'back-button',
                        onPress: Navigator.pop,
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
