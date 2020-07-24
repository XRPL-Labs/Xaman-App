/**
 * Transaction Details screen
 */
import { find, isEmpty, isUndefined } from 'lodash';
import moment from 'moment';

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
export interface PartiesDetails extends AccountNameType {
    address: string;
}

export interface Props {
    tx: TransactionsType;
    account: AccountSchema;
}

export interface State {
    partiesDetails: PartiesDetails;
    coreSettings: CoreSchema;
    connectedChain: NodeChain;
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
            connectedChain: SocketService.chain,
            incomingTx: props.tx.Destination?.address === props.account.address,
            scamAlert: false,
            showMemo: true,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {
            this.checkForScamAlert();
            this.setPartiesDetails();
        });
    }

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
        const { tx } = this.props;
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
                address = tx.Issuer;
                break;
            case 'EscrowCreate':
                address = tx.Destination.address;
                tag = tx.Destination.tag;
                break;
            case 'EscrowFinish':
                address = tx.Destination.address;
                tag = tx.Destination.tag;
                break;
            case 'DepositPreauth':
                address = tx.Authorize || tx.Unauthorize;
                break;
            case 'SetRegularKey':
                address = tx.RegularKey;
                break;
            case 'CheckCreate':
                address = tx.Destination.address;
                tag = tx.Destination.tag;
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

        return `${explorer.tx[net]}${tx.Hash}`;
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
        const { tx } = this.props;

        switch (tx.Type) {
            case 'Payment':
                return Localize.t('global.payment');
            case 'TrustSet':
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
            default:
                return tx.Type;
        }
    };

    onActionButtonPress = () => {
        const { incomingTx } = this.state;
        const { tx, account } = this.props;

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
                    (l: any) => l.currency.currency === tx.Amount.currency && l.currency.issuer === tx.Amount.issuer,
                );
            }

            Object.assign(params, { amount: tx.Amount.value, currency });
        }

        Navigator.push(AppScreens.Transaction.Payment, {}, params);
    };

    renderStatus = () => {
        const { tx } = this.props;

        return (
            <>
                <Text style={[styles.labelText]}>{Localize.t('global.status')}</Text>
                <Text style={[styles.contentText]}>
                    {tx.TransactionResult.success
                        ? Localize.t('events.thisTransactionWasSuccessful')
                        : Localize.t('events.transactionFailedWithCode', { txCode: tx.TransactionResult.code })}{' '}
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
            content += `\nThe transaction will also cancel ${tx.tx.Account} 's existing offer ${tx.OfferSequence}`;
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
        if (tx.tx.SendMax) {
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
                content += this.renderOfferCreate();
                break;
            case 'OfferCancel':
                content += this.renderOfferCancel();
                break;
            case 'Payment':
                content += this.renderPayment();
                break;
            case 'EscrowCreate':
                content += this.renderEscrowCreate();
                break;
            case 'EscrowFinish':
                content += this.renderEscrowFinish();
                break;
            case 'TrustSet':
                content += this.renderTrustSet();
                break;
            case 'CheckCreate':
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
                <Badge size="medium" type="success" />
                <Spacer />
                <Text style={[styles.dateText]}>{moment(tx.Date).format('LLLL')}</Text>
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
            text: '',
        };

        switch (tx.Type) {
            case 'Payment':
            case 'AccountDelete': {
                Object.assign(props, {
                    color: incomingTx ? styles.incomingColor : styles.outgoingColor,
                    text: `${incomingTx ? '' : '-'}${tx.Amount.value} ${NormalizeCurrencyCode(tx.Amount.currency)}`,
                });
                break;
            }
            case 'EscrowCreate':
                Object.assign(props, {
                    color: incomingTx ? styles.orangeColor : styles.outgoingColor,
                    text: `-${tx.Amount.value} ${NormalizeCurrencyCode(tx.Amount.currency)}`,
                });
                break;
            case 'EscrowFinish':
                Object.assign(props, {
                    color: incomingTx ? styles.orangeColor : styles.naturalColor,
                    text: `${tx.Amount.value} ${NormalizeCurrencyCode(tx.Amount.currency)}`,
                    icon: 'IconCornerRightDown',
                });
                break;
            case 'CheckCreate':
                Object.assign(props, {
                    color: styles.naturalColor,
                    text: `${tx.SendMax.value} ${NormalizeCurrencyCode(tx.SendMax.currency)}`,
                });
                break;
            case 'CheckCash': {
                const amount = tx.Amount || tx.DeliverMin;
                const incoming = tx.Account.address === account.address;

                Object.assign(props, {
                    color: incoming ? styles.incomingColor : styles.outgoingColor,
                    text: `${incoming ? '' : '-'}${amount.value} ${NormalizeCurrencyCode(amount.currency)}`,
                });
                break;
            }
            case 'OfferCreate': {
                if (tx.Executed) {
                    Object.assign(props, {
                        color: styles.incomingColor,
                        text: `${tx.TakerPaid.value} ${NormalizeCurrencyCode(tx.TakerPaid.currency)}`,
                        icon: 'IconCornerRightDown',
                    });
                } else {
                    Object.assign(props, {
                        color: styles.naturalColor,
                        text: `${tx.TakerPays.value} ${NormalizeCurrencyCode(tx.TakerPays.currency)}`,
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
            return (
                <View style={styles.headerContainer}>
                    <View style={[AppStyles.row, styles.amountContainerSmall]}>
                        <Text style={[styles.amountTextSmall]} numberOfLines={1}>
                            {`${tx.TakerGets.value} ${NormalizeCurrencyCode(tx.TakerGets.currency)}`}
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
            <View style={styles.headerContainer}>
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

    renderSourceDestination = () => {
        const { tx, account } = this.props;
        const { partiesDetails, incomingTx } = this.state;

        let from = {
            address: tx.Account.address,
        } as any;
        let to = {
            address: tx.Destination?.address,
        } as any;

        if (incomingTx) {
            from = Object.assign(from, partiesDetails);
            to = Object.assign(to, {
                name: account.label,
                source: 'internal:accounts',
            });
        } else {
            to = Object.assign(to, partiesDetails);
            from = Object.assign(from, {
                name: account.label,
                source: 'internal:accounts',
            });
        }

        let actionButton;

        // render action button only when payment
        if (tx.Type === 'Payment') {
            const label = incomingTx ? Localize.t('events.returnPayment') : Localize.t('events.newPayment');
            actionButton = <Button onPress={this.onActionButtonPress} rounded block label={label} />;
        }

        if (!to.address) {
            return (
                <View style={styles.extraHeaderContainer}>
                    <Text style={[styles.labelText]}>From</Text>
                    <RecipientElement recipient={from} />
                </View>
            );
        }

        return (
            <View style={styles.extraHeaderContainer}>
                <Text style={[styles.labelText]}>From</Text>
                <RecipientElement
                    recipient={from}
                    showMoreButton={from.source !== 'internal:accounts'}
                    onMorePress={from.source !== 'internal:accounts' && this.showRecipientMenu}
                />
                <Icon name="IconArrowDown" style={AppStyles.centerSelf} />
                <Text style={[styles.labelText]}>To</Text>
                <RecipientElement
                    recipient={to}
                    showMoreButton={to.source !== 'internal:accounts'}
                    onMorePress={to.source !== 'internal:accounts' && this.showRecipientMenu}
                />

                {actionButton && (
                    <>
                        <Spacer />
                        {actionButton}
                    </>
                )}
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
