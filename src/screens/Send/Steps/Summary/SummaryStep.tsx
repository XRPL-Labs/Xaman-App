/**
 * Send Summary Step
 */

import { isEmpty } from 'lodash';
import React, { Component } from 'react';
import { View, Text, Alert, InteractionManager } from 'react-native';

import NetworkService from '@services/NetworkService';
import BackendService, { RatesType } from '@services/BackendService';

import { AppScreens } from '@common/constants';
import { Prompt, Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import Preferences from '@common/libs/preferences';

import { CalculateAvailableBalance } from '@common/utils/balance';

import { TrustLineModel } from '@store/models';

// components
import {
    AmountText,
    Button,
    Footer,
    Spacer,
    TextInput,
    SwipeButton,
    KeyboardAwareScrollView,
} from '@components/General';
import { TokenAvatar } from '@components/Modules/TokenElement';

import { AccountPicker, FeePicker, ServiceFee } from '@components/Modules';

import Localize from '@locale';

import { EnterDestinationTagOverlayProps } from '@screens/Overlay/EnterDestinationTag';
import { ConfirmDestinationTagOverlayProps } from '@screens/Overlay/ConfirmDestinationTag';

import { AppStyles, AppColors } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {
    confirmedDestinationTag?: number;
    destinationTagInputVisible: boolean;
    currencyRate?: RatesType;
    canScroll: boolean;
}

/* Component ==================================================================== */
class SummaryStep extends Component<Props, State> {
    static contextType = StepsContext;
    declare context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        // console.log('SummaryStep constructor')

        this.state = {
            confirmedDestinationTag: undefined,
            destinationTagInputVisible: false,
            currencyRate: undefined,
            canScroll: true,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchCurrencyRate);
    }

    fetchCurrencyRate = () => {
        const { coreSettings } = this.context;

        const { currency } = coreSettings;

        BackendService.getCurrencyRate(currency)
            .then((resp) => {
                this.setState({
                    currencyRate: resp,
                });
            })
            .catch(() => {
                Toast(Localize.t('global.unableToFetchCurrencyRate'));
            });
    };

    onPaymentDescriptionChange = (text: string) => {
        const { setMemo } = this.context;

        setMemo(text);
    };

    showMemoAlert = async () => {
        const { memo } = this.context;

        const displayedMemoAlert = await Preferences.get(Preferences.keys.DISPLAYED_MEMO_ALERT);

        if (!displayedMemoAlert && memo) {
            Prompt(
                Localize.t('global.pleaseNote'),
                Localize.t('send.memoPublicWarning'),
                [
                    {
                        text: Localize.t('global.doNotRemindMe'),
                        onPress: () => {
                            Preferences.set(Preferences.keys.DISPLAYED_MEMO_ALERT, 'YES');
                        },
                        style: 'destructive',
                    },
                    { text: Localize.t('global.dismiss') },
                ],
                { type: 'default' },
            );
        }
    };

    showEnterDestinationTag = () => {
        const { setDestination, destination } = this.context;
        const { destinationTagInputVisible } = this.state;

        if (!destination) {
            return;
        }

        if (!destinationTagInputVisible) {
            this.setState({
                destinationTagInputVisible: true,
            });
        }

        Navigator.showOverlay<EnterDestinationTagOverlayProps>(AppScreens.Overlay.EnterDestinationTag, {
            buttonType: 'set',
            destination,
            onFinish: (destinationTag: string) => {
                Object.assign(destination, { tag: destinationTag });
                setDestination(destination);

                this.setState({
                    destinationTagInputVisible: false,
                });
            },
            onClose: () => {
                this.setState({
                    destinationTagInputVisible: false,
                });
            },
            onScannerRead: ({ tag }: { tag: number }) => {
                Object.assign(destination, { tag: String(tag) });
                setDestination(destination);

                this.showEnterDestinationTag();
            },
            onScannerClose: this.showEnterDestinationTag,
        });
    };

    onDestinationTagConfirm = () => {
        const { destination } = this.context;

        this.setState(
            {
                confirmedDestinationTag: destination!.tag,
            },
            this.goNext,
        );
    };

    goNext = () => {
        const { goNext, token, source, amount, destination, destinationInfo } = this.context;
        const { confirmedDestinationTag } = this.state;

        // console.log('SummaryStep constructor gonext')

        if (!amount || parseFloat(amount) === 0) {
            Alert.alert(Localize.t('global.error'), Localize.t('send.pleaseEnterAmount'));
            return;
        }

        if (source!.balance === 0) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.accountIsNotActivated'));
            return;
        }

        // if IOU and obligation can send unlimited
        if (typeof token !== 'string' && token.obligation) {
            // go to next screen
            goNext();
            return;
        }

        // check if destination requires the destination tag
        if (destinationInfo?.requireDestinationTag && (!destination!.tag || Number(destination!.tag) === 0)) {
            Alert.alert(Localize.t('global.warning'), Localize.t('send.destinationTagIsRequired'));
            return;
        }

        if (!isEmpty(destination!.tag) && destination!.tag !== confirmedDestinationTag) {
            Navigator.showOverlay<ConfirmDestinationTagOverlayProps>(AppScreens.Overlay.ConfirmDestinationTag, {
                destinationTag: `${destination!.tag ?? ''}`,
                onConfirm: this.onDestinationTagConfirm,
                onChange: this.showEnterDestinationTag,
            });
            return;
        }

        // go to next screen
        goNext();
    };

    goBack = () => {
        const { goBack, setDestination } = this.context;

        // clear destination
        setDestination(undefined);

        goBack();
    };

    getSwipeButtonColor = (): string | undefined => {
        const { coreSettings } = this.context;

        if (coreSettings?.developerMode && coreSettings?.network) {
            return coreSettings.network.color;
        }

        return undefined;
    };

    toggleCanScroll = () => {
        const { canScroll } = this.state;

        this.setState({
            canScroll: !canScroll,
        });
    };

    renderCurrencyItem = (item: string | TrustLineModel) => {
        const { source } = this.context;

        // Native asset
        if (typeof item === 'string') {
            return (
                <View style={styles.pickerItem}>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <View style={styles.currencyImageContainer}>
                            <TokenAvatar token="Native" border size={35} />
                        </View>
                        <View style={[AppStyles.column, AppStyles.centerContent]}>
                            <Text style={styles.currencyItemLabel}>{NetworkService.getNativeAsset()}</Text>
                            <Text style={styles.currencyBalance}>
                                {Localize.t('global.available')}:{' '}
                                {Localize.formatNumber(CalculateAvailableBalance(source!))}
                            </Text>
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.pickerItem}>
                <View style={[AppStyles.row, AppStyles.centerAligned]}>
                    <View style={styles.currencyImageContainer}>
                        <TokenAvatar token={item} border size={35} />
                    </View>
                    <View style={[AppStyles.column, AppStyles.centerContent]}>
                        <View style={[AppStyles.row, AppStyles.centerAligned]}>
                            <Text style={styles.currencyItemLabel}>{item.getFormattedCurrency()}</Text>
                            <Text style={styles.currencyItemCounterPartyLabel}>
                                &nbsp;-&nbsp;{item.getFormattedIssuer()}
                            </Text>
                        </View>
                        <AmountText
                            prefix={`${Localize.t('global.balance')}: `}
                            style={styles.currencyBalance}
                            value={item.balance}
                        />
                    </View>
                </View>
            </View>
        );
    };

    renderAmountRate = () => {
        const { currencyRate } = this.state;

        const { token, amount } = this.context;

        // only show rate for native currency
        if (typeof token === 'string' && currencyRate && amount) {
            const rate = Number(amount) * currencyRate.rate;
            if (rate > 0) {
                return (
                    <View style={styles.rateContainer}>
                        <Text style={styles.rateText}>
                            ~{currencyRate.code} {Localize.formatNumber(rate)}
                        </Text>
                    </View>
                );
            }
        }

        return null;
    };

    render() {
        const {
            source,
            amount,
            destination,
            token,
            issuerFee,
            isLoading,
            selectedFee,
            setFee,
            setServiceFeeAmount,
            getPaymentJsonForFee,
        } = this.context;
        const { destinationTagInputVisible, canScroll } = this.state;

        return (
            <View testID="send-summary-view" style={styles.container}>
                <KeyboardAwareScrollView
                    style={[AppStyles.flex1, AppStyles.stretchSelf]}
                    enabled={!destinationTagInputVisible}
                    scrollEnabled={canScroll}
                >
                    <View style={[styles.rowItem, styles.rowItemGrey]}>
                        <View style={styles.rowTitle}>
                            <Text
                                style={[
                                    AppStyles.subtext,
                                    AppStyles.strong,
                                    styles.rowTitlePadding,
                                    { color: AppColors.grey },
                                ]}
                            >
                                {Localize.t('global.from')}
                            </Text>
                        </View>

                        <AccountPicker accounts={[source]} selectedItem={source} />

                        <Spacer size={20} />

                        <View style={styles.rowTitle}>
                            <Text style={[AppStyles.subtext, AppStyles.strong, { color: AppColors.grey }]}>
                                {Localize.t('global.to')}
                            </Text>
                        </View>
                        <Spacer size={15} />

                        <View style={styles.rowTitle}>
                            <View style={styles.pickerItem}>
                                <Text numberOfLines={1} style={styles.pickerItemTitle}>
                                    {destination?.name || Localize.t('global.noNameFound')}
                                </Text>
                                <Text
                                    style={[styles.pickerItemSub, AppStyles.colorGrey]}
                                    adjustsFontSizeToFit
                                    numberOfLines={1}
                                >
                                    {destination!.address}
                                </Text>
                            </View>
                        </View>

                        <Spacer size={20} />

                        <View style={AppStyles.row}>
                            <View style={AppStyles.flex1}>
                                <View style={styles.rowTitle}>
                                    <Text style={[AppStyles.monoSubText, AppStyles.colorGrey]}>
                                        {typeof destination!.tag !== 'undefined' &&
                                            `${Localize.t('global.destinationTag')}: `}
                                        <Text style={AppStyles.colorBlue}>
                                            {destination!.tag || Localize.t('send.noDestinationTag')}
                                        </Text>
                                    </Text>
                                </View>
                            </View>
                            <Button
                                onPress={this.showEnterDestinationTag}
                                style={styles.editButton}
                                roundedSmall
                                iconSize={13}
                                light
                                icon="IconEdit"
                            />
                        </View>
                    </View>

                    {/* Currency */}
                    <View style={styles.rowItem}>
                        <View style={styles.rowTitle}>
                            <Text style={[AppStyles.subtext, AppStyles.strong, { color: AppColors.grey }]}>
                                {Localize.t('global.asset')}
                            </Text>
                        </View>
                        <Spacer size={15} />
                        <View style={styles.rowTitle}>{this.renderCurrencyItem(token)}</View>
                    </View>

                    {/* Amount */}
                    <View style={styles.rowItem}>
                        <View style={styles.rowTitle}>
                            <Text style={[AppStyles.subtext, AppStyles.strong, { color: AppColors.grey }]}>
                                {Localize.t('global.amount')}
                            </Text>
                        </View>
                        <Spacer size={15} />

                        <AmountText value={amount} style={styles.amountInput} immutable />

                        {this.renderAmountRate()}
                    </View>

                    {issuerFee && (
                        <View style={styles.rowItem}>
                            <View style={styles.rowTitle}>
                                <Text style={[AppStyles.subtext, AppStyles.strong, { color: AppColors.grey }]}>
                                    {Localize.t('global.issuerFee')}
                                </Text>
                            </View>
                            <View style={styles.feeContainer}>
                                <Text style={styles.feeText}>{issuerFee} %</Text>
                            </View>
                        </View>
                    )}

                    <View style={[styles.rowItem, AppStyles.centerContent]}>
                        <View style={styles.rowTitle}>
                            <Text style={[AppStyles.subtext, AppStyles.strong, { color: AppColors.grey }]}>
                                {Localize.t('global.fee')}
                            </Text>
                        </View>
                        <FeePicker
                            txJson={getPaymentJsonForFee()}
                            containerStyle={styles.feePickerContainer}
                            textStyle={styles.feeText}
                            onSelect={setFee}
                        />
                    </View>

                    <View style={[styles.rowItem, AppStyles.centerContent]}>
                        <View style={styles.rowTitle}>
                            <Text style={[AppStyles.subtext, AppStyles.strong, { color: AppColors.grey }]}>
                                Service fee
                            </Text>
                        </View>
                        <ServiceFee
                            txJson={getPaymentJsonForFee()}
                            containerStyle={styles.feePickerContainer}
                            textStyle={styles.feeText}
                            onSelect={setServiceFeeAmount}
                        />
                    </View>
    
                    {/* Memo */}
                    <View style={styles.rowItem}>
                        <View style={styles.rowTitle}>
                            <Text style={[AppStyles.subtext, AppStyles.strong, { color: AppColors.grey }]}>
                                {Localize.t('global.memo')}
                            </Text>
                        </View>
                        <Spacer size={15} />
                        <TextInput
                            onBlur={this.showMemoAlert}
                            onChangeText={this.onPaymentDescriptionChange}
                            placeholder={Localize.t('send.enterPublicMemo')}
                            inputStyle={styles.inputStyle}
                            maxLength={300}
                            returnKeyType="done"
                            autoCapitalize="sentences"
                            numberOfLines={1}
                        />
                    </View>

                    <Footer safeArea>
                        <SwipeButton
                            color={this.getSwipeButtonColor()}
                            label={Localize.t('global.slideToSend')}
                            accessibilityLabel={Localize.t('global.send')}
                            onSwipeSuccess={this.goNext}
                            isLoading={isLoading}
                            isDisabled={!selectedFee}
                            shouldResetAfterSuccess
                            onPanResponderGrant={this.toggleCanScroll}
                            onPanResponderRelease={this.toggleCanScroll}
                        />
                    </Footer>
                </KeyboardAwareScrollView>
                {/* Bottom Bar */}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default SummaryStep;
