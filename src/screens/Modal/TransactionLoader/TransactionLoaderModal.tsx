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

import { CoreRepository, NetworkRepository } from '@store/repositories';
import { AccountModel, NetworkModel } from '@store/models';
import { NetworkType } from '@store/types';

import { Button, Footer, Icon, InfoMessage, LoadingIndicator, Spacer } from '@components/General';

import Localize from '@locale';

import { TransactionDetailsViewProps } from '@screens/Events/Details';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    hash: string;
    account: AccountModel;
    network: string;
}

export interface State {
    isLoading: boolean;
    requiredSwitchNetwork: boolean;
    requiredNetwork?: NetworkModel;
    error: boolean;
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
            requiredSwitchNetwork: false,
            requiredNetwork: undefined,
            error: false,
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

        if (network && network !== networkKey) {
            // get required network
            const requiredNetwork = NetworkRepository.findOne({ key: network });

            // set return
            this.setState({
                isLoading: false,
                requiredSwitchNetwork: true,
                requiredNetwork,
            });
            return;
        }

        if (!isLoading) {
            this.setState({
                isLoading: true,
                error: false,
            });
        }

        // some timing issue can be fixed with this
        await new Promise((resolve) => {
            setTimeout(resolve, 1000);
        });

        // load the transaction from ledger
        try {
            const resp = await LedgerService.getTransaction(hash);

            if (!this.mounted) {
                return;
            }

            if ('error' in resp) {
                this.setState({
                    error: true,
                });
                return;
            }

            // eslint-disable-next-line no-underscore-dangle
            // @ts-ignore
            delete resp.__replyMs;
            // eslint-disable-next-line no-underscore-dangle
            delete resp.__command;
            delete resp.inLedger;

            // build transaction instance
            const transactionInstance = TransactionFactory.fromJson(resp, [MixingTypes.Mutation]) as Transactions &
                MutationsMixinType;

            // switch to the right account if necessary
            const coreSettings = CoreRepository.getSettings();

            if (coreSettings.account.address !== account.address) {
                CoreRepository.saveSettings({
                    account,
                });
            }

            // close this modal and open the transaction details screen
            await Navigator.dismissModal();

            // redirect to details screen with a little-bit delay
            setTimeout(() => {
                Navigator.showModal<TransactionDetailsViewProps>(AppScreens.Transaction.Details, {
                    item: transactionInstance,
                    account,
                });
            }, 500);
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
        const { requiredNetwork } = this.state;

        // double check
        if (!requiredNetwork) {
            return;
        }

        // switch to the desired network
        await NetworkService.switchNetwork(requiredNetwork);

        // re-run the preFlight
        await this.loadTransaction();
    };

    dismiss = () => {
        Navigator.dismissModal();
    };

    renderNetworkSwitch = () => {
        const { requiredNetwork } = this.state;

        const coreSettings = CoreRepository.getSettings();

        // only enable network switch if developer mode is on
        let ShouldShowSwitchButton = true;
        if (requiredNetwork?.type !== NetworkType.Main && !coreSettings.developerMode) {
            ShouldShowSwitchButton = false;
        }

        let switchNetworkWarning;

        // only show switch warning text when we allow user to switch from this modal
        if (ShouldShowSwitchButton) {
            const connectedNetwork = NetworkService.getNetwork();
            switchNetworkWarning = Localize.t('settings.networkChangeAccountDetailsWarning', {
                from: `"${connectedNetwork.name}"`,
                to: `"${requiredNetwork?.name}`,
            });
        }

        return (
            <>
                <Icon name="IconInfo" style={styles.infoIcon} size={80} />
                <Spacer size={18} />
                <InfoMessage
                    type="neutral"
                    label={`${Localize.t('events.transactionDetailsDifferentNetworkError', {
                        network: `"${requiredNetwork?.name}"`,
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
                <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                    {Localize.t('events.fetchingTransactionFromNetwork')}
                </Text>
                <Text style={[AppStyles.subtext, AppStyles.textCenterAligned, AppStyles.colorGrey]}>
                    {Localize.t('global.pleaseWait')}
                </Text>
            </>
        );
    };

    renderError = () => {
        return (
            <>
                <Icon size={50} name="IconAlertTriangle" style={AppStyles.imgColorOrange} />
                <Spacer size={40} />
                <InfoMessage
                    type="neutral"
                    label={Localize.t('events.unableToLoadTheTransaction')}
                    actionButtonLabel={Localize.t('global.tryAgain')}
                    actionButtonIcon="IconRefresh"
                    onActionButtonPress={this.loadTransaction}
                    containerStyle={styles.messageContainer}
                />
            </>
        );
    };

    renderContent = () => {
        const { isLoading, requiredSwitchNetwork, error } = this.state;

        if (isLoading) {
            return this.renderLoading();
        }
        if (requiredSwitchNetwork) {
            return this.renderNetworkSwitch();
        }
        if (error) {
            return this.renderError();
        }
        return null;
    };

    render() {
        const { isLoading } = this.state;

        return (
            <ImageBackground
                source={StyleService.getImage('BackgroundShapes')}
                imageStyle={styles.backgroundShapes}
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
