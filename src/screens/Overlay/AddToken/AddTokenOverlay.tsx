/**
 * Add Token Screen
 */

import { find, first, get, isEmpty, values } from 'lodash';

import React, { Component } from 'react';
import { Alert, Image, InteractionManager, ScrollView, Text, View } from 'react-native';

import LedgerService from '@services/LedgerService';
import NetworkService from '@services/NetworkService';
import BackendService from '@services/BackendService';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { TrustSet } from '@common/libs/ledger/transactions';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

import { Payload } from '@common/libs/payload';
import { AccountRepository } from '@store/repositories';
import { AccountModel } from '@store/models';

// components
import {
    ActionPanel,
    Button,
    Footer,
    InfoMessage,
    LoadingIndicator,
    Spacer,
    TouchableDebounce,
} from '@components/General';

import Localize from '@locale';

// style
import { AppSizes, AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountModel;
}

export interface State {
    dataSource?: XamanBackend.CuratedIOUsDetails;
    selectedPartyId?: number;
    selectedCurrencyId?: number;
    isLoading: boolean;
    isLoadingTokenInfo: boolean;
    error: boolean;
}

/* Component ==================================================================== */
class AddTokenOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.AddToken;

    private actionPanelRef: React.RefObject<ActionPanel>;

    static options() {
        return {
            statusBar: {
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
            dataSource: undefined,
            selectedPartyId: undefined,
            selectedCurrencyId: undefined,
            isLoading: true,
            isLoadingTokenInfo: false,
            error: false,
        };

        this.actionPanelRef = React.createRef();
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.loadVettedTokens);
    }

    loadVettedTokens = async () => {
        const { isLoading } = this.state;

        try {
            if (!isLoading) {
                this.setState({
                    isLoading: true,
                    error: false,
                });
            }

            const { details } = await BackendService.getCuratedIOUs(0, true);

            // set default selected party and currency to the first in the list
            const selectedParty = first(values(details));
            const selectedPartyId = get(selectedParty, 'id');
            const selectedCurrencyId = get(first(values(get(selectedParty, 'currencies'))), 'id');

            // something is not right,
            if (!selectedPartyId || !selectedCurrencyId) {
                this.setState({
                    error: true,
                });
                return;
            }

            this.setState({
                dataSource: details,
                selectedPartyId,
                selectedCurrencyId,
            });
        } catch {
            this.setState({
                error: true,
            });
        } finally {
            this.setState({
                isLoading: false,
            });
        }
    };

    onAddPress = async () => {
        const { account } = this.props;
        const { dataSource, selectedPartyId, selectedCurrencyId } = this.state;

        const selectedCurrency = find(values(get(find(values(dataSource), { id: selectedPartyId }), 'currencies')), {
            id: selectedCurrencyId,
        });

        if (typeof selectedCurrency === 'undefined') {
            Alert.alert(Localize.t('global.error'), Localize.t('asset.selectCurrency'));
            return;
        }

        // if trustline is already exist return
        if (
            AccountRepository.hasCurrency(account, {
                issuer: selectedCurrency.issuer,
                currency: selectedCurrency.currency,
            })
        ) {
            Alert.alert(Localize.t('global.error'), Localize.t('asset.trustLineIsAlreadyExist'));
            return;
        }

        this.setState({
            isLoadingTokenInfo: true,
        });

        // set the default line limit
        let lineLimit = '1000000000';

        try {
            // set the trustline limit by gateway balance if it's more than our default value
            const resp = await LedgerService.getGatewayBalances(selectedCurrency.issuer);
            const gatewayBalances = get(resp, ['obligations', selectedCurrency.currency]);

            if (gatewayBalances && Number(gatewayBalances) > Number(lineLimit)) {
                lineLimit = gatewayBalances;
            }
        } catch {
            // ignore
        } finally {
            this.setState({
                isLoadingTokenInfo: false,
            });
        }

        const trustSet = new TrustSet({
            TransactionType: TransactionTypes.TrustSet,
            Account: account.address,
            Flags: 131072, // tfSetNoRipple
            LimitAmount: {
                currency: selectedCurrency.currency,
                issuer: selectedCurrency.issuer,
                value: lineLimit,
            },
        });

        const payload = Payload.build(
            trustSet.Json,
            Localize.t('asset.addingAssetReserveDescription', {
                ownerReserve: NetworkService.getNetworkReserve().OwnerReserve,
                nativeAsset: NetworkService.getNativeAsset(),
            }),
        );

        // slide down
        this.actionPanelRef?.current?.slideDown();

        setTimeout(() => {
            Navigator.showModal(
                AppScreens.Modal.ReviewTransaction,
                {
                    payload,
                },
                { modalPresentationStyle: 'fullScreen' },
            );
        }, 800);
    };

    onCancelPress = () => {
        this.actionPanelRef?.current?.slideDown();
    };

    renderCurrencies = () => {
        const { dataSource, selectedPartyId, selectedCurrencyId } = this.state;

        const currencies = values(get(find(values(dataSource), { id: selectedPartyId }), 'currencies'));

        if (isEmpty(currencies)) {
            return (
                <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]} adjustsFontSizeToFit numberOfLines={1}>
                    No Item to show
                </Text>
            );
        }

        return currencies.map((currency, index) => {
            const selected = currency.id === selectedCurrencyId;

            return (
                <TouchableDebounce
                    testID={`currency-${currency.issuer}.${currency.currency}`}
                    key={index}
                    style={[styles.listItem, selected && styles.selectedRow]}
                    onPress={() => {
                        this.setState({
                            selectedCurrencyId: currency.id,
                        });
                    }}
                >
                    <View style={[AppStyles.flex3, AppStyles.row, AppStyles.centerAligned]}>
                        <View style={AppStyles.flex1}>
                            <Image style={styles.currencyAvatar} source={{ uri: currency.avatar }} />
                        </View>
                        <View style={AppStyles.flex3}>
                            <Text
                                style={[AppStyles.subtext, selected && styles.selectedText]}
                                adjustsFontSizeToFit
                                numberOfLines={1}
                            >
                                {currency.name}
                            </Text>
                        </View>
                    </View>
                </TouchableDebounce>
            );
        });
    };

    renderParties = () => {
        const { dataSource, selectedPartyId } = this.state;

        const parties = values(dataSource);

        if (isEmpty(parties)) {
            return (
                <Text
                    key="empty-parties"
                    style={[AppStyles.subtext, AppStyles.textCenterAligned]}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                >
                    No Item to show
                </Text>
            );
        }

        return parties.map((party, index) => {
            // if selected party on the list
            const selected = selectedPartyId === party.id;

            return (
                <TouchableDebounce
                    testID={`counterParty-${party.name}`}
                    key={index}
                    style={[styles.listItem, selected && styles.selectedRow]}
                    onPress={() => {
                        this.setState({
                            selectedPartyId: party.id,
                            selectedCurrencyId: get(first(values(get(party, 'currencies'))), 'id'),
                        });
                    }}
                >
                    <View style={[AppStyles.flex3, AppStyles.row, AppStyles.centerAligned]}>
                        <View style={AppStyles.flex1}>
                            <Image style={styles.avatar} source={{ uri: party.avatar }} />
                        </View>
                        <View style={AppStyles.flex3}>
                            <Text
                                style={[AppStyles.subtext, selected && styles.selectedText]}
                                adjustsFontSizeToFit
                                numberOfLines={1}
                            >
                                {party.name}
                                {party.name && ` (${values(get(party, 'currencies')).length})`}
                            </Text>
                        </View>
                    </View>
                </TouchableDebounce>
            );
        });
    };

    renderContent = () => {
        const { isLoading, error } = this.state;

        if (isLoading) {
            return (
                <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                    <LoadingIndicator size="large" />
                    <Spacer />
                    <Text style={AppStyles.p}>{Localize.t('global.loading')}</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.errorContainer}>
                    <InfoMessage
                        type="error"
                        label={Localize.t('asset.unableToLoadListOfTokens')}
                        actionButtonLabel={Localize.t('global.tryAgain')}
                        actionButtonIcon="IconRefresh"
                        onActionButtonPress={this.loadVettedTokens}
                    />
                </View>
            );
        }

        return (
            <View style={[AppStyles.flex1, AppStyles.row]}>
                <ScrollView style={AppStyles.flex1}>{this.renderParties()}</ScrollView>
                <View style={styles.separator} />
                <ScrollView style={AppStyles.flex1}>{this.renderCurrencies()}</ScrollView>
            </View>
        );
    };

    render() {
        const { selectedCurrencyId, isLoadingTokenInfo } = this.state;

        return (
            <ActionPanel
                height={AppSizes.heightPercentageToDP(90)}
                onSlideDown={Navigator.dismissOverlay}
                testID="add-asset-overlay"
                ref={this.actionPanelRef}
                contentStyle={AppStyles.centerAligned}
            >
                <View style={[AppStyles.row, AppStyles.centerAligned, AppStyles.paddingBottomSml]}>
                    <View style={[AppStyles.flex1, AppStyles.paddingLeftSml]}>
                        <Text numberOfLines={1} style={[AppStyles.h5, AppStyles.strong]}>
                            {Localize.t('asset.addAsset')}
                        </Text>
                    </View>
                    <View style={[AppStyles.row, AppStyles.flex1, AppStyles.paddingRightSml, AppStyles.flexEnd]}>
                        <Button
                            light
                            roundedSmall
                            isDisabled={false}
                            onPress={this.onCancelPress}
                            textStyle={[AppStyles.subtext, AppStyles.bold]}
                            label={Localize.t('global.cancel')}
                        />
                    </View>
                </View>
                <View style={[AppStyles.row, AppStyles.centerContent, AppStyles.marginBottomSml]}>
                    <Text numberOfLines={3} style={[AppStyles.p, AppStyles.subtext, AppStyles.textCenterAligned]}>
                        {Localize.t('asset.selectAnExchangeAndSelectAsset')}
                    </Text>
                </View>

                <View style={[AppStyles.row, AppStyles.paddingExtraSml]}>
                    <View style={AppStyles.flex1}>
                        <Text
                            numberOfLines={1}
                            style={[AppStyles.subtext, AppStyles.bold, AppStyles.textCenterAligned]}
                        >
                            {Localize.t('global.exchanges')}:
                        </Text>
                    </View>
                    <View style={styles.separator} />
                    <View style={AppStyles.flex1}>
                        <Text
                            numberOfLines={1}
                            style={[AppStyles.subtext, AppStyles.bold, AppStyles.textCenterAligned]}
                        >
                            {Localize.t('global.assets')}:
                        </Text>
                    </View>
                </View>

                {this.renderContent()}

                <Footer style={styles.footer}>
                    <Button
                        isLoading={isLoadingTokenInfo}
                        numberOfLines={1}
                        testID="add-and-sign-button"
                        isDisabled={!selectedCurrencyId}
                        onPress={this.onAddPress}
                        style={AppStyles.buttonGreen}
                        label={Localize.t('asset.addAndSign')}
                    />
                </Footer>
            </ActionPanel>
        );
    }
}

/* Export Component ==================================================================== */
export default AddTokenOverlay;
