/**
 * Review Transaction Screen
 */

import { get, find, isEmpty } from 'lodash';
import React, { Component, Fragment } from 'react';
import {
    Animated,
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Clipboard,
    Alert,
    Linking,
    Image,
    ImageBackground,
    LayoutChangeEvent,
    BackHandler,
    Keyboard,
} from 'react-native';

import Interactable from 'react-native-interactable';
import { BlurView } from '@react-native-community/blur';

import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountSchema, CoreSchema } from '@store/schemas/latest';

import { Payload } from '@common/libs/payload';
import { SubmitResultType } from '@common/libs/ledger/types';

import { AppScreens } from '@common/constants';
import { Toast, VibrateHapticFeedback } from '@common/helpers/interface';

import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';

// services
import { PushNotificationsService, LedgerService, SocketService } from '@services';

// transaction parser
import parserFactory from '@common/libs/ledger/parser';
import { TransactionsType } from '@common/libs/ledger/transactions/types';

// components
import { Button, AccordionPicker, Icon, Footer, Spacer } from '@components/General';

// localize
import Localize from '@locale';

// style
import { AppStyles, AppColors, AppSizes } from '@theme';
import styles from './styles';

// transaction templates
import * as Templates from './Templates';

/* types ==================================================================== */
export interface Props {
    payload: Payload;
}

export interface State {
    accounts: Array<AccountSchema>;
    transaction: TransactionsType;
    source: AccountSchema;
    step: 'review' | 'submitting' | 'verifying' | 'result';
    submitResult: SubmitResultType;
    hasError: boolean;
    errorMessage: string;
    isPreparing: boolean;
    canScroll: boolean;
    panelExpanded: boolean;
    headerHeight: number;
    coreSettings: CoreSchema;
}

/* Component ==================================================================== */
class ReviewTransactionModal extends Component<Props, State> {
    static screenName = AppScreens.Modal.ReviewTransaction;

    private deltaY: Animated.Value;
    private backHandler: any;
    private panel: any;
    private sourcePicker: AccordionPicker;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            accounts: undefined,
            transaction: parserFactory(props.payload.TxJson),
            source: undefined,
            step: 'review',
            submitResult: undefined,
            isPreparing: false,
            hasError: false,
            errorMessage: '',
            canScroll: false,
            panelExpanded: false,
            headerHeight: 0,
            coreSettings: CoreRepository.getSettings(),
        };

        this.deltaY = new Animated.Value(0);
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
    }

    componentDidMount() {
        // back handler listener
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.onClose);

        // update the accounts details before process the review
        LedgerService.updateAccountsDetails();

        // set signalbe account and set prefer account
        this.setAccounts();
    }

    componentDidCatch() {
        this.setState({ hasError: true });
    }

    setAccounts = () => {
        const { payload } = this.props;
        const { transaction } = this.state;

        // get available account base on transaction type
        let availableAccounts =
            payload.payload.tx_type === 'SignIn'
                ? AccountRepository.getSignableAccounts()
                : AccountRepository.getSpendableAccounts();

        if (isEmpty(availableAccounts)) {
            return;
        }

        // choose preferred account for sign
        let preferredAccount;

        // for CheckCash and CheckCancel
        if (transaction.Account && transaction.Type === 'CheckCash') {
            preferredAccount = find(availableAccounts, { address: transaction.Account.address });

            // override available Accounts
            availableAccounts = [preferredAccount];

            // cannot sign this tx as account is not imported in the XUMM
            if (!preferredAccount) {
                this.setState({
                    hasError: true,
                    errorMessage: Localize.t('payload.checkCanOnlyCashByCheckDestination'),
                });

                return;
            }
        } else {
            preferredAccount = find(availableAccounts, { default: true }) || availableAccounts[0];

            // set the default source account
            if (preferredAccount) {
                // ignore if it's multisign
                if (!payload.meta.multisign) {
                    transaction.Account = { address: preferredAccount.address };
                }
            }
        }

        this.setState({
            accounts: availableAccounts,
            source: preferredAccount,
        });
    };

    onDecline = () => {
        const { payload } = this.props;

        // reject the payload
        payload.reject();

        // emit sign requests update
        setTimeout(() => {
            PushNotificationsService.emit('signRequestUpdate');
        }, 1000);

        // close modal
        Navigator.dismissModal();
    };

    onAccept = () => {
        const { source } = this.state;

        Navigator.showOverlay(
            AppScreens.Overlay.Vault,
            {
                overlay: {
                    handleKeyboardEvents: true,
                },
                layout: {
                    backgroundColor: 'transparent',
                    componentBackgroundColor: 'transparent',
                },
            },
            {
                account: source,
                onOpen: (privateKey: string) => {
                    this.submit(privateKey);
                },
            },
        );
    };

    onClose = () => {
        const { payload } = this.props;

        // dismiss keyboard if it's present
        Keyboard.dismiss();

        if (payload.meta.generated) {
            Navigator.dismissModal();
        } else {
            Navigator.showOverlay(
                AppScreens.Overlay.RequestDecline,
                {
                    layout: {
                        backgroundColor: 'transparent',
                        componentBackgroundColor: 'transparent',
                    },
                },
                {
                    onDecline: this.onDecline,
                    onClose: () => {
                        Navigator.dismissModal();
                    },
                },
            );
        }

        return true;
    };

    onAcceptPress = async () => {
        const { payload } = this.props;
        const { source, transaction } = this.state;

        // if any validation set to the transaction run and check
        if (typeof transaction.validate === 'function') {
            this.setState({
                isPreparing: true,
            });

            try {
                await transaction.validate(source);
            } catch (e) {
                Navigator.showAlertModal({
                    type: 'error',
                    text: e.message,
                    buttons: [
                        {
                            text: Localize.t('global.ok'),
                            onPress: () => {},
                            light: false,
                        },
                    ],
                });
                return;
            } finally {
                this.setState({
                    isPreparing: false,
                });
            }
        }

        // account is not activated and want to sign a tx
        if (payload.payload.tx_type !== 'SignIn' && source.balance === 0) {
            Alert.alert(
                Localize.t('global.error'),
                Localize.t('account.selectedAccountIsNotActivatedPleaseChooseAnotherOne'),
            );
            return;
        }

        // check for account delete and alert user
        if (transaction.Type === 'AccountDelete') {
            Navigator.showAlertModal({
                type: 'error',
                title: Localize.t('global.danger'),
                text: Localize.t('account.deleteAccountWarning'),
                buttons: [
                    {
                        text: Localize.t('global.back'),
                        onPress: () => {},
                        light: false,
                    },
                    {
                        text: Localize.t('global.continue'),
                        onPress: this.onAccept,
                        type: 'dismiss',
                        light: true,
                    },
                ],
            });
            return;
        }

        // check for asfDisableMaster
        if (transaction.Type === 'AccountSet' && transaction.SetFlag === 'asfDisableMaster') {
            Navigator.showAlertModal({
                type: 'warning',
                text: Localize.t('account.disableMasterKeyWarning'),
                buttons: [
                    {
                        text: Localize.t('global.cancel'),
                        onPress: () => {},
                        light: false,
                    },
                    {
                        text: Localize.t('global.continue'),
                        onPress: this.onAccept,
                        type: 'dismiss',
                        light: true,
                    },
                ],
            });
            return;
        }

        this.onAccept();
    };

    onAccountChange = (item: AccountSchema) => {
        const { payload } = this.props;
        const { transaction } = this.state;

        // set the source account to payload
        // ignore if it's multisign
        if (!payload.meta.multisign) {
            transaction.Account = { address: item.address };
        }

        // change state
        this.setState({
            source: item,
        });
    };

    submit = async (privateKey: string) => {
        const { payload } = this.props;
        const { transaction, coreSettings } = this.state;

        try {
            this.setState({
                isPreparing: true,
            });

            // prepare the transaction
            await transaction.prepare(privateKey, payload.meta.multisign);
            // sign the payload
            const singedBlob = await transaction.sign();

            // create patch object
            const patch = {
                signed_blob: singedBlob,
                tx_id: transaction.Hash,
                multisigned: payload.meta.multisign ? transaction.signer.address : '',
                permission: {
                    push: true,
                    days: 365,
                },
            };

            // check if we need to submit the payload to the XRP Ledger
            if (payload.shouldSubmit()) {
                this.setState({
                    step: 'submitting',
                });

                // submit the transaction to the xrp ledger
                const submitResult = await transaction.submit();

                // if submitted then verify
                if (submitResult.success) {
                    this.setState({ step: 'verifying' });

                    // verify transaction
                    const verifyResult = await transaction.verify();

                    // change the transaction final status if the transaction settled in the ledger
                    if (verifyResult.success && submitResult.engineResult !== 'tesSUCCESS') {
                        submitResult.engineResult = 'tesSUCCESS';
                    }

                    if (coreSettings.hapticFeedback) {
                        if (verifyResult.success) {
                            VibrateHapticFeedback('notificationSuccess');
                        } else {
                            VibrateHapticFeedback('notificationError');
                        }
                    }
                } else if (coreSettings.hapticFeedback) {
                    VibrateHapticFeedback('notificationError');
                }

                // update patch
                Object.assign(patch, {
                    dispatched: {
                        to: submitResult.node,
                        nodetype: submitResult.nodeType,
                        result: submitResult.engineResult,
                    },
                });

                this.setState({
                    submitResult,
                });
            } else {
                Object.assign(patch, {
                    dispatched: {
                        to: SocketService.node,
                        nodetype: SocketService.chain,
                    },
                });
            }

            // patch the payload
            payload.patch(patch);

            // emit sign requests update
            setTimeout(() => {
                PushNotificationsService.emit('signRequestUpdate');
            }, 1000);

            this.setState({
                step: 'result',
                isPreparing: false,
            });
        } catch (e) {
            this.setState({
                step: 'review',
                isPreparing: false,
            });
            if (typeof e.toString === 'function') {
                Alert.alert(Localize.t('global.error'), e.toString());
            } else {
                Alert.alert(Localize.t('global.error'), Localize.t('global.unexpectedErrorOccurred'));
            }
        }
    };

    getTransactionType = () => {
        const { payload } = this.props;
        const { transaction } = this.state;

        let type = '';

        switch (payload.payload.tx_type) {
            case 'AccountSet':
                type = Localize.t('events.updateAccountSettings');
                break;
            case 'AccountDelete':
                type = Localize.t('events.deleteAccount');
                break;
            case 'EscrowFinish':
                type = Localize.t('events.finishEscrow');
                break;
            case 'EscrowCancel':
                type = Localize.t('events.cancelEscrow');
                break;
            case 'EscrowCreate':
                type = Localize.t('events.createEscrow');
                break;
            case 'SetRegularKey':
                type = Localize.t('events.setARegularKey');
                break;
            case 'SignerListSet':
                type = Localize.t('events.setSignerList');
                break;
            case 'TrustSet':
                type = Localize.t('events.updateAccountAssets');
                break;
            case 'OfferCreate':
                type = Localize.t('events.createOffer');
                break;
            case 'OfferCancel':
                type = Localize.t('events.cancelOffer');
                break;
            case 'DepositPreauth':
                if (transaction.Authorize) {
                    type = Localize.t('events.authorizeDeposit');
                } else {
                    type = Localize.t('events.unauthorizeDeposit');
                }
                break;
            case 'CheckCreate':
                type = Localize.t('events.createCheck');
                break;
            case 'CheckCash':
                type = Localize.t('events.cashCheck');
                break;
            case 'CheckCancel':
                type = Localize.t('events.cancelCheck');
                break;
            case 'SignIn':
                type = Localize.t('global.signIn');
                break;
            default:
                type = payload.payload.tx_type;
                break;
        }

        return type;
    };

    handleClose = () => {
        const { payload } = this.props;

        const { return_url_app } = payload.meta;

        if (return_url_app) {
            Linking.canOpenURL(return_url_app).then((support) => {
                if (support) {
                    Linking.openURL(return_url_app);
                } else {
                    Alert.alert(Localize.t('global.error'), Localize.t('global.unableOpenReturnURL'));
                }
            });
        }
        Navigator.dismissModal();
    };

    getTopOffset = () => {
        const { headerHeight } = this.state;

        return -headerHeight + 20;
    };

    setHeaderHeight = (event: LayoutChangeEvent) => {
        const { headerHeight } = this.state;
        const { height } = event.nativeEvent.layout;

        if (height === 0 || headerHeight) return;

        this.setState({ headerHeight: height });
    };

    onSnap = () => {
        this.sourcePicker.updateContainerPosition();
    };

    onDrag = (event: any) => {
        const { targetSnapPointId, state } = event.nativeEvent;

        if (state === 'end' && targetSnapPointId === 'up') {
            this.setState({ canScroll: true, panelExpanded: true });
        }

        if (state === 'end' && targetSnapPointId === 'down') {
            this.setState({ panelExpanded: false });
        }
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
        }, 10);
    };

    onScroll = (event: any) => {
        const { contentOffset } = event.nativeEvent;
        if (contentOffset.y <= 0) {
            this.setState({ canScroll: false });
        }
    };

    onSourcePickerPress = () => {
        const { panelExpanded } = this.state;

        if (!panelExpanded) {
            this.slideUp();

            setTimeout(() => {
                this.sourcePicker.open();
            }, 1000);
        } else {
            this.sourcePicker.open();
        }
    };

    renderDetails = () => {
        const { payload } = this.props;
        const { transaction } = this.state;

        const Template = get(Templates, payload.payload.tx_type, View);
        const Global = get(Templates, 'Global');

        // if tx is SignIn ignore to show details
        if (payload.payload.tx_type === 'SignIn') {
            return null;
        }

        // render transaction details and global variables
        return (
            <>
                <Template transaction={transaction} />
                <Global transaction={transaction} />
            </>
        );
    };

    renderAccountItem = (account: AccountSchema, selected: boolean) => {
        return (
            <View style={[styles.pickerItem]}>
                <Text style={[AppStyles.pbold, selected ? AppStyles.colorBlue : AppStyles.colorBlack]}>
                    {account.label}
                </Text>
                <Text
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    style={[AppStyles.monoSubText, selected ? AppStyles.colorBlue : AppStyles.colorBlack]}
                >
                    {account.address}
                </Text>
            </View>
        );
    };

    renderError = () => {
        const { errorMessage } = this.state;
        return (
            <View
                testID="review-error-view"
                style={[AppStyles.container, AppStyles.paddingSml, { backgroundColor: AppColors.lightBlue }]}
            >
                <Icon name="IconInfo" size={70} />
                <Spacer size={20} />
                <Text style={AppStyles.h5}>{Localize.t('global.error')}</Text>
                <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                    {errorMessage || Localize.t('payload.unexpectedPayloadErrorOccurred')}
                </Text>
                <Spacer size={40} />
                <Button
                    testID="back-button"
                    label={Localize.t('global.back')}
                    onPress={() => {
                        this.onDecline();
                    }}
                />
            </View>
        );
    };

    renderEmptyOverlay = () => {
        return (
            <BlurView style={styles.blurView} blurType="xlight" blurAmount={10}>
                <View style={styles.absolute}>
                    <View style={[styles.headerContainer]}>
                        <View style={[AppStyles.row]}>
                            <View style={[AppStyles.flex1, AppStyles.leftAligned]}>
                                <Text style={[AppStyles.h5, AppStyles.textCenterAligned]}>
                                    {Localize.t('global.reviewTransaction')}
                                </Text>
                            </View>
                            <View style={[AppStyles.rightAligned]}>
                                <Button
                                    testID="back-button"
                                    roundedSmall
                                    style={AppStyles.buttonBlack}
                                    label={Localize.t('global.close')}
                                    onPress={() => {
                                        Navigator.dismissModal();
                                    }}
                                />
                            </View>
                        </View>
                    </View>
                    <View
                        style={[
                            AppStyles.flex1,
                            AppStyles.centerContent,
                            AppStyles.centerAligned,
                            AppStyles.paddingSml,
                        ]}
                    >
                        <Text style={AppStyles.h5}>{Localize.t('global.noAccountConfigured')}</Text>
                        <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                            {Localize.t('global.pleaseAddAccountToSignTheTransaction')}
                        </Text>
                        <Spacer size={20} />
                        <Button
                            testID="add-account-button"
                            label={Localize.t('home.addAccount')}
                            icon="IconPlus"
                            iconStyle={[AppStyles.imgColorWhite]}
                            rounded
                            onPress={async () => {
                                await Navigator.dismissModal();
                                Navigator.push(AppScreens.Account.Add);
                            }}
                        />
                        <Spacer size={40} />
                    </View>
                </View>
            </BlurView>
        );
    };

    renderReview = () => {
        const { accounts, source, canScroll, isPreparing } = this.state;
        const { payload } = this.props;

        return (
            <ImageBackground
                testID="review-view"
                source={Images.backgroundPattern}
                imageStyle={styles.xummAppBackground}
                style={[styles.container]}
            >
                {/* render overlay if there is no account */}
                {isEmpty(accounts) && this.renderEmptyOverlay()}
                {/* header */}
                <View style={[styles.headerContainer]}>
                    <View style={[AppStyles.row]}>
                        <View style={[AppStyles.flex1, AppStyles.leftAligned]}>
                            <Text style={[AppStyles.h5, AppStyles.textCenterAligned]}>
                                {Localize.t('global.reviewTransaction')}
                            </Text>
                        </View>
                        <View style={[AppStyles.rightAligned]}>
                            <Button
                                roundedSmall
                                style={AppStyles.buttonBlack}
                                label={Localize.t('global.close')}
                                onPress={this.onClose}
                            />
                        </View>
                    </View>
                </View>
                <View onLayout={this.setHeaderHeight} style={[styles.collapsingHeader, AppStyles.centerContent]}>
                    <View style={[AppStyles.row, AppStyles.paddingSml]}>
                        <View style={[AppStyles.flex1, AppStyles.centerAligned]}>
                            <Image source={{ uri: payload.application.icon_url }} style={[styles.xummAppIcon]} />

                            <Text style={[styles.xummAppTitle]}>{payload.application.name}</Text>

                            {!!payload.meta.custom_instruction && (
                                <>
                                    <Text style={[styles.xummAppLabelText]}>{Localize.t('global.details')}</Text>
                                    <Text style={[styles.xummAppLabelInfo]}>{payload.meta.custom_instruction}</Text>
                                </>
                            )}

                            <Text style={[styles.xummAppLabelText]}>{Localize.t('global.type')}</Text>
                            <Text style={[styles.xummAppLabelInfo, AppStyles.colorBlue, AppStyles.bold]}>
                                {this.getTransactionType()}
                            </Text>
                        </View>
                    </View>
                </View>

                <Interactable.View
                    ref={(r) => {
                        this.panel = r;
                    }}
                    snapPoints={[
                        { y: 0, id: 'down' },
                        { y: this.getTopOffset(), id: 'up' },
                    ]}
                    boundaries={{ top: this.getTopOffset() - 20 }}
                    animatedValueY={this.deltaY}
                    onDrag={this.onDrag}
                    onSnap={this.onSnap}
                    verticalOnly
                    animatedNativeDriver
                >
                    <View style={[styles.transactionContent, { height: AppSizes.screen.height - 70 }]}>
                        <View style={AppStyles.panelHeader}>
                            <View style={AppStyles.panelHandle} />
                        </View>
                        <ScrollView
                            onScroll={this.onScroll}
                            scrollEnabled={canScroll}
                            showsVerticalScrollIndicator={false}
                            scrollEventThrottle={16}
                            bounces={false}
                        >
                            <View style={[AppStyles.paddingHorizontalSml]}>
                                <View style={styles.rowLabel}>
                                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreyDark]}>
                                        {payload.payload.tx_type === 'SignIn' || payload.meta.multisign
                                            ? Localize.t('global.signAs')
                                            : Localize.t('global.signWith')}
                                    </Text>
                                </View>
                                <AccordionPicker
                                    ref={(r) => {
                                        this.sourcePicker = r;
                                    }}
                                    onSelect={this.onAccountChange}
                                    items={accounts}
                                    renderItem={this.renderAccountItem}
                                    selectedItem={source}
                                    keyExtractor={(i) => i.address}
                                    onPress={this.onSourcePickerPress}
                                />
                            </View>

                            <View style={[AppStyles.paddingHorizontalSml, AppStyles.paddingVerticalSml]}>
                                {this.renderDetails()}
                            </View>
                            <View
                                style={[
                                    AppStyles.flex1,
                                    AppStyles.paddingHorizontalSml,
                                    { paddingBottom: AppSizes.navigationBarHeight },
                                ]}
                            >
                                <Button
                                    isLoading={isPreparing}
                                    onPress={this.onAcceptPress}
                                    label={Localize.t('global.accept')}
                                />
                            </View>

                            <Spacer size={50} />
                        </ScrollView>
                    </View>
                </Interactable.View>
            </ImageBackground>
        );
    };

    renderSubmitting = () => {
        const { step } = this.state;
        return (
            <SafeAreaView style={[AppStyles.container, AppStyles.paddingSml, { backgroundColor: AppColors.light }]}>
                <View style={[AppStyles.flex5, AppStyles.centerContent]}>
                    <Image style={styles.backgroundImageStyle} source={Images.IconSend} />
                </View>

                <View style={[AppStyles.flex4]}>
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        {step === 'submitting' ? (
                            <Text style={[AppStyles.h4, AppStyles.textCenterAligned]}>
                                {step === 'submitting' ? Localize.t('send.sending') : Localize.t('send.verifying')}
                            </Text>
                        ) : (
                            <Text style={[AppStyles.h5, AppStyles.textCenterAligned, AppStyles.colorGreen]}>
                                {Localize.t('send.sent')}{' '}
                                <Icon name="IconCheck" size={20} style={AppStyles.imgColorGreen} />
                            </Text>
                        )}

                        <Spacer size={10} />
                        {step === 'verifying' && (
                            <Text style={[AppStyles.h4, AppStyles.textCenterAligned]}>
                                {Localize.t('send.verifying')}
                            </Text>
                        )}
                    </View>
                    <View style={[AppStyles.flex2]}>
                        <Image style={styles.loaderStyle} source={require('@common/assets/loader.gif')} />
                        <Spacer size={20} />
                        <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                            {Localize.t('send.submittingToLedger')}
                        </Text>
                        <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                            {Localize.t('global.thisMayTakeFewSeconds')}
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    };

    renderResult = () => {
        const { submitResult, transaction } = this.state;
        const { payload } = this.props;

        if (!submitResult) {
            return (
                <SafeAreaView
                    testID="result-view"
                    style={[AppStyles.container, { backgroundColor: AppColors.lightBlue }]}
                >
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        <Fragment key="success">
                            <Text
                                style={[
                                    AppStyles.h3,
                                    AppStyles.strong,
                                    AppStyles.textCenterAligned,
                                    AppStyles.colorBlue,
                                ]}
                            >
                                {Localize.t('send.signed')}
                            </Text>
                            <Text
                                style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.colorBlue]}
                            >
                                {Localize.t('send.transactionSignedSuccessfully')}
                            </Text>
                        </Fragment>
                    </View>

                    <View style={[AppStyles.flex3]}>
                        <View style={styles.detailsCard}>
                            {transaction.Hash && (
                                <Fragment key="txID">
                                    <Text style={[AppStyles.subtext, AppStyles.bold]}>
                                        {Localize.t('send.transactionID')}
                                    </Text>
                                    <Spacer />
                                    <Text style={[AppStyles.subtext]}>{transaction.Hash}</Text>

                                    <Spacer size={50} />
                                    <Button
                                        secondary
                                        roundedSmall
                                        label={Localize.t('global.copy')}
                                        style={AppStyles.stretchSelf}
                                        onPress={() => {
                                            Clipboard.setString(transaction.Hash);
                                            Toast(Localize.t('send.txIdCopiedToClipboard'));
                                        }}
                                    />
                                </Fragment>
                            )}
                        </View>
                    </View>

                    <Footer>
                        <Button
                            onPress={this.handleClose}
                            label={payload.meta.return_url_app ? Localize.t('global.next') : Localize.t('global.close')}
                        />
                    </Footer>
                </SafeAreaView>
            );
        }

        return (
            <SafeAreaView
                testID="result-view"
                style={[
                    AppStyles.container,
                    { backgroundColor: submitResult.success ? AppColors.lightGreen : AppColors.lightRed },
                ]}
            >
                <View style={[AppStyles.flex1, AppStyles.centerContent, AppStyles.centerContent]}>
                    {submitResult.success ? (
                        <Fragment key="success">
                            <Text
                                style={[
                                    AppStyles.h3,
                                    AppStyles.strong,
                                    AppStyles.colorGreen,
                                    AppStyles.textCenterAligned,
                                ]}
                            >
                                {Localize.t('send.submittingDone')}
                            </Text>
                            <Text
                                style={[AppStyles.p, AppStyles.bold, AppStyles.colorGreen, AppStyles.textCenterAligned]}
                            >
                                {Localize.t('send.transactionSubmittedSuccessfully')}
                            </Text>
                        </Fragment>
                    ) : (
                        <Fragment key="failed">
                            <Text style={[AppStyles.h3, AppStyles.strong, AppStyles.colorRed]}>
                                {Localize.t('send.submitFailed')}
                            </Text>
                            <Text
                                style={[AppStyles.p, AppStyles.bold, AppStyles.colorRed, AppStyles.textCenterAligned]}
                            >
                                {Localize.t('send.somethingWentWrong')}
                            </Text>
                        </Fragment>
                    )}
                </View>

                <View style={[AppStyles.flex3]}>
                    <View style={styles.detailsCard}>
                        <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.code')}</Text>
                        <Spacer />
                        <Text style={[AppStyles.p, AppStyles.monoBold]}>{submitResult.engineResult || '-'}</Text>

                        <Spacer />
                        <View style={AppStyles.hr} />
                        <Spacer />
                        <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.description')}</Text>
                        <Spacer />

                        <Text style={[AppStyles.subtext]}>{submitResult.message?.toString()}</Text>
                        <Spacer />

                        <View style={AppStyles.hr} />
                        <Spacer />

                        <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('send.transactionID')}</Text>
                        <Spacer />
                        <Text style={[AppStyles.subtext]}>{transaction.Hash}</Text>

                        <Spacer size={50} />
                        <Button
                            secondary
                            roundedSmall
                            label={Localize.t('global.copy')}
                            style={AppStyles.stretchSelf}
                            onPress={() => {
                                Clipboard.setString(transaction.Hash);
                                Toast(Localize.t('send.txIdCopiedToClipboard'));
                            }}
                        />
                    </View>
                </View>

                <Footer>
                    <Button
                        onPress={this.handleClose}
                        style={{ backgroundColor: submitResult.success ? AppColors.green : AppColors.red }}
                        label={payload.meta.return_url_app ? Localize.t('global.next') : Localize.t('global.close')}
                    />
                </Footer>
            </SafeAreaView>
        );
    };

    render() {
        const { step, hasError } = this.state;

        // don't render if any error happened
        // this can happen if there is a missing field in the payload
        if (hasError) return this.renderError();

        switch (step) {
            case 'review':
                return this.renderReview();
            case 'submitting':
            case 'verifying':
                return this.renderSubmitting();
            case 'result':
                return this.renderResult();
            default:
                return this.renderReview();
        }
    }
}

/* Export Component ==================================================================== */
export default ReviewTransactionModal;
