/**
 * Transaction Details screen
 */
import { find, get, isEmpty, isUndefined } from 'lodash';
import moment from 'moment-timezone';
import { Navigation, OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import React, { Component, Fragment } from 'react';
import {
    Alert,
    ImageBackground,
    InteractionManager,
    Linking,
    Platform,
    ScrollView,
    Share,
    Text,
    View,
} from 'react-native';

import { BackendService, LedgerService, StyleService } from '@services';

import { AccountSchema } from '@store/schemas/latest';
import AccountRepository from '@store/repositories/account';

import { Payload, XAppOrigin } from '@common/libs/payload';

import { LedgerObjectTypes, TransactionTypes } from '@common/libs/ledger/types';
import { BaseTransaction } from '@common/libs/ledger/transactions';
import { Transactions } from '@common/libs/ledger/transactions/types';

import { BaseLedgerObject } from '@common/libs/ledger/objects';
import { LedgerObjects } from '@common/libs/ledger/objects/types';

import { OfferStatus } from '@common/libs/ledger/parser/types';
import { TransactionFactory } from '@common/libs/ledger/factory';
import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';

import { NormalizeCurrencyCode, XRPLValueToNFT } from '@common/utils/amount';
import { AppScreens } from '@common/constants';

import { ActionSheet, Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { GetTransactionLink } from '@common/utils/explorer';

import { AccountNameType, getAccountName } from '@common/helpers/resolver';

import {
    AmountText,
    Badge,
    Button,
    Header,
    Icon,
    InfoMessage,
    LoadingIndicator,
    ReadMore,
    Spacer,
    TouchableDebounce,
} from '@components/General';
import { NFTokenElement, RecipientElement } from '@components/Modules';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    tx?: Transactions | LedgerObjects;
    hash?: string;
    account: AccountSchema;
    asModal?: boolean;
}

export interface State {
    tx: Transactions | LedgerObjects;
    partiesDetails: AccountNameType;
    spendableAccounts: AccountSchema[];
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
    private closeTimeout: any;

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
            spendableAccounts: AccountRepository.getSpendableAccounts(),
            balanceChanges: undefined,
            incomingTx: props.tx?.Account && props.tx?.Account?.address !== props.account.address,
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

        if (this.closeTimeout) clearTimeout(this.closeTimeout);
    }

    componentDidAppear() {
        if (this.forceFetchDetails) {
            this.forceFetchDetails = false;

            InteractionManager.runAfterInteractions(this.setPartiesDetails);
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

                // separate transaction meta
                const { meta } = resp;

                // cleanup
                delete resp.meta;
                // eslint-disable-next-line no-underscore-dangle
                delete resp.__replyMs;
                // eslint-disable-next-line no-underscore-dangle
                delete resp.__command;
                delete resp.inLedger;

                const tx = TransactionFactory.fromLedger({ tx: resp, meta });

                this.setState(
                    {
                        tx,
                        isLoading: false,
                        incomingTx: tx?.Account?.address !== account.address,
                    },
                    this.loadDetails,
                );
            })
            .catch(() => {
                Toast(Localize.t('events.unableToLoadTheTransaction'));
                this.closeTimeout = setTimeout(this.close, 2000);
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

        if (
            tx instanceof BaseTransaction &&
            [
                TransactionTypes.Payment,
                TransactionTypes.PaymentChannelClaim,
                TransactionTypes.PaymentChannelCreate,
                TransactionTypes.PaymentChannelFund,
                TransactionTypes.NFTokenAcceptOffer,
            ].includes(tx.Type)
        ) {
            this.setState({
                balanceChanges: tx.BalanceChange(account.address),
            });
        }
    };

    checkForScamAlert = async () => {
        const { incomingTx, tx } = this.state;

        if (incomingTx) {
            BackendService.getAccountAdvisory(tx.Account.address)
                .then((accountAdvisory: any) => {
                    if (accountAdvisory && accountAdvisory.danger !== 'UNKNOWN') {
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
            case TransactionTypes.Payment:
                if (incomingTx) {
                    address = tx.Account.address;
                } else {
                    address = tx.Destination.address;
                    tag = tx.Destination.tag;
                }
                break;
            case TransactionTypes.AccountDelete:
                if (incomingTx) {
                    address = tx.Account.address;
                } else {
                    address = tx.Destination.address;
                    tag = tx.Destination.tag;
                }
                break;
            case TransactionTypes.TrustSet:
                // incoming trustline
                if (tx.Issuer === account.address) {
                    address = tx.Account.address;
                } else {
                    address = tx.Issuer;
                }
                break;
            case TransactionTypes.EscrowCreate:
            case LedgerObjectTypes.Escrow:
                if (incomingTx) {
                    address = tx.Account.address;
                } else {
                    address = tx.Destination.address;
                    tag = tx.Destination.tag;
                }
                break;
            case TransactionTypes.EscrowFinish:
                if (tx.Owner === account.address) {
                    address = tx.Destination.address;
                    tag = tx.Destination.tag;
                } else {
                    address = tx.Owner;
                }
                break;
            case TransactionTypes.DepositPreauth:
                address = tx.Authorize || tx.Unauthorize;
                break;
            case TransactionTypes.AccountSet:
                if (tx.Account.address !== account.address) {
                    address = tx.Account.address;
                }
                break;
            case TransactionTypes.SetRegularKey:
                address = tx.RegularKey;
                break;
            case TransactionTypes.CheckCreate:
            case LedgerObjectTypes.Check:
                if (incomingTx) {
                    address = tx.Account.address;
                } else {
                    address = tx.Destination.address;
                    tag = tx.Destination.tag;
                }
                break;
            case TransactionTypes.CheckCash:
                if (!incomingTx && tx.Check) {
                    address = tx.Check.Account.address;
                } else {
                    address = tx.Account.address;
                }
                break;
            case TransactionTypes.CheckCancel:
                if (incomingTx) {
                    address = tx.Account.address;
                }
                break;
            case TransactionTypes.OfferCreate:
                if (incomingTx) {
                    address = tx.Account.address;
                }
                break;
            case TransactionTypes.PaymentChannelCreate:
            case LedgerObjectTypes.PayChannel:
                if (incomingTx) {
                    address = tx.Account.address;
                } else {
                    address = tx.Destination.address;
                    tag = tx.Destination.tag;
                }
                break;
            case TransactionTypes.PaymentChannelFund:
            case TransactionTypes.PaymentChannelClaim:
                if (incomingTx) {
                    address = tx.Account.address;
                }
                break;
            case TransactionTypes.NFTokenMint:
                if (tx.Issuer) {
                    address = tx.Issuer;
                }
                break;
            case TransactionTypes.NFTokenBurn:
                if (incomingTx) {
                    address = tx.Account.address;
                }
                break;
            case TransactionTypes.NFTokenCreateOffer:
                if (incomingTx) {
                    address = tx.Account.address;
                } else if (tx.Destination) {
                    address = tx.Destination.address;
                }
                break;
            case TransactionTypes.NFTokenAcceptOffer:
                if (incomingTx) {
                    address = tx.Account.address;
                } else if (tx.Offer) {
                    address = tx.Offer.Owner;
                }
                break;
            case LedgerObjectTypes.NFTokenOffer:
                if (tx.Owner !== account.address) {
                    address = tx.Owner;
                } else if (tx.Destination && tx.Destination.address !== account.address) {
                    address = tx.Destination.address;
                }
                break;
            default:
                break;
        }

        // no parties detail
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
        const { tx } = this.state;
        const hash = tx instanceof BaseTransaction ? tx.Hash : tx.PreviousTxnID;
        return GetTransactionLink(hash);
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
        if (url) {
            Linking.openURL(url).catch(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('global.cannotOpenLink'));
            });
        }
    };

    showMenu = () => {
        const { tx } = this.state;

        // transaction still loading
        if (!tx) {
            return;
        }

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
            StyleService.isDarkMode() ? 'dark' : 'light',
        );
    };

    showRecipientMenu = (recipient: any) => {
        if (!recipient) {
            return;
        }
        Navigator.showOverlay(AppScreens.Overlay.RecipientMenu, { recipient });
    };

    getLabel = () => {
        const { account } = this.props;
        const { balanceChanges, tx } = this.state;

        switch (tx.Type) {
            case TransactionTypes.Payment:
                if ([tx.Account.address, tx.Destination?.address].indexOf(account.address) === -1) {
                    if (balanceChanges?.sent || balanceChanges?.received) {
                        return Localize.t('events.exchangedAssets');
                    }
                }
                return Localize.t('global.payment');

            case TransactionTypes.TrustSet: {
                // incoming TrustLine
                if (tx.Account.address !== account.address) {
                    if (tx.Limit === 0) {
                        return Localize.t('events.incomingTrustLineRemoved');
                    }
                    return Localize.t('events.incomingTrustLineAdded');
                }
                const ownerCountChange = tx.OwnerCountChange(account.address);
                if (ownerCountChange) {
                    if (ownerCountChange.action === 'INC') {
                        return Localize.t('events.addedATrustLine');
                    }
                    return Localize.t('events.removedATrustLine');
                }
                return Localize.t('events.updatedATrustLine');
            }
            case TransactionTypes.EscrowCreate:
                return Localize.t('events.createEscrow');
            case TransactionTypes.EscrowFinish:
                return Localize.t('events.finishEscrow');
            case TransactionTypes.EscrowCancel:
                return Localize.t('events.cancelEscrow');
            case TransactionTypes.AccountSet:
                if (tx.isNoOperation() && tx.isCancelTicket()) {
                    return Localize.t('events.cancelTicket');
                }
                return Localize.t('events.accountSettings');
            case TransactionTypes.SignerListSet:
                return Localize.t('events.setSignerList');
            case TransactionTypes.OfferCreate:
                if ([OfferStatus.FILLED, OfferStatus.PARTIALLY_FILLED].includes(tx.GetOfferStatus(account.address))) {
                    return Localize.t('events.exchangedAssets');
                }
                return Localize.t('events.createOffer');
            case TransactionTypes.OfferCancel:
                return Localize.t('events.cancelOffer');
            case TransactionTypes.AccountDelete:
                return Localize.t('events.deleteAccount');
            case TransactionTypes.SetRegularKey:
                if (tx.RegularKey) {
                    return Localize.t('events.setRegularKey');
                }
                return Localize.t('events.removeRegularKey');
            case TransactionTypes.DepositPreauth:
                if (tx.Authorize) {
                    return Localize.t('events.authorizeDeposit');
                }
                return Localize.t('events.unauthorizeDeposit');
            case TransactionTypes.CheckCreate:
                return Localize.t('events.createCheck');
            case TransactionTypes.CheckCash:
                return Localize.t('events.cashCheck');
            case TransactionTypes.CheckCancel:
                return Localize.t('events.cancelCheck');
            case TransactionTypes.TicketCreate:
                return Localize.t('events.createTicket');
            case TransactionTypes.PaymentChannelCreate:
                return Localize.t('events.createPaymentChannel');
            case TransactionTypes.PaymentChannelClaim:
                return Localize.t('events.claimPaymentChannel');
            case TransactionTypes.PaymentChannelFund:
                return Localize.t('events.fundPaymentChannel');
            case TransactionTypes.NFTokenMint:
                return Localize.t('events.mintNFT');
            case TransactionTypes.NFTokenBurn:
                return Localize.t('events.burnNFT');
            case TransactionTypes.NFTokenCreateOffer:
                return Localize.t('events.createNFTOffer');
            case TransactionTypes.NFTokenCancelOffer:
                return Localize.t('events.cancelNFTOffer');
            case TransactionTypes.NFTokenAcceptOffer:
                return Localize.t('events.acceptNFTOffer');
            case LedgerObjectTypes.Offer:
                return Localize.t('global.offer');
            case LedgerObjectTypes.Escrow:
                return Localize.t('global.escrow');
            case LedgerObjectTypes.Check:
                return Localize.t('global.check');
            case LedgerObjectTypes.Ticket:
                return Localize.t('global.ticket');
            case LedgerObjectTypes.PayChannel:
                return Localize.t('events.paymentChannel');
            case LedgerObjectTypes.NFTokenOffer:
                if (tx.Owner !== account.address) {
                    if (tx.Flags.SellToken) {
                        return Localize.t('events.nftOfferedToYou');
                    }
                    return Localize.t('events.offerOnYouNFT');
                }
                if (tx.Flags.SellToken) {
                    return Localize.t('events.sellNFToken');
                }
                return Localize.t('events.buyNFToken');
            default:
                // @ts-ignore
                return tx.Type;
        }
    };

    onActionButtonPress = async (type: string) => {
        const { tx, incomingTx } = this.state;
        const { account, asModal } = this.props;

        // no action button show be available when opening details as modal
        if (asModal) {
            return;
        }

        // open the XApp
        if (type === 'OpenXapp' && tx instanceof BaseTransaction) {
            Navigator.showModal(
                AppScreens.Modal.XAppBrowser,
                {
                    identifier: tx.getXappIdentifier(),
                    origin: XAppOrigin.TRANSACTION_MEMO,
                    originData: { txid: tx.Hash },
                },
                {
                    modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                    modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                },
            );
            return;
        }

        // handle return or new payment process
        if (type === 'Payment' && tx.Type === TransactionTypes.Payment) {
            // remove return feature
            if (incomingTx) {
                return;
            }

            // create new payment
            const params = {
                scanResult: {
                    to: incomingTx ? tx.Account.address : tx.Destination.address,
                    tag: incomingTx ? tx.Account.tag : tx.Destination.tag,
                },
            };

            // prefill the currency
            let currency;

            if (tx.DeliveredAmount.currency === 'XRP') {
                currency = 'XRP';
            } else {
                currency = account.lines.find(
                    (l: any) =>
                        l.currency.currency === tx.DeliveredAmount.currency &&
                        l.currency.issuer === tx.DeliveredAmount.issuer &&
                        l.balance > 0,
                );
            }

            // if no currency found just return
            if (!currency) {
                return;
            }

            // assign currency to the params
            Object.assign(params, { currency });

            // got to Payment screen
            Navigator.push(AppScreens.Transaction.Payment, params);
            return;
        }

        // when the Escrow is eligible for release, we'll leave out the button if an escrow has a condition,
        // in which case we will show a message and return
        if (type === 'EscrowFinish' && tx.Type === TransactionTypes.EscrowFinish && tx.Condition) {
            Navigator.showAlertModal({
                type: 'warning',
                text: Localize.t('events.pleaseReleaseThisEscrowUsingTheToolUsedToCreateTheEscrow'),
                buttons: [
                    {
                        text: Localize.t('global.ok'),
                        onPress: () => {},
                        light: false,
                    },
                ],
            });
            return;
        }

        let transaction = {};

        switch (type) {
            case 'OfferCancel':
                Object.assign(transaction, {
                    TransactionType: 'OfferCancel',
                    OfferSequence: tx.Sequence,
                });
                break;
            case 'NFTokenCancelOffer':
                Object.assign(transaction, {
                    TransactionType: 'NFTokenCancelOffer',
                    // @ts-ignore
                    NFTokenOffers: [tx.Index],
                });
                break;
            case 'NFTokenAcceptOffer':
                Object.assign(transaction, {
                    TransactionType: 'NFTokenAcceptOffer',
                });
                if (tx.Flags.SellToken) {
                    Object.assign(transaction, {
                        // @ts-ignore
                        NFTokenSellOffer: tx.Index,
                    });
                } else {
                    Object.assign(transaction, {
                        // @ts-ignore
                        NFTokenBuyOffer: tx.Index,
                    });
                }
                break;
            case 'CheckCancel':
                if (tx.Type === LedgerObjectTypes.Check) {
                    Object.assign(transaction, {
                        TransactionType: 'CheckCancel',
                        CheckID: tx.Index,
                    });
                }
                break;
            case 'CheckCash':
                if (tx.Type === LedgerObjectTypes.Check) {
                    Object.assign(transaction, {
                        TransactionType: 'CheckCash',
                        CheckID: tx.Index,
                    });
                }
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
            case 'CancelTicket':
                if (tx.Type === LedgerObjectTypes.Ticket) {
                    Object.assign(transaction, {
                        TransactionType: 'AccountSet',
                        Sequence: 0,
                        TicketSequence: tx.TicketSequence,
                    });
                }
                break;
            default:
                transaction = undefined;
                break;
        }

        if (!isEmpty(transaction)) {
            // assign current account for crafted transaction
            Object.assign(transaction, { Account: account.address });

            // generate payload
            const payload = await Payload.build(transaction);

            Navigator.showModal(
                AppScreens.Modal.ReviewTransaction,
                {
                    payload,
                    onResolve: Navigator.pop,
                },
                { modalPresentationStyle: 'fullScreen' },
            );
        }
    };

    showBalanceExplain = () => {
        const { account } = this.props;

        // don't show the explain screen when account is not activated
        if (account.balance === 0) {
            return;
        }

        Navigator.showOverlay(AppScreens.Overlay.ExplainBalance, { account });
    };

    renderStatus = () => {
        const { tx } = this.state;

        // ignore if it's ledger object
        if (!(tx instanceof BaseTransaction)) {
            return null;
        }

        return (
            <View style={styles.detailContainer}>
                <Text style={[styles.labelText]}>{Localize.t('global.status')}</Text>
                <Text style={[styles.contentText]}>
                    {Localize.t('events.thisTransactionWasSuccessful')} {Localize.t('events.andValidatedInLedger')}
                    <Text style={AppStyles.monoBold}> {tx.LedgerIndex} </Text>
                    {Localize.t('events.onDate')}
                    <Text style={AppStyles.monoBold}> {moment(tx.Date).format('LLLL')}</Text>
                </Text>
            </View>
        );
    };

    renderOfferCreate = (
        tx:
            | Extract<Transactions, { Type: TransactionTypes.OfferCreate }>
            | Extract<LedgerObjects, { Type: LedgerObjectTypes.Offer }>,
    ): string => {
        let content = '';

        const takerGetsNFT = XRPLValueToNFT(tx.TakerGets.value);
        const takerPaysNFT = XRPLValueToNFT(tx.TakerPays.value);

        content = Localize.t('events.offerTransactionExplain', {
            address: tx.Account.address,
            takerGetsValue: takerGetsNFT || tx.TakerGets.value,
            takerGetsCurrency: NormalizeCurrencyCode(tx.TakerGets.currency),
            takerPaysValue: takerPaysNFT || tx.TakerPays.value,
            takerPaysCurrency: NormalizeCurrencyCode(tx.TakerPays.currency),
        });

        // hide showing exchange rate if NFT
        if (!takerPaysNFT && !takerGetsNFT) {
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
        }

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

    renderOfferCancel = (tx: Extract<Transactions, { Type: TransactionTypes.OfferCancel }>): string => {
        return Localize.t('events.theTransactionWillCancelOffer', {
            address: tx.Account.address,
            offerSequence: tx.OfferSequence,
        });
    };

    renderEscrowCreate = (
        tx:
            | Extract<Transactions, { Type: TransactionTypes.EscrowCreate }>
            | Extract<LedgerObjects, { Type: LedgerObjectTypes.Escrow }>,
    ): string => {
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
        content += Localize.t('events.itEscrowedWithCurrency', {
            amount: tx.Amount.value,
            currency: tx.Amount.currency,
        });

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

    renderEscrowFinish = (tx: Extract<Transactions, { Type: TransactionTypes.EscrowFinish }>): string => {
        let content = Localize.t('events.escrowFinishExplain', {
            address: tx.Account.address,
            amount: tx.Amount.value,
            currency: tx.Amount.currency,
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

    renderPayment = (tx: Extract<Transactions, { Type: TransactionTypes.Payment }>): string => {
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

    renderAccountDelete = (tx: Extract<Transactions, { Type: TransactionTypes.AccountDelete }>): string => {
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

    renderCheckCreate = (
        tx:
            | Extract<Transactions, { Type: TransactionTypes.CheckCreate }>
            | Extract<LedgerObjects, { Type: LedgerObjectTypes.Check }>,
    ): string => {
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
            value: tx.SendMax.value,
            currency: NormalizeCurrencyCode(tx.SendMax.currency),
        });

        return content;
    };

    renderCheckCash = (tx: Extract<Transactions, { Type: TransactionTypes.CheckCash }>): string => {
        const amount = tx.Amount || tx.DeliverMin;

        return Localize.t('events.itWasInstructedToDeliverByCashingCheck', {
            address: tx.Check?.Destination.address || 'address',
            amount: amount.value,
            currency: NormalizeCurrencyCode(amount.currency),
            checkId: tx.CheckID,
        });
    };

    renderCheckCancel = (tx: Extract<Transactions, { Type: TransactionTypes.CheckCancel }>): string => {
        return Localize.t('events.theTransactionWillCancelCheckWithId', { checkId: tx.CheckID });
    };

    renderDepositPreauth = (tx: Extract<Transactions, { Type: TransactionTypes.DepositPreauth }>): string => {
        if (tx.Authorize) {
            return Localize.t('events.itAuthorizesSendingPaymentsToThisAccount', { address: tx.Authorize });
        }

        return Localize.t('events.itRemovesAuthorizesSendingPaymentsToThisAccount', { address: tx.Unauthorize });
    };

    renderTicketCreate = (tx: Extract<Transactions, { Type: TransactionTypes.TicketCreate }>): string => {
        let content = Localize.t('events.itCreatesTicketForThisAccount', { ticketCount: tx.TicketCount });
        content += '\n\n';
        content += Localize.t('events.createdTicketsSequence', { ticketsSequence: tx.TicketsSequence.join(', ') });
        return content;
    };

    renderTrustSet = (tx: Extract<Transactions, { Type: TransactionTypes.TrustSet }>) => {
        const { account } = this.props;

        const ownerCountChange = tx.OwnerCountChange(account.address);

        if (ownerCountChange && ownerCountChange.action === 'DEC') {
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

    renderSetRegularKey = (tx: Extract<Transactions, { Type: TransactionTypes.SetRegularKey }>): string => {
        let content = Localize.t('events.thisIsAnSetRegularKeyTransaction');
        content += '\n';
        if (tx.RegularKey) {
            content += Localize.t('events.itSetsAccountRegularKeyTo', { regularKey: tx.RegularKey });
        } else {
            content += Localize.t('events.itRemovesTheAccountRegularKey');
        }
        return content;
    };

    renderAccountSet = (tx: Extract<Transactions, { Type: TransactionTypes.AccountSet }>): string => {
        let content = Localize.t('events.thisIsAnAccountSetTransaction');

        if (tx.isNoOperation()) {
            content += '\n';
            if (tx.isCancelTicket()) {
                content += Localize.t('events.thisTransactionClearTicket', { ticketSequence: tx.TicketSequence });
            } else {
                content += Localize.t('events.thisTransactionDoesNotEffectAnyAccountSettings');
            }
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

        if (tx.NFTokenMinter !== undefined) {
            content += '\n';
            if (tx.NFTokenMinter === '') {
                content += Localize.t('events.itRemovesTheAccountMinter');
            } else {
                content += Localize.t('events.itSetsAccountMinterTo', { minter: tx.NFTokenMinter });
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

    renderPaymentChannelCreate = (
        tx:
            | Extract<Transactions, { Type: TransactionTypes.PaymentChannelCreate }>
            | Extract<LedgerObjects, { Type: LedgerObjectTypes.PayChannel }>,
    ): string => {
        let content = '';

        content += Localize.t(
            tx.Type === LedgerObjectTypes.PayChannel
                ? 'events.accountCreatedAPaymentChannelTo'
                : 'events.accountWillCreateAPaymentChannelTo',
            {
                account: tx.Account.address,
                destination: tx.Destination.address,
            },
        );
        content += '\n';

        content += Localize.t('events.theChannelIdIs', {
            channel: tx.Type === LedgerObjectTypes.PayChannel ? tx.Index : tx.ChannelID,
        });
        content += '\n';

        if (tx.Type === TransactionTypes.PaymentChannelCreate) {
            content += Localize.t('events.theChannelAmountIs', { amount: tx.Amount.value });
            content += '\n';
        }

        if (tx.Account.tag !== undefined) {
            content += Localize.t('events.theASourceTagIs', { tag: tx.Account.tag });
            content += ' \n';
        }

        if (tx.Destination.tag !== undefined) {
            content += Localize.t('events.theDestinationTagIs', { tag: tx.Destination.tag });
            content += ' \n';
        }

        if (tx.Type === LedgerObjectTypes.PayChannel && tx.Expiration) {
            content += Localize.t('events.theChannelExpiresAt', { cancelAfter: tx.Expiration });
            content += ' \n';
        }

        if (tx.SettleDelay) {
            content += Localize.t('events.theChannelHasASettlementDelay', { delay: tx.SettleDelay });
            content += ' \n';
        }

        if (tx.CancelAfter) {
            content += Localize.t('events.itCanBeCancelledAfter', { cancelAfter: tx.CancelAfter });
        }

        return content;
    };

    renderPaymentChannelFund = (tx: Extract<Transactions, { Type: TransactionTypes.PaymentChannelFund }>): string => {
        let content = '';

        content += Localize.t('events.itWillUpdateThePaymentChannel', { channel: tx.Channel });
        content += '\n';
        content += Localize.t('events.itWillIncreaseTheChannelAmount', { amount: tx.Amount.value });

        return content;
    };

    renderPaymentChannelClaim = (tx: Extract<Transactions, { Type: TransactionTypes.PaymentChannelClaim }>): string => {
        let content = '';

        content += Localize.t('events.itWillUpdateThePaymentChannel', { channel: tx.Channel });
        content += '\n';

        if (tx.Balance) {
            content += Localize.t('events.theChannelBalanceClaimedIs', { balance: tx.Balance.value });
            content += '\n';
        }

        if (tx.IsClosed) {
            content += Localize.t('events.thePaymentChannelWillBeClosed');
        }

        return content;
    };

    renderNFTokenMint = (tx: Extract<Transactions, { Type: TransactionTypes.NFTokenMint }>): string => {
        let content = '';

        content += Localize.t('events.theTokenIdIs', { tokenID: tx.NFTokenID });

        if (tx.TransferFee) {
            content += '\n';
            content += Localize.t('events.theTokenHasATransferFee', { transferFee: tx.TransferFee });
        }

        if (tx.NFTokenTaxon) {
            content += '\n';
            content += Localize.t('events.theTokenTaxonForThisTokenIs', { taxon: tx.NFTokenTaxon });
        }

        return content;
    };

    renderNFTokenBurn = (tx: Extract<Transactions, { Type: TransactionTypes.NFTokenBurn }>): string => {
        return Localize.t('events.nftokenBurnExplain', { tokenID: tx.NFTokenID });
    };

    renderNFTokenCreateOffer = (tx: Extract<Transactions, { Type: TransactionTypes.NFTokenCreateOffer }>): string => {
        let content = '';

        if (tx.Flags.SellToken) {
            content += Localize.t('events.nftOfferSellExplain', {
                address: tx.Account.address,
                tokenID: tx.NFTokenID,
                amount: tx.Amount.value,
                currency: NormalizeCurrencyCode(tx.Amount.currency),
            });
        } else {
            content += Localize.t('events.nftOfferBuyExplain', {
                address: tx.Account.address,
                tokenID: tx.NFTokenID,
                amount: tx.Amount.value,
                currency: NormalizeCurrencyCode(tx.Amount.currency),
            });
        }

        if (tx.Owner) {
            content += '\n';
            content += Localize.t('events.theNftOwnerIs', { address: tx.Owner });
        }

        if (tx.Destination) {
            content += '\n';
            content += Localize.t('events.thisNftOfferMayOnlyBeAcceptedBy', { address: tx.Destination.address });
        }

        if (tx.Expiration) {
            content += '\n';
            content += Localize.t('events.theOfferExpiresAtUnlessCanceledOrAccepted', {
                expiration: moment(tx.Expiration).format('LLLL'),
            });
        }

        return content;
    };

    renderNFTokenOffer = (tx: Extract<LedgerObjects, { Type: LedgerObjectTypes.NFTokenOffer }>): string => {
        let content = '';

        if (tx.Flags.SellToken) {
            content += Localize.t('events.nftOfferSellExplain', {
                address: tx.Owner,
                tokenID: tx.NFTokenID,
                amount: tx.Amount.value,
                currency: NormalizeCurrencyCode(tx.Amount.currency),
            });
        } else {
            content += Localize.t('events.nftOfferBuyExplain', {
                address: tx.Owner,
                tokenID: tx.NFTokenID,
                amount: tx.Amount.value,
                currency: NormalizeCurrencyCode(tx.Amount.currency),
            });
        }

        if (tx.Destination) {
            content += '\n';
            content += Localize.t('events.thisNftOfferMayOnlyBeAcceptedBy', { address: tx.Destination.address });
        }

        if (tx.Expiration) {
            content += '\n';
            content += Localize.t('events.theOfferExpiresAtUnlessCanceledOrAccepted', {
                expiration: moment(tx.Expiration).format('LLLL'),
            });
        }

        return content;
    };

    renderNFTokenCancelOffer = (tx: Extract<Transactions, { Type: TransactionTypes.NFTokenCancelOffer }>): string => {
        let content = '';

        content += Localize.t('events.theTransactionWillCancelNftOffer', { address: tx.Account.address });
        content += '\n';

        tx.NFTokenOffers?.forEach((id: string) => {
            content += `${id}\n`;
        });

        return content;
    };

    renderNFTokenAcceptOffer = (tx: Extract<Transactions, { Type: TransactionTypes.NFTokenAcceptOffer }>): string => {
        const offerID = tx.NFTokenBuyOffer || tx.NFTokenSellOffer;

        // this should never happen
        // but as we are in beta we should check
        if (!tx.Offer) {
            return 'Unable to fetch the offer for this transaction!';
        }

        let content = '';

        if (tx.Offer.Flags.SellToken) {
            content += Localize.t('events.nftAcceptOfferBuyExplanation', {
                address: tx.Account.address,
                offerID,
                tokenID: tx.Offer.NFTokenID,
                amount: tx.Offer.Amount.value,
                currency: NormalizeCurrencyCode(tx.Offer.Amount.currency),
            });
        } else {
            content += Localize.t('events.nftAcceptOfferSellExplanation', {
                address: tx.Account.address,
                offerID,
                tokenID: tx.Offer.NFTokenID,
                amount: tx.Offer.Amount.value,
                currency: NormalizeCurrencyCode(tx.Offer.Amount.currency),
            });
        }

        if (tx.NFTokenBrokerFee) {
            content += '\n';
            content += Localize.t('events.nftAcceptOfferBrokerFee', {
                brokerFee: tx.NFTokenBrokerFee.value,
                currency: NormalizeCurrencyCode(tx.NFTokenBrokerFee.currency),
            });
        }

        return content;
    };

    renderTicketObject = (tx: Extract<LedgerObjects, { Type: LedgerObjectTypes.Ticket }>): string => {
        return `${Localize.t('global.ticketSequence')} #${tx.TicketSequence}`;
    };

    renderDescription = () => {
        const { tx } = this.state;

        let content = '';

        switch (tx.Type) {
            case TransactionTypes.OfferCreate:
            case LedgerObjectTypes.Offer:
                content += this.renderOfferCreate(tx);
                break;
            case TransactionTypes.OfferCancel:
                content += this.renderOfferCancel(tx);
                break;
            case TransactionTypes.Payment:
                content += this.renderPayment(tx);
                break;
            case TransactionTypes.EscrowCreate:
            case LedgerObjectTypes.Escrow:
                content += this.renderEscrowCreate(tx);
                break;
            case TransactionTypes.EscrowFinish:
                content += this.renderEscrowFinish(tx);
                break;
            case TransactionTypes.TrustSet:
                content += this.renderTrustSet(tx);
                break;
            case TransactionTypes.CheckCreate:
            case LedgerObjectTypes.Check:
                content += this.renderCheckCreate(tx);
                break;
            case TransactionTypes.CheckCash:
                content += this.renderCheckCash(tx);
                break;
            case TransactionTypes.CheckCancel:
                content += this.renderCheckCancel(tx);
                break;
            case TransactionTypes.AccountDelete:
                content += this.renderAccountDelete(tx);
                break;
            case TransactionTypes.DepositPreauth:
                content += this.renderDepositPreauth(tx);
                break;
            case TransactionTypes.AccountSet:
                content += this.renderAccountSet(tx);
                break;
            case TransactionTypes.SetRegularKey:
                content += this.renderSetRegularKey(tx);
                break;
            case TransactionTypes.TicketCreate:
                content += this.renderTicketCreate(tx);
                break;
            case TransactionTypes.PaymentChannelCreate:
            case LedgerObjectTypes.PayChannel:
                content += this.renderPaymentChannelCreate(tx);
                break;
            case TransactionTypes.PaymentChannelFund:
                content += this.renderPaymentChannelFund(tx);
                break;
            case TransactionTypes.PaymentChannelClaim:
                content += this.renderPaymentChannelClaim(tx);
                break;
            case TransactionTypes.NFTokenMint:
                content += this.renderNFTokenMint(tx);
                break;
            case TransactionTypes.NFTokenBurn:
                content += this.renderNFTokenBurn(tx);
                break;
            case TransactionTypes.NFTokenCreateOffer:
                content += this.renderNFTokenCreateOffer(tx);
                break;
            case LedgerObjectTypes.NFTokenOffer:
                content += this.renderNFTokenOffer(tx);
                break;
            case TransactionTypes.NFTokenCancelOffer:
                content += this.renderNFTokenCancelOffer(tx);
                break;
            case TransactionTypes.NFTokenAcceptOffer:
                content += this.renderNFTokenAcceptOffer(tx);
                break;
            case LedgerObjectTypes.Ticket:
                content += this.renderTicketObject(tx);
                break;
            default:
                content += `This is a ${tx.Type} transaction`;
        }

        return (
            <View style={styles.detailContainer}>
                <Text style={[styles.labelText]}>{Localize.t('global.description')}</Text>
                <Text selectable style={styles.contentText}>
                    {content}
                </Text>
            </View>
        );
    };

    renderMemos = () => {
        const { asModal } = this.props;
        const { tx, showMemo, scamAlert } = this.state;

        // if ledger object or no Memo return null
        if (!(tx instanceof BaseTransaction) || !tx.Memos) return null;

        // check for xapp memo
        if (!scamAlert) {
            const xAppIdentifier = tx.getXappIdentifier();
            if (xAppIdentifier && !asModal) {
                return (
                    <View style={styles.memoContainer}>
                        <Button
                            rounded
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
                <View style={AppStyles.row}>
                    <Icon name="IconFileText" size={18} style={AppStyles.imgColorPrimary} />
                    <Text style={styles.labelText}> {Localize.t('global.memo')}</Text>
                </View>

                {showMemo ? (
                    <ReadMore
                        numberOfLines={2}
                        textStyle={[styles.memoText, AppStyles.textCenterAligned, scamAlert && AppStyles.colorRed]}
                    >
                        {tx.Memos.map((m) => {
                            if (m.MemoType === 'text/plain' || !m.MemoType) {
                                return m.MemoData;
                            }
                            return `${m.MemoType}: ${m.MemoData}`;
                        })}
                    </ReadMore>
                ) : (
                    <TouchableDebounce
                        onPress={() => {
                            this.setState({ showMemo: true });
                        }}
                    >
                        <Text style={[styles.contentText, AppStyles.colorRed]}>{Localize.t('events.showMemo')}</Text>
                    </TouchableDebounce>
                )}
            </View>
        );
    };

    renderReserveChange = () => {
        const { account } = this.props;
        const { tx } = this.state;

        let changes;

        // ledger objects always have reserve change increase
        if (tx instanceof BaseLedgerObject) {
            // ignore for incoming NFTokenOffers
            if (tx.Type === LedgerObjectTypes.NFTokenOffer && tx.Owner !== account.address) {
                return null;
            }
            changes = {
                address: account.address,
                value: 1,
                action: 'INC',
            };
        } else if (tx instanceof BaseTransaction && typeof tx.OwnerCountChange === 'function') {
            changes = tx.OwnerCountChange(account.address);
        }

        if (!changes) {
            return null;
        }

        return (
            <View style={styles.reserveContainer}>
                <View style={AppStyles.row}>
                    <Icon
                        name={changes.action === 'INC' ? 'IconLock' : 'IconUnlock'}
                        size={18}
                        style={AppStyles.imgColorPrimary}
                    />
                    <Text style={styles.labelText}> {Localize.t('global.reserve')}</Text>
                </View>

                <View style={[AppStyles.paddingBottomSml]}>
                    <Text style={[AppStyles.baseText, AppStyles.textCenterAligned]}>
                        {changes.action === 'INC'
                            ? Localize.t('events.thisTransactionIncreaseAccountReserve', {
                                  ownerReserve: Number(changes.value) * LedgerService.getNetworkReserve().OwnerReserve,
                              })
                            : Localize.t('events.thisTransactionDecreaseAccountReserve', {
                                  ownerReserve: Number(changes.value) * LedgerService.getNetworkReserve().OwnerReserve,
                              })}
                    </Text>
                </View>

                <Button roundedSmall secondary label="My balance & reserve" onPress={this.showBalanceExplain} />
            </View>
        );
    };

    renderFee = () => {
        const { tx } = this.state;

        // ignore if it's ledger object
        if (!(tx instanceof BaseTransaction)) {
            return null;
        }

        return (
            <View style={styles.detailContainer}>
                <Text style={[styles.labelText]}>{Localize.t('events.transactionCost')}</Text>
                <Text style={[styles.contentText]}>
                    {Localize.t('events.sendingThisTransactionConsumed', { fee: tx.Fee })}
                </Text>
            </View>
        );
    };

    renderInvoiceId = () => {
        const { tx } = this.state;

        // InvoiceID only exist in Payment and CheckCreate transactions and Check objects
        if (
            !(
                tx.Type === TransactionTypes.Payment ||
                tx.Type === TransactionTypes.CheckCreate ||
                tx.Type === LedgerObjectTypes.Check
            ) ||
            isUndefined(tx.InvoiceID)
        ) {
            return null;
        }

        return (
            <View style={styles.detailContainer}>
                <Text style={[styles.labelText]}>{Localize.t('global.invoiceID')}</Text>
                <Text selectable style={styles.hashText}>
                    {tx.InvoiceID}
                </Text>
            </View>
        );
    };

    renderFlags = () => {
        const { tx } = this.state;

        if (!tx.Flags) {
            return null;
        }

        const flags = [];
        for (const [key, value] of Object.entries(tx.Flags)) {
            if (!(key in txFlags.Universal) && value) {
                flags.push(
                    <Text key={key} style={styles.contentText}>
                        {key}
                    </Text>,
                );
            }
        }

        if (isEmpty(flags)) {
            return null;
        }

        return (
            <View style={styles.detailContainer}>
                <Text style={[styles.labelText]}>{Localize.t('global.flags')}</Text>
                {flags}
            </View>
        );
    };

    renderTransactionId = () => {
        const { tx } = this.state;

        if (tx instanceof BaseLedgerObject) {
            return (
                <View style={styles.detailContainer}>
                    <Text style={[styles.labelText]}>{Localize.t('events.ledgerIndex')}</Text>
                    <Text selectable style={[styles.hashText]}>
                        {tx.Index}
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.detailContainer}>
                <Text style={[styles.labelText]}>{Localize.t('events.transactionId')}</Text>
                <Text selectable style={[styles.hashText]}>
                    {tx.Hash}
                </Text>
            </View>
        );
    };

    renderHeader = () => {
        const { tx } = this.state;

        let badgeType: any;

        if (tx instanceof BaseLedgerObject) {
            if (
                [
                    LedgerObjectTypes.Offer,
                    LedgerObjectTypes.NFTokenOffer,
                    LedgerObjectTypes.Check,
                    LedgerObjectTypes.Ticket,
                    LedgerObjectTypes.PayChannel,
                ].includes(tx.Type)
            ) {
                badgeType = 'open';
            } else {
                badgeType = 'planned';
            }
        } else {
            badgeType = 'success';
        }

        let date;

        if (tx.Type !== LedgerObjectTypes.Ticket) {
            date = moment(tx.Date).format('LLLL');
        }

        return (
            <View style={styles.headerContainer}>
                <Text style={AppStyles.h5}>{this.getLabel()}</Text>
                <Spacer />
                <Badge size="medium" type={badgeType} />
                <Spacer />
                {date && <Text style={[styles.dateText]}>{date}</Text>}
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
            case TransactionTypes.Payment: {
                const amount = tx.DeliveredAmount || tx.Amount;

                if ([tx.Account.address, tx.Destination?.address].indexOf(account.address) === -1) {
                    // regular key
                    if (!balanceChanges?.received && !balanceChanges?.sent) {
                        Object.assign(props, {
                            color: styles.naturalColor,
                            value: amount.value,
                            currency: amount.currency,
                            icon: undefined,
                        });
                    } else if (balanceChanges?.received) {
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
                } else if (tx.Account.address === account.address && tx.Destination.address === account.address) {
                    // payment to self
                    Object.assign(props, {
                        value: tx.Amount.value,
                        currency: tx.Amount.currency,
                        icon: undefined,
                    });
                } else {
                    Object.assign(props, {
                        color: incomingTx ? styles.incomingColor : styles.outgoingColor,
                        prefix: incomingTx ? '' : '-',
                        value: amount.value,
                        currency: amount.currency,
                    });
                }

                break;
            }
            case TransactionTypes.AccountDelete: {
                Object.assign(props, {
                    color: incomingTx ? styles.incomingColor : styles.outgoingColor,
                    prefix: incomingTx ? '' : '-',
                    value: tx.Amount.value,
                    currency: tx.Amount.currency,
                });
                break;
            }
            case TransactionTypes.EscrowCreate:
            case LedgerObjectTypes.Escrow:
                Object.assign(props, {
                    color: tx.Account.address === account.address ? styles.orangeColor : styles.naturalColor,
                    prefix: tx.Account.address === account.address ? '-' : '',
                    value: tx.Amount.value,
                    currency: tx.Amount.currency,
                });
                break;
            case TransactionTypes.EscrowFinish:
                Object.assign(props, {
                    color: [
                        styles.naturalColor,
                        tx.Owner === account.address && styles.outgoingColor,
                        tx.Destination.address === account.address && styles.incomingColor,
                    ],
                    icon: tx.Owner === account.address ? 'IconCornerLeftUp' : 'IconCornerRightDown',
                    prefix: tx.Owner === account.address ? '-' : '',
                    value: tx.Amount.value,
                    currency: tx.Amount.currency,
                });
                break;
            case TransactionTypes.CheckCreate:
            case LedgerObjectTypes.Check:
                Object.assign(props, {
                    color: styles.naturalColor,
                    value: tx.SendMax.value,
                    currency: tx.SendMax.currency,
                });
                break;
            case TransactionTypes.CheckCash: {
                const amount = tx.Amount || tx.DeliverMin;
                const incoming = tx.Account.address === account.address;

                Object.assign(props, {
                    color: incoming ? styles.incomingColor : styles.outgoingColor,
                    icon: incoming ? 'IconCornerRightDown' : 'IconCornerLeftUp',
                    prefix: incoming ? '' : '-',
                    value: amount.value,
                    currency: amount.currency,
                });
                break;
            }
            case TransactionTypes.OfferCreate:
                if (
                    [OfferStatus.FILLED, OfferStatus.PARTIALLY_FILLED].indexOf(tx.GetOfferStatus(account.address)) > -1
                ) {
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
            case LedgerObjectTypes.Offer:
                Object.assign(props, {
                    color: styles.naturalColor,
                    icon: 'IconCornerRightDown',
                    value: tx.TakerPays.value,
                    currency: tx.TakerPays.currency,
                });

                break;
            case TransactionTypes.PaymentChannelClaim:
            case TransactionTypes.PaymentChannelFund:
            case TransactionTypes.PaymentChannelCreate: {
                if (balanceChanges && (balanceChanges.received || balanceChanges.sent)) {
                    const incoming = !!balanceChanges.received;
                    const amount = balanceChanges?.received || balanceChanges?.sent;

                    Object.assign(props, {
                        icon: incoming ? 'IconCornerRightDown' : 'IconCornerRightUp',
                        color: incoming ? styles.incomingColor : styles.outgoingColor,
                        prefix: incoming ? '' : '-',
                        value: amount.value,
                        currency: amount.currency,
                    });
                } else {
                    shouldShowAmount = false;
                }
                break;
            }
            case LedgerObjectTypes.NFTokenOffer: {
                let icon;
                if (tx.Owner !== account.address) {
                    icon = tx.Flags.SellToken ? 'IconCornerRightUp' : 'IconCornerRightDown';
                } else {
                    icon = tx.Flags.SellToken ? 'IconCornerRightDown' : 'IconCornerRightUp';
                }
                Object.assign(props, {
                    color: styles.naturalColor,
                    icon,
                    value: tx.Amount.value,
                    currency: tx.Amount.currency,
                });
                break;
            }
            case TransactionTypes.NFTokenCreateOffer: {
                let icon;
                if (incomingTx) {
                    icon = tx.Flags.SellToken ? 'IconCornerRightUp' : 'IconCornerRightDown';
                } else {
                    icon = tx.Flags.SellToken ? 'IconCornerRightDown' : 'IconCornerRightUp';
                }
                Object.assign(props, {
                    color: styles.naturalColor,
                    icon,
                    value: tx.Amount.value,
                    currency: tx.Amount.currency,
                });
                break;
            }
            case TransactionTypes.NFTokenAcceptOffer: {
                if (balanceChanges && (balanceChanges.received || balanceChanges.sent)) {
                    const incoming = !!balanceChanges.received;
                    const amount = balanceChanges?.received || balanceChanges?.sent;

                    Object.assign(props, {
                        icon: incoming ? 'IconCornerRightDown' : 'IconCornerRightUp',
                        color: incoming ? styles.incomingColor : styles.outgoingColor,
                        prefix: incoming ? '' : '-',
                        value: amount.value,
                        currency: amount.currency,
                    });
                } else {
                    // free NFT transfer
                    Object.assign(props, {
                        icon: undefined,
                        color: styles.naturalColor,
                        prefix: '',
                        value: tx.Offer.Amount.value,
                        currency: tx.Offer.Amount.currency,
                    });
                }
                break;
            }
            case LedgerObjectTypes.PayChannel:
                break;
            default:
                shouldShowAmount = false;
                break;
        }

        if (!shouldShowAmount) {
            return null;
        }

        if (tx.Type === TransactionTypes.OfferCreate || tx.Type === LedgerObjectTypes.Offer) {
            let takerGets;

            if (
                tx.Type === TransactionTypes.OfferCreate &&
                [OfferStatus.FILLED, OfferStatus.PARTIALLY_FILLED].includes(tx.GetOfferStatus(account.address))
            ) {
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
                    <Icon size={20} style={AppStyles.imgColorGrey} name="IconSwitchAccount" />
                    <Spacer />

                    <View style={[AppStyles.row, styles.amountContainer]}>
                        {props.icon && (
                            // @ts-ignore
                            <Icon name={props.icon} size={27} style={[props.color, AppStyles.marginRightSml]} />
                        )}
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

        if (tx.Type === TransactionTypes.Payment) {
            // rippling
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
                            <Icon size={20} style={AppStyles.imgColorGrey} name="IconSwitchAccount" />
                            <Spacer />

                            <View style={[AppStyles.row, styles.amountContainer]}>
                                {props.icon && (
                                    // @ts-ignore
                                    <Icon name={props.icon} size={27} style={[props.color, AppStyles.marginRightSml]} />
                                )}
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

            // cross currency
            if (tx.SendMax && tx.SendMax.currency !== tx.Amount.currency) {
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
                            <Icon size={20} style={AppStyles.imgColorGrey} name="IconArrowDown" />
                            <Spacer />

                            <View style={[AppStyles.row, styles.amountContainer]}>
                                {props.icon && (
                                    //  @ts-ignore
                                    <Icon name={props.icon} size={27} style={[props.color, AppStyles.marginRightSml]} />
                                )}
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

        if (
            tx.Type === LedgerObjectTypes.NFTokenOffer ||
            tx.Type === TransactionTypes.NFTokenCreateOffer ||
            tx.Type === TransactionTypes.NFTokenAcceptOffer
        ) {
            const tokenId = tx.Type === TransactionTypes.NFTokenAcceptOffer ? tx.Offer?.NFTokenID : tx.NFTokenID;

            return (
                <View style={styles.amountHeaderContainer}>
                    <View style={[AppStyles.row, styles.nfTokenContainer]}>
                        <NFTokenElement account={account.address} nfTokenId={tokenId} />
                    </View>

                    <Spacer />
                    <Icon size={20} style={AppStyles.imgColorGrey} name="IconSwitchAccount" />
                    <Spacer />
                    <View style={[AppStyles.row, styles.amountContainer]}>
                        {props.icon && (
                            // @ts-ignore
                            <Icon name={props.icon} size={27} style={[props.color, AppStyles.marginRightSml]} />
                        )}
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

        if (tx.Type === LedgerObjectTypes.PayChannel) {
            return (
                <View style={styles.amountHeaderContainer}>
                    <Text style={styles.labelText}> {Localize.t('events.payChannelAmount')}</Text>
                    <Spacer />
                    <View style={[AppStyles.row, styles.amountContainerSmall]}>
                        <AmountText
                            value={tx.Amount.value}
                            currency={tx.Amount.currency}
                            style={[styles.amountText, props.color]}
                        />
                    </View>

                    <Spacer size={30} />

                    <Text style={styles.labelText}> {Localize.t('events.payChannelBalance')}</Text>
                    <Spacer />
                    <View style={[AppStyles.row, styles.amountContainer]}>
                        <AmountText
                            value={tx.Balance.value}
                            currency={tx.Balance.currency}
                            prefix={props.prefix}
                            style={styles.amountTextSmall}
                        />
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.amountHeaderContainer}>
                <View style={[AppStyles.row, styles.amountContainer]}>
                    {props.icon && (
                        //  @ts-ignore
                        <Icon name={props.icon} size={27} style={[props.color, AppStyles.marginRightSml]} />
                    )}
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
        const { account, asModal } = this.props;
        const { tx, spendableAccounts } = this.state;

        // just return as the account is not a spendable account or details presented as modal
        if (!find(spendableAccounts, { address: account.address }) || asModal) {
            return null;
        }

        const actionButtons = [];

        switch (tx.Type) {
            case TransactionTypes.Payment:
                // only new payment
                if (tx.Account.address === account.address && tx.DeliveredAmount) {
                    // check if we can make new payment base on sent currency
                    if (tx.DeliveredAmount.currency !== 'XRP') {
                        const trustLine = account.lines.find(
                            (l: any) =>
                                l.currency.currency === tx.DeliveredAmount.currency &&
                                l.currency.issuer === tx.DeliveredAmount.issuer &&
                                l.balance > 0,
                        );
                        // do not show the button if user does not have the TrustLine
                        if (!trustLine) {
                            break;
                        }
                    }
                    actionButtons.push({
                        label: Localize.t('events.newPayment'),
                        type: 'Payment',
                        secondary: false,
                    });
                }
                break;
            case LedgerObjectTypes.Offer:
                actionButtons.push({
                    label: Localize.t('events.cancelOffer'),
                    type: 'OfferCancel',
                    secondary: true,
                });
                break;
            case LedgerObjectTypes.NFTokenOffer:
                if (tx.Owner === account.address) {
                    actionButtons.push({
                        label: Localize.t('events.cancelOffer'),
                        type: 'NFTokenCancelOffer',
                        secondary: true,
                    });
                } else if (!tx.Destination || tx.Destination.address === account.address) {
                    if (tx.Flags.SellToken) {
                        actionButtons.push({
                            label: Localize.t('events.acceptOffer'),
                            type: 'NFTokenAcceptOffer',
                            secondary: true,
                        });
                    } else {
                        actionButtons.push({
                            label: Localize.t('events.sellMyNFT'),
                            type: 'NFTokenAcceptOffer',
                            secondary: true,
                        });
                    }
                }
                break;
            case LedgerObjectTypes.Escrow:
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
            case LedgerObjectTypes.Check:
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
            case LedgerObjectTypes.Ticket:
                actionButtons.push({
                    label: Localize.t('events.cancelTicket'),
                    type: 'CancelTicket',
                    secondary: true,
                });
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

    renderWarnings = () => {
        const { account } = this.props;
        const { tx } = this.state;

        const warnings = [] as Array<string>;

        if (tx.Type === LedgerObjectTypes.NFTokenOffer) {
            // incoming offer with destination set other than
            if (tx.Owner !== account.address && tx.Destination && tx.Destination.address !== account.address) {
                warnings.push(Localize.t('events.thisOfferCanOnlyBeAcceptedByThirdParty'));
            }
        }

        if (warnings.length > 0) {
            return (
                <View style={styles.warningsContainer}>
                    {warnings.map((warning) => {
                        return <InfoMessage type="error" label={warning} />;
                    })}
                </View>
            );
        }

        return null;
    };

    renderSourceDestination = () => {
        const { account } = this.props;
        const { tx, partiesDetails, incomingTx, balanceChanges } = this.state;

        let from = {
            // @ts-ignore
            address: tx.Account?.address || tx.Owner,
        } as any;
        let to = {
            // @ts-ignore
            address: tx.Destination?.address,
        } as any;

        let through;

        if (incomingTx) {
            from = Object.assign(from, partiesDetails);
            if (to.address === account.address) {
                to = Object.assign(to, {
                    name: account.label,
                    source: 'accounts',
                });
            }
        } else {
            to = Object.assign(to, partiesDetails);
            if (from.address === account.address) {
                from = Object.assign(from, {
                    name: account.label,
                    source: 'accounts',
                });
            }
        }

        // incoming trustline
        if (tx.Type === TransactionTypes.TrustSet && tx.Issuer === account.address) {
            from = { address: tx.Account.address, ...partiesDetails };
            to = {
                address: account.address,
                name: account.label,
                source: 'accounts',
            };
        }

        // incoming CheckCash
        if (tx.Type === TransactionTypes.CheckCash) {
            if (incomingTx) {
                to = { address: tx.Account.address, ...partiesDetails };
                from = {
                    address: account.address,
                    name: account.label,
                    source: 'accounts',
                };
            } else {
                from = { address: tx.Account.address, ...partiesDetails };
                to = {
                    address: account.address,
                    name: account.label,
                    source: 'accounts',
                };
            }
        }

        if (tx.Type === LedgerObjectTypes.NFTokenOffer) {
            if (tx.Owner === account.address) {
                from = {
                    address: account.address,
                    name: account.label,
                    source: 'accounts',
                };
            } else {
                from = {
                    address: tx.Owner,
                    ...partiesDetails,
                };
            }

            to = {
                address: undefined,
            };
        }

        // Accepted NFT offer
        if (tx.Type === TransactionTypes.NFTokenAcceptOffer) {
            const offerer = tx.Offer.Owner;
            const accepter = tx.Account.address;
            const isSellOffer = tx.Offer?.Flags.SellToken;
            const buyer = isSellOffer ? accepter : offerer;
            const seller = isSellOffer ? offerer : accepter;

            from = {
                address: buyer,
                ...(buyer !== account.address
                    ? { ...partiesDetails }
                    : {
                          address: account.address,
                          name: account.label,
                          source: 'accounts',
                      }),
            };
            to = {
                address: seller,
                ...(seller !== account.address
                    ? { ...partiesDetails }
                    : {
                          address: account.address,
                          name: account.label,
                          source: 'accounts',
                      }),
            };
        }

        // 3rd party consuming own offer
        if (tx.Type === TransactionTypes.Payment) {
            if ([tx.Account.address, tx.Destination?.address].indexOf(account.address) === -1) {
                if (balanceChanges?.sent || balanceChanges?.received) {
                    from = { address: tx.Account.address };
                    to = { address: tx.Destination?.address };
                    through = { address: account.address, name: account.label, source: 'accounts' };
                }
            }
        }

        if (tx.Type === TransactionTypes.EscrowFinish) {
            from = {
                address: tx.Owner,
                ...(tx.Owner !== account.address
                    ? { ...partiesDetails }
                    : {
                          address: account.address,
                          name: account.label,
                          source: 'accounts',
                      }),
            };
            to = {
                address: tx.Destination.address,
                ...(tx.Owner === account.address
                    ? { ...partiesDetails }
                    : {
                          address: account.address,
                          name: account.label,
                          source: 'accounts',
                      }),
            };
        }

        // no information to show
        if (!to.address && !from.address) {
            return null;
        }

        // ignore async third party offer executed
        if (tx.Type === TransactionTypes.OfferCreate && to.address !== account.address) {
            return null;
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
                    showMoreButton={from.source !== 'accounts'}
                    onMorePress={this.showRecipientMenu}
                />
                {!!through && (
                    <>
                        <Icon name="IconArrowDown" style={[AppStyles.centerSelf, styles.iconArrow]} />
                        <Text style={[styles.labelText]}>{Localize.t('events.throughOfferBy')}</Text>
                        <RecipientElement
                            recipient={through}
                            showMoreButton={through.source !== 'accounts'}
                            onMorePress={this.showRecipientMenu}
                        />
                    </>
                )}
                <Icon name="IconArrowDown" style={[AppStyles.centerSelf, styles.iconArrow]} />
                <Text style={[styles.labelText]}>{Localize.t('global.to')}</Text>
                <RecipientElement
                    recipient={to}
                    showMoreButton={to.source !== 'accounts'}
                    onMorePress={this.showRecipientMenu}
                />
            </View>
        );
    };

    render() {
        const { asModal } = this.props;
        const { isLoading, scamAlert } = this.state;

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

                {isLoading ? (
                    <ImageBackground
                        source={StyleService.getImage('BackgroundShapes')}
                        imageStyle={AppStyles.BackgroundShapes}
                        style={[AppStyles.container, AppStyles.paddingSml, AppStyles.BackgroundShapesWH]}
                    >
                        <LoadingIndicator size="large" />
                        <Spacer />
                        <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                            {Localize.t('global.pleaseWait')}
                        </Text>
                    </ImageBackground>
                ) : (
                    <>
                        {scamAlert && (
                            <View style={styles.dangerHeader}>
                                <Text style={[AppStyles.h4, AppStyles.colorWhite]}>
                                    {Localize.t('global.alertDanger')}
                                </Text>
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
                            {this.renderReserveChange()}
                            {this.renderSourceDestination()}
                            {this.renderActionButtons()}
                            {this.renderWarnings()}
                            <View style={styles.detailsContainer}>
                                {this.renderTransactionId()}
                                {this.renderDescription()}
                                {this.renderFlags()}
                                {this.renderInvoiceId()}
                                {this.renderFee()}
                                {this.renderStatus()}
                            </View>
                        </ScrollView>
                    </>
                )}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default TransactionDetailsView;
