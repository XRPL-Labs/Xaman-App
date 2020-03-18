/**
 * Add Currency Screen
 */

import head from 'lodash/head';
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
    LayoutAnimation,
} from 'react-native';

import Interactable from 'react-native-interactable';

import { Navigator } from '@common/helpers';
import { AppScreens } from '@common/constants';

import { Payload } from '@common/libs/payload';
import { CounterPartyRepository } from '@store/repositories';
import { CounterPartySchema, CurrencySchema } from '@store/schemas/latest';

// components
import { Button, Footer } from '@components';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    counterParties: CounterPartySchema[];
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
        const counterParties = CounterPartyRepository.findAll() as any;

        this.setState({
            counterParties,
            selectedParty: head(counterParties),
            // @ts-ignore
            selectedCurrency: head(head(counterParties).currencies),
        });
    };

    addCurrency = async () => {
        const { selectedCurrency } = this.state;

        const payload = await Payload.build({
            TransactionType: 'TrustSet',
            Flags: 131072, // tfSetNoRipple
            LimitAmount: { currency: selectedCurrency.currency, issuer: selectedCurrency.issuer, value: 999999999 },
        });

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
            this.panel.snapTo({ index: 1 });
        }, 10);
    };

    slideDown = () => {
        this.panel.snapTo({ index: 0 });
    };

    onSnap = (event: any) => {
        const { index } = event.nativeEvent;

        if (index === 0) {
            Navigator.dismissOverlay();
        }
    };

    renderCurrencies = () => {
        const { selectedParty, selectedCurrency } = this.state;

        return selectedParty.currencies.map((c, index) => {
            return (
                <TouchableOpacity
                    key={index}
                    style={[styles.listItem, selectedCurrency.name === c.name ? styles.selectedRow : null]}
                    onPress={() => {
                        LayoutAnimation.easeInEaseOut();
                        this.setState({
                            selectedCurrency: c,
                        });
                    }}
                >
                    <View style={[AppStyles.flex3, AppStyles.row, AppStyles.centerAligned]}>
                        <View style={[AppStyles.flex1]}>
                            <Image style={styles.currencyAvatar} source={{ uri: c.avatar }} />
                        </View>
                        <View style={[AppStyles.flex3]}>
                            <Text
                                style={[
                                    AppStyles.subtext,
                                    selectedCurrency.name === c.name ? styles.selectedText : null,
                                ]}
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
        const { counterParties, selectedParty } = this.state;
        return counterParties.map((c, index) => {
            return (
                <TouchableOpacity
                    key={index}
                    style={[styles.listItem, selectedParty.name === c.name ? styles.selectedRow : null]}
                    onPress={() => {
                        LayoutAnimation.easeInEaseOut();
                        this.setState({
                            selectedParty: c,
                            selectedCurrency: c.currencies[0],
                        });
                    }}
                >
                    <View style={[AppStyles.flex3, AppStyles.row, AppStyles.centerAligned]}>
                        <View style={[AppStyles.flex1]}>
                            <Image style={styles.avatar} source={{ uri: c.avatar }} />
                        </View>
                        <View style={[AppStyles.flex3]}>
                            <Text
                                style={[AppStyles.subtext, selectedParty.name === c.name ? styles.selectedText : null]}
                                adjustsFontSizeToFit
                                numberOfLines={1}
                            >
                                {c.name}
                                {c.name && ` (${c.currencies.length})`}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        });
    };

    renderContent = () => {
        return (
            <View style={[AppStyles.visibleContent, AppStyles.centerAligned]}>
                <View style={AppStyles.panelHeader}>
                    <View style={AppStyles.panelHandle} />
                </View>

                <View style={[AppStyles.row, AppStyles.centerAligned, AppStyles.paddingBottomSml]}>
                    <View style={[AppStyles.flex1, AppStyles.paddingLeftSml]}>
                        <Text style={[AppStyles.h5, AppStyles.strong]}>{Localize.t('currency.addCurrency')}</Text>
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
                        {Localize.t('currency.selectAnExchangeAndSelectCurrency')}
                    </Text>
                </View>

                <View style={[AppStyles.row, AppStyles.paddingExtraSml]}>
                    <View style={[AppStyles.flex1]}>
                        <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.textCenterAligned]}>Exchanges:</Text>
                    </View>
                    <View style={styles.separator} />
                    <View style={[AppStyles.flex1]}>
                        <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.textCenterAligned]}>
                            Currencies:
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
                            block
                            isDisabled={false}
                            onPress={this.addCurrency}
                            style={[AppStyles.buttonGreen]}
                            label={Localize.t('currency.addAndSign')}
                        />
                    </Footer>
                </SafeAreaView>
            </View>
        );
    };

    render() {
        const { counterParties } = this.state;

        if (!counterParties) return null;

        return (
            <View style={AppStyles.flex1}>
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
                    ref={r => {
                        this.panel = r;
                    }}
                    animatedNativeDriver
                    onSnap={this.onSnap}
                    verticalOnly
                    snapPoints={[{ y: AppSizes.screen.height + 3 }, { y: AppSizes.screen.height * 0.12 }]}
                    boundaries={{ top: AppSizes.screen.height * 0.1 }}
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
