/**
 * Review Step
 */

import { isEmpty, get, find, filter } from 'lodash';
import React, { Component } from 'react';
import { ImageBackground, View, Text } from 'react-native';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';

import { SocketService, StyleService } from '@services';

import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';

// components
import { Button, SwipeButton, Spacer, KeyboardAwareScrollView, Avatar } from '@components/General';
import { AccountPicker } from '@components/Modules';

import Localize from '@locale';
// style
import { AppStyles } from '@theme';
import { ChainColors } from '@theme/colors';

import styles from './styles';

// transaction templates
import * as Templates from './Templates';

import { StepsContext } from '../../Context';
/* types ==================================================================== */
export interface Props {}

export interface State {
    accounts: Array<AccountSchema>;
    canScroll: boolean;
    timestamp?: number;
}

/* Component ==================================================================== */
class ReviewStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            accounts: undefined,
            canScroll: true,
        };
    }

    componentDidMount() {
        this.setAccounts();
    }

    setAccounts = () => {
        const { transaction, payload, setSource, setError } = this.context;

        // get available account base on transaction type

        let availableAccounts = [] as AccountSchema[];

        // only accounts with full access
        if (payload.isMultiSign()) {
            availableAccounts = AccountRepository.getFullAccessAccounts();
        } else if (payload.isSignIn()) {
            availableAccounts = AccountRepository.getSignableAccounts();
        } else {
            availableAccounts = AccountRepository.getSpendableAccounts(true);
        }

        // if no account for signing is available then just return
        if (isEmpty(availableAccounts)) {
            return;
        }

        // choose preferred account for sign
        let preferredAccount = undefined as AccountSchema;

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
            if (!payload.isMultiSign()) {
                transaction.Account = { address: preferredAccount.address };
            }
        }

        // remove hidden accounts but keep preffered account even if hidden
        availableAccounts = filter(availableAccounts, (a) => !a.hidden || a.address === preferredAccount.address);

        this.setState({
            accounts: availableAccounts,
        });

        setSource(preferredAccount);
    };

    toggleCanScroll = () => {
        const { canScroll } = this.state;

        this.setState({
            canScroll: !canScroll,
        });
    };

    getSwipeButtonColor = (): string => {
        const { coreSettings } = this.context;

        if (coreSettings.developerMode) {
            return ChainColors[SocketService.chain];
        }

        return undefined;
    };

    forceRender = () => {
        this.setState({
            // eslint-disable-next-line react/no-unused-state
            timestamp: +new Date(),
        });
    };

    renderDetails = () => {
        const { payload, transaction } = this.context;

        // if tx is SignIn ignore to show details
        if (payload.isSignIn()) {
            return null;
        }

        const Template = get(Templates, payload.getTransactionType(), View);
        const Global = get(Templates, 'Global');

        // render transaction details and global variables
        return (
            <>
                <Template
                    transaction={transaction}
                    canOverride={!payload.isMultiSign()}
                    forceRender={this.forceRender}
                />
                <Global transaction={transaction} canOverride={!payload.isMultiSign()} forceRender={this.forceRender} />
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
        const { onClose } = this.context;

        return (
            <View style={styles.blurView}>
                <View style={styles.absolute}>
                    <View style={[styles.headerContainer]}>
                        <View style={[AppStyles.row]}>
                            <View style={[AppStyles.flex1, AppStyles.leftAligned]}>
                                <Text numberOfLines={1} style={[AppStyles.h5, AppStyles.textCenterAligned]}>
                                    {Localize.t('global.reviewTransaction')}
                                </Text>
                            </View>
                            <View style={[AppStyles.rightAligned]}>
                                <Button
                                    contrast
                                    testID="close-button"
                                    numberOfLines={1}
                                    roundedSmall
                                    label={Localize.t('global.close')}
                                    onPress={onClose}
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

        const { payload, source, isValidating, isPreparing, setSource, onAccept, onClose, getTransactionLabel } =
            this.context;

        return (
            <ImageBackground
                testID="review-transaction-modal"
                source={StyleService.getImage('BackgroundPattern')}
                imageStyle={styles.xummAppBackground}
                style={[styles.container]}
            >
                {/* render overlay if there is no account */}
                {isEmpty(accounts) && this.renderEmptyOverlay()}
                {/* header */}
                <View style={[styles.headerContainer]}>
                    <View style={[AppStyles.row]}>
                        <View style={[AppStyles.flex1, AppStyles.leftAligned, AppStyles.paddingRightSml]}>
                            <Text numberOfLines={1} style={[AppStyles.h5, AppStyles.textCenterAligned]}>
                                {Localize.t('global.reviewTransaction')}
                            </Text>
                        </View>
                        <View style={[AppStyles.rightAligned]}>
                            <Button
                                contrast
                                testID="close-button"
                                numberOfLines={1}
                                roundedSmall
                                label={Localize.t('global.close')}
                                onPress={onClose}
                            />
                        </View>
                    </View>
                </View>
                <KeyboardAwareScrollView
                    testID="review-content-container"
                    contentContainerStyle={styles.keyboardAvoidContainerStyle}
                    style={AppStyles.flex1}
                    scrollEnabled={canScroll}
                >
                    <View style={[AppStyles.centerContent]}>
                        <View style={[AppStyles.row, AppStyles.paddingSml]}>
                            <View style={[AppStyles.flex1, AppStyles.centerAligned]}>
                                <Avatar size={60} border source={{ uri: payload.getApplicationIcon() }} />

                                <Text style={[styles.appTitle]}>{payload.getApplicationName()}</Text>

                                {!!payload.getCustomInstruction() && (
                                    <>
                                        <Text style={[styles.descriptionLabel]}>{Localize.t('global.details')}</Text>
                                        <Text style={[styles.instructionText]}>{payload.getCustomInstruction()}</Text>
                                    </>
                                )}

                                <Text style={[styles.descriptionLabel]}>{Localize.t('global.type')}</Text>
                                <Text style={[styles.instructionText, AppStyles.colorBlue, AppStyles.bold]}>
                                    {getTransactionLabel()}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.transactionContent]}>
                        <View style={[AppStyles.paddingHorizontalSml]}>
                            <View style={styles.rowLabel}>
                                <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                    {payload.isSignIn() || payload.isMultiSign()
                                        ? Localize.t('global.signAs')
                                        : Localize.t('global.signWith')}
                                </Text>
                            </View>
                            <AccountPicker onSelect={setSource} accounts={accounts} selectedItem={source} />
                        </View>

                        <View style={[AppStyles.paddingHorizontalSml, AppStyles.paddingVerticalSml]}>
                            {this.renderDetails()}
                        </View>
                        <View style={[styles.acceptButtonContainer, AppStyles.paddingHorizontalSml]}>
                            <SwipeButton
                                testID="accept-button"
                                color={this.getSwipeButtonColor()}
                                isLoading={isValidating || isPreparing}
                                onSwipeSuccess={onAccept}
                                label={Localize.t('global.slideToAccept')}
                                accessibilityLabel={Localize.t('global.accept')}
                                shouldResetAfterSuccess
                                onPanResponderGrant={this.toggleCanScroll}
                                onPanResponderRelease={this.toggleCanScroll}
                            />
                        </View>
                    </View>
                </KeyboardAwareScrollView>
            </ImageBackground>
        );
    }
}

/* Export Component ==================================================================== */
export default ReviewStep;
