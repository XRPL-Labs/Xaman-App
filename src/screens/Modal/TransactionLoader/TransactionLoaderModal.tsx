/**
 * Transaction Loader modal
 * A Modal to load transaction base on the transaction hash and redirect to details screen
 */

import React, { Component } from 'react';
import { ImageBackground, InteractionManager, Text, View } from 'react-native';

import NetworkService from '@services/NetworkService';
import LedgerService from '@services/LedgerService';
import StyleService from '@services/StyleService';

import { AppScreens } from '@common/constants';

import { TransactionFactory } from '@common/libs/ledger/factory';
import { MixingTypes, MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { Transactions } from '@common/libs/ledger/transactions/types';

import { Navigator } from '@common/helpers/navigator';

import { CoreRepository } from '@store/repositories';
import { AccountModel, NetworkModel } from '@store/models';
import { NetworkType } from '@store/types';

import { Button, Footer, Icon, InfoMessage, LoadingIndicator, Spacer } from '@components/General';

import Localize from '@locale';

// eslint-disable-next-line import/no-cycle
import TransactionDetailsView from '@screens/Events/Details';

import { AppStyles } from '@theme';
import styles from './styles';
import { ErrorResponse } from '@common/libs/ledger/types/methods';
import { ComponentTypes } from '@services/NavigationService';

/* types ==================================================================== */
export interface Props {
    hash: string;
    account: AccountModel;
    network: NetworkModel;
}

export interface State {
    isLoading: boolean;
    requiresSwitchNetwork: boolean;
    error: boolean;
    errorMessage?: string;
    transactionInstance?: Transactions & MutationsMixinType;
    account?: AccountModel;
}

/* Component ==================================================================== */
class TransactionLoaderModal extends Component<Props, State> {
    static screenName = AppScreens.Modal.TransactionLoader;

    private mounted = false;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            requiresSwitchNetwork: false,
            error: false,
            transactionInstance: undefined,
            account: undefined,
        };
    }

    componentDidMount() {
        // track mount status
        this.mounted = true;

        InteractionManager.runAfterInteractions(this.loadTransaction);
    }

    componentWillUnmount() {
        // keep track of mounted status
        this.mounted = false;
    }

    loadTransaction = async () => {
        const { hash, account, network } = this.props;
        const { isLoading } = this.state;

        // no transaction hash has been provided ?
        if (!hash) return;

        // check if we are connected to the network that this push is coming from
        const { networkKey } = NetworkService.getConnectionDetails();

        if (network && network.key !== networkKey) {
            // set return
            this.setState({
                isLoading: false,
                requiresSwitchNetwork: true,
            });
            return;
        }

        if (!isLoading) {
            this.setState({
                isLoading: true,
                error: false,
            });
        }

        // Give the modal time to open
        await new Promise((resolve) => {
            setTimeout(resolve, 500);
        });

        // load the transaction from ledger
        try {
            const resp = await Promise.race([
                new Promise((resolve) => {
                    setTimeout(() => {
                        resolve({
                            error: 'timeout',
                            error_message: Localize.t('global.timeoutFetchingTx'),
                        } as ErrorResponse);
                    }, 10_000);
                }) as Promise<ErrorResponse>,
                LedgerService.getTransaction(hash),
            ]);

            if (!this.mounted) {
                return;
            }

            if ('error' in resp) {
                this.setState({
                    error: true,
                    isLoading: false,
                    errorMessage: String(resp?.error_message || resp?.error || ''),
                });
                return;
            }

            // eslint-disable-next-line no-underscore-dangle
            // @ts-expect-error
            delete resp.__replyMs;
            // eslint-disable-next-line no-underscore-dangle
            delete resp.__command;
            delete resp.inLedger;

            // pick meta from resp and anything else put it in the tx key
            const { meta, ledger_index, validated, ...tx } = resp;

            // build transaction instance
            const transactionInstance = TransactionFactory.fromLedger({ tx, meta, ledger_index, validated }, [
                MixingTypes.Mutation,
            ]) as Transactions & MutationsMixinType;

            // switch to the right account if necessary
            const coreSettings = CoreRepository.getSettings();

            if (coreSettings.account.address !== account.address) {
                CoreRepository.saveSettings({
                    account,
                });
            }

            // Moved to rendering in page
            // close this modal and open the transaction details screen
            // await Navigator.dismissModal();

            this.setState({
                transactionInstance,
                account,
            });

            // redirect to details screen with a little-bit delay
            // setTimeout(() => {
            //     Navigator.showModal<TransactionDetailsViewProps>(AppScreens.Transaction.Details, {
            //         item: transactionInstance,
            //         account,
            //     }, {
            //        modalPresentationStyle: OptionsModalPresentationStyle.pageSheet,
            //     });
            // }, 500);
        } catch (error) {
            if (!this.mounted) {
                return;
            }
            this.setState({
                isLoading: false,
                error: true,
            });
        }
    };

    onSwitchNetworkPress = async () => {
        const { network } = this.props;
        const { requiresSwitchNetwork } = this.state;

        // double check
        if (!requiresSwitchNetwork) {
            return;
        }

        // switch to the desired network
        await NetworkService.switchNetwork(network);

        // re-run the preFlight
        await this.loadTransaction();
    };

    dismiss = () => {
        Navigator.dismissModal();
    };

    renderNetworkSwitch = () => {
        const { network } = this.props;

        const coreSettings = CoreRepository.getSettings();

        // only enable network switch if developer mode is on
        let ShouldShowSwitchButton = true;
        if (network?.type !== NetworkType.Main && !coreSettings.developerMode) {
            ShouldShowSwitchButton = false;
        }

        let switchNetworkWarning;

        // only show switch warning text when we allow user to switch from this modal
        if (ShouldShowSwitchButton) {
            const connectedNetwork = NetworkService.getNetwork();
            switchNetworkWarning = Localize.t('settings.networkChangeAccountDetailsWarning', {
                from: `"${connectedNetwork.name}"`,
                to: `"${network?.name}`,
            });
        }

        return (
            <>
                <Icon name="IconInfo" style={styles.infoIcon} size={80} />
                <Spacer size={18} />
                <InfoMessage
                    type="neutral"
                    label={`${Localize.t('events.transactionDetailsDifferentNetworkError', {
                        network: `"${network?.name}"`,
                    })}\n\n${switchNetworkWarning}\n`}
                    hideActionButton={!ShouldShowSwitchButton}
                    actionButtonLabel={Localize.t('global.switchNetwork')}
                    actionButtonIcon="IconSwitchAccount"
                    actionButtonIconSize={17}
                    onActionButtonPress={this.onSwitchNetworkPress}
                    containerStyle={styles.messageContainer}
                />
            </>
        );
    };

    renderLoading = () => {
        return (
            <>
                <LoadingIndicator size="large" />
                <Spacer size={30} />
                <Text style={[
                    AppStyles.p,
                    AppStyles.textCenterAligned,
                    AppStyles.baseText,
                    AppStyles.colorPrimary,
                ]}>
                    {Localize.t('events.fetchingTransactionFromNetwork')}
                </Text>
                <Text style={[AppStyles.subtext, AppStyles.textCenterAligned, AppStyles.colorGrey]}>
                    {Localize.t('global.pleaseWait')}
                </Text>
            </>
        );
    };

    renderError = () => {
        const { errorMessage } = this.state;
        return (
            <>
                <Icon size={50} name="IconAlertTriangle" style={AppStyles.imgColorOrange} />
                <Spacer size={40} />
                <InfoMessage
                    type="neutral"
                    actionButtonLabel={Localize.t('global.tryAgain')}
                    actionButtonIcon="IconRefresh"
                    onActionButtonPress={this.loadTransaction}
                    containerStyle={styles.messageContainer}
                >
                    <Text style={[AppStyles.subtext, AppStyles.textCenterAligned, AppStyles.colorGrey]}>
                        {Localize.t('events.unableToLoadTheTransaction')}
                    </Text>
                    {errorMessage && errorMessage !== '' && (
                        <View style={[
                            AppStyles.paddingTopSml,
                            AppStyles.paddingBottomExtraSml,
                            AppStyles.centerSelf,
                            AppStyles.centerContent,
                        ]}>
                            <Text style={[
                                AppStyles.baseText,
                                AppStyles.colorRed,
                                AppStyles.bold,
                            ]}>{errorMessage}</Text>
                        </View>
                    )}
                </InfoMessage>
            </>
        );
    };

    renderContent = () => {
        const {
            isLoading,
            requiresSwitchNetwork,
            error,
        } = this.state;

        if (isLoading) {
            return this.renderLoading();
        }
        if (requiresSwitchNetwork) {
            return this.renderNetworkSwitch();
        }
        if (error) {
            return this.renderError();
        }

        return null;
    };

    render() {
        const {
            isLoading,
            transactionInstance,
            account,
        } = this.state;

        if (transactionInstance && account) {
            return (
                <TransactionDetailsView
                    componentType={ComponentTypes.Modal}
                    item={transactionInstance}
                    account={account}
                    embeddedInsteadOfModal
                />
            );
        }

        return (
            <ImageBackground
                resizeMode="cover"
                source={
                    StyleService.getImageIfLightModeIfDarkMode('BackgroundShapesLight', 'BackgroundShapes')
                }
                style={styles.container}
            >
                <View style={styles.contentContainer}>{this.renderContent()}</View>
                <Footer>
                    <Button
                        light
                        textStyle={AppStyles.strong}
                        label={isLoading ? Localize.t('global.cancel') : Localize.t('global.close')}
                        onPress={this.dismiss}
                    />
                </Footer>
            </ImageBackground>
        );
    }
}

/* Export Component ==================================================================== */
export default TransactionLoaderModal;
