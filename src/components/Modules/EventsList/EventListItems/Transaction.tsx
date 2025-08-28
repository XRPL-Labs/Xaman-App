import { isEmpty, isEqual } from 'lodash';

// import { NetworkService } from '@services';

import React, { Component } from 'react';
import { Text, View, InteractionManager } from 'react-native';
import type { RatesType } from '@services/BackendService';

import Localize from '@locale';

import AppConfig from '@common/constants/config';
import { AppScreens } from '@common/constants';

import { ExplainerFactory } from '@common/libs/ledger/factory';
import { CombinedTransactions, Transactions } from '@common/libs/ledger/transactions/types';
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';

import { ExplainerAbstract } from '@common/libs/ledger/factory/types';
import { LedgerObjects } from '@common/libs/ledger/objects/types';

import { AccountModel } from '@store/models';
import { TokenAvatar } from '@components/Modules/TokenElement';

import ResolverService, { AccountNameResolveType } from '@services/ResolverService';

import { Navigator } from '@common/helpers/navigator';

import { TouchableDebounce, Badge, BadgeType, Icon } from '@components/General';

import { TransactionDetailsViewProps } from '@screens/Events/Details';

import * as Blocks from './Blocks';

import { AppSizes, AppStyles } from '@theme';
import styles from './styles';
import lpStyles from '@components/Modules/AssetsList/Tokens/TokenItem/styles';
import trustLine from '@store/repositories/trustLine';
import { OperationActions } from '@common/libs/ledger/parser/types';
import { NormalizeCurrencyCode } from '@common/utils/monetary';

/* types ==================================================================== */
export interface cachedTokenDetailsState {
    title?: React.JSX.Element;
    participant?: string;
    icon?: React.JSX.Element;
    account?: string;
};

export interface Props {
    account: AccountModel;
    item: Transactions & MutationsMixinType;
    timestamp?: number;
    rates?: {
        fiatCurrency: string;
        fiatRate: RatesType | undefined;
        isLoadingRate: boolean;
    };
}

export interface State {
    isLoading: boolean;
    participant?: AccountNameResolveType;
    explainer?: ExplainerAbstract<CombinedTransactions | LedgerObjects>;
    isFeeTransaction?: boolean;
    feeText?: string;
    cachedTokenDetails: cachedTokenDetailsState;
}

/* Component ==================================================================== */
class TransactionItem extends Component<Props, State> {
    static Height = AppSizes.heightPercentageToDP(7.5);
    static FeeHeight = AppSizes.heightPercentageToDP(4);

    private mounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            participant: undefined,
            explainer: undefined,
            cachedTokenDetails: {
                title: undefined,
                icon: undefined,
                account: undefined,
                participant: undefined,
            },
        };
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        // const { item, timestamp } = this.props;
        // const { isLoading, participant, explainer } = this.state;
        const { isLoading, cachedTokenDetails } = this.state;

        return (
            // !isEqual(nextProps.item?.hash, item?.hash) ||
            !isEqual(nextState.isLoading, isLoading) ||
            !isEqual(nextState.cachedTokenDetails.account, cachedTokenDetails.account)
            // !isEqual(nextState.participant, participant) ||
            // !isEqual(nextState.explainer, explainer) // ||
            // !isEqual(nextProps.timestamp, timestamp)
        );
    }

    componentDidMount() {
        // track mounted
        this.mounted = true;

        // fetch recipient details
        InteractionManager.runAfterInteractions(this.setDetails);
    }

    componentDidUpdate(prevProps: Props) {
        const { item, timestamp } = this.props;

        // force the lookup if timestamp changed
        if (timestamp !== prevProps.timestamp || item?.hash !== prevProps.item?.hash) {
            InteractionManager.runAfterInteractions(this.setDetails);
        }
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    setDetails = async () => {
        const { item, account } = this.props;
        const { isLoading } = this.state;

        // set is loading flag if not true
        if (!isLoading) {
            this.setState({
                isLoading: true,
                feeText: '',
                isFeeTransaction: false,
            });
        }

        const explainer = ExplainerFactory.fromTransaction(item, account);

        if (typeof explainer === 'undefined') {
            this.setState({
                isLoading: false,
            });
            return;
        }

        // get participants
        const participants = explainer.getParticipants();

        const otherParty =
            participants.start?.address && participants.start?.address !== account.address
                ? participants.start
                : participants.end?.address && participants.end?.address !== account.address
                  ? participants.end
                  : { address: account.address };        

        try {
            // get participant details
            const resp = await ResolverService.getAccountName(otherParty.address, otherParty.tag);

            const isFeeTransaction = resp?.address && AppConfig?.feeAccount &&
                String(resp?.address || '') === String(AppConfig?.feeAccount || '') &&
                typeof item.MetaData.delivered_amount === 'string' &&
                (item as any)?._tx?.InvoiceID;

            let feeText = '';
            
            if (isFeeTransaction) {
                const feeFactor = explainer?.getMonetaryDetails()?.factor?.[0];
                if (feeFactor) {
                    feeText = `${feeFactor?.value} ${feeFactor?.currency}`.trim();
                    // if (rates?.fiatRate?.rate && rates?.fiatRate?.symbol) {
                    // const effectiveAmount = Number(feeFactor?.value || 0) * Number(rates?.fiatRate?.rate || 0);
                    const effectiveAmount = Number(feeFactor?.value || 0);
                    if (effectiveAmount !== 0) {
                        feeText = `${Localize.formatNumber(effectiveAmount, 6)} ${feeFactor?.currency}`.trim();
                        // feeText = `${rates?.fiatRate?.symbol} ${Localize.formatNumber(effectiveAmount, 2)}`.trim();
                        // if (effectiveAmount < 0.01) {
                        //     feeText = `< ${rates?.fiatRate?.symbol} ${Localize.formatNumber(0.01, 2)}`.trim();
                        // } 
                    }
                // }
                }
            }

            if (!isEmpty(resp) && this.mounted) {
                this.setState({
                    explainer,
                    participant: resp,
                    isLoading: false,
                    feeText,
                    isFeeTransaction,
                });
            }
        } catch (error) {
            if (this.mounted) {
                this.setState({
                    explainer,
                    participant: { ...otherParty },
                    isLoading: false,
                });
            }
        }

        this.getTokenDetails();
    };

    onPress = () => {
        const { item, account } = this.props;
        const { cachedTokenDetails } = this.state;

        Navigator.push<TransactionDetailsViewProps>(AppScreens.Transaction.Details, {
            item,
            account,
            cachedTokenDetails,
        });
    };

    getTokenDetails() {
        const { item, account } = this.props;
        const { participant, cachedTokenDetails } = this.state;

        if (cachedTokenDetails?.icon) return;

        let changesToAmmLine;
        let changesSwap;

        if ([
            'AMMCreate',
            'AMMDeposit',
            'AMMWithdraw',
        ].indexOf(item.TransactionType) > -1) {
            changesToAmmLine = Object.values(item.MetaData)
                .flat().filter(f => typeof f === 'object')
                .map(f => Object.values(f))
                .flat().filter(f => typeof f === 'object')
                .map(f => Object.values(f) as any)
                .flat().filter(f => typeof f.AMMID === 'string' && typeof f.Account === 'string')
                .map(f => f.Account)
                .map(issuer => trustLine.findBy('currency.issuer', issuer)?.[0])
                .filter(line => typeof line === 'object' && line && line?.currency)?.[0];
        }

        if (item.TransactionType === 'Payment' && item.Account === (item as any)?.Destination) {
            // Payment to self
            const itemAsAny = (item as any);
            const fieldsToCheck = ['SendMax', 'Amount', 'DeliverMin']; // In this order for logical from/to
            const mutations = fieldsToCheck
                .map(field => itemAsAny?.[field])
                .filter(field => !!field && field?.currency)
                .map(field => `${field.currency} ${field?.issuer || ''}`.trim())
                .reduce((a: string[], v: string) => {
                    if (a.indexOf(v) < 0) a.push(v);
                    return a;
                }, []);

            if (mutations.length === 2) {
                changesSwap = mutations.map(mutation => {
                    const [currency, issuer] = mutation.split(' ');
                    return trustLine.findBy('currency.currencyCode', currency)
                        .filter(line => line.currency.issuer === issuer)?.[0] || mutation;
                });
            }
        }

        if (changesToAmmLine) {
            this.setState({cachedTokenDetails: {
                account: changesToAmmLine.currency.issuer,
                participant: changesToAmmLine.currency.issuer,
                title: (
                    <Text style={styles.boldTitle}>
                        {changesToAmmLine.getFormattedCurrency()}
                        {
                            changesToAmmLine.isLiquidityPoolToken() && (
                                <View style={lpStyles.lpBadgeContainer}>
                                    <Badge
                                        label="LP"
                                        type={BadgeType.Planned}
                                        containerStyle={lpStyles.lpBadge}
                                    />
                                </View>
                            )
                        }
                    </Text>
                ),
                icon: (
                    <View style={styles.ammIcon}>
                        <TokenAvatar
                            token={changesToAmmLine}
                            // border
                            size={35}
                        />
                    </View>
                ),
            }});
        } else if (changesSwap) {
            const tokenNames = changesSwap.map(token => {
                return typeof token?.currency?.currencyCode === 'string'
                    ? token.getFormattedCurrency()
                    : typeof token === 'string'
                        ? ((t: string) => {
                            const tokenSplit = t.trim().split(' ');
                            if (
                                tokenSplit.length === 2 &&
                                (
                                    tokenSplit[0].match(/^[A-F0-9]{40}$/) || 
                                    tokenSplit[0].match(/^[a-zA-Z0-9]{3,}$/)
                                ) &&
                                tokenSplit[1].match(/^r/)
                            ) {
                                const normalized = NormalizeCurrencyCode(tokenSplit[0]);
                                if (normalized.length < 40) {
                                    return `${normalized} (${tokenSplit[1].slice(0, 8)}...)`;
                                }
                                return `${tokenSplit[0].slice(0, 8)}... ${tokenSplit[1].slice(0, 8)}...`;
                            }
                            return NormalizeCurrencyCode(t);
                    })(token)
                    : '?';
            }).join(' / ');

            this.setState({cachedTokenDetails: {
                account: item.Account,
                participant: participant?.address,
                title: (
                    <Text style={styles.boldTitle}>
                        {tokenNames}
                    </Text>
                ),
                icon: (
                    <View style={styles.ammIcon}>
                        <TokenAvatar
                            tokenPair={changesSwap}
                            // border
                            size={35}
                        />
                    </View>
                ),
            }});  
        } else {
            this.setState({cachedTokenDetails: {
                account: account.address,
                participant: participant?.address,
                title: <Blocks.LabelBlock item={item} account={account} participant={participant} />,
                icon: <Blocks.AvatarBlock participant={participant} item={item} />,
            }});
        }
    }

    render() {
        const { item, account } = this.props; // , rates
        const { participant, explainer, isFeeTransaction, feeText, cachedTokenDetails } = this.state;

        // if participant is block the show an overlay to reduce the visibility
        const showHalfTransparent = participant?.blocked && !isFeeTransaction;
        const opacity = { opacity: showHalfTransparent ? 0.3 : 1 };

        const isRejected = item.MetaData?.TransactionResult === 'tecHOOK_REJECTED';

        let hasBalanceChanges = true;
        const mutations = item.BalanceChange(account.address);
        if (!mutations?.[OperationActions.INC]?.[0] && !mutations?.[OperationActions.DEC]?.[0]) {
            if (item?.Account !== account.address && (item as any)?.Issuer !== account.address) {
                                                            // ^^ Credential
                hasBalanceChanges = false;
            }
        }

        return (
            <TouchableDebounce
                onPress={this.onPress}
                activeOpacity={Math.min(0.6, 0.6 * opacity.opacity)}
                style={[
                    styles.container,
                    {
                        height: isFeeTransaction
                            ? TransactionItem.FeeHeight
                            : TransactionItem.Height,
                    },
                ]}
            >
                <View style={[AppStyles.flex1, AppStyles.centerContent, opacity]}>
                    { isFeeTransaction && (
                        <View style={[ styles.feeTxAvatar ]}>
                            <Text>💝</Text>
                        </View>
                    )}
                    { !isFeeTransaction && (
                        cachedTokenDetails?.icon
                    )}
                </View>
                <View style={[AppStyles.flex3, AppStyles.centerContent, opacity]}>
                    { !isFeeTransaction && hasBalanceChanges && (
                        cachedTokenDetails?.title
                    )}
                    { !isFeeTransaction && !hasBalanceChanges && (
                        <Text style={[
                            styles.feeTxText,
                            styles.actionText,
                            styles.label,
                        ]}>{item.TransactionType}</Text>
                    )}
                    { isFeeTransaction && (
                        <Text style={styles.feeTxText}>{Localize.t('events.serviceFee')}</Text>
                    )}
                    { !isFeeTransaction && !participant?.blocked && (
                        <View style={[AppStyles.row, AppStyles.centerAligned]}>
                            {hasBalanceChanges && (
                                <Blocks.ActionBlock item={item} explainer={explainer} participant={participant} />
                            )}
                            {!hasBalanceChanges && (
                                <Text style={[
                                    styles.actionText,
                                ]}>{Localize.t('events.thirdPartyTx')}</Text>
                            )}
                            <Blocks.IndicatorIconBlock item={item} account={account} />
                        </View>
                    )}
                    { !isFeeTransaction && participant?.blocked && (
                        <Text style={styles.feeTxText}>{Localize.t('global.unusualTransaction')}</Text>
                    )}
                </View>
                <View style={[AppStyles.flex2, AppStyles.rightAligned, AppStyles.centerContent, opacity]}>
                    { isFeeTransaction && (
                        <Text style={[ styles.requestTimeText, styles.naturalColor, styles.currency ]}>
                            { feeText }
                        </Text>
                    )}
                    { !isFeeTransaction && !isRejected && hasBalanceChanges && (
                        <Blocks.MonetaryBlock explainer={explainer} />
                    )}
                    { !isFeeTransaction && isRejected && (
                        <Icon name="IconAlertTriangle" size={20} style={styles.iconHookRejcted} />
                    )}
                </View>
            </TouchableDebounce>
        );
    }
}

export default TransactionItem;
