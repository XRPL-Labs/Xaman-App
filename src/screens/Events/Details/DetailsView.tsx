/**
 * Transaction Details screen
 */
import { find, isEmpty, isUndefined } from 'lodash';
import moment from 'moment-timezone';

import React, { Component } from 'react';
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
} from 'react-native';

import { BackendService, SocketService } from '@services';

import { NodeChain } from '@store/types';
import { CoreSchema, AccountSchema } from '@store/schemas/latest';
import CoreRepository from '@store/repositories/core';
import AccountRepository from '@store/repositories/account';

import { Payload } from '@common/libs/payload';
import { TransactionsType } from '@common/libs/ledger/transactions/types';
import { NormalizeCurrencyCode } from '@common/libs/utils';

import { AppScreens, AppConfig } from '@common/constants';

import { ActionSheet } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import { Header, Button, Badge, Spacer, Icon, ReadMore } from '@components/General';
import { RecipientElement } from '@components/Modules';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    tx: TransactionsType;
    account: AccountSchema;
}

export interface State {
    partiesDetails: AccountNameType;
    coreSettings: CoreSchema;
    spendableAccounts: AccountSchema[];
    connectedChain: NodeChain;
    balanceChanges: any;
    incomingTx: boolean;
    scamAlert: boolean;
    showMemo: boolean;
}

/* Component ==================================================================== */
class TransactionDetailsView extends Component<Props, State> {
    static screenName = AppScreens.Transaction.Details;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            partiesDetails: {
                address: '',
                name: '',
                source: '',
            },
            coreSettings: CoreRepository.getSettings(),
            spendableAccounts: AccountRepository.getSpendableAccounts(),
            connectedChain: SocketService.chain,
            balanceChanges: undefined,
            incomingTx: props.tx.Destination?.address === props.account.address,
            scamAlert: false,
            showMemo: true,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {
            this.checkForScamAlert();
            this.setPartiesDetails();
            this.setBalanceChanges();
        });
    }

    setBalanceChanges = () => {
        const { tx, account } = this.props;

        if (tx.Type === 'Payment') {
            this.setState({
                balanceChanges: tx.BalanceChange(account.address),
            });
        }
    };

    checkForScamAlert = async () => {
        const { tx } = this.props;
        const { incomingTx } = this.state;

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
        const { tx, account } = this.props;
        const { incomingTx } = this.state;

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
        const { connectedChain, coreSettings } = this.state;
        const { tx } = this.props;

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
        const { tx } = this.props;
        const { partiesDetails, incomingTx } = this.state;

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
        const { tx, account } = this.props;
        const { balanceChanges } = this.state;

        switch (tx.Type) {
            case 'Payment':
                if ([tx.Account.address, tx.Destination?.address].indexOf(account.address) === -1) {
                    if (balanceChanges?.sent || balanceChanges?.received) {
                        return Localize.t('events.exchangedAssets');
                    }
                }
                return Localize.t('global.payment');

            case 'TrustSet':
                if (tx.Account.address !== account.address) {
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
        const { incomingTx } = this.state;
        const { tx, account } = this.props;

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
                        (l: any) => l.currency.currency === tx.Amount.currency && l.currency.issuer === tx.Amount.issuer,
                    );
                }
                Object.assign(params, { amount: tx.Amount.value, currency });
            }
            Navigator.push(AppScreens.Transaction.Payment, {}, params);
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
        const { tx } = this.props;

        // ignore if it's ledger object
        if (tx.ClassName !== 'Transaction') {
            return null;
        }

        return (
            <>
                <Text style={[styles.labelText]}>{Localize.t('global.status')}</Text>
                <Text style={[styles.contentText]}>
                    {Localize.t('events.thisTransactionWasSuccessful')}
                    {Localize.t('events.andValidatedInLedger')}
                    <Text style={AppStyles.monoBold}> {tx.LedgerIndex} </Text>
                    {Localize.t('events.onDate')}
                    <Text style={AppStyles.monoBold}> {moment(tx.Date).format('LLLL')}</Text>
                </Text>
            </>
        );
    };

    renderOfferCreate = () => {
        const { tx } = this.props;

        let content;

        content =
            `${tx.Account.address} offered to pay ${tx.TakerGets.value} ${NormalizeCurrencyCode(
                tx.TakerGets.currency,
            )}` +
            ` in order to receive ${tx.TakerPays.value} ${NormalizeCurrencyCode(tx.TakerPays.currency)}\n` +
            `The exchange rate for this offer is ${tx.Rate} ` +
            `${NormalizeCurrencyCode(tx.TakerPays.currency)}/${NormalizeCurrencyCode(tx.TakerGets.currency)}`;

        if (tx.OfferSequence) {
            content += `\nThe transaction will also cancel ${tx.Account.address} 's existing offer ${tx.OfferSequence}`;
        }

        if (tx.Expiration) {
            content += `\nThe offer expires at ${moment(tx.Expiration).format(
                'LLLL',
            )} unless canceled or consumed before then.`;
        }

        return content;
    };

    renderOfferCancel = () => {
        const { tx } = this.props;
        return `The transaction will cancel ${tx.Account.address} offer #${tx.OfferSequence}`;
    };

    renderEscrowCreate = () => {
        const { tx } = this.props;

        let content = `The escrow is from ${tx.Account.address} to ${tx.Destination.address}`;
        if (tx.Destination.tag) {
            content += `\nThe escrow has a destination tag: ${tx.Destination.tag}\n`;
        }
        content += `\nIt escrowed ${tx.Amount.value} XRP`;

        if (tx.CancelAfter) {
            content += `\nIt can be cancelled after ${moment(tx.CancelAfter).format('LLLL')}`;
        }

        if (tx.FinishAfter) {
            content += `\nIt can be finished after ${moment(tx.FinishAfter).format('LLLL')}`;
        }
        return content;
    };

    renderEscrowFinish = () => {
        const { tx } = this.props;

        let content = `Completion was triggered by ${tx.Account.address}`;
        content += `\nThe escrowed amount of ${tx.Amount.value} XRP was delivered to ${tx.Destination.address}`;
        if (tx.Destination.tag) {
            content += `\nThe escrow has a destination tag: ${tx.Destination.tag}\n`;
        }
        content += `\nThe escrow was created by ${tx.Owner}`;

        return content;
    };

    renderPayment = () => {
        const { tx } = this.props;

        let content = '';
        if (tx.Account.tag) {
            content += `The payment has a source tag:${tx.Account.tag}\n`;
        }
        if (tx.Destination.tag) {
            content += `The payment has a destination tag: ${tx.Destination.tag}\n`;
        }
        content += `It was instructed to deliver ${tx.Amount.value} ${NormalizeCurrencyCode(tx.Amount.currency)}`;
        if (tx.SendMax) {
            content += ` by spending up to ${tx.SendMax.value} ${NormalizeCurrencyCode(tx.SendMax.currency)}`;
        }
        return content;
    };

    renderAccountDelete = () => {
        const { tx } = this.props;

        let content = `It deleted account ${tx.Account.address}`;

        content += `\n\nIt was instructed to deliver the remaining balance of ${
            tx.Amount.value
        } ${NormalizeCurrencyCode(tx.Amount.currency)} to ${tx.Destination.address}`;

        if (tx.Account.tag) {
            content += `\nThe transaction has a source tag:${tx.Account.tag}`;
        }
        if (tx.Destination.tag) {
            content += `\nThe transaction has a destination tag: ${tx.Destination.tag}`;
        }

        return content;
    };

    renderCheckCreate = () => {
        const { tx } = this.props;

        let content = `The check is from ${tx.Account.address} to ${tx.Destination.address}`;
        if (tx.Account.tag) {
            content += `\nThe check has a source tag:${tx.Account.tag}`;
        }
        if (tx.Destination.tag) {
            content += `\nThe check has a destination tag: ${tx.Destination.tag}`;
        }
        content += `\n\nMaximum amount of source currency the Check is allowed to debit the sender is ${
            tx.SendMax.value
        } ${NormalizeCurrencyCode(tx.SendMax.currency)}`;

        return content;
    };

    renderCheckCash = () => {
        const { tx } = this.props;

        const amount = tx.Amount || tx.DeliverMin;

        const content = `It was instructed to deliver ${amount.value} ${NormalizeCurrencyCode(amount.currency)} to ${
            tx.Account.address
        } by cashing check with ID ${tx.CheckID}`;

        return content;
    };

    renderCheckCancel = () => {
        const { tx } = this.props;
        return `The transaction will cancel check with ID ${tx.CheckID}`;
    };

    renderDepositPreauth = () => {
        const { tx } = this.props;

        if (tx.Authorize) {
            return `It authorizes ${tx.Authorize} to send payments to this account`;
        }

        return `It removes the authorization for ${tx.Unauthorize} to send payments to this account`;
    };

    renderTrustSet = () => {
        const { tx } = this.props;

        if (tx.Limit === 0) {
            return `It removed TrustLine currency ${NormalizeCurrencyCode(tx.Currency)} to ${tx.Issuer}`;
        }
        return (
            `It establishes ${tx.Limit} as the maximum amount of ${NormalizeCurrencyCode(tx.Currency)} ` +
            `from ${tx.Issuer} that ${tx.Account.address} is willing to hold.`
        );
    };

    renderAccountSet = () => {
        const { tx } = this.props;

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
            if (tx.Domain === '') {
                content += '\nIt removes the account domain';
            } else {
                content += `\nIt sets the account domain to ${tx.Domain}`;
            }
        }

        if (tx.EmailHash !== undefined) {
            if (tx.EmailHash === '') {
                content += '\nIt removes the account email hash';
            } else {
                content += `\nIt sets the account email hash to ${tx.EmailHash}`;
            }
        }

        if (tx.MessageKey !== undefined) {
            if (tx.MessageKey === '') {
                content += '\nIt removes the account message key';
            } else {
                content += `\nIt sets the account message key to ${tx.MessageKey}`;
            }
        }

        if (tx.TransferRate !== undefined) {
            if (tx.TransferRate === '') {
                content += '\nIt removes the account transfer rate';
            } else {
                content += `\nIt sets the account transfer rates to ${tx.TransferRate}`;
            }
        }

        if (tx.SetFlag !== undefined) {
            content += `\nIt sets the account flag ${tx.SetFlag}`;
        }

        if (tx.ClearFlag !== undefined) {
            content += `\nIt clears the account flag ${tx.ClearFlag}`;
        }

        return content;
    };

    renderDescription = () => {
        const { tx } = this.props;

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
                <Text style={[styles.labelText]}>Description</Text>
                <Text style={[styles.contentText]}>{content}</Text>
            </>
        );
    };

    renderMemos = () => {
        const { tx } = this.props;
        const { showMemo, scamAlert } = this.state;

        if (!tx.Memos) return null;

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
        const { tx } = this.props;

        // ignore if it's ledger object
        if (tx.ClassName !== 'Transaction') {
            return null;
        }

        return (
            <>
                <Text style={[styles.labelText]}>Transaction cost</Text>
                <Text style={[styles.contentText]}>
                    Sending this transaction consumed <Text style={AppStyles.monoBold}>{tx.Fee} XRP</Text>
                </Text>
            </>
        );
    };

    renderTransactionId = () => {
        const { tx } = this.props;

        if (tx.ClassName === 'LedgerObject') {
            return (
                <>
                    <Text style={[styles.labelText]}>Ledger Index</Text>
                    <Text selectable style={[styles.hashText]}>
                        {tx.Index}
                    </Text>
                </>
            );
        }
        return (
            <>
                <Text style={[styles.labelText]}>Transaction id</Text>
                <Text selectable style={[styles.hashText]}>
                    {tx.Hash}
                </Text>
            </>
        );
    };

    renderHeader = () => {
        const { tx } = this.props;

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
        const { tx, account } = this.props;
        const { incomingTx, balanceChanges } = this.state;

        let shouldShowAmount = true;

        const props = {
            icon: incomingTx ? 'IconCornerRightDown' : 'IconCornerLeftUp',
            color: {},
            text: '',
        };

        switch (tx.Type) {
            case 'Payment':
                if ([tx.Account.address, tx.Destination?.address].indexOf(account.address) === -1) {
                    if (balanceChanges?.received) {
                        Object.assign(props, {
                            color: styles.incomingColor,
                            text: `${Localize.formatNumber(balanceChanges.received.value)} ${NormalizeCurrencyCode(
                                balanceChanges.received.currency,
                            )}`,
                            icon: 'IconCornerRightDown',
                        });
                    } else {
                        Object.assign(props, {
                            color: styles.outgoingColor,
                            text: `${'-'}${Localize.formatNumber(tx.Amount.value)} ${NormalizeCurrencyCode(
                                tx.Amount.currency,
                            )}`,
                        });
                    }
                } else {
                    Object.assign(props, {
                        color: incomingTx ? styles.incomingColor : styles.outgoingColor,
                        text: `${incomingTx ? '' : '-'}${Localize.formatNumber(
                            tx.Amount.value,
                        )} ${NormalizeCurrencyCode(tx.Amount.currency)}`,
                    });
                }

                break;
            case 'AccountDelete': {
                Object.assign(props, {
                    color: incomingTx ? styles.incomingColor : styles.outgoingColor,
                    text: `${incomingTx ? '' : '-'}${Localize.formatNumber(tx.Amount.value)} ${NormalizeCurrencyCode(
                        tx.Amount.currency,
                    )}`,
                });
                break;
            }
            case 'EscrowCreate':
            case 'Escrow':
                Object.assign(props, {
                    color: incomingTx ? styles.orangeColor : styles.outgoingColor,
                    text: `-${Localize.formatNumber(tx.Amount.value)} ${NormalizeCurrencyCode(tx.Amount.currency)}`,
                });
                break;
            case 'EscrowFinish':
                Object.assign(props, {
                    color: incomingTx ? styles.orangeColor : styles.naturalColor,
                    text: `${Localize.formatNumber(tx.Amount.value)} ${NormalizeCurrencyCode(tx.Amount.currency)}`,
                    icon: 'IconCornerRightDown',
                });
                break;
            case 'CheckCreate':
            case 'Check':
                Object.assign(props, {
                    color: styles.naturalColor,
                    text: `${Localize.formatNumber(tx.SendMax.value)} ${NormalizeCurrencyCode(tx.SendMax.currency)}`,
                });
                break;
            case 'CheckCash': {
                const amount = tx.Amount || tx.DeliverMin;
                const incoming = tx.Account.address === account.address;

                Object.assign(props, {
                    color: incoming ? styles.incomingColor : styles.outgoingColor,
                    text: `${incoming ? '' : '-'}${Localize.formatNumber(amount.value)} ${NormalizeCurrencyCode(
                        amount.currency,
                    )}`,
                });
                break;
            }
            case 'OfferCreate':
            case 'Offer': {
                if (tx.Executed) {
                    const takerPaid = tx.TakerPaid(account.address);
                    Object.assign(props, {
                        color: styles.incomingColor,
                        text: `${Localize.formatNumber(takerPaid.value)} ${NormalizeCurrencyCode(takerPaid.currency)}`,
                        icon: 'IconCornerRightDown',
                    });
                } else {
                    Object.assign(props, {
                        color: styles.naturalColor,
                        text: `${Localize.formatNumber(tx.TakerPays.value)} ${NormalizeCurrencyCode(
                            tx.TakerPays.currency,
                        )}`,
                        icon: 'IconCornerRightDown',
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
            const takerGot = tx.TakerGot(account.address);

            return (
                <View style={styles.amountHeaderContainer}>
                    <View style={[AppStyles.row, styles.amountContainerSmall]}>
                        <Text style={[styles.amountTextSmall]} numberOfLines={1}>
                            {`${takerGot.value} ${NormalizeCurrencyCode(takerGot.currency)}`}
                        </Text>
                    </View>

                    <Spacer />
                    <Icon size={20} style={AppStyles.imgColorGreyBlack} name="IconSwitchAccount" />
                    <Spacer />

                    <View style={[AppStyles.row, styles.amountContainer]}>
                        {/*
                    // @ts-ignore */}
                        <Icon name={props.icon} size={27} style={[props.color, AppStyles.marginRightSml]} />
                        <Text style={[styles.amountText, props.color]} numberOfLines={1}>
                            {props.text}
                        </Text>
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
                                <Text style={[styles.amountTextSmall]} numberOfLines={1}>
                                    {`${balanceChanges.sent.value} ${NormalizeCurrencyCode(
                                        balanceChanges.sent.currency,
                                    )}`}
                                </Text>
                            </View>

                            <Spacer />
                            <Icon size={20} style={AppStyles.imgColorGreyBlack} name="IconSwitchAccount" />
                            <Spacer />

                            <View style={[AppStyles.row, styles.amountContainer]}>
                                {/*
                        // @ts-ignore */}
                                <Icon name={props.icon} size={27} style={[props.color, AppStyles.marginRightSml]} />
                                <Text style={[styles.amountText, props.color]} numberOfLines={1}>
                                    {props.text}
                                </Text>
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
                        <Text style={[styles.amountTextSmall]} numberOfLines={1}>
                            {`${takerGot.value} ${NormalizeCurrencyCode(takerGot.currency)}`}
                        </Text>
                    </View>

                    <Spacer />
                    <Icon size={20} style={AppStyles.imgColorGreyBlack} name="IconSwitchAccount" />
                    <Spacer />

                    <View style={[AppStyles.row, styles.amountContainer]}>
                        {/*
                    // @ts-ignore */}
                        <Icon name={props.icon} size={27} style={[props.color, AppStyles.marginRightSml]} />
                        <Text style={[styles.amountText, props.color]} numberOfLines={1}>
                            {props.text}
                        </Text>
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
                    <Text style={[styles.amountText, props.color]} numberOfLines={1}>
                        {props.text}
                    </Text>
                </View>
            </View>
        );
    };

    renderActionButtons = () => {
        const { tx, account } = this.props;
        const { incomingTx, spendableAccounts } = this.state;

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
                        <>
                            <Button
                                key={`actionButton-${i}`}
                                rounded
                                block
                                secondary={e.secondary}
                                label={e.label}
                                // eslint-disable-next-line react/jsx-no-bind
                                onPress={this.onActionButtonPress.bind(null, e.type)}
                            />
                            <Spacer size={i + 1 < actionButtons.length ? 15 : 0} />
                        </>
                    ))}
                </View>
            );
        }

        return null;
    };

    renderSourceDestination = () => {
        const { tx, account } = this.props;
        const { partiesDetails, incomingTx, balanceChanges } = this.state;

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

    render() {
        const { scamAlert } = this.state;

        return (
            <View style={AppStyles.container}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                    centerComponent={{ text: Localize.t('events.transactionDetails') }}
                    rightComponent={{
                        icon: 'IconMoreHorizontal',
                        onPress: () => {
                            this.showMenu();
                        },
                    }}
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
