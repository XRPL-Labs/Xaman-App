/**
 * Transaction Details screen
 */
import { find, isEmpty, isUndefined } from 'lodash';
import moment from 'moment-timezone';
import { Navigation, OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import React, { Component, Fragment } from 'react';
import { Alert, InteractionManager, Linking, Platform, ScrollView, Share, Text, View } from 'react-native';

import { BackendService, NetworkService, StyleService } from '@services';

import AccountRepository from '@store/repositories/account';
import { AccountModel } from '@store/models';

import { Payload, XAppOrigin } from '@common/libs/payload';

import { LedgerObjectTypes, TransactionTypes } from '@common/libs/ledger/types';
import { BaseTransaction } from '@common/libs/ledger/transactions';
import { Transactions } from '@common/libs/ledger/transactions/types';

import { BaseLedgerObject } from '@common/libs/ledger/objects';
import { LedgerObjects } from '@common/libs/ledger/objects/types';

import { OfferStatus } from '@common/libs/ledger/parser/types';
import { ExplainerFactory } from '@common/libs/ledger/factory';
import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';

import { AppScreens } from '@common/constants';

import { ActionSheet } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { GetTransactionLink } from '@common/utils/explorer';

import {
    AmountText,
    Badge,
    Button,
    Header,
    Icon,
    InfoMessage,
    ReadMore,
    Spacer,
    TouchableDebounce,
} from '@components/General';
import { AccountElement, HooksExplainer, NFTokenElement } from '@components/Modules';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    tx: Transactions | LedgerObjects;
    hash?: string;
    account: AccountModel;
    asModal?: boolean;
}

export interface State {
    spendableAccounts: AccountModel[];
    recipient: { address: string; tag?: number };
    incomingTx: boolean;
    scamAlert: boolean;
    showMemo: boolean;
    label: string;
    description: string;
}

/* Component ==================================================================== */
class TransactionDetailsView extends Component<Props, State> {
    static screenName = AppScreens.Transaction.Details;

    private navigationListener: any;
    private mounted = false;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            recipient: undefined,
            spendableAccounts: AccountRepository.getSpendableAccounts(),
            incomingTx: props.tx?.Account && props.tx?.Account?.address !== props.account.address,
            scamAlert: false,
            showMemo: true,
            label: undefined,
            description: undefined,
        };
    }

    componentDidMount() {
        this.mounted = true;

        this.navigationListener = Navigation.events().bindComponent(this);

        InteractionManager.runAfterInteractions(this.setDetails);
    }

    componentWillUnmount() {
        this.mounted = false;

        if (this.navigationListener) {
            this.navigationListener.remove();
        }
    }

    close = () => {
        const { asModal } = this.props;

        if (asModal) {
            Navigator.dismissModal();
        } else {
            Navigator.pop();
        }
    };

    setDetails = async () => {
        const { tx, account } = this.props;
        const { incomingTx } = this.state;

        const explainer = ExplainerFactory.fromType(tx.Type);

        const transactionLabel = explainer.getLabel(tx, account);
        const transactionDescription = explainer.getDescription(tx, account);
        const recipient = explainer.getRecipient(tx, account);

        // set the details
        this.setState({
            label: transactionLabel,
            description: transactionDescription,
            recipient,
        });

        // check for scam alert
        if (incomingTx) {
            BackendService.getAccountAdvisory(tx.Account.address)
                .then((resp) => {
                    if (resp && resp.danger !== 'UNKNOWN' && this.mounted) {
                        this.setState({
                            scamAlert: true,
                            showMemo: false,
                        });
                    }
                })
                .catch(() => {
                    // ignore
                });
        }
    };

    getTransactionLink = () => {
        const { tx } = this.props;
        return GetTransactionLink(tx.CTID);
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
        const { tx } = this.props;

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
        Navigator.showOverlay(AppScreens.Overlay.RecipientMenu, {
            address: recipient.address,
            tag: recipient.tag,
        });
    };

    onActionButtonPress = async (type: string) => {
        const { tx, account, asModal } = this.props;
        const { incomingTx } = this.state;

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

            if (tx.DeliveredAmount.currency === NetworkService.getNativeAsset()) {
                currency = NetworkService.getNativeAsset();
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
        const { tx } = this.props;

        // ignore if it's ledger object
        if (!(tx instanceof BaseTransaction)) {
            return null;
        }

        return (
            <View style={styles.detailContainer}>
                <Text style={styles.labelText}>{Localize.t('global.status')}</Text>
                <Text style={styles.contentText}>
                    {Localize.t('events.thisTransactionWasSuccessful')} {Localize.t('events.andValidatedInLedger')}
                    <Text style={AppStyles.monoBold}> {tx.LedgerIndex} </Text>
                    {Localize.t('events.onDate')}
                    <Text style={AppStyles.monoBold}> {moment(tx.Date).format('LLLL')}</Text>
                </Text>
            </View>
        );
    };

    renderDescription = () => {
        const { description } = this.state;

        return (
            <View style={styles.detailContainer}>
                <Text style={styles.labelText}>{Localize.t('global.description')}</Text>
                <Text selectable style={styles.contentText}>
                    {description}
                </Text>
            </View>
        );
    };

    renderMemos = () => {
        const { tx, asModal } = this.props;
        const { showMemo, scamAlert } = this.state;

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
        const { tx, account } = this.props;

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

                <View style={AppStyles.paddingBottomSml}>
                    <Text style={[AppStyles.baseText, AppStyles.textCenterAligned]}>
                        {changes.action === 'INC'
                            ? Localize.t('events.thisTransactionIncreaseAccountReserve', {
                                  ownerReserve: Number(changes.value) * NetworkService.getNetworkReserve().OwnerReserve,
                                  nativeAsset: NetworkService.getNativeAsset(),
                              })
                            : Localize.t('events.thisTransactionDecreaseAccountReserve', {
                                  ownerReserve: Number(changes.value) * NetworkService.getNetworkReserve().OwnerReserve,
                                  nativeAsset: NetworkService.getNativeAsset(),
                              })}
                    </Text>
                </View>

                <Button
                    roundedSmall
                    secondary
                    label={Localize.t('events.myBalanceAndReserve')}
                    onPress={this.showBalanceExplain}
                />
            </View>
        );
    };

    renderFee = () => {
        const { tx } = this.props;

        // ignore if it's ledger object
        if (!(tx instanceof BaseTransaction)) {
            return null;
        }

        return (
            <View style={styles.detailContainer}>
                <Text style={styles.labelText}>{Localize.t('events.transactionCost')}</Text>
                <Text style={styles.contentText}>
                    {Localize.t('events.sendingThisTransactionConsumed', {
                        fee: tx.Fee,
                        nativeAsset: NetworkService.getNativeAsset(),
                    })}
                </Text>
            </View>
        );
    };

    renderInvoiceId = () => {
        const { tx } = this.props;

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
                <Text style={styles.labelText}>{Localize.t('global.invoiceID')}</Text>
                <Text selectable style={styles.hashText}>
                    {tx.InvoiceID}
                </Text>
            </View>
        );
    };

    renderHookDetails = () => {
        const { tx, account } = this.props;

        if (tx instanceof BaseLedgerObject) {
            return null;
        }

        if (
            tx.Type === TransactionTypes.SetHook ||
            tx.EmitDetails ||
            tx.MetaData?.HookExecutions ||
            tx.MetaData?.HookEmissions
        ) {
            return (
                <View style={styles.detailContainer}>
                    <Text style={styles.labelText}>{Localize.t('global.hooks')}</Text>
                    <HooksExplainer transaction={tx} account={account} />
                </View>
            );
        }

        return null;
    };

    renderFlags = () => {
        const { tx } = this.props;

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
                <Text style={styles.labelText}>{Localize.t('global.flags')}</Text>
                {flags}
            </View>
        );
    };

    renderTransactionId = () => {
        const { tx } = this.props;

        if (tx instanceof BaseLedgerObject) {
            return (
                <View style={styles.detailContainer}>
                    <Text style={styles.labelText}>{Localize.t('events.ledgerIndex')}</Text>
                    <Text selectable style={styles.hashText}>
                        {tx.Index}
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.detailContainer}>
                <Text style={styles.labelText}>{Localize.t('events.transactionId')}</Text>
                <Text selectable style={styles.hashText}>
                    {tx.Hash}
                </Text>
            </View>
        );
    };

    renderHeader = () => {
        const { tx } = this.props;
        const { label } = this.state;

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
                <Text style={AppStyles.h5}>{label}</Text>
                <Spacer />
                <Badge size="medium" type={badgeType} />
                <Spacer />
                {date && <Text style={styles.dateText}>{date}</Text>}
            </View>
        );
    };

    renderAmount = () => {
        const { tx, account } = this.props;
        const { incomingTx } = this.state;

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
                    if (!tx.BalanceChange()?.received && !tx.BalanceChange()?.sent) {
                        Object.assign(props, {
                            color: styles.naturalColor,
                            value: amount.value,
                            currency: amount.currency,
                            icon: undefined,
                        });
                    } else if (tx.BalanceChange()?.received) {
                        Object.assign(props, {
                            color: styles.incomingColor,
                            value: tx.BalanceChange().received.value,
                            currency: tx.BalanceChange().received.currency,
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
                if (tx.BalanceChange() && (tx.BalanceChange().received || tx.BalanceChange().sent)) {
                    const incoming = !!tx.BalanceChange().received;
                    const amount = tx.BalanceChange()?.received || tx.BalanceChange()?.sent;

                    Object.assign(props, {
                        icon: incoming ? 'IconCornerRightDown' : 'IconCornerRightUp',
                        color: incoming ? styles.incomingColor : styles.outgoingColor,
                        prefix: !incoming && !amount.value.startsWith('-') ? '-' : '',
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
                if (tx.BalanceChange() && (tx.BalanceChange().received || tx.BalanceChange().sent)) {
                    const incoming = !!tx.BalanceChange().received;
                    const amount = tx.BalanceChange()?.received || tx.BalanceChange()?.sent;

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

            // all new transactions types
            case TransactionTypes.Import:
            case TransactionTypes.GenesisMint:
            case TransactionTypes.EnableAmendment: {
                const balanceChanges = tx.BalanceChange(account.address);
                if (balanceChanges && (balanceChanges.received || balanceChanges.sent)) {
                    const incoming = !!balanceChanges.received;
                    const amount = balanceChanges?.received || balanceChanges?.sent;

                    Object.assign(props, {
                        icon: incoming ? 'IconCornerRightDown' : 'IconCornerRightUp',
                        color: incoming ? styles.incomingColor : styles.outgoingColor,
                        prefix: !incoming && !amount.value.startsWith('-') ? '-' : '',
                        value: amount.value,
                        currency: amount.currency,
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
                            style={styles.amountTextSmall}
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
                if (tx.BalanceChange()?.sent) {
                    return (
                        <View style={styles.amountHeaderContainer}>
                            <View style={[AppStyles.row, styles.amountContainerSmall]}>
                                <AmountText
                                    value={tx.BalanceChange().sent.value}
                                    currency={tx.BalanceChange().sent.currency}
                                    style={styles.amountTextSmall}
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
                if (tx.BalanceChange()?.sent) {
                    return (
                        <View style={styles.amountHeaderContainer}>
                            <View style={[AppStyles.row, styles.amountContainerSmall]}>
                                <AmountText
                                    value={tx.BalanceChange().sent.value}
                                    currency={tx.BalanceChange().sent.currency}
                                    style={styles.amountTextSmall}
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
        const { tx, account, asModal } = this.props;
        const { spendableAccounts } = this.state;

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
                    if (tx.DeliveredAmount.currency !== NetworkService.getNativeAsset()) {
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
        const { tx, account } = this.props;

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
        const { tx, account } = this.props;
        const { recipient, incomingTx } = this.state;

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
            from = Object.assign(from, recipient);
            if (to.address === account.address) {
                to = Object.assign(to, {
                    name: account.label,
                    source: 'accounts',
                });
            }
        } else {
            to = Object.assign(to, recipient);
            if (from.address === account.address) {
                from = Object.assign(from, {
                    name: account.label,
                    source: 'accounts',
                });
            }
        }

        // incoming trustline
        if (tx.Type === TransactionTypes.TrustSet && tx.Issuer === account.address) {
            from = { address: tx.Account.address, tag: tx.Account.tag };
            to = {
                address: account.address,
                name: account.label,
                source: 'accounts',
            };
        }

        // incoming CheckCash
        if (tx.Type === TransactionTypes.CheckCash) {
            if (incomingTx) {
                to = { address: tx.Account.address, tag: tx.Account.tag };
                from = {
                    address: account.address,
                    name: account.label,
                    source: 'accounts',
                };
            } else {
                from = { address: tx.Account.address, tag: tx.Account.tag };
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
                    ? { ...recipient }
                    : {
                          address: account.address,
                          name: account.label,
                          source: 'accounts',
                      }),
            };
            to = {
                address: seller,
                ...(seller !== account.address
                    ? { ...recipient }
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
                if (tx.BalanceChange()?.sent || tx.BalanceChange()?.received) {
                    from = { address: tx.Account.address, tag: tx.Account.tag };
                    to = { address: tx.Destination?.address, tag: tx.Destination.tag };
                    through = { address: account.address, name: account.label, source: 'accounts' };
                }
            }
        }

        // escrow finish
        if (tx.Type === TransactionTypes.EscrowFinish) {
            from = {
                address: tx.Owner,
                ...(tx.Owner !== account.address
                    ? { ...recipient }
                    : {
                          address: account.address,
                          name: account.label,
                          source: 'accounts',
                      }),
            };
            to = {
                address: tx.Destination.address,
                ...(tx.Owner === account.address
                    ? { ...recipient }
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
                    <Text style={styles.labelText}>{Localize.t('global.from')}</Text>
                    <AccountElement address={from.address} tag={from.tag} />
                </View>
            );
        }

        return (
            <View style={styles.extraHeaderContainer}>
                <Text style={styles.labelText}>{Localize.t('global.from')}</Text>
                <AccountElement
                    address={from.address}
                    tag={from.tag}
                    visibleElements={{ tag: true, avatar: true, button: from.source !== 'accounts' }}
                    onButtonPress={this.showRecipientMenu}
                />
                {!!through && (
                    <>
                        <Icon name="IconArrowDown" style={[AppStyles.centerSelf, styles.iconArrow]} />
                        <Text style={styles.labelText}>{Localize.t('events.throughOfferBy')}</Text>
                        <AccountElement
                            address={through.address}
                            visibleElements={{ tag: true, avatar: true, button: through.source !== 'accounts' }}
                            onButtonPress={this.showRecipientMenu}
                        />
                    </>
                )}
                <Icon name="IconArrowDown" style={[AppStyles.centerSelf, styles.iconArrow]} />
                <Text style={styles.labelText}>{Localize.t('global.to')}</Text>
                <AccountElement
                    address={to.address}
                    tag={to.tag}
                    visibleElements={{ tag: true, avatar: true, button: to.source !== 'accounts' }}
                    onButtonPress={this.showRecipientMenu}
                />
            </View>
        );
    };

    render() {
        const { asModal } = this.props;
        const { scamAlert } = this.state;

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
                    containerStyle={asModal && { marginTop: 0 }}
                />

                {scamAlert && (
                    <View style={styles.dangerHeader}>
                        <Text style={[AppStyles.h4, AppStyles.colorWhite]}>{Localize.t('global.alertDanger')}</Text>
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
                        {this.renderHookDetails()}
                        {this.renderFee()}
                        {this.renderStatus()}
                    </View>
                </ScrollView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default TransactionDetailsView;
