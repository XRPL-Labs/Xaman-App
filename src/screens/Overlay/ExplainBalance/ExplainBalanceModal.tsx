/**
 * Add Currency Screen
 */

import { sortBy, filter } from 'lodash';
import React, { Component } from 'react';
import { View, Text, ScrollView, InteractionManager } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { Toast } from '@common/helpers/interface';
import { AppScreens } from '@common/constants';

import { LedgerEntriesTypes } from '@common/libs/ledger/objects/types';

import { AccountSchema, TrustLineSchema } from '@store/schemas/latest';

import LedgerService from '@services/LedgerService';

import { NormalizeCurrencyCode } from '@common/utils/amount';
import { CalculateAvailableBalance } from '@common/utils/balance';

// components
import { Avatar, Button, Icon, Spacer, LoadingIndicator, ActionPanel } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountSchema;
}

export interface State {
    isLoading: boolean;
    accountObjects: any;
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
            networkReserve: LedgerService.getNetworkReserve(),
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.setAccountObjects);
    }

    loadAccountObjects = (
        account: string,
        marker?: string,
        combined = [] as LedgerEntriesTypes[],
    ): Promise<LedgerEntriesTypes[]> => {
        return LedgerService.getAccountObjects(account).then((resp) => {
            const { account_objects, marker: _marker } = resp;
            // ignore trustline as we handle them in better way
            // ignore incoming objects
            const filtered = filter(account_objects, (o) => {
                return o.LedgerEntryType !== 'RippleState' && o.Account === account;
            });

            if (_marker && _marker !== marker) {
                return this.loadAccountObjects(account, _marker, filtered.concat(combined));
            }

            return filtered.concat(combined);
        });
    };

    setAccountObjects = async () => {
        const { account } = this.props;

        this.loadAccountObjects(account.address)
            .then((accountObjects) => {
                this.setState({
                    accountObjects: sortBy(accountObjects, 'LedgerEntryType'),
                });
            })
            .catch(() => {
                Toast(Localize.t('account.unableToCheckAccountObjects'));
            })
            .finally(() => {
                this.setState({
                    isLoading: false,
                });
            });
    };

    renderAccountObjects = () => {
        const { accountObjects, networkReserve } = this.state;

        if (accountObjects.length === 0) {
            return null;
        }

        return accountObjects.map((item: any, index: number) => {
            const { LedgerEntryType } = item;

            return (
                <View key={`object-${index}`} style={[styles.objectItemCard]}>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <View style={[styles.iconContainer]}>
                            <Icon name="IconInfo" size={16} style={[AppStyles.imgColorGrey]} />
                        </View>
                        <Text style={[styles.rowLabel]}>{LedgerEntryType}</Text>
                    </View>
                    <View style={[AppStyles.flex4, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}>
                        <Text style={[styles.reserveAmount]}>{networkReserve.OwnerReserve} XRP</Text>
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
                {account.lines.map((line: TrustLineSchema, index: number) => {
                    // don't render obligation trustlines
                    if (line.obligation) return null;

                    return (
                        <View key={`line-${index}`} style={[styles.objectItemCard]}>
                            <View style={[AppStyles.flex5, AppStyles.row, AppStyles.centerAligned]}>
                                <View style={[styles.brandAvatarContainer]}>
                                    <Avatar border size={32} source={{ uri: line.counterParty.avatar }} />
                                </View>
                                <Text style={[styles.rowLabel]}>
                                    {Localize.t('global.asset')}
                                    <Text style={styles.rowLabelSmall}>
                                        {` (${line.counterParty.name} ${NormalizeCurrencyCode(
                                            line.currency.currency,
                                        )})`}
                                    </Text>
                                </Text>
                            </View>
                            <View style={[AppStyles.flex1, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}>
                                <Text style={[styles.reserveAmount]}>{networkReserve.OwnerReserve} XRP</Text>
                            </View>
                        </View>
                    );
                })}
            </>
        );
    };

    renderUnknownObjects = () => {
        const { account } = this.props;
        const { accountObjects, networkReserve } = this.state;

        if (account.ownerCount > accountObjects.length + account.lines.length) {
            const remainingOwner = account.ownerCount - (accountObjects.length + account.lines.length);

            return (
                <View style={[styles.objectItemCard]}>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <View style={[styles.iconContainer]}>
                            <Icon name="IconInfo" size={15} style={[AppStyles.imgColorGrey]} />
                        </View>
                        <Text style={[styles.rowLabel]}>{Localize.t('global.otherReserveSeeExplorer')}</Text>
                    </View>
                    <View style={[AppStyles.flex4, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}>
                        <Text style={[styles.reserveAmount]}>{remainingOwner * networkReserve.OwnerReserve} XRP</Text>
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
                <View style={[styles.scrollStickyHeader]}>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <View style={[styles.iconContainer]}>
                            <Icon name="IconLock" size={20} />
                        </View>
                        <Text style={[styles.rowLabelBig]}>{Localize.t('global.totalReserved')}</Text>
                    </View>
                    <View style={[AppStyles.flex4, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}>
                        <Text style={[AppStyles.h5, AppStyles.monoBold]}>
                            {Localize.formatNumber(
                                account.ownerCount * networkReserve.OwnerReserve + networkReserve.BaseReserve,
                            )}{' '}
                            XRP
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    renderReserves = () => {
        const { networkReserve } = this.state;

        return (
            <View style={[AppStyles.paddingHorizontalSml]}>
                <View style={[styles.objectItemCard]}>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <View style={[styles.iconContainer]}>
                            <Icon name="IconAccount" size={15} style={[AppStyles.imgColorGrey]} />
                        </View>
                        <Text style={[styles.rowLabel]}>{Localize.t('account.walletReserve')}</Text>
                    </View>
                    <View style={[AppStyles.flex4, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}>
                        <Text style={[styles.reserveAmount]}>{networkReserve.BaseReserve} XRP</Text>
                    </View>
                </View>

                {this.renderAccountLines()}
                {this.renderAccountObjects()}
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
                    contentContainerStyle={[AppStyles.stretchSelf]}
                    stickyHeaderIndices={[1]}
                    scrollEventThrottle={1}
                >
                    <View style={[AppStyles.paddingHorizontalSml]}>
                        <Text style={[styles.rowTitle]}>{Localize.t('account.accountBalance')}</Text>
                        <View style={[styles.objectItemCard]}>
                            <View style={[AppStyles.row, AppStyles.centerAligned]}>
                                <View style={[styles.iconContainer]}>
                                    <Icon name="IconXrp" size={20} style={[AppStyles.imgColorGrey]} />
                                </View>
                                <Text style={[styles.currencyLabel, AppStyles.colorGrey]}>XRP</Text>
                            </View>
                            <View style={[AppStyles.flex4, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}>
                                <Text style={[AppStyles.h5, AppStyles.monoBold, AppStyles.colorGrey]}>
                                    {Localize.formatNumber(account.balance)}
                                </Text>
                            </View>
                        </View>

                        <Spacer size={30} />

                        <Text style={[styles.rowTitle]}>{Localize.t('account.availableForSpending')}</Text>
                        <View style={[styles.objectItemCard]}>
                            <View style={[AppStyles.row, AppStyles.centerAligned]}>
                                <View style={[styles.iconContainer]}>
                                    <Icon name="IconXrp" size={20} />
                                </View>
                                <Text style={[styles.currencyLabel]}>XRP</Text>
                            </View>
                            <View style={[AppStyles.flex4, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}>
                                <Text style={[AppStyles.h5, AppStyles.monoBold]}>
                                    {Localize.formatNumber(CalculateAvailableBalance(account))}
                                </Text>
                            </View>
                        </View>
                        <Spacer size={30} />
                        <Text style={[styles.rowTitle]}>{Localize.t('global.reservedOnLedger')}</Text>
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
