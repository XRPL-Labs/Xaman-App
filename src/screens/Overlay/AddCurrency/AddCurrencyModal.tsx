/**
 * Add Currency Screen
 */

import { head, first, forEach, isEmpty, get } from 'lodash';

import React, { Component } from 'react';
import { View, Text, Image, ScrollView, Alert } from 'react-native';

import LedgerService from '@services/LedgerService';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { Payload } from '@common/libs/payload';
import { CounterPartyRepository } from '@store/repositories';
import { CounterPartySchema, CurrencySchema, AccountSchema } from '@store/schemas/latest';

// components
import { TouchableDebounce, Button, Footer, ActionPanel } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountSchema;
}

export interface CurrenciesList {
    [key: string]: CurrencySchema[];
}

export interface State {
    counterParties: CounterPartySchema[];
    currencies: CurrenciesList;
    selectedCurrency: CurrencySchema;
    selectedParty: CounterPartySchema;
    isLoading: boolean;
}

/* Component ==================================================================== */
class AddCurrencyOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.AddCurrency;

    private actionPanel: ActionPanel;

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
            counterParties: undefined,
            currencies: undefined,
            selectedParty: undefined,
            selectedCurrency: undefined,
            isLoading: false,
        };
    }

    componentDidMount() {
        this.setDefaults();
    }

    setDefaults = () => {
        const counterParties = CounterPartyRepository.query({ shortlist: true }) as any;

        if (counterParties.isEmpty()) return;

        const availableParties = [] as CounterPartySchema[];
        const availableCurrencies = [] as any;

        forEach(counterParties, (counterParty) => {
            const currencies = [] as any;

            forEach(counterParty.currencies, (currency) => {
                if (currency.shortlist === true) {
                    currencies.push(currency);
                }
            });

            if (!isEmpty(currencies)) {
                availableParties.push(counterParty);
                availableCurrencies[counterParty.id] = currencies;
            }
        });

        this.setState({
            counterParties: availableParties,
            currencies: availableCurrencies,
            selectedParty: head(availableParties),
            selectedCurrency: head(get(availableCurrencies, head(availableParties)?.id)),
        });
    };

    onAddPress = async () => {
        const { account } = this.props;
        const { selectedCurrency } = this.state;

        if (!selectedCurrency.isValid()) {
            return;
        }

        // if trustline is already exist return
        if (account.hasCurrency(selectedCurrency)) {
            Alert.alert(Localize.t('global.error'), Localize.t('asset.trustLineIsAlreadyExist'));
            return;
        }

        this.setState({
            isLoading: true,
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
                isLoading: false,
            });
        }

        const payload = await Payload.build(
            {
                TransactionType: 'TrustSet',
                Flags: 131072, // tfSetNoRipple
                LimitAmount: {
                    currency: selectedCurrency.currency,
                    issuer: selectedCurrency.issuer,
                    value: lineLimit,
                },
            },
            Localize.t('asset.addingAssetReserveDescription', {
                ownerReserve: LedgerService.getNetworkReserve().OwnerReserve,
            }),
        );

        if (this.actionPanel) {
            this.actionPanel.slideDown();
        }

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

    renderCurrencies = () => {
        const { counterParties, selectedParty, selectedCurrency, currencies } = this.state;

        if (isEmpty(counterParties)) {
            return (
                <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]} adjustsFontSizeToFit numberOfLines={1}>
                    No Item to show
                </Text>
            );
        }

        return currencies[selectedParty.id].map((c, index) => {
            if (!c.isValid()) {
                return null;
            }

            return (
                <TouchableDebounce
                    testID={c.id}
                    key={index}
                    style={[styles.listItem, selectedCurrency.id === c.id && styles.selectedRow]}
                    onPress={() => {
                        if (c.isValid() && selectedParty.isValid()) {
                            this.setState({
                                selectedCurrency: c,
                            });
                        }
                    }}
                >
                    <View style={[AppStyles.flex3, AppStyles.row, AppStyles.centerAligned]}>
                        <View style={[AppStyles.flex1]}>
                            <Image style={[styles.currencyAvatar]} source={{ uri: c.avatar }} />
                        </View>
                        <View style={[AppStyles.flex3]}>
                            <Text
                                style={[AppStyles.subtext, selectedCurrency.id === c.id && styles.selectedText]}
                                adjustsFontSizeToFit
                                numberOfLines={1}
                            >
                                {c.name}
                            </Text>
                        </View>
                    </View>
                </TouchableDebounce>
            );
        });
    };

    renderParties = () => {
        const { counterParties, selectedParty, currencies } = this.state;

        if (isEmpty(counterParties)) {
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

        return counterParties.map((c, index) => {
            if (!c?.isValid()) return null;

            const selected = selectedParty.id === c.id;

            return (
                <TouchableDebounce
                    key={index}
                    style={[styles.listItem, selected && styles.selectedRow]}
                    onPress={() => {
                        if (c.isValid()) {
                            this.setState({
                                selectedParty: c,
                                selectedCurrency: first(get(currencies, c.id)),
                            });
                        }
                    }}
                >
                    <View style={[AppStyles.flex3, AppStyles.row, AppStyles.centerAligned]}>
                        <View style={[AppStyles.flex1]}>
                            <Image style={styles.avatar} source={{ uri: c.avatar }} />
                        </View>
                        <View style={[AppStyles.flex3]}>
                            <Text
                                style={[AppStyles.subtext, selected && styles.selectedText]}
                                adjustsFontSizeToFit
                                numberOfLines={1}
                            >
                                {c.name}
                                {c.name && ` (${currencies[c.id].length})`}
                            </Text>
                        </View>
                    </View>
                </TouchableDebounce>
            );
        });
    };

    render() {
        const { selectedCurrency, isLoading } = this.state;

        return (
            <ActionPanel
                height={AppSizes.heightPercentageToDP(90)}
                onSlideDown={Navigator.dismissOverlay}
                testID="add-asset-overlay"
                ref={(r) => {
                    this.actionPanel = r;
                }}
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
                            onPress={() => {
                                if (this.actionPanel) {
                                    this.actionPanel.slideDown();
                                }
                            }}
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
                    <View style={[AppStyles.flex1]}>
                        <Text
                            numberOfLines={1}
                            style={[AppStyles.subtext, AppStyles.bold, AppStyles.textCenterAligned]}
                        >
                            {Localize.t('global.exchanges')}:
                        </Text>
                    </View>
                    <View style={styles.separator} />
                    <View style={[AppStyles.flex1]}>
                        <Text
                            numberOfLines={1}
                            style={[AppStyles.subtext, AppStyles.bold, AppStyles.textCenterAligned]}
                        >
                            {Localize.t('global.assets')}:
                        </Text>
                    </View>
                </View>
                <View style={[AppStyles.flex1, AppStyles.row]}>
                    <ScrollView style={[AppStyles.flex1]}>{this.renderParties()}</ScrollView>
                    <View style={styles.separator} />
                    <ScrollView style={[AppStyles.flex1]}>{this.renderCurrencies()}</ScrollView>
                </View>

                <Footer style={styles.footer}>
                    <Button
                        isLoading={isLoading}
                        numberOfLines={1}
                        testID="add-and-sign-button"
                        isDisabled={!selectedCurrency}
                        onPress={this.onAddPress}
                        style={[AppStyles.buttonGreen]}
                        label={Localize.t('asset.addAndSign')}
                    />
                </Footer>
            </ActionPanel>
        );
    }
}

/* Export Component ==================================================================== */
export default AddCurrencyOverlay;
