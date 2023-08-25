/**
 * Add Currency Screen
 */

import { sortBy, filter, countBy, forEach } from 'lodash';
import React, { Component } from 'react';
import { View, Text, ScrollView, InteractionManager } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { Toast } from '@common/helpers/interface';
import { AppScreens } from '@common/constants';

import { LedgerEntriesTypes } from '@common/libs/ledger/types';

import { AccountModel, TrustLineModel } from '@store/models';

import NetworkService from '@services/NetworkService';
import LedgerService from '@services/LedgerService';

import { NormalizeCurrencyCode } from '@common/utils/amount';
import { CalculateAvailableBalance } from '@common/utils/balance';
import { DecodeAccountId } from '@common/utils/codec';

// components
import { Button, Icon, Spacer, LoadingIndicator, ActionPanel, TokenAvatar, TokenIcon } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountModel;
}

export interface State {
    isLoading: boolean;
    accountObjects: any;
    nfTokenPageCount: number;
    networkReserve: any;
}

/* Component ==================================================================== */
class ExplainBalanceOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.ExplainBalance;

    private actionPanel: ActionPanel;

    static options() {
        return {
            statusBar: {
                visible: true,
                style: 'light',
            },
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            accountObjects: [],
            nfTokenPageCount: 0,
            networkReserve: NetworkService.getNetworkReserve(),
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.setAccountObjectsState);
    }

    loadAccountObjects = (
        account: string,
        marker?: string,
        combined = [] as LedgerEntriesTypes[],
    ): Promise<LedgerEntriesTypes[]> => {
        return LedgerService.getAccountObjects(account, { marker }).then((resp) => {
            const { account_objects, marker: _marker } = resp;

            // ignore TrustLines as we handle them in better way
            // ignore incoming objects
            const filtered = filter(account_objects, (o) => {
                return (
                    o.LedgerEntryType !== 'RippleState' &&
                    // @ts-ignore
                    o.LedgerEntryType !== 'NFTokenPage' &&
                    // @ts-ignore
                    (o.Account === account ||
                        // @ts-ignore
                        o.Owner === account ||
                        ['SignerList', 'PayChannel'].includes(o.LedgerEntryType))
                );
            });

            if (_marker && _marker !== marker) {
                return this.loadAccountObjects(account, _marker, filtered.concat(combined));
            }

            return filtered.concat(combined);
        });
    };

    loadNFTokenPageCount = (account: string, marker?: string, count = 0): Promise<number> => {
        // calculate first marker
        if (!marker) {
            marker = `${DecodeAccountId(account)}${'0'.repeat(24)}`;
        }
        return LedgerService.getLedgerData(marker, 10).then((resp: any) => {
            const { state, marker: _marker } = resp;

            let tokenPageCount = count;
            let endOfPage = false;

            forEach(state, (entry: any) => {
                const { LedgerEntryType } = entry;

                if (endOfPage) {
                    return;
                }

                if (LedgerEntryType === 'NFTokenPage') {
                    tokenPageCount += 1;
                } else {
                    endOfPage = true;
                }
            });

            if (!endOfPage && _marker && _marker !== marker && _marker.slice(0, 40) === marker.slice(0, 40)) {
                return this.loadNFTokenPageCount(account, _marker, tokenPageCount);
            }
            return tokenPageCount;
        });
    };

    setAccountObjectsState = async () => {
        const { account } = this.props;

        try {
            await this.loadAccountObjects(account.address).then((accountObjects) => {
                this.setState({
                    accountObjects: sortBy(accountObjects, 'LedgerEntryType'),
                });
            });

            await this.loadNFTokenPageCount(account.address).then((nfTokenPageCount) => {
                this.setState({
                    nfTokenPageCount,
                });
            });
        } catch {
            Toast(Localize.t('account.unableToCheckAccountObjects'));
        } finally {
            this.setState({
                isLoading: false,
            });
        }
    };

    renderAccountObjects = () => {
        const { accountObjects, networkReserve } = this.state;

        if (accountObjects.length === 0) {
            return null;
        }

        const accountObjectsCount = countBy(accountObjects, 'LedgerEntryType');

        return Object.keys(accountObjectsCount).map((entryType) => {
            const count = accountObjectsCount[entryType];

            let normalizedEntryType;
            switch (entryType) {
                case 'PayChannel':
                    normalizedEntryType = Localize.t('events.paymentChannel');
                    break;
                default:
                    normalizedEntryType = entryType;
            }

            const label = count > 1 ? `${normalizedEntryType}s (${count})` : normalizedEntryType;
            const totalReserve = count * networkReserve.OwnerReserve;
            return (
                <View key={`objects-${entryType}`} style={styles.objectItemCard}>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <View style={styles.iconContainer}>
                            <Icon name="IconInfo" size={16} style={AppStyles.imgColorGrey} />
                        </View>
                        <Text style={styles.rowLabel}>{label}</Text>
                    </View>
                    <View style={[AppStyles.flex4, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}>
                        <Text style={styles.reserveAmount}>
                            {totalReserve} {NetworkService.getNativeAsset()}
                        </Text>
                    </View>
                </View>
            );
        });
    };

    renderAccountLines = () => {
        const { account } = this.props;
        const { networkReserve } = this.state;

        if (account.lines.length === 0) return null;

        return (
            <>
                {account.lines.map((line: TrustLineModel, index: number) => {
                    // don't render obligation TrustLines
                    if (line.obligation) return null;

                    return (
                        <View key={`line-${index}`} style={styles.objectItemCard}>
                            <View style={[AppStyles.flex5, AppStyles.row, AppStyles.centerAligned]}>
                                <View style={styles.brandAvatarContainer}>
                                    <TokenAvatar token={line} border size={32} />
                                </View>
                                <Text style={styles.rowLabel}>
                                    {Localize.t('global.asset')}
                                    <Text style={styles.rowLabelSmall}>
                                        {` (${line.counterParty.name} ${NormalizeCurrencyCode(
                                            line.currency.currency,
                                        )})`}
                                    </Text>
                                </Text>
                            </View>
                            <View style={[AppStyles.flex1, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}>
                                <Text style={styles.reserveAmount}>
                                    {networkReserve.OwnerReserve} {NetworkService.getNativeAsset()}
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </>
        );
    };

    renderNFTokenPages = () => {
        const { nfTokenPageCount, networkReserve } = this.state;

        if (nfTokenPageCount) {
            const label = nfTokenPageCount > 1 ? `NFTokenPages (${nfTokenPageCount})` : 'NFTokenPages';

            return (
                <View style={styles.objectItemCard}>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <View style={styles.iconContainer}>
                            <Icon name="IconInfo" size={15} style={AppStyles.imgColorGrey} />
                        </View>
                        <Text style={styles.rowLabel}>{label}</Text>
                    </View>
                    <View style={[AppStyles.flex4, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}>
                        <Text style={styles.reserveAmount}>
                            {nfTokenPageCount * networkReserve.OwnerReserve} {NetworkService.getNativeAsset()}
                        </Text>
                    </View>
                </View>
            );
        }
        return null;
    };

    renderUnknownObjects = () => {
        const { account } = this.props;
        const { accountObjects, nfTokenPageCount, networkReserve } = this.state;

        const remainingOwner = account.ownerCount - (accountObjects.length + nfTokenPageCount + account.lines.length);

        if (remainingOwner > 0) {
            return (
                <View style={styles.objectItemCard}>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <View style={styles.iconContainer}>
                            <Icon name="IconInfo" size={15} style={AppStyles.imgColorGrey} />
                        </View>
                        <Text style={styles.rowLabel}>{Localize.t('global.otherReserveSeeExplorer')}</Text>
                    </View>
                    <View style={[AppStyles.flex4, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}>
                        <Text style={styles.reserveAmount}>
                            {remainingOwner * networkReserve.OwnerReserve} {NetworkService.getNativeAsset()}
                        </Text>
                    </View>
                </View>
            );
        }
        return null;
    };

    renderTotalReserve = () => {
        const { account } = this.props;
        const { networkReserve } = this.state;
        return (
            <View>
                <View style={styles.scrollStickyHeader}>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <View style={styles.iconContainer}>
                            <Icon name="IconLock" size={20} />
                        </View>
                        <Text style={styles.rowLabelBig}>{Localize.t('global.totalReserved')}</Text>
                    </View>
                    <View style={[AppStyles.flex4, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}>
                        <Text style={[AppStyles.h5, AppStyles.monoBold]}>
                            {Localize.formatNumber(
                                account.ownerCount * networkReserve.OwnerReserve + networkReserve.BaseReserve,
                            )}{' '}
                            {NetworkService.getNativeAsset()}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    renderReserves = () => {
        const { networkReserve } = this.state;

        return (
            <View style={AppStyles.paddingHorizontalSml}>
                <View style={styles.objectItemCard}>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <View style={styles.iconContainer}>
                            <Icon name="IconAccount" size={15} style={AppStyles.imgColorGrey} />
                        </View>
                        <Text style={styles.rowLabel}>{Localize.t('account.walletReserve')}</Text>
                    </View>
                    <View style={[AppStyles.flex4, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}>
                        <Text style={styles.reserveAmount}>
                            {networkReserve.BaseReserve} {NetworkService.getNativeAsset()}
                        </Text>
                    </View>
                </View>

                {this.renderAccountLines()}
                {this.renderAccountObjects()}
                {this.renderNFTokenPages()}
                {this.renderUnknownObjects()}

                <Spacer size={50} />
            </View>
        );
    };

    render() {
        const { account } = this.props;
        const { isLoading } = this.state;

        return (
            <ActionPanel
                height={AppSizes.heightPercentageToDP(88)}
                onSlideDown={Navigator.dismissOverlay}
                ref={(r) => {
                    this.actionPanel = r;
                }}
            >
                <View style={[AppStyles.row, AppStyles.centerAligned, AppStyles.paddingBottomSml]}>
                    <View style={[AppStyles.flex1, AppStyles.paddingLeftSml]}>
                        <Text numberOfLines={1} style={[AppStyles.h5, AppStyles.strong]}>
                            {Localize.t('global.balance')}
                        </Text>
                    </View>
                    <View style={[AppStyles.row, AppStyles.flex1, AppStyles.paddingRightSml, AppStyles.flexEnd]}>
                        <Button
                            numberOfLines={1}
                            light
                            roundedSmall
                            isDisabled={false}
                            onPress={() => {
                                if (this.actionPanel) {
                                    this.actionPanel.slideDown();
                                }
                            }}
                            textStyle={[AppStyles.subtext, AppStyles.bold]}
                            label={Localize.t('global.close')}
                        />
                    </View>
                </View>
                <View
                    style={[
                        AppStyles.row,
                        AppStyles.centerContent,
                        AppStyles.paddingBottom,
                        AppStyles.paddingHorizontalSml,
                    ]}
                >
                    <Text style={[AppStyles.p, AppStyles.subtext, AppStyles.textCenterAligned]}>
                        {Localize.t('home.xrpYouOwnVsYourSpendableBalance')}
                    </Text>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    contentContainerStyle={AppStyles.stretchSelf}
                    stickyHeaderIndices={[1]}
                    scrollEventThrottle={1}
                >
                    <View style={AppStyles.paddingHorizontalSml}>
                        <Text style={styles.rowTitle}>{Localize.t('account.accountBalance')}</Text>
                        <View style={styles.objectItemCard}>
                            <View style={[AppStyles.row, AppStyles.centerAligned]}>
                                <TokenIcon
                                    size={20}
                                    token="Native"
                                    containerStyle={styles.iconContainer}
                                    style={[AppStyles.imgColorGrey]}
                                />
                                <Text style={[styles.currencyLabel, AppStyles.colorGrey]}>
                                    {NetworkService.getNativeAsset()}
                                </Text>
                            </View>
                            <View style={[AppStyles.flex4, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}>
                                <Text style={[AppStyles.h5, AppStyles.monoBold, AppStyles.colorGrey]}>
                                    {Localize.formatNumber(account.balance)}
                                </Text>
                            </View>
                        </View>

                        <Spacer size={30} />

                        <Text style={styles.rowTitle}>{Localize.t('account.availableForSpending')}</Text>
                        <View style={styles.objectItemCard}>
                            <View style={[AppStyles.row, AppStyles.centerAligned]}>
                                <TokenIcon size={20} token="Native" containerStyle={styles.iconContainer} />
                                <Text style={styles.currencyLabel}>{NetworkService.getNativeAsset()}</Text>
                            </View>
                            <View style={[AppStyles.flex4, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}>
                                <Text style={[AppStyles.h5, AppStyles.monoBold]}>
                                    {Localize.formatNumber(CalculateAvailableBalance(account, true))}
                                </Text>
                            </View>
                        </View>
                        <Spacer size={30} />
                        <Text style={styles.rowTitle}>{Localize.t('global.reservedOnLedger')}</Text>
                        <Spacer size={10} />
                    </View>

                    {this.renderTotalReserve()}
                    {isLoading ? (
                        <>
                            <Spacer size={20} />
                            <LoadingIndicator />
                        </>
                    ) : (
                        this.renderReserves()
                    )}
                </ScrollView>
            </ActionPanel>
        );
    }
}

/* Export Component ==================================================================== */
export default ExplainBalanceOverlay;
