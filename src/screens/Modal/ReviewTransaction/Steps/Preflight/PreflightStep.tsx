/**
 * Review transaction preflight Screen
 */
/* eslint-disable max-classes-per-file */
import { filter, find, first, isEmpty } from 'lodash';
import React, { Component } from 'react';
import { Image, InteractionManager, Text, View } from 'react-native';

import { NetworkService } from '@services';

import { AccountRepository, CoreRepository, NetworkRepository } from '@store/repositories';
import { NetworkType } from '@store/types';
import { AccountModel } from '@store/models';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';
import { Prompt } from '@common/helpers/interface';
import { Images } from '@common/helpers/images';

import { TransactionTypes } from '@common/libs/ledger/types/enums';

import { Button, Icon, InfoMessage, Spacer } from '@components/General';
import { ReviewHeader } from '@screens/Modal/ReviewTransaction/Shared';

import Localize from '@locale';

import { AccountAddViewProps } from '@screens/Account/Add';

import { AppStyles } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';
/* types ==================================================================== */
enum RequiredActionsType {
    SWITCH_NETWORK = 'SWITCH_NETWORK',
    FORCED_SIGNER = 'FORCED_SIGNER',
    ADD_ACCOUNT = 'ADD_ACCOUNTS',
}

export interface Props {}

export interface State {
    requiredAction?: RequiredActionsType;
    requiredActionData: any;
}

/* Error ==================================================================== */
class PreflightError extends Error {
    public action: RequiredActionsType;
    public data: any;
    public recoverable = true;

    constructor(action: RequiredActionsType, data?: any) {
        super();

        this.action = action;
        this.data = data;

        if (!this.action && !this.data) {
            this.recoverable = false;
        }
    }
}

/* Component ==================================================================== */
class PreflightStep extends Component<Props, State> {
    static contextType = StepsContext;
    declare context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            requiredAction: undefined,
            requiredActionData: undefined,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.runPreFlight);
    }

    /*
    Run all preflight checks and tasks
     */
    runPreFlight = () => {
        // necessary jobs in order
        const jobs = [this.checkForcedNetwork, this.setTransaction, this.loadSingingAccount];

        // run them in waterfall
        jobs.reduce((accumulator: any, callback) => {
            return accumulator.then(callback);
        }, Promise.resolve())
            .then(this.onPreflightPass)
            .catch(this.onPreflightReject);
    };

    /*
    Callback for when all test flight tasks are resolved
     */
    onPreflightPass = () => {
        const { onPreflightPass } = this.context;

        // callback
        if (typeof onPreflightPass === 'function') {
            onPreflightPass();
        }
    };

    /*
    Callback for when there is at least one error in one of preflight tasks
    */
    onPreflightReject = (error: PreflightError) => {
        const { setError } = this.context;

        // hard error
        if (!error.recoverable) {
            setError(error);
            return;
        }

        this.setState({
            requiredAction: error.action,
            requiredActionData: error.data,
        });
    };

    /*
    Set the transaction and check if we can sign this transaction in the selected network
     */
    setTransaction = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            const { payload, setTransaction } = this.context;

            try {
                setTransaction(payload.getTransaction());

                resolve();
            } catch (error: any) {
                reject(error);
            }
        });
    };

    /*
    Check if payload includes forced_network and show error if user is not in desired network
     */
    checkForcedNetwork = (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            const { payload, setError } = this.context;

            try {
                // check if any forced network applied
                const forcedNetwork = payload.getForcedNetwork();

                // nothing to check
                if (typeof forcedNetwork !== 'string') {
                    resolve();
                    return;
                }

                // force network applied, run check
                const network = NetworkRepository.findOne({ key: forcedNetwork });

                // force network applied but user is not connected to the network
                if (network && NetworkService.getNetwork().key !== network.key) {
                    reject(
                        new PreflightError(RequiredActionsType.SWITCH_NETWORK, {
                            network,
                        }),
                    );
                    return;
                }

                // everything seems fine
                resolve();
            } catch (error: any) {
                setError(error);
            }
        });
    };

    /*
    Load the accounts which this payload can be signed with
     */
    loadSingingAccount = (): Promise<void> => {
        return new Promise((resolve, reject): void => {
            const { transaction, payload, setAccounts, setSource } = this.context;

            try {
                // get available accounts for signing
                let availableAccounts: AccountModel[];

                if (
                    payload.isMultiSign() ||
                    payload.isPseudoTransaction() ||
                    payload.getTransactionType() === TransactionTypes.Import
                ) {
                    // account's that can sign the transaction
                    // NOTE: for Import transaction, the transaction can be signed with not activated accounts
                    availableAccounts = AccountRepository.getSignableAccounts();
                } else {
                    // account's that can sign the transaction and also activated
                    availableAccounts = AccountRepository.getSpendableAccounts(true);
                }

                // if no account for signing is available then just return
                if (isEmpty(availableAccounts)) {
                    reject(new PreflightError(RequiredActionsType.ADD_ACCOUNT));
                    return;
                }

                // choose preferred account for sign
                let preferredAccount: AccountModel | undefined;
                let source: AccountModel | undefined;

                // check for enforced signer accounts
                const forcedSigners = payload.getSigners();

                if (Array.isArray(forcedSigners) && forcedSigners.length > 0) {
                    // filter available accounts base on forced signers
                    availableAccounts = filter(availableAccounts, (account) => forcedSigners.includes(account.address));

                    // no available account for signing base on forced signers
                    if (isEmpty(availableAccounts)) {
                        reject(
                            new PreflightError(RequiredActionsType.FORCED_SIGNER, {
                                forcedSigners,
                            }),
                        );
                        return;
                    }
                }

                // if any account set from payload, set as preferred account
                if (transaction && transaction.Account) {
                    preferredAccount = find(availableAccounts, { address: transaction.Account });
                }

                // remove hidden accounts but keep preferred account even if hidden
                // ignore for forced signers
                if (!forcedSigners) {
                    availableAccounts = filter(
                        availableAccounts,
                        (account) => !account.hidden || account.address === preferredAccount?.address,
                    );
                }

                // after removing the hidden accounts
                // return if empty
                if (isEmpty(availableAccounts)) {
                    reject(new PreflightError(RequiredActionsType.ADD_ACCOUNT));
                    return;
                }

                // if there is no preferred account base on transaction.Account
                // choose default || first available account
                // this will guarantee source to be set
                if (preferredAccount) {
                    source = preferredAccount;
                } else {
                    const defaultAccount = CoreRepository.getDefaultAccount();
                    source = find(availableAccounts, { address: defaultAccount.address }) || first(availableAccounts);
                }

                // double check
                if (!source) {
                    reject(new PreflightError(RequiredActionsType.ADD_ACCOUNT));
                    return;
                }

                // set the source
                setSource(source);

                // set available accounts
                setAccounts(availableAccounts);

                // resolve
                resolve();
            } catch (error: any) {
                reject(error);
            }
        });
    };

    switchNetwork = async () => {
        const { requiredActionData } = this.state;

        // switch to the desired network
        await NetworkService.switchNetwork(requiredActionData.network);

        // re-run the preFlight
        this.runPreFlight();
    };

    onSwitchNetworkPress = () => {
        const { requiredActionData } = this.state;

        // get currently connected network
        const connectedNetwork = NetworkService.getNetwork();

        // ask user if they want to switch the network
        Prompt(
            Localize.t('global.switchNetwork'),
            Localize.t('settings.nodeChangeWarning', {
                from: `"${connectedNetwork.name}"`,
                to: `"${requiredActionData.network.name}`,
            }),
            [
                { text: Localize.t('global.cancel') },
                {
                    text: Localize.t('global.switch'),
                    onPress: this.switchNetwork,
                },
            ],
        );
    };

    onAddAccountPress = async () => {
        // close the ReviewModal and redirect user to add account screen
        await Navigator.dismissModal();

        // push to the screen
        Navigator.push<AccountAddViewProps>(AppScreens.Account.Add, {});
    };

    renderForcedSigners = () => {
        const { requiredActionData } = this.state;

        return (
            <View style={styles.contentContainer}>
                <Icon name="IconInfo" style={styles.infoIcon} size={80} />
                <Spacer size={18} />
                <Text style={AppStyles.h5}>{Localize.t('global.noAccountConfigured')}</Text>
                <Spacer size={18} />
                <InfoMessage
                    type="neutral"
                    labelStyle={styles.actionDescription}
                    label={Localize.t('payload.forcedSignersAccountsDoesNotExist', {
                        accounts: requiredActionData.forcedSigners.join('\n'),
                    })}
                    containerStyle={styles.actionContainer}
                    actionButtonLabel={Localize.t('account.addAccount')}
                    actionButtonIcon="IconPlus"
                    actionButtonIconSize={17}
                    onActionButtonPress={this.onAddAccountPress}
                />
            </View>
        );
    };

    renderAddAccountAction = () => {
        return (
            <View style={styles.contentContainer}>
                <Icon name="IconInfo" style={styles.infoIcon} size={80} />
                <Spacer size={18} />
                <Text style={AppStyles.h5}>{Localize.t('global.noAccountConfigured')}</Text>
                <Spacer size={18} />
                <InfoMessage
                    type="neutral"
                    labelStyle={styles.actionDescription}
                    label={Localize.t('global.pleaseAddAccountToSignTheTransaction')}
                    containerStyle={styles.actionContainer}
                    actionButtonLabel={Localize.t('account.addAccount')}
                    actionButtonIcon="IconPlus"
                    actionButtonIconSize={17}
                    onActionButtonPress={this.onAddAccountPress}
                />
            </View>
        );
    };

    renderSwitchNetworkAction = () => {
        const { requiredActionData } = this.state;
        const { coreSettings } = this.context;

        // if forced_network type is not "Mainnet" then we should only offer switching if developer mode is on
        let ShouldShowSwitchButton = true;
        if (requiredActionData.network.type !== NetworkType.Main && !coreSettings.developerMode) {
            ShouldShowSwitchButton = false;
        }

        return (
            <View style={styles.errorContainer}>
                <Image source={Images.ImageArrowUp} style={styles.arrowUpImage} />
                <Spacer size={18} />
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned]}>
                    {Localize.t('payload.payloadForceNetworkError')}
                </Text>
                <Spacer size={18} />
                <Text style={styles.networkSwitchSubtext}>
                    {Localize.t('payload.pleaseSwitchToNetworkAndTryAgain', {
                        network: requiredActionData.network.name,
                    })}
                </Text>
                <Spacer size={30} />
                {ShouldShowSwitchButton && (
                    <Button
                        secondary
                        roundedMini
                        label={Localize.t('global.switchNetwork')}
                        onPress={this.onSwitchNetworkPress}
                    />
                )}
            </View>
        );
    };

    render() {
        const { onClose, transaction } = this.context;
        const { requiredAction } = this.state;

        // no action is required
        if (!requiredAction) {
            return null;
        }

        let ActionRenderer;

        switch (requiredAction) {
            case RequiredActionsType.SWITCH_NETWORK:
                ActionRenderer = this.renderSwitchNetworkAction;
                break;
            case RequiredActionsType.ADD_ACCOUNT:
                ActionRenderer = this.renderAddAccountAction;
                break;
            case RequiredActionsType.FORCED_SIGNER:
                ActionRenderer = this.renderForcedSigners;
                break;
            default:
                return null;
        }

        return (
            <View testID="preflight-error-view" style={styles.container}>
                <ReviewHeader onClose={onClose} transaction={transaction} />
                {ActionRenderer()}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default PreflightStep;
