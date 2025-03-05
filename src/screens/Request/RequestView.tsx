/**
 * Request Screen
 */

import { find, first } from 'lodash';
import BigNumber from 'bignumber.js';
import Realm from 'realm';

import React, { Component } from 'react';
import { View, Text, Keyboard, Share, InteractionManager, Platform } from 'react-native';
import { Clipboard } from '@common/helpers/clipboard';

import BackendService, { RatesType } from '@services/BackendService';

import { Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import NetworkService from '@services/NetworkService';

import { AppScreens } from '@common/constants';
import { HOSTNAME } from '@common/constants/endpoints';

import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountModel, CoreModel } from '@store/models';

// components
import {
    TouchableDebounce,
    Header,
    AmountInput,
    QRCode,
    CheckBox,
    HorizontalLine,
    KeyboardAwareScrollView,
    Spacer,
    Button,
} from '@components/General';

import { AmountValueType } from '@components/General/AmountInput';
import { AccountPicker } from '@components/Modules';

import DeviceBrightness from '@adrianso/react-native-device-brightness';

// local
import Localize from '@locale';

// style
import { AppStyles, AppColors, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    ogBrightness?: number;
}

export interface State {
    coreSettings: CoreModel;
    accounts: Realm.Results<AccountModel>;
    source: AccountModel;
    amount?: string;
    amountRate?: string;
    currencyRate?: RatesType;
    withAmount: boolean;
}

/* Component ==================================================================== */
class RequestView extends Component<Props, State> {
    static screenName = AppScreens.Transaction.Request;

    amountInputRef: React.RefObject<typeof AmountInput>;
    amountRateInputRef: React.RefObject<typeof AmountInput>;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        const defaultAccount = CoreRepository.getDefaultAccount();
        const accounts = AccountRepository.getAccounts();

        this.state = {
            coreSettings: CoreRepository.getSettings(),
            accounts,
            source: find(accounts, { address: defaultAccount.address }) || first(accounts)!,
            amount: undefined,
            currencyRate: undefined,
            amountRate: undefined,
            withAmount: false,
        };

        this.amountInputRef = React.createRef();
        this.amountRateInputRef = React.createRef();
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchCurrencyRate);
        DeviceBrightness.setBrightnessLevel(1);
    }

    componentWillUnmount(): void {
        const {ogBrightness} = this.props;
        if (typeof ogBrightness === 'number') {
            DeviceBrightness.setBrightnessLevel(Platform.OS === 'android' ? -1 : ogBrightness);
        }
    };

    fetchCurrencyRate = () => {
        const { coreSettings } = this.state;

        const { currency } = coreSettings;

        BackendService.getCurrencyRate(currency)
            .then((r) => {
                this.setState(
                    {
                        currencyRate: r,
                    },
                    this.onUpdateRate,
                );
            })
            .catch(() => {
                Toast(Localize.t('global.unableToFetchCurrencyRate'));
            });
    };

    onUpdateRate = () => {
        const { amount, currencyRate } = this.state;

        if (amount && currencyRate) {
            const inRate = Number(amount) * currencyRate.rate;
            this.setState({
                amountRate: String(inRate),
            });
        }
    };

    onAccountChange = (item: AccountModel) => {
        this.setState({
            source: item,
        });
    };

    onAmountChange = (amount: string) => {
        const { currencyRate } = this.state;

        this.setState({
            amount,
        });

        if (!amount) {
            this.setState({
                amountRate: '',
            });

            return;
        }

        if (currencyRate) {
            const inRate = new BigNumber(amount).multipliedBy(currencyRate.rate).decimalPlaces(8).toFixed();
            this.setState({
                amountRate: String(inRate),
            });
        }
    };

    onRateAmountChange = (amount: string) => {
        const { currencyRate } = this.state;

        this.setState({
            amountRate: amount,
        });

        if (!amount) {
            this.setState({
                amount: '',
            });
            return;
        }

        if (currencyRate) {
            const inXRP = new BigNumber(amount).dividedBy(currencyRate.rate).decimalPlaces(6).toFixed();
            this.setState({
                amount: inXRP,
            });
        }
    };

    getLink = () => {
        const { source, amount, withAmount } = this.state;

        let content = `https://${HOSTNAME}/detect/request:${source.address}`;

        if (amount && withAmount) {
            content += `?amount=${amount}`;
        }

        return content;
    };

    toggleUseAmount = () => {
        const { withAmount } = this.state;

        this.setState({
            withAmount: !withAmount,
        });
    };

    onHeaderBackPress = () => {
        Keyboard.dismiss();
        setTimeout(Navigator.pop, 10);
    };

    onCopyAddressPress = () => {
        Clipboard.setString(this.getLink());

        // setTimeout(() => {
        Toast(Localize.t('global.requestCopied'));
        // }, 10);
    };

    onSharePress = () => {
        Share.share({
            message: this.getLink(),
            url: undefined,
        }).catch(() => {});
    };

    calcKeyboardAwareExtraOffset = (input: any, inputHeight: number) => {
        if (input === this.amountInputRef?.current) {
            return inputHeight + Platform.select({ ios: 10, android: AppSizes.safeAreaBottomInset, default: 0 });
        }
        return 0;
    };

    renderAmountInput = () => {
        const { coreSettings, withAmount, amount, amountRate, currencyRate } = this.state;

        if (!withAmount) return null;

        return (
            <>
                <View style={styles.amountContainer}>
                    <View style={AppStyles.flex1}>
                        <AmountInput
                            ref={this.amountInputRef}
                            testID="amount-input"
                            value={amount}
                            valueType={AmountValueType.Native}
                            onChange={this.onAmountChange}
                            style={styles.amountInput}
                            placeholderTextColor={AppColors.grey}
                            returnKeyType="done"
                        />
                    </View>
                    <View style={styles.currencySymbolTextContainer}>
                        <Text style={styles.currencySymbolText}>{NetworkService.getNativeAsset()}</Text>
                    </View>
                </View>

                <View style={styles.amountRateContainer}>
                    <View style={AppStyles.centerContent}>
                        <Text style={styles.amountRateInput}>~ </Text>
                    </View>
                    <View style={AppStyles.flex1}>
                        <AmountInput
                            ref={this.amountRateInputRef}
                            testID="amount-rate-input"
                            value={amountRate}
                            valueType={AmountValueType.IOU}
                            editable={!!currencyRate}
                            onChange={this.onRateAmountChange}
                            style={[styles.amountRateInput]}
                            placeholderTextColor={AppColors.grey}
                            returnKeyType="done"
                        />
                    </View>
                    <View style={styles.currencySymbolTextContainer}>
                        <Text style={styles.currencySymbolText}>{coreSettings.currency}</Text>
                    </View>
                </View>
            </>
        );
    };

    render() {
        const { accounts, source, withAmount } = this.state;

        return (
            <View testID="request-screen" style={styles.container}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: this.onHeaderBackPress,
                    }}
                    centerComponent={{ text: 'Request' }}
                    // rightComponent={{
                    //     icon: 'IconShare',
                    //     iconSize: 23,
                    //     onPress: this.onHeaderSharePress,
                    // }}
                />

                <KeyboardAwareScrollView
                    style={[AppStyles.flex1, AppStyles.stretchSelf]}
                    calculateExtraOffset={this.calcKeyboardAwareExtraOffset}
                >
                    <View style={[ styles.rowItem ]}>
                        <View style={[ styles.rowTitle ]}>
                            <Text style={AppStyles.colorGrey}>
                                {Localize.t('global.receiveOnAccount')}:
                            </Text>
                        </View>
                        <View style={[ styles.accountPickerContainer]}>
                            <AccountPicker onSelect={this.onAccountChange} accounts={accounts} selectedItem={source} />
                        </View>
                    </View>

                    {/* Amount */}
                    <View style={[ styles.rowItem ]}>
                        <TouchableDebounce
                            activeOpacity={0.8}
                            style={[styles.checkboxView, styles.rowTitle]}
                            onPress={this.toggleUseAmount}
                        >
                            <View style={[ AppStyles.centerContent, styles.checkboxLabelContainer ]}>
                                {/* <Text style={AppStyles.borderOrange}>X</Text> */}
                                <Text style={[AppStyles.subtext, AppStyles.colorPrimary]}>
                                    {Localize.t('global.requestWithAmount')}
                                </Text>
                            </View>
                            <View style={[
                                // AppStyles.borderGrey,
                                styles.checkboxContainer,
                            ]}>
                                <View style={[
                                    styles.checkboxWrapper,
                                ]}>
                                    <CheckBox
                                        style={[
                                            AppStyles.flexEnd,
                                            styles.checkbox,
                                        ]}
                                        checked={withAmount}
                                        onPress={this.toggleUseAmount}
                                    />
                                </View>
                            </View>
                        </TouchableDebounce>

                        {this.renderAmountInput()}
                    </View>

                    <HorizontalLine />

                    <Spacer size={12} />

                    <View style={[
                        AppStyles.paddingHorizontalSml,
                        AppStyles.marginBottomSml,
                    ]}>
                        <Text style={AppStyles.colorGrey}>
                            {Localize.t('global.requestLinkNow')}:
                        </Text>
                        <View style={[
                            AppStyles.row,
                        ]}>
                            <Button
                                numberOfLines={1}
                                icon="IconShare"
                                // iconStyle={AppStyles.imgColorBlue}
                                label={Localize.t('global.share')}
                                onPress={this.onSharePress}
                                style={[AppStyles.flex1, styles.sharebtnLeft]}
                            />
                            <Button
                                numberOfLines={1}
                                icon="IconClipboard"
                                // iconStyle={AppStyles.imgColorBlue}
                                label={Localize.t('global.copy')}
                                onPress={this.onCopyAddressPress}
                                style={[AppStyles.flex1, styles.sharebtnRight]}
                            />
                        </View>
                    </View>

                    <View style={[ AppStyles.paddingHorizontalSml, AppStyles.marginTopNegativeSml ]}>
                        <Text style={AppStyles.colorGrey}>
                            {Localize.t('global.orShareQr')}:
                        </Text>
                        <View style={[
                            styles.qrCodeContainer,
                        ]}>
                            <View style={styles.qrCode}>
                                <View style={styles.qrImgContainer}>
                                    <QRCode size={140} value={`${this.getLink()}`} />
                                </View>
                            </View>
                        </View>
                    </View>

                </KeyboardAwareScrollView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default RequestView;
