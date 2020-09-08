/**
 * Add Currency Screen
 */

import { head, first, forEach, isEmpty, get } from 'lodash';

import React, { Component } from 'react';
import {
    Animated,
    View,
    Text,
    Image,
    TouchableWithoutFeedback,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
} from 'react-native';

import Interactable from 'react-native-interactable';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { Payload } from '@common/libs/payload';
import { CounterPartyRepository } from '@store/repositories';
import { CounterPartySchema, CurrencySchema, AccountSchema } from '@store/schemas/latest';

// components
import { Button, Footer } from '@components/General';

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
}

/* Component ==================================================================== */
class AddCurrencyOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.AddCurrency;

    panel: any;
    deltaY: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.state = {
            counterParties: undefined,
            currencies: undefined,
            selectedParty: undefined,
            selectedCurrency: undefined,
        };

        this.deltaY = new Animated.Value(AppSizes.screen.height);
    }

    componentDidMount() {
        this.setDefaults();
        this.slideUp();
    }

    setDefaults = () => {
        const { account } = this.props;

        const counterParties = CounterPartyRepository.query({ shortlist: true }) as any;

        if (isEmpty(counterParties)) return;

        const availableParties = [] as CounterPartySchema[];
        const availableCurrencies = [] as any;

        forEach(counterParties, (counterParty) => {
            const currencies = [] as any;

            forEach(counterParty.currencies, (currency) => {
                if (!account.hasCurrency(currency) && currency.shortlist === true) {
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

    addCurrency = async () => {
        const { selectedCurrency } = this.state;

        const payload = await Payload.build(
            {
                TransactionType: 'TrustSet',
                Flags: 131072, // tfSetNoRipple
                LimitAmount: { currency: selectedCurrency.currency, issuer: selectedCurrency.issuer, value: 999999999 },
            },
            Localize.t('asset.addingAssetReserveDescription'),
        );

        Navigator.showModal(
            AppScreens.Modal.ReviewTransaction,
            { modalPresentationStyle: 'fullScreen' },
            {
                payload,
            },
        );

        this.slideDown();
    };

    slideUp = () => {
        setTimeout(() => {
            if (this.panel) {
                this.panel.snapTo({ index: 1 });
            }
        }, 10);
    };

    slideDown = () => {
        setTimeout(() => {
            if (this.panel) {
                this.panel.snapTo({ index: 0 });
            }
        });
    };

    onSnap = (event: any) => {
        const { index } = event.nativeEvent;

        if (index === 0) {
            Navigator.dismissOverlay();
        }
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
            return (
                <TouchableOpacity
                    key={index}
                    style={[styles.listItem, selectedCurrency.id === c.id && styles.selectedRow]}
                    onPress={() => {
                        this.setState({
                            selectedCurrency: c,
                        });
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
                </TouchableOpacity>
            );
        });
    };

    renderParties = () => {
        const { counterParties, selectedParty, currencies } = this.state;

        if (isEmpty(counterParties)) {
            return (
                <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]} adjustsFontSizeToFit numberOfLines={1}>
                    No Item to show
                </Text>
            );
        }

        return counterParties.map((c, index) => {
            if (!c.isValid()) return null;

            return (
                <TouchableOpacity
                    key={index}
                    style={[styles.listItem, selectedParty.id === c.id ? styles.selectedRow : null]}
                    onPress={() => {
                        this.setState({
                            selectedParty: c,
                            selectedCurrency: first(get(currencies, c.id)),
                        });
                    }}
                >
                    <View style={[AppStyles.flex3, AppStyles.row, AppStyles.centerAligned]}>
                        <View style={[AppStyles.flex1]}>
                            <Image style={styles.avatar} source={{ uri: c.avatar }} />
                        </View>
                        <View style={[AppStyles.flex3]}>
                            <Text
                                style={[AppStyles.subtext, selectedParty.id === c.id ? styles.selectedText : null]}
                                adjustsFontSizeToFit
                                numberOfLines={1}
                            >
                                {c.name}
                                {c.name && ` (${currencies[c.id].length})`}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        });
    };

    renderContent = () => {
        const { selectedCurrency } = this.state;

        return (
            <View style={[styles.visibleContent, AppStyles.centerAligned]}>
                <View style={AppStyles.panelHeader}>
                    <View style={AppStyles.panelHandle} />
                </View>

                <View style={[AppStyles.row, AppStyles.centerAligned, AppStyles.paddingBottomSml]}>
                    <View style={[AppStyles.flex1, AppStyles.paddingLeftSml]}>
                        <Text style={[AppStyles.h5, AppStyles.strong]}>{Localize.t('asset.addAsset')}</Text>
                    </View>
                    <View style={[AppStyles.row, AppStyles.flex1, AppStyles.paddingRightSml, AppStyles.flexEnd]}>
                        <Button
                            light
                            roundedSmall
                            isDisabled={false}
                            onPress={() => {
                                this.slideDown();
                            }}
                            textStyle={[AppStyles.subtext, AppStyles.bold]}
                            label={Localize.t('global.cancel')}
                        />
                    </View>
                </View>
                <View style={[AppStyles.row, AppStyles.centerContent, AppStyles.marginBottomSml]}>
                    <Text style={[AppStyles.p, AppStyles.subtext]}>
                        {Localize.t('asset.selectAnExchangeAndSelectAsset')}
                    </Text>
                </View>

                <View style={[AppStyles.row, AppStyles.paddingExtraSml]}>
                    <View style={[AppStyles.flex1]}>
                        <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.textCenterAligned]}>
                            {Localize.t('global.exchanges')}:
                        </Text>
                    </View>
                    <View style={styles.separator} />
                    <View style={[AppStyles.flex1]}>
                        <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.textCenterAligned]}>
                            {Localize.t('global.assets')}:
                        </Text>
                    </View>
                </View>
                <View style={[AppStyles.flex1, AppStyles.row]}>
                    <ScrollView style={[AppStyles.flex1]}>{this.renderParties()}</ScrollView>
                    <View style={styles.separator} />
                    <ScrollView style={[AppStyles.flex1]}>{this.renderCurrencies()}</ScrollView>
                </View>

                <SafeAreaView style={styles.footer}>
                    <Footer>
                        <Button
                            testID="add-and-sign-button"
                            block
                            isDisabled={!selectedCurrency}
                            onPress={this.addCurrency}
                            style={[AppStyles.buttonGreen]}
                            label={Localize.t('asset.addAndSign')}
                        />
                    </Footer>
                </SafeAreaView>
            </View>
        );
    };

    render() {
        return (
            <View testID="add-asset-overlay" style={AppStyles.flex1}>
                <TouchableWithoutFeedback onPress={this.slideDown}>
                    <Animated.View
                        style={[
                            AppStyles.shadowContent,
                            {
                                opacity: this.deltaY.interpolate({
                                    inputRange: [0, AppSizes.screen.height],
                                    outputRange: [0.9, 0],
                                    extrapolateRight: 'clamp',
                                }),
                            },
                        ]}
                    />
                </TouchableWithoutFeedback>

                <Interactable.View
                    ref={(r) => {
                        this.panel = r;
                    }}
                    animatedNativeDriver
                    onSnap={this.onSnap}
                    verticalOnly
                    snapPoints={[{ y: AppSizes.screen.height + 3 }, { y: AppSizes.heightPercentageToDP(10) }]}
                    boundaries={{ top: AppSizes.heightPercentageToDP(8) }}
                    initialPosition={{ y: AppSizes.screen.height }}
                    animatedValueY={this.deltaY}
                >
                    {this.renderContent()}
                </Interactable.View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default AddCurrencyOverlay;
