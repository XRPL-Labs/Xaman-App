/**
 * Review Step
 */

import { isEmpty, get, find } from 'lodash';
import React, { Component } from 'react';
import { ImageBackground, ScrollView, View, Text, Platform, LayoutChangeEvent } from 'react-native';

import Interactable from 'react-native-interactable';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';

import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';

// components
import { Button, AccordionPicker, Spacer, Avatar } from '@components/General';

import Localize from '@locale';
// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

// transaction templates
import * as Templates from './Templates';

import { StepsContext } from '../../Context';
/* types ==================================================================== */
export interface Props {}

export interface State {
    accounts: Array<AccountSchema>;
    headerHeight: number;
    panelExpanded: boolean;
    canScroll: boolean;
}

/* Component ==================================================================== */
class ReviewStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    private panel: any;
    private sourcePicker: AccordionPicker;

    constructor(props: Props) {
        super(props);

        this.state = {
            accounts: undefined,
            canScroll: false,
            panelExpanded: false,
            headerHeight: 0,
        };
    }

    componentDidMount() {
        this.setAccounts();
    }

    setAccounts = () => {
        const { transaction, payload, setSource, setError } = this.context;

        // get available account base on transaction type
        let availableAccounts =
            payload.payload.tx_type === 'SignIn' || payload.meta.multisign
                ? AccountRepository.getSignableAccounts()
                : AccountRepository.getSpendableAccounts();

        // if no account for signing is available then just return
        if (isEmpty(availableAccounts)) {
            return;
        }

        // choose preferred account for sign
        let preferredAccount;

        // if any account set from payload
        if (transaction.Account) {
            preferredAccount = find(availableAccounts, { address: transaction.Account.address });

            // if CheckCash check if account is imported in the xumm
            if (transaction.Type === 'CheckCash') {
                // cannot sign this tx as account is not imported in the XUMM
                if (!preferredAccount) {
                    setError(Localize.t('payload.checkCanOnlyCashByCheckDestination'));
                    return;
                }
                // override available Accounts
                availableAccounts = [preferredAccount];
            }
        }

        // if the preferred account is not set in the payload
        // choose default || first available account
        if (!preferredAccount) {
            preferredAccount = find(availableAccounts, { default: true }) || availableAccounts[0];
        }

        // set the preffered account to the tx
        if (preferredAccount && !transaction.Account) {
            // ignore if it's multisign
            if (!payload.meta.multisign) {
                transaction.Account = { address: preferredAccount.address };
            }
        }

        this.setState({
            accounts: availableAccounts,
        });

        setSource(preferredAccount);
    };

    onScroll = (event: any) => {
        const { contentOffset } = event.nativeEvent;
        if (contentOffset.y <= 0) {
            this.setState({ canScroll: false });
        }
    };

    onSourcePickerPress = () => {
        const { panelExpanded, accounts } = this.state;

        if (accounts.length < 2) return;

        if (!panelExpanded) {
            this.slideUp();

            setTimeout(() => {
                this.sourcePicker.open();
            }, 1000);
        } else {
            this.sourcePicker.open();
        }
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
        if (Platform.OS === 'android') {
            setTimeout(() => {
                this.sourcePicker.updateContainerPosition();
            }, 500);
        } else {
            this.sourcePicker.updateContainerPosition();
        }
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

    renderDetails = () => {
        const { payload, transaction } = this.context;

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
            <View>
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

    renderEmptyOverlay = () => {
        return (
            <View style={styles.blurView}>
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
            </View>
        );
    };

    render() {
        const { accounts, canScroll } = this.state;

        const { payload, source, isPreparing, setSource, onAccept, onClose, getTransactionLabel } = this.context;

        return (
            <ImageBackground
                testID="review-transaction-modal"
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
                                onPress={onClose}
                            />
                        </View>
                    </View>
                </View>
                <View onLayout={this.setHeaderHeight} style={[styles.collapsingHeader, AppStyles.centerContent]}>
                    <View style={[AppStyles.row, AppStyles.paddingSml]}>
                        <View style={[AppStyles.flex1, AppStyles.centerAligned]}>
                            <Avatar size={60} border source={{ uri: payload.application.icon_url }} />

                            <Text style={[styles.appTitle]}>{payload.application.name}</Text>

                            {!!payload.meta.custom_instruction && (
                                <>
                                    <Text style={[styles.descriptionLabel]}>{Localize.t('global.details')}</Text>
                                    <Text style={[styles.instructionText]}>{payload.meta.custom_instruction}</Text>
                                </>
                            )}

                            <Text style={[styles.descriptionLabel]}>{Localize.t('global.type')}</Text>
                            <Text style={[styles.instructionText, AppStyles.colorBlue, AppStyles.bold]}>
                                {getTransactionLabel()}
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
                    onDrag={this.onDrag}
                    onSnap={this.onSnap}
                    verticalOnly
                    animatedNativeDriver
                >
                    <View style={[styles.transactionContent, { height: AppSizes.screen.height - 70 }]}>
                        <View style={AppStyles.panelHeader} testID="review-content-container">
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
                                    onSelect={setSource}
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
                                    testID="accept-button"
                                    isLoading={isPreparing}
                                    onPress={onAccept}
                                    label={Localize.t('global.accept')}
                                />
                            </View>

                            <Spacer size={50} />
                        </ScrollView>
                    </View>
                </Interactable.View>
            </ImageBackground>
        );
    }
}

/* Export Component ==================================================================== */
export default ReviewStep;
