/**
 * Send Summary Step
 */

import { isEmpty } from 'lodash';
import React, { Component } from 'react';
import { View, Text, Alert, InteractionManager } from 'react-native';

import { BackendService, SocketService } from '@services';

import { AppScreens } from '@common/constants';
import { Prompt, Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';

import Preferences from '@common/libs/preferences';
import { NormalizeCurrencyCode } from '@common/utils/amount';
import { CalculateAvailableBalance } from '@common/utils/balance';
// components
import {
    Avatar,
    AmountText,
    Button,
    Footer,
    Spacer,
    TextInput,
    SwipeButton,
    KeyboardAwareScrollView,
} from '@components/General';
import { AccountPicker } from '@components/Modules';

// locale
import Localize from '@locale';

// style
import { AppStyles, AppColors } from '@theme';
import { ChainColors } from '@theme/colors';

import styles from './styles';

import { StepsContext } from '../../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {
    confirmedDestinationTag: number;
    destinationTagInputVisible: boolean;
    currencyRate: any;
    canScroll: boolean;
}

/* Component ==================================================================== */
class SummaryStep extends Component<Props, State> {
    destinationTagInput: TextInput;

    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

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
            .then((r) => {
                this.setState({
                    currencyRate: r,
                });
            })
            .catch(() => {
                Toast(Localize.t('global.unableToFetchCurrencyRate'));
            });
    };

    onDescriptionChange = (text: string) => {
        const { payment } = this.context;

        if (text) {
            payment.Memos = [
                {
                    data: text,
                    format: 'text/plain',
                    type: 'Description',
                },
            ];
        } else {
            payment.Memos = [];
        }
    };

    onDestinationTagChange = (text: string) => {
        const { setDestination, destination } = this.context;
        const destinationTag = text.replace(/[^0-9]/g, '');

        if (Number(destinationTag) < 2 ** 32) {
            Object.assign(destination, { tag: destinationTag });
        }

        setDestination(destination);
    };

    showMemoAlert = async () => {
        const { payment } = this.context;

        const displayedMemoAlert = await Preferences.get(Preferences.keys.DISPLAYED_MEMO_ALERT);

        if (!displayedMemoAlert && payment.Memos) {
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

        Navigator.showOverlay(AppScreens.Overlay.EnterDestinationTag, {
            buttonType: 'apply',
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
                confirmedDestinationTag: destination.tag,
            },
            () => {
                this.goNext();
            },
        );
    };

    getCurrencyName = (): string => {
        const { currency } = this.context;

        // XRP
        if (typeof currency === 'string') {
            return 'XRP';
        }

        return NormalizeCurrencyCode(currency.currency.currency);
    };

    goNext = () => {
        const { confirmedDestinationTag } = this.state;
        const { goNext, currency, source, amount, destination, destinationInfo } = this.context;

        if (!amount || parseFloat(amount) === 0) {
            Alert.alert(Localize.t('global.error'), Localize.t('send.pleaseEnterAmount'));
            return;
        }

        if (source.balance === 0) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.accountIsNotActivated'));
            return;
        }

        // if IOU and obligation can send unlimited
        if (typeof currency !== 'string' && currency.obligation) {
            // go to next screen
            goNext();
            return;
        }

        // check if destination requires the destination tag
        if (destinationInfo?.requireDestinationTag && (!destination.tag || Number(destination.tag) === 0)) {
            Alert.alert(Localize.t('global.warning'), Localize.t('send.destinationTagIsRequired'));
            return;
        }

        if (!isEmpty(destination.tag) && destination.tag !== confirmedDestinationTag) {
            Navigator.showOverlay(AppScreens.Overlay.ConfirmDestinationTag, {
                destinationTag: destination.tag,
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

    getSwipeButtonColor = (): string => {
        const { coreSettings } = this.context;

        if (coreSettings.developerMode) {
            return ChainColors[SocketService.chain];
        }

        return undefined;
    };

    toggleCanScroll = () => {
        const { canScroll } = this.state;

        this.setState({
            canScroll: !canScroll,
        });
    };

    renderCurrencyItem = (item: any) => {
        const { source } = this.context;

        // XRP
        if (typeof item === 'string') {
            return (
                <View style={[styles.pickerItem]}>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <View style={[styles.currencyImageContainer]}>
                            <Avatar border size={35} source={Images.IconXrpNew} />
                        </View>
                        <View style={[AppStyles.column, AppStyles.centerContent]}>
                            <Text style={[styles.currencyItemLabel]}>XRP</Text>
                            <Text style={[styles.currencyBalance]}>
                                {Localize.t('global.available')}:{' '}
                                {Localize.formatNumber(CalculateAvailableBalance(source))}
                            </Text>
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <View style={[styles.pickerItem]}>
                <View style={[AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[styles.currencyImageContainer]}>
                        <Avatar border size={35} source={{ uri: item.counterParty.avatar }} />
                    </View>
                    <View style={[AppStyles.column, AppStyles.centerContent]}>
                        <Text style={[styles.currencyItemLabel]}>
                            {NormalizeCurrencyCode(item.currency.currency)}

                            {item.currency.name && <Text style={[AppStyles.subtext]}> - {item.currency.name}</Text>}
                        </Text>
                        <AmountText
                            prefix={`${Localize.t('global.balance')}: `}
                            style={[styles.currencyBalance]}
                            value={item.balance}
                        />
                    </View>
                </View>
            </View>
        );
    };

    renderAmountRate = () => {
        const { currencyRate } = this.state;

        const { currency, amount } = this.context;

        // only show rate for XRP
        if (typeof currency === 'string' && currencyRate && amount) {
            const rate = Number(amount) * currencyRate.lastRate;
            if (rate > 0) {
                return (
                    <View style={[styles.rateContainer]}>
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
        const { source, amount, destination, currency, fee, issuerFee, isLoading } = this.context;
        const { destinationTagInputVisible, canScroll } = this.state;

        return (
            <View testID="send-summary-view" style={[styles.container]}>
                <KeyboardAwareScrollView
                    style={[AppStyles.flex1, AppStyles.stretchSelf]}
                    enabled={!destinationTagInputVisible}
                    scrollEnabled={canScroll}
                >
                    <View style={[styles.rowItem, styles.rowItemGrey]}>
                        <View style={[styles.rowTitle]}>
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

                        <View style={[styles.rowTitle]}>
                            <Text style={[AppStyles.subtext, AppStyles.strong, { color: AppColors.grey }]}>
                                {Localize.t('global.to')}
                            </Text>
                        </View>
                        <Spacer size={15} />

                        <View style={[styles.rowTitle]}>
                            <View style={[styles.pickerItem]}>
                                <Text style={[styles.pickerItemTitle]}>
                                    {destination?.name || Localize.t('global.noNameFound')}
                                </Text>
                                <Text
                                    style={[styles.pickerItemSub, AppStyles.colorGrey]}
                                    adjustsFontSizeToFit
                                    numberOfLines={1}
                                >
                                    {destination.address}
                                </Text>
                            </View>
                        </View>

                        <Spacer size={20} />

                        <View style={AppStyles.row}>
                            <View style={AppStyles.flex1}>
                                <View style={[styles.rowTitle]}>
                                    <Text style={[AppStyles.monoSubText, AppStyles.colorGrey]}>
                                        {destination.tag && `${Localize.t('global.destinationTag')}: `}
                                        <Text style={AppStyles.colorBlue}>
                                            {destination.tag || Localize.t('send.noDestinationTag')}
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
                    <View style={[styles.rowItem]}>
                        <View style={[styles.rowTitle]}>
                            <Text style={[AppStyles.subtext, AppStyles.strong, { color: AppColors.grey }]}>
                                {Localize.t('global.asset')}
                            </Text>
                        </View>
                        <Spacer size={15} />
                        <View style={[styles.rowTitle]}>{this.renderCurrencyItem(currency)}</View>
                    </View>

                    {/* Amount */}
                    <View style={[styles.rowItem]}>
                        <View style={[styles.rowTitle]}>
                            <Text style={[AppStyles.subtext, AppStyles.strong, { color: AppColors.grey }]}>
                                {Localize.t('global.amount')}
                            </Text>
                        </View>
                        <Spacer size={15} />

                        <AmountText value={amount} style={[styles.amountInput]} />

                        {this.renderAmountRate()}
                    </View>

                    {/* Fee */}
                    <View style={[styles.rowItem, styles.rowItemMulti]}>
                        <View style={[AppStyles.flex1]}>
                            <View style={[styles.rowTitle]}>
                                <Text style={[AppStyles.subtext, AppStyles.strong, { color: AppColors.grey }]}>
                                    {Localize.t('global.fee')}
                                </Text>
                            </View>
                            <View style={styles.feeContainer}>
                                <Text style={[styles.feeText]}>{fee} XRP</Text>
                            </View>
                        </View>
                        {issuerFee && (
                            <View style={[AppStyles.flex1]}>
                                <View style={[styles.rowTitle]}>
                                    <Text style={[AppStyles.subtext, AppStyles.strong, { color: AppColors.grey }]}>
                                        {Localize.t('global.issuerFee')}
                                    </Text>
                                </View>
                                <View style={styles.feeContainer}>
                                    <Text style={[styles.feeText]}>{issuerFee} %</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Memo */}
                    <View style={[styles.rowItem]}>
                        <View style={[styles.rowTitle]}>
                            <Text style={[AppStyles.subtext, AppStyles.strong, { color: AppColors.grey }]}>
                                {Localize.t('global.memo')}
                            </Text>
                        </View>
                        <Spacer size={15} />
                        <TextInput
                            onBlur={this.showMemoAlert}
                            onChangeText={this.onDescriptionChange}
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
