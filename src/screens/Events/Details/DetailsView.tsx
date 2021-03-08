/**
 * Transaction Details screen
 */
import { find, isEmpty, isUndefined, get } from 'lodash';
import moment from 'moment-timezone';
import { Navigation, OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import React, { Component, Fragment } from 'react';
import {
    View,
    Text,
    ScrollView,
    Platform,
    Linking,
    Alert,
    InteractionManager,
    TouchableOpacity,
    Share,
    ImageBackground,
    ActivityIndicator,
} from 'react-native';

import { BackendService, SocketService, LedgerService } from '@services';

import { NodeChain } from '@store/types';
import { CoreSchema, AccountSchema } from '@store/schemas/latest';
import CoreRepository from '@store/repositories/core';
import AccountRepository from '@store/repositories/account';

import { Payload, PayloadOrigin } from '@common/libs/payload';
import { TransactionsType } from '@common/libs/ledger/transactions/types';
import transactionFactory from '@common/libs/ledger/parser/transaction';

import { NormalizeCurrencyCode } from '@common/libs/utils';
import { AppScreens, AppConfig } from '@common/constants';

import { ActionSheet, Toast } from '@common/helpers/interface';
import { Images } from '@common/helpers/images';
import { Navigator } from '@common/helpers/navigator';

import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import { Header, Button, Badge, Spacer, Icon, ReadMore, AmountText } from '@components/General';
import { RecipientElement } from '@components/Modules';

import Localize from '@locale';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    tx?: TransactionsType;
    hash?: string;
    account: AccountSchema;
    asModal?: boolean;
}

export interface State {
    tx: TransactionsType;
    partiesDetails: AccountNameType;
    coreSettings: CoreSchema;
    spendableAccounts: AccountSchema[];
    connectedChain: NodeChain;
    balanceChanges: any;
    incomingTx: boolean;
    scamAlert: boolean;
    showMemo: boolean;
    isLoading: boolean;
}

/* Component ==================================================================== */
class TransactionDetailsView extends Component<Props, State> {
    static screenName = AppScreens.Transaction.Details;

    private forceFetchDetails: boolean;
    private navigationListener: any;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            tx: props.tx,
            partiesDetails: {
                address: '',
                name: '',
                source: '',
            },
            coreSettings: CoreRepository.getSettings(),
            spendableAccounts: AccountRepository.getSpendableAccounts(),
            connectedChain: SocketService.chain,
            balanceChanges: undefined,
            incomingTx: props.tx?.Destination?.address === props.account.address,
            scamAlert: false,
            showMemo: true,
            isLoading: !props.tx,
        };

        this.forceFetchDetails = false;
    }

    componentDidMount() {
        const { tx } = this.props;

        this.navigationListener = Navigation.events().bindComponent(this);

        InteractionManager.runAfterInteractions(() => {
            if (tx) {
                this.loadDetails();
            } else {
                this.loadTransaction();
            }
        });
    }

    componentWillUnmount() {
        if (this.navigationListener) {
            this.navigationListener.remove();
        }
    }

    componentDidAppear() {
        if (this.forceFetchDetails) {
            this.forceFetchDetails = false;

            InteractionManager.runAfterInteractions(() => {
                this.setPartiesDetails();
            });
        }
    }

    componentDidDisappear() {
        this.forceFetchDetails = true;
    }

    close = () => {
        const { asModal } = this.props;

        if (asModal) {
            Navigator.dismissModal();
        } else {
            Navigator.pop();
        }
    };

    loadTransaction = () => {
        const { hash, account } = this.props;

        if (!hash) return;

        LedgerService.getTransaction(hash)
            .then((resp: any) => {
                if (get(resp, 'error')) {
                    throw new Error('Not found');
                }

                const { meta } = resp;
                delete resp.meta;

                const transaction = transactionFactory({ tx: resp, meta });

                this.setState(
                    {
                        tx: transaction,
                        isLoading: false,
                        incomingTx: transaction.Destination?.address === account.address,
                    },
                    this.loadDetails,
                );
            })
            .catch(() => {
                Toast(Localize.t('events.unableToLoadTheTransaction'));
                setTimeout(this.close, 2000);
            });
    };

    loadDetails = () => {
        this.checkForScamAlert();
        this.setPartiesDetails();
        this.setBalanceChanges();
    };

    setBalanceChanges = () => {
        const { tx } = this.state;
        const { account } = this.props;

        if (tx.Type === 'Payment') {
            this.setState({
                balanceChanges: tx.BalanceChange(account.address),
            });
        }
    };

    checkForScamAlert = async () => {
        const { incomingTx, tx } = this.state;

        if (incomingTx) {
            BackendService.getAccountRisk(tx.Account.address)
                .then((accountRisk: any) => {
                    if (accountRisk && accountRisk.danger !== 'UNKNOWN') {
                        this.setState({
                            scamAlert: true,
                            showMemo: false,
                        });
                    }
                })
                .catch(() => {});
        }
    };

    setPartiesDetails = async () => {
        const { account } = this.props;
        const { incomingTx, tx } = this.state;

        let address = '';
        let tag;

        switch (tx.Type) {
            case 'Payment':
                if (incomingTx) {
                    address = tx.Account.address;
                } else {
                    address = tx.Destination.address;
                    tag = tx.Destination.tag;
                }
                break;
            case 'AccountDelete':
                address = tx.Destination.address;
                break;
            case 'TrustSet':
                // incoming trustline
                if (tx.Issuer === account.address) {
                    address = tx.Account.address;
                } else {
                    address = tx.Issuer;
                }
                break;
            case 'EscrowCreate':
            case 'Escrow':
                if (incomingTx) {
                    address = tx.Account.address;
                } else {
                    address = tx.Destination.address;
                    tag = tx.Destination.tag;
                }
                break;
            case 'EscrowFinish':
                if (incomingTx) {
                    address = tx.Account.address;
                } else {
                    address = tx.Destination.address;
                    tag = tx.Destination.tag;
                }
                break;
            case 'DepositPreauth':
                address = tx.Authorize || tx.Unauthorize;
                break;
            case 'SetRegularKey':
                address = tx.RegularKey;
                break;
            case 'CheckCreate':
            case 'Check':
                if (incomingTx) {
                    address = tx.Account.address;
                } else {
                    address = tx.Destination.address;
                    tag = tx.Destination.tag;
                }
                break;
            case 'CheckCash':
                address = tx.Account.address;
                break;
            case 'CheckCancel':
                address = tx.Account.address;
                break;
            default:
                break;
        }

        // no parties details
        if (!address) return;

        getAccountName(address, tag)
            .then((res: any) => {
                if (!isEmpty(res)) {
                    this.setState({
                        partiesDetails: Object.assign(res, { address }),
                    });
                }
            })
            .catch(() => {});
    };

    getTransactionLink = () => {
        const { tx, connectedChain, coreSettings } = this.state;

        const net = connectedChain === NodeChain.Main ? 'main' : 'test';

        const explorer = find(AppConfig.explorer, { value: coreSettings.defaultExplorer });

        return `${explorer.tx[net]}${tx.Hash || tx.PreviousTxnID}`;
    };

    shareTxLink = () => {
        const url = this.getTransactionLink();

        Share.share({
            title: Localize.t('events.shareTransactionId'),
            message: url,
            url: undefined,
        }).catch(() => {});
    };

    openTxLink = () => {
        const url = this.getTransactionLink();
        Linking.canOpenURL(url).then((supported) => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert(Localize.t('global.error'), Localize.t('global.cannotOpenLink'));
            }
        });
    };

    showMenu = () => {
        const IosButtons = [
            Localize.t('global.share'),
            Localize.t('global.openInBrowser'),
            Localize.t('global.cancel'),
        ];
        const AndroidButtons = [Localize.t('global.share'), Localize.t('global.openInBrowser')];
        ActionSheet(
            {
                options: Platform.OS === 'ios' ? IosButtons : AndroidButtons,

                cancelButtonIndex: 2,
            },
            (buttonIndex: number) => {
                if (buttonIndex === 0) {
                    this.shareTxLink();
                }
                if (buttonIndex === 1) {
                    this.openTxLink();
                }
            },
        );
    };

    showRecipientMenu = () => {
        const { partiesDetails, incomingTx, tx } = this.state;

        let recipient = undefined as any;

        if (incomingTx) {
            recipient = {
                address: tx.Account.address,
                tag: tx.Account.tag,
                ...partiesDetails,
            };
        } else {
            recipient = {
                address: tx.Destination?.address,
                tag: tx.Destination?.tag,
                ...partiesDetails,
            };
        }

        Navigator.showOverlay(
            AppScreens.Overlay.RecipientMenu,
            {
                layout: {
                    backgroundColor: 'transparent',
                    componentBackgroundColor: 'transparent',
                },
            },
            { recipient },
        );
    };

    getLabel = () => {
        const { account } = this.props;
        const { balanceChanges, tx } = this.state;

        switch (tx.Type) {
            case 'Payment':
                if ([tx.Account.address, tx.Destination?.address].indexOf(account.address) === -1) {
                    if (balanceChanges?.sent || balanceChanges?.received) {
                        return Localize.t('events.exchangedAssets');
                    }
                }
                return Localize.t('global.payment');

            case 'TrustSet':
                if (tx.Account.address !== account.address && tx.Limit !== 0) {
                    return Localize.t('events.incomingTrustLineAdded');
                }
                if (tx.Limit === 0) {
                    return Localize.t('events.removedATrustLine');
                }
                return Localize.t('events.addedATrustLine');
            case 'EscrowCreate':
                return Localize.t('events.createEscrow');
            case 'EscrowFinish':
                return Localize.t('events.finishEscrow');
            case 'EscrowCancel':
                return Localize.t('events.cancelEscrow');
            case 'AccountSet':
                return Localize.t('events.accountSettings');
            case 'SignerListSet':
                return Localize.t('events.setSignerList');
            case 'OfferCreate':
                if (tx.Executed) {
                    return Localize.t('events.exchangedAssets');
                }
                return Localize.t('events.createOffer');
            case 'OfferCancel':
                return Localize.t('events.cancelOffer');
            case 'AccountDelete':
                return Localize.t('events.deleteAccount');
            case 'SetRegularKey':
                return Localize.t('events.setRegularKey');
            case 'DepositPreauth':
                if (tx.Authorize) {
                    return Localize.t('events.authorizeDeposit');
                }
                return Localize.t('events.unauthorizeDeposit');
            case 'CheckCreate':
                return Localize.t('events.createCheck');
            case 'CheckCash':
                return Localize.t('events.cashCheck');
            case 'CheckCancel':
                return Localize.t('events.cancelCheck');
            case 'Offer':
                return Localize.t('global.offer');
            case 'Escrow':
                return Localize.t('global.escrow');
            case 'Check':
                return Localize.t('global.check');
            default:
                return tx.Type;
        }
    };

    onActionButtonPress = async (type: string) => {
        const { tx, incomingTx } = this.state;
        const { account } = this.props;

        if (type === 'OpenXapp') {
            Navigator.showModal(
                AppScreens.Modal.XAppBrowser,
                {
                    modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                    modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                },
                {
                    identifier: tx.getXappIdentifier(),
                    origin: PayloadOrigin.TRANSACTION_MEMO,
                    originData: { txid: tx.Hash },
                },
            );
            return;
        }

        if (type === 'Payment') {
            const params = {
                scanResult: {
                    to: incomingTx ? tx.Account.address : tx.Destination.address,
                    tag: incomingTx ? tx.Account.tag : tx.Destination.tag,
                },
            };

            if (incomingTx) {
                let currency;

                if (tx.Amount?.currency === 'XRP') {
                    currency = 'XRP';
                } else {
                    currency = account.lines.find(
                        // eslint-disable-next-line max-len
                        (l: any) =>
                            l.currency.currency === tx.Amount.currency && l.currency.issuer === tx.Amount.issuer,
                    );
                }
                Object.assign(params, { amount: tx.Amount.value, currency });
            }
            Navigator.push(AppScreens.Transaction.Payment, {}, params);
            return;
        }

        let transaction = { Account: account.address };

        switch (type) {
            case 'OfferCancel':
                Object.assign(transaction, {
                    TransactionType: 'OfferCancel',
                    OfferSequence: tx.Sequence,
                });
                break;
            case 'CheckCancel':
                Object.assign(transaction, {
                    TransactionType: 'CheckCancel',
                    CheckID: tx.Index,
                });
                break;
            case 'CheckCash':
                Object.assign(transaction, {
                    TransactionType: 'CheckCash',
                    CheckID: tx.Index,
                });
                break;
            case 'EscrowCancel':
                Object.assign(transaction, {
                    TransactionType: 'EscrowCancel',
                    Owner: tx.Account.address,
                    PreviousTxnID: tx.PreviousTxnID,
                });
                break;
            case 'EscrowFinish':
                Object.assign(transaction, {
                    TransactionType: 'EscrowFinish',
                    Owner: tx.Account.address,
                    PreviousTxnID: tx.PreviousTxnID,
                });
                break;
            default:
                transaction = undefined;
                break;
        }

        if (transaction) {
            const payload = await Payload.build(transaction);

            Navigator.showModal(
                AppScreens.Modal.ReviewTransaction,
                { modalPresentationStyle: 'fullScreen' },
                {
                    payload,
                    onResolve: Navigator.pop,
                },
            );
        }
    };

    renderStatus = () => {
        const { tx } = this.state;

        // ignore if it's ledger object
        if (tx.ClassName !== 'Transaction') {
            return null;
        }

        return (
            <>
                <Text style={[styles.labelText]}>{Localize.t('global.status')}</Text>
                <Text style={[styles.contentText]}>
                    {Localize.t('events.thisTransactionWasSuccessful')} {Localize.t('events.andValidatedInLedger')}
                    <Text style={AppStyles.monoBold}> {tx.LedgerIndex} </Text>
                    {Localize.t('events.onDate')}
                    <Text style={AppStyles.monoBold}> {moment(tx.Date).format('LLLL')}</Text>
                </Text>
            </>
        );
    };

    renderOfferCreate = () => {
        const { tx } = this.state;

        let content;

        content = Localize.t('events.offerTransactionExplain', {
            address: tx.Account.address,
            takerGetsValue: tx.TakerGets.value,
            takerGetsCurrency: NormalizeCurrencyCode(tx.TakerGets.currency),
            takerPaysValue: tx.TakerPays.value,
            takerPaysCurrency: NormalizeCurrencyCode(tx.TakerPays.currency),
        });
        content += '\n';
        content += Localize.t('events.theExchangeRateForThisOfferIs', {
            rate: tx.Rate,
            takerPaysCurrency:
                tx.TakerGets.currency === 'XRP'
                    ? NormalizeCurrencyCode(tx.TakerPays.currency)
                    : NormalizeCurrencyCode(tx.TakerGets.currency),
            takerGetsCurrency:
                tx.TakerGets.currency !== 'XRP'
                    ? NormalizeCurrencyCode(tx.TakerPays.currency)
                    : NormalizeCurrencyCode(tx.TakerGets.currency),
        });

        if (tx.OfferSequence) {
            content += '\n';
            content += Localize.t('events.theTransactionIsAlsoCancelOffer', {
                address: tx.Account.address,
                offerSequence: tx.OfferSequence,
            });
        }

        if (tx.Expiration) {
            content += '\n';
            content += Localize.t('events.theOfferExpiresAtUnlessCanceledOrConsumed', {
                expiration: moment(tx.Expiration).format('LLLL'),
            });
        }

        return content;
    };

    renderOfferCancel = () => {
        const { tx } = this.state;

        return Localize.t('events.theTransactionWillCancelOffer', {
            address: tx.Account.address,
            offerSequence: tx.OfferSequence,
        });
    };

    renderEscrowCreate = () => {
        const { tx } = this.state;

        let content = Localize.t('events.theEscrowIsFromTo', {
            account: tx.Account.address,
            destination: tx.Destination.address,
        });
        if (tx.Destination.tag) {
            content += '\n';
            content += Localize.t('events.theEscrowHasADestinationTag', { tag: tx.Destination.tag });
            content += ' ';
        }
        content += '\n';
        content += Localize.t('events.itEscrowed', { amount: tx.Amount.value });

        if (tx.CancelAfter) {
            content += '\n';
            content += Localize.t('events.itCanBeCanceledAfter', { date: moment(tx.CancelAfter).format('LLLL') });
        }

        if (tx.FinishAfter) {
            content += '\n';
            content += Localize.t('events.itCanBeFinishedAfter', { date: moment(tx.FinishAfter).format('LLLL') });
        }
        return content;
    };

    renderEscrowFinish = () => {
        const { tx } = this.state;

        let content = Localize.t('events.escrowFinishTransactionExplain', {
            address: tx.Account.address,
            amount: tx.Amount.value,
            destination: tx.Destination.address,
        });
        if (tx.Destination.tag) {
            content += '\n';
            content += Localize.t('events.theEscrowHasADestinationTag', { tag: tx.Destination.tag });
            content += ' ';
        }

        content += '\n';
        content += Localize.t('events.theEscrowWasCreatedBy', { owner: tx.Owner });

        return content;
    };

    renderPayment = () => {
        const { tx } = this.state;

        let content = '';
        if (tx.Account.tag) {
            content += Localize.t('events.thePaymentHasASourceTag', { tag: tx.Account.tag });
            content += ' \n';
        }
        if (tx.Destination.tag) {
            content += Localize.t('events.thePaymentHasADestinationTag', { tag: tx.Destination.tag });
            content += ' \n';
        }

        content += Localize.t('events.itWasInstructedToDeliver', {
            amount: tx.Amount.value,
            currency: NormalizeCurrencyCode(tx.Amount.currency),
        });

        if (tx.SendMax) {
            content += ' ';
            content += Localize.t('events.bySpendingUpTo', {
                amount: tx.SendMax.value,
                currency: NormalizeCurrencyCode(tx.SendMax.currency),
            });
        }
        return content;
    };

    renderAccountDelete = () => {
        const { tx } = this.state;

        let content = Localize.t('events.itDeletedAccount', { address: tx.Account.address });

        content += '\n\n';
        content += Localize.t('events.itWasInstructedToDeliverTheRemainingBalanceOf', {
            amount: tx.Amount.value,
            currency: NormalizeCurrencyCode(tx.Amount.currency),
            destination: tx.Destination.address,
        });

        if (tx.Account.tag) {
            content += '\n';
            content += Localize.t('events.theTransactionHasASourceTag', { tag: tx.Account.tag });
        }
        if (tx.Destination.tag) {
            content += '\n';
            content += Localize.t('events.theTransactionHasADestinationTag', { tag: tx.Destination.tag });
        }

        return content;
    };

    renderCheckCreate = () => {
        const { tx } = this.state;

        let content = Localize.t('events.theCheckIsFromTo', {
            address: tx.Account.address,
            destination: tx.Destination.address,
        });

        if (tx.Account.tag) {
            content += '\n';
            content += Localize.t('events.theCheckHasASourceTag', { tag: tx.Account.tag });
        }
        if (tx.Destination.tag) {
            content += '\n';
            content += Localize.t('events.theCheckHasADestinationTag', { tag: tx.Destination.tag });
        }

        content += '\n\n';
        content += Localize.t('events.maximumAmountCheckIsAllowToDebit', {
            amount: tx.SendMax.value,
            currency: NormalizeCurrencyCode(tx.SendMax.currency),
        });

        return content;
    };

    renderCheckCash = () => {
        const { tx } = this.state;

        const amount = tx.Amount || tx.DeliverMin;

        const content = Localize.t('events.itWasInstructedToDeliverByCashingCheck', {
            amount: amount.value,
            currency: NormalizeCurrencyCode(amount.currency),
            checkId: tx.CheckID,
        });

        return content;
    };

    renderCheckCancel = () => {
        const { tx } = this.state;

        return Localize.t('events.theTransactionWillCancelCheckWithId', { checkId: tx.CheckID });
    };

    renderDepositPreauth = () => {
        const { tx } = this.state;

        if (tx.Authorize) {
            return Localize.t('events.itAuthorizesSendingPaymentsToThisAccount', { address: tx.Authorize });
        }

        return Localize.t('events.itRemovesAuthorizesSendingPaymentsToThisAccount', { address: tx.Unauthorize });
    };

    renderTrustSet = () => {
        const { tx } = this.state;

        if (tx.Limit === 0) {
            return Localize.t('events.itRemovedTrustLineCurrencyTo', {
                currency: NormalizeCurrencyCode(tx.Currency),
                issuer: tx.Issuer,
            });
        }

        return Localize.t('events.itEstablishesTrustLineTo', {
            limit: tx.Limit,
            currency: NormalizeCurrencyCode(tx.Currency),
            issuer: tx.Issuer,
            address: tx.Account.address,
        });
    };

    renderAccountSet = () => {
        const { tx } = this.state;

        let content = `This is an ${tx.Type} transaction`;

        if (
            isUndefined(tx.SetFlag) &&
            isUndefined(tx.ClearFlag) &&
            isUndefined(tx.Domain) &&
            isUndefined(tx.EmailHash) &&
            isUndefined(tx.MessageKey) &&
            isUndefined(tx.TransferRate)
        ) {
            return content;
        }

        if (tx.Domain !== undefined) {
            content += '\n';
            if (tx.Domain === '') {
                content += Localize.t('events.itRemovesTheAccountDomain');
            } else {
                content += Localize.t('events.itSetsAccountDomainTo', { domain: tx.Domain });
            }
        }

        if (tx.EmailHash !== undefined) {
            content += '\n';
            if (tx.EmailHash === '') {
                content += Localize.t('events.itRemovesTheAccountEmailHash');
            } else {
                content += Localize.t('events.itSetsAccountEmailHashTo', { emailHash: tx.EmailHash });
            }
        }

        if (tx.MessageKey !== undefined) {
            content += '\n';
            if (tx.MessageKey === '') {
                content += Localize.t('events.itRemovesTheAccountMessageKey');
            } else {
                content += Localize.t('events.itSetsAccountMessageKeyTo', { messageKey: tx.MessageKey });
            }
        }

        if (tx.TransferRate !== undefined) {
            content += '\n';
            if (tx.MessageKey === '') {
                content += Localize.t('events.itRemovesTheAccountTransferRate');
            } else {
                content += Localize.t('events.itSetsAccountTransferRateTo', { transferRate: tx.TransferRate });
            }
        }

        if (tx.SetFlag !== undefined) {
            content += '\n';
            content += Localize.t('events.itSetsTheAccountFlag', { flag: tx.SetFlag });
        }

        if (tx.ClearFlag !== undefined) {
            content += '\n';
            content += Localize.t('events.itClearsTheAccountFlag', { flag: tx.ClearFlag });
        }

        return content;
    };

    renderDescription = () => {
        const { tx } = this.state;

        let content = '';

        switch (tx.Type) {
            case 'OfferCreate':
            case 'Offer':
                content += this.renderOfferCreate();
                break;
            case 'OfferCancel':
                content += this.renderOfferCancel();
                break;
            case 'Payment':
                content += this.renderPayment();
                break;
            case 'EscrowCreate':
            case 'Escrow':
                content += this.renderEscrowCreate();
                break;
            case 'EscrowFinish':
                content += this.renderEscrowFinish();
                break;
            case 'TrustSet':
                content += this.renderTrustSet();
                break;
            case 'CheckCreate':
            case 'Check':
                content += this.renderCheckCreate();
                break;
            case 'CheckCash':
                content += this.renderCheckCash();
                break;
            case 'CheckCancel':
                content += this.renderCheckCancel();
                break;
            case 'AccountDelete':
                content += this.renderAccountDelete();
                break;
            case 'DepositPreauth':
                content += this.renderDepositPreauth();
                break;
            case 'AccountSet':
                content += this.renderAccountSet();
                break;
            default:
                content += `This is a ${tx.Type} transaction`;
        }

        return (
            <>
                <Text style={[styles.labelText]}>{Localize.t('global.description')}</Text>
                <Text style={[styles.contentText]}>{content}</Text>
            </>
        );
    };

    renderMemos = () => {
        const { tx } = this.state;
        const { showMemo, scamAlert, incomingTx } = this.state;

        // if no memo or the transaction contain xApp memo return null
        if (!tx.Memos) return null;

        // check for xapp memo
        // only for payments and incoming transactions
        if (incomingTx && !scamAlert) {
            const xAppIdentifier = tx.getXappIdentifier();
            if (xAppIdentifier) {
                return (
                    <View style={styles.memoContainer}>
                        <Button
                            rounded
                            block
                            label={Localize.t('global.openXApp')}
                            secondary
                            // eslint-disable-next-line react/jsx-no-bind
                            onPress={this.onActionButtonPress.bind(null, 'OpenXapp')}
                        />
                    </View>
                );
            }
        }

        return (
            <View style={styles.memoContainer}>
                <View style={[AppStyles.row]}>
                    <Icon name="IconFileText" size={18} />
                    <Text style={[styles.labelText]}> {Localize.t('global.memo')}</Text>
                </View>

                {showMemo ? (
                    <ReadMore
                        numberOfLines={2}
                        textStyle={[styles.memoText, AppStyles.textCenterAligned, scamAlert && AppStyles.colorRed]}
                    >
                        {tx.Memos.map((m) => {
                            if (m.type === 'text/plain' || !m.type) {
                                return m.data;
                            }

                            return `${m.type}: ${m.data}`;
                        })}
                    </ReadMore>
                ) : (
                    <TouchableOpacity
                        onPress={() => {
                            this.setState({ showMemo: true });
                        }}
                    >
                        <Text style={[styles.contentText, AppStyles.colorRed]}>{Localize.t('events.showMemo')}</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    renderFee = () => {
        const { tx } = this.state;

        // ignore if it's ledger object
        if (tx.ClassName !== 'Transaction') {
            return null;
        }

        return (
            <>
                <Text style={[styles.labelText]}>{Localize.t('events.transactionCost')}</Text>
                <Text style={[styles.contentText]}>
                    {Localize.t('events.sendingThisTransactionConsumed', { fee: tx.Fee })}
                </Text>
            </>
        );
    };

    renderTransactionId = () => {
        const { tx } = this.state;

        if (tx.ClassName === 'LedgerObject') {
            return (
                <>
                    <Text style={[styles.labelText]}>{Localize.t('events.ledgerIndex')}</Text>
                    <Text selectable style={[styles.hashText]}>
                        {tx.Index}
                    </Text>
                </>
            );
        }
        return (
            <>
                <Text style={[styles.labelText]}>{Localize.t('events.transactionId')}</Text>
                <Text selectable style={[styles.hashText]}>
                    {tx.Hash}
                </Text>
            </>
        );
    };

    renderHeader = () => {
        const { tx } = this.state;

        return (
            <View style={styles.headerContainer}>
                <Text style={AppStyles.h5}>{this.getLabel()}</Text>
                <Spacer />
                <Badge size="medium" type={tx.ClassName === 'Transaction' ? 'success' : 'planned'} />
                <Spacer />
                <Text style={[styles.dateText]}>{moment(tx.Date).format('LLLL')}</Text>
            </View>
        );
    };

    renderAmount = () => {
        const { account } = this.props;
        const { tx, incomingTx, balanceChanges } = this.state;

        let shouldShowAmount = true;

        const props = {
            icon: incomingTx ? 'IconCornerRightDown' : 'IconCornerLeftUp',
            color: {},
            prefix: '',
            value: 0,
            currency: '',
        };

        switch (tx.Type) {
            case 'Payment':
                if ([tx.Account.address, tx.Destination?.address].indexOf(account.address) === -1) {
                    if (balanceChanges?.received) {
                        Object.assign(props, {
                            color: styles.incomingColor,
                            value: balanceChanges.received.value,
                            currency: balanceChanges.received.currency,
                            icon: 'IconCornerRightDown',
                        });
                    } else {
                        Object.assign(props, {
                            color: styles.outgoingColor,
                            prefix: '-',
                            value: tx.Amount.value,
                            currency: tx.Amount.currency,
                        });
                    }
                } else {
                    Object.assign(props, {
                        color: incomingTx ? styles.incomingColor : styles.outgoingColor,
                        prefix: incomingTx ? '' : '-',
                        value: tx.Amount.value,
                        currency: tx.Amount.currency,
                    });
                }

                break;
            case 'AccountDelete': {
                Object.assign(props, {
                    color: incomingTx ? styles.incomingColor : styles.outgoingColor,
                    prefix: incomingTx ? '' : '-',
                    value: tx.Amount.value,
                    currency: tx.Amount.currency,
                });
                break;
            }
            case 'EscrowCreate':
            case 'Escrow':
                Object.assign(props, {
                    color: incomingTx ? styles.orangeColor : styles.outgoingColor,
                    prefix: '-',
                    value: tx.Amount.value,
                    currency: tx.Amount.currency,
                });
                break;
            case 'EscrowFinish':
                Object.assign(props, {
                    color: incomingTx ? styles.orangeColor : styles.naturalColor,
                    icon: 'IconCornerRightDown',
                    value: tx.Amount.value,
                    currency: tx.Amount.currency,
                });
                break;
            case 'CheckCreate':
            case 'Check':
                Object.assign(props, {
                    color: styles.naturalColor,
                    icon: 'IconCornerRightDown',
                    value: tx.SendMax.value,
                    currency: tx.SendMax.currency,
                });
                break;
            case 'CheckCash': {
                const amount = tx.Amount || tx.DeliverMin;
                const incoming = tx.Account.address === account.address;

                Object.assign(props, {
                    color: incoming ? styles.incomingColor : styles.outgoingColor,
                    prefix: incoming ? '' : '-',
                    value: amount.value,
                    currency: amount.currency,
                });
                break;
            }
            case 'OfferCreate':
            case 'Offer': {
                if (tx.Executed) {
                    const takerPaid = tx.TakerPaid(account.address);
                    Object.assign(props, {
                        color: styles.incomingColor,
                        icon: 'IconCornerRightDown',
                        value: takerPaid.value,
                        currency: takerPaid.currency,
                    });
                } else {
                    Object.assign(props, {
                        color: styles.naturalColor,
                        icon: 'IconCornerRightDown',
                        value: tx.TakerPays.value,
                        currency: tx.TakerPays.currency,
                    });
                }

                break;
            }
            default:
                shouldShowAmount = false;
                break;
        }

        if (!shouldShowAmount) {
            return null;
        }

        if (tx.Type === 'OfferCreate') {
            let takerGets;

            if (tx.Executed) {
                takerGets = tx.TakerGot(account.address);
            } else {
                takerGets = tx.TakerGets;
            }

            return (
                <View style={styles.amountHeaderContainer}>
                    <View style={[AppStyles.row, styles.amountContainerSmall]}>
                        <AmountText
                            value={takerGets.value}
                            currency={takerGets.currency}
                            style={[styles.amountTextSmall]}
                        />
                    </View>

                    <Spacer />
                    <Icon size={20} style={AppStyles.imgColorGreyBlack} name="IconSwitchAccount" />
                    <Spacer />

                    <View style={[AppStyles.row, styles.amountContainer]}>
                        {/*
                    // @ts-ignore */}
                        <Icon name={props.icon} size={27} style={[props.color, AppStyles.marginRightSml]} />
                        <AmountText
                            value={props.value}
                            currency={props.currency}
                            prefix={props.prefix}
                            style={[styles.amountText, props.color]}
                        />
                    </View>
                </View>
            );
        }

        if (tx.Type === 'Payment') {
            if ([tx.Account.address, tx.Destination?.address].indexOf(account.address) === -1) {
                if (balanceChanges?.sent) {
                    return (
                        <View style={styles.amountHeaderContainer}>
                            <View style={[AppStyles.row, styles.amountContainerSmall]}>
                                <AmountText
                                    value={balanceChanges.sent.value}
                                    currency={balanceChanges.sent.currency}
                                    style={[styles.amountTextSmall]}
                                />
                            </View>

                            <Spacer />
                            <Icon size={20} style={AppStyles.imgColorGreyBlack} name="IconSwitchAccount" />
                            <Spacer />

                            <View style={[AppStyles.row, styles.amountContainer]}>
                                {/*
                        // @ts-ignore */}
                                <Icon name={props.icon} size={27} style={[props.color, AppStyles.marginRightSml]} />
                                <AmountText
                                    value={props.value}
                                    currency={props.currency}
                                    prefix={props.prefix}
                                    style={[styles.amountText, props.color]}
                                />
                            </View>
                        </View>
                    );
                }
            }
        }

        if (tx.Type === 'OfferCreate') {
            const takerGot = tx.TakerGot(account.address);

            return (
                <View style={styles.amountHeaderContainer}>
                    <View style={[AppStyles.row, styles.amountContainerSmall]}>
                        <AmountText
                            value={takerGot.value}
                            currency={takerGot.currency}
                            style={[styles.amountTextSmall]}
                        />
                    </View>

                    <Spacer />
                    <Icon size={20} style={AppStyles.imgColorGreyBlack} name="IconSwitchAccount" />
                    <Spacer />

                    <View style={[AppStyles.row, styles.amountContainer]}>
                        {/*
                    // @ts-ignore */}
                        <Icon name={props.icon} size={27} style={[props.color, AppStyles.marginRightSml]} />
                        <AmountText
                            value={props.value}
                            currency={props.currency}
                            prefix={props.prefix}
                            style={[styles.amountText, props.color]}
                        />
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.amountHeaderContainer}>
                <View style={[AppStyles.row, styles.amountContainer]}>
                    {/*
                        // @ts-ignore */}
                    <Icon name={props.icon} size={27} style={[props.color, AppStyles.marginRightSml]} />
                    <AmountText
                        value={props.value}
                        currency={props.currency}
                        prefix={props.prefix}
                        style={[styles.amountText, props.color]}
                    />
                </View>
            </View>
        );
    };

    renderActionButtons = () => {
        const { account } = this.props;
        const { tx, incomingTx, spendableAccounts } = this.state;

        // just return is the account is not an spendable account
        if (!find(spendableAccounts, { address: account.address })) {
            return null;
        }

        const actionButtons = [];

        switch (tx.Type) {
            case 'Payment':
                if ([tx.Account.address, tx.Destination?.address].indexOf(account.address) > -1) {
                    const label = incomingTx ? Localize.t('events.returnPayment') : Localize.t('events.newPayment');
                    actionButtons.push({
                        label,
                        type: 'Payment',
                        secondary: false,
                    });
                }
                break;
            case 'Offer':
                actionButtons.push({
                    label: Localize.t('events.cancelOffer'),
                    type: 'OfferCancel',
                    secondary: true,
                });
                break;
            case 'Escrow':
                if (tx.isExpired) {
                    actionButtons.push({
                        label: Localize.t('events.cancelEscrow'),
                        type: 'EscrowCancel',
                        secondary: true,
                    });
                }

                if (tx.canFinish) {
                    actionButtons.push({
                        label: Localize.t('events.finishEscrow'),
                        type: 'EscrowFinish',
                        secondary: false,
                    });
                }

                break;
            case 'Check':
                if (tx.Destination.address === account.address && !tx.isExpired) {
                    actionButtons.push({
                        label: Localize.t('events.cashCheck'),
                        type: 'CheckCash',
                        secondary: false,
                    });
                }
                if (!tx.isExpired) {
                    actionButtons.push({
                        label: Localize.t('events.cancelCheck'),
                        type: 'CheckCancel',
                        secondary: true,
                    });
                }

                break;
            default:
                break;
        }

        if (!isEmpty(actionButtons)) {
            return (
                <View style={styles.actionButtonsContainer}>
                    {actionButtons.map((e, i) => (
                        <Fragment key={`actionButton-${i}`}>
                            <Button
                                rounded
                                block
                                secondary={e.secondary}
                                label={e.label}
                                // eslint-disable-next-line react/jsx-no-bind
                                onPress={this.onActionButtonPress.bind(null, e.type)}
                            />
                            <Spacer size={i + 1 < actionButtons.length ? 15 : 0} />
                        </Fragment>
                    ))}
                </View>
            );
        }

        return null;
    };

    renderSourceDestination = () => {
        const { account } = this.props;
        const { tx, partiesDetails, incomingTx, balanceChanges } = this.state;

        let from = {
            address: tx.Account.address,
        } as any;
        let to = {
            address: tx.Destination?.address,
        } as any;

        let through;

        if (incomingTx) {
            from = Object.assign(from, partiesDetails);
            if (to.address === account.address) {
                to = Object.assign(to, {
                    name: account.label,
                    source: 'internal:accounts',
                });
            }
        } else {
            to = Object.assign(to, partiesDetails);
            if (from.address === account.address) {
                from = Object.assign(from, {
                    name: account.label,
                    source: 'internal:accounts',
                });
            }
        }

        // incoming trustline
        if (tx.Type === 'TrustSet' && tx.Issuer === account.address) {
            from = { address: tx.Account.address, ...partiesDetails };
            to = {
                address: account.address,
                name: account.label,
                source: 'internal:accounts',
            };
        }

        // incoming trustline
        if (tx.Type === 'CheckCash' && tx.Account.address !== account.address) {
            to = { address: tx.Account.address, ...partiesDetails };
            from = {
                address: account.address,
                name: account.label,
                source: 'internal:accounts',
            };
        }

        // 3rd party consuming own offer
        if (tx.Type === 'Payment') {
            if ([tx.Account.address, tx.Destination?.address].indexOf(account.address) === -1) {
                if (balanceChanges?.sent || balanceChanges?.received) {
                    from = { address: tx.Account.address };
                    to = { address: tx.Destination?.address };
                    through = { address: account.address, name: account.label, source: 'internal:accounts' };
                }
            }
        }

        if (!to.address) {
            return (
                <View style={styles.extraHeaderContainer}>
                    <Text style={[styles.labelText]}>{Localize.t('global.from')}</Text>
                    <RecipientElement recipient={from} />
                </View>
            );
        }

        return (
            <View style={styles.extraHeaderContainer}>
                <Text style={[styles.labelText]}>{Localize.t('global.from')}</Text>
                <RecipientElement
                    recipient={from}
                    showMoreButton={from.source !== 'internal:accounts'}
                    onMorePress={from.source !== 'internal:accounts' && this.showRecipientMenu}
                />
                {!!through && (
                    <>
                        <Icon name="IconArrowDown" style={AppStyles.centerSelf} />
                        <Text style={[styles.labelText]}>{Localize.t('events.throughOfferBy')}</Text>
                        <RecipientElement
                            recipient={through}
                            onMorePress={to.source !== 'internal:accounts' && this.showRecipientMenu}
                        />
                    </>
                )}
                <Icon name="IconArrowDown" style={AppStyles.centerSelf} />
                <Text style={[styles.labelText]}>{Localize.t('global.to')}</Text>
                <RecipientElement
                    recipient={to}
                    showMoreButton={to.source !== 'internal:accounts'}
                    onMorePress={to.source !== 'internal:accounts' && this.showRecipientMenu}
                />
            </View>
        );
    };

    renderLoading = () => {
        return (
            <ImageBackground source={Images.BackgroundShapes} style={[AppStyles.container, AppStyles.paddingSml]}>
                <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                    <ActivityIndicator color={AppColors.blue} size="large" />
                    <Spacer />
                    <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>{Localize.t('global.pleaseWait')}</Text>
                </View>
            </ImageBackground>
        );
    };

    render() {
        const { asModal } = this.props;
        const { isLoading, scamAlert } = this.state;

        if (isLoading) {
            return this.renderLoading();
        }

        return (
            <View style={AppStyles.container}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: this.close,
                    }}
                    centerComponent={{ text: Localize.t('events.transactionDetails') }}
                    rightComponent={{
                        icon: 'IconMoreHorizontal',
                        onPress: this.showMenu,
                    }}
                    // eslint-disable-next-line react-native/no-inline-styles
                    containerStyle={asModal && { paddingTop: 0 }}
                />

                {scamAlert && (
                    <View style={styles.dangerHeader}>
                        <Text style={[AppStyles.h4, AppStyles.colorWhite]}>{Localize.t('global.fraudAlert')}</Text>
                        <Text style={[AppStyles.subtext, AppStyles.textCenterAligned, AppStyles.colorWhite]}>
                            {Localize.t(
                                'global.thisAccountIsReportedAsScamOrFraudulentAddressPleaseProceedWithCaution',
                            )}
                        </Text>
                    </View>
                )}

                <ScrollView testID="transaction-details-view">
                    {this.renderHeader()}
                    {this.renderAmount()}
                    {this.renderMemos()}
                    {this.renderSourceDestination()}
                    {this.renderActionButtons()}
                    <View style={styles.detailsContainer}>
                        {this.renderTransactionId()}
                        <Spacer size={30} />
                        {this.renderDescription()}
                        <Spacer size={30} />
                        {this.renderFee()}
                        <Spacer size={30} />
                        {this.renderStatus()}
                    </View>

                    {/* renderFlags(tx); */}
                </ScrollView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default TransactionDetailsView;
