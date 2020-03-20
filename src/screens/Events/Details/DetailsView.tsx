/**
 * Transaction Details screen
 */

import React, { Component } from 'react';
import { View, Text, ScrollView, Platform, Linking, Alert } from 'react-native';

import Share from 'react-native-share';

import { TransactionsType } from '@common/libs/ledger/types';
import { AppScreens } from '@common/constants';
import { Navigator, ActionSheet } from '@common/helpers';

import { Header, QRCode, Spacer } from '@components';

import Localize from '@locale';
// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    tx: TransactionsType;
}

export interface State {}

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
    }

    shareTxLink = () => {
        const { tx } = this.props;
        /* eslint-disable-next-line */
        const url = `https://livenet.xrpl.org/transactions/${tx.Hash}`;

        const shareOptions = {
            title: Localize.t('events.shareTransactionId'),
            message: url,
            type: 'link',
        };
        Share.open(shareOptions).catch(() => {});
    };

    openTxLink = () => {
        const { tx } = this.props;

        /* eslint-disable-next-line */
        const url = `https://livenet.xrpl.org/transactions/${tx.Hash}`;
        Linking.canOpenURL(url).then(supported => {
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

    renderStatus = () => {
        const { tx } = this.props;

        return (
            <>
                {/* <View style={[AppStyles.hr, AppStyles.marginVerticalSml]} /> */}
                <Text style={[styles.labelText]}>{Localize.t('global.status')}</Text>
                <Text style={[styles.contentText]}>
                    {tx.TransactionResult.success
                        ? Localize.t('events.thisTransactionWasSuccessful')
                        : Localize.t('events.transactionFailedWithCode', { txCode: tx.TransactionResult.code })}{' '}
                    {Localize.t('events.andValidatedInLedger')}
                    <Text style={AppStyles.monoBold}> {tx.LedgerIndex} </Text>
                    {Localize.t('events.onDate')}
                    <Text style={AppStyles.monoBold}> {tx.Date}</Text>
                </Text>
            </>
        );
    };

    renderOfferCreate = () => {
        const { tx } = this.props;

        let content;

        content =
            `${tx.Account.address} offered to pay ${tx.TakerGets.value} ${tx.TakerGets.currency}` +
            ` in order to receive ${tx.TakerPays.value} ${tx.TakerPays.currency}\n` +
            `The exchange rate for this offer is ${tx.Rate} ` +
            `${tx.TakerPays.currency}/${tx.TakerGets.currency}`;

        if (tx.OfferSequence) {
            content += `\nThe transaction will also cancel ${tx.tx.Account} 's existing offer ${tx.OfferSequence}`;
        }

        if (tx.Expiration) {
            content += `\nThe offer expires at ${tx.Expiration} unless canceled or consumed before then.`;
        }

        return content;
    };

    renderOfferCancel = () => {
        const { tx } = this.props;
        return `The transaction will cancel ${tx.Account.address} offer #${tx.OfferSequence}`;
    };

    renderPayment = () => {
        const { tx } = this.props;

        let content = `The payment is from ${tx.Account.address} to ${tx.Destination.address}`;
        if (tx.Account.tag) {
            content += `\nThe payment has a source tag:${tx.Account.tag}`;
        }
        if (tx.Destination.tag) {
            content += `\nThe payment has a destination tag: ${tx.Destination.tag}`;
        }
        content += `\n\nIt was instructed to deliver ${tx.Amount.value} ${tx.Amount.currency}`;
        if (tx.tx.SendMax) {
            content += ` by spending up to ${tx.SendMax.value} ${tx.SendMax.currency}`;
        }
        return content;
    };

    renderTrustSet = () => {
        const { tx } = this.props;

        if (tx.Limit === 0) {
            return `It removed TrustLine currency ${tx.Currency} to ${tx.Issuer}`;
        }
        return (
            `It establishes ${tx.Limit} as the maximum amount of ${tx.Currency} ` +
            `from ${tx.Issuer} that ${tx.Account.address} is willing to hold.`
        );
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
            case 'TrustSet':
                content += this.renderTrustSet();
                break;
            default:
                content += `This is a ${tx.Type} transaction`;
        }

        return (
            <>
                <View style={[AppStyles.hr, AppStyles.marginVerticalSml]} />
                <Text style={[styles.labelText]}>Description</Text>
                <Text style={[styles.contentText]}>{content}</Text>
            </>
        );
    };

    renderMemos = () => {
        const { tx } = this.props;

        if (!tx.Memos) return null;

        return (
            <>
                <View style={[AppStyles.hr, AppStyles.marginVerticalSml]} />
                <Text style={[styles.labelText]}>Memos</Text>
                <Text style={[styles.contentText]}>
                    {tx.Memos.map(m => {
                        let memo = '';
                        memo += m.type ? `${m.type}\n` : '';
                        memo += m.format ? `${m.format}\n` : '';
                        memo += m.data ? `${m.data}\n` : '';
                        return memo;
                    })}
                </Text>
            </>
        );
    };

    renderFee = () => {
        const { tx } = this.props;

        return (
            <>
                <View style={[AppStyles.hr, AppStyles.marginVerticalSml]} />
                <Text style={[styles.labelText]}>Transaction cost</Text>
                <Text style={[styles.contentText]}>
                    Sending this transaction consumed <Text style={AppStyles.monoBold}>{tx.Fee} XRP</Text>
                </Text>
            </>
        );
    };

    render() {
        const { tx } = this.props;

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

                <ScrollView testID="transaction-details-view" contentContainerStyle={[]}>
                    <View style={styles.qrCodeContainer}>
                        <Text
                            style={[
                                styles.statusText,
                                tx.TransactionResult.success ? styles.statusSuccess : styles.statusFailed,
                            ]}
                        >
                            {tx.TransactionResult.success ? 'Success' : 'Failed'}
                        </Text>
                        <View style={styles.qrImage}>
                            {/* eslint-disable-next-line */}
                            <QRCode size={170} value={`https://livenet.xrpl.org/transactions/${tx.Hash}`} />
                        </View>
                        <Spacer />
                        <Text style={[styles.hashText]}>{tx.Hash}</Text>
                    </View>
                    <View style={styles.detailsContainer}>
                        {this.renderStatus()}
                        {this.renderDescription()}
                        {this.renderFee()}
                        {this.renderMemos()}
                    </View>

                    {/* renderFlags(tx); */}
                </ScrollView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default TransactionDetailsView;
