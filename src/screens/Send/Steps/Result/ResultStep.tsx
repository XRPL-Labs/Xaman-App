/**
 * Send Result Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Image, TouchableWithoutFeedback, LayoutAnimation } from 'react-native';

import NetworkService from '@services/NetworkService';

import { Images } from '@common/helpers/images';
import { Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { Clipboard } from '@common/helpers/clipboard';

import { ContactRepository, AccountRepository } from '@store/repositories';

import { AppScreens } from '@common/constants';
import { Button, Footer, AmountText, Spacer } from '@components/General';

import Localize from '@locale';
import { AddContactViewProps } from '@screens/Settings/AddressBook/Add';

import { AppStyles, AppColors } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';
/* types ==================================================================== */
export interface Props {}

export interface State {
    showDetailsCard: boolean;
}

/* Component ==================================================================== */
class ResultStep extends Component<Props, State> {
    static contextType = StepsContext;
    declare context: React.ContextType<typeof StepsContext>;

    private showDetailsTimeout?: ReturnType<typeof setTimeout>;

    constructor(props: Props) {
        super(props);

        this.state = {
            showDetailsCard: false,
        };
    }

    componentDidMount() {
        const { payment, remit, check, altTxTypeTo } = this.context;

        const txType = (altTxTypeTo && altTxTypeTo !== '' ? altTxTypeTo.split(':')[0] : 'payment')
            .toLocaleLowerCase();

        const _tx = txType === 'remit' ? remit : txType === 'check' ? check : payment;

        if (_tx.VerifyResult?.success) {
            this.showDetailsTimeout = setTimeout(this.showDetailsCard, 4500);
        }
    }

    componentWillUnmount() {
        if (this.showDetailsTimeout) clearTimeout(this.showDetailsTimeout);
    }

    showDetailsCard = () => {
        LayoutAnimation.spring();

        this.setState({
            showDetailsCard: true,
        });
    };

    onAddToContactPress = () => {
        const { destination } = this.context;

        Navigator.popToRoot();

        setTimeout(() => {
            Navigator.push<AddContactViewProps>(AppScreens.Settings.AddressBook.Add, {
                address: destination?.address,
                tag: `${destination?.tag ?? ''}`,
                name: destination?.name,
            });
        }, 1000);
    };

    onClosePress = () => {
        Navigator.popToRoot();
    };

    renderAddToContactButton = () => {
        const { destination } = this.context;

        // if destination is already in the contact list or it's or own account just ignore
        const contact = ContactRepository.findBy('address', destination!.address);
        const account = AccountRepository.findBy('address', destination!.address);

        if (contact.isEmpty() || account.isEmpty()) {
            return null;
        }

        return (
            <>
                <Spacer size={50} />
                <Button
                    icon="IconPlus"
                    secondary
                    roundedSmall
                    label={Localize.t('send.addToContacts')}
                    onPress={this.onAddToContactPress}
                />
            </>
        );
    };

    renderDetailsCard = () => {
        const { destination, amount, token } = this.context;

        return (
            <View style={styles.detailsCard}>
                <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.amount')}:</Text>
                <Spacer />

                <AmountText
                    style={[AppStyles.h4, AppStyles.monoBold]}
                    value={amount}
                    currency={typeof token === 'string' ? NetworkService.getNativeAsset() : token.currency.currencyCode}
                    immutable
                />

                <Spacer />
                <View style={AppStyles.hr} />
                <Spacer />
                <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.recipient')}:</Text>
                <Spacer />
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.colorBlue]}>
                    {destination!.name || Localize.t('global.noNameFound')}
                </Text>
                <Text style={[AppStyles.subtext, AppStyles.mono]}>{destination!.address}</Text>

                {this.renderAddToContactButton()}
            </View>
        );
    };

    renderSuccess = () => {
        const { showDetailsCard } = this.state;
        // const { serviceFeeAmount, _tx } = this.context;
        // console.log('[ResultStep] context serviceFeeAmount', serviceFeeAmount);
        // console.log('[ResultStep] context serviceFeeTx', serviceFeeTx);
        // console.log('[ResultStep] _tx Service Fee', _tx.ServiceFee);
        // console.log('[ResultStep] _tx Service TX', _tx.ServiceFeeTx);

        return (
            <SafeAreaView testID="send-result-view" style={[styles.container, styles.containerSuccess]}>
                <View style={[AppStyles.flex1, AppStyles.centerContent, AppStyles.paddingSml]}>
                    <Text style={[AppStyles.h3, AppStyles.strong, AppStyles.colorGreen, AppStyles.textCenterAligned]}>
                        {Localize.t('send.sendingDone')}
                    </Text>
                    <Text
                        style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreen, AppStyles.textCenterAligned]}
                    >
                        {Localize.t('send.transferredSuccessfully', { network: NetworkService.getNetwork().name })}
                    </Text>
                </View>

                <View style={AppStyles.flex2}>
                    {showDetailsCard ? (
                        this.renderDetailsCard()
                    ) : (
                        <TouchableWithoutFeedback onPress={this.showDetailsCard}>
                            <Image style={styles.successImage} source={Images.ImageSuccessCheckMark} />
                        </TouchableWithoutFeedback>
                    )}
                </View>

                <Footer>
                    <Button
                        onPress={this.onClosePress}
                        style={{ backgroundColor: AppColors.green }}
                        label={Localize.t('global.close')}
                    />
                </Footer>
            </SafeAreaView>
        );
    };

    renderFailed = () => {
        const { payment, check, remit, altTxTypeTo } = this.context;

        const txType = (altTxTypeTo && altTxTypeTo !== '' ? altTxTypeTo.split(':')[0] : 'payment')
            .toLocaleLowerCase();

        const _tx = txType === 'remit' ? remit : txType === 'check' ? check : payment;


        const c = _tx?.MetaData?.HookExecutions
            ?.filter(h =>
                typeof h?.HookExecution?.HookReturnCode === 'string' &&
                typeof h?.HookExecution?.HookReturnString === 'string',
            )
            ?.map(h => [
                ((val) => val >> 63n ? -(val & ~(1n << 63n)) : val)(BigInt(`0x${String(h.HookExecution.HookReturnCode)}`)),
                Buffer.from(
                    String(h.HookExecution?.HookReturnString || '').replace(/00$/, ''),
                    'hex',
                ).toString('utf-8').trim(),
            ])
            ?.filter((h: any) =>
                h?.[0] !== 0 &&
                String(h?.[1] || '').trim().match(/[a-zA-Z0-9_\-+*^.()[\]:,;!?\s ]+$/msi),
            );  
        
        const errorMsg = c && c.length > 0
            ? c.map(h => `${h[1]} (#${h[0]})`).join(', ')
            : _tx?.FinalResult?.message ||
            _tx?.SubmitResult?.message ||
            _tx.SubmitResult?.message ||
            Localize.t('global.noInformationToShow');

        return (
            <SafeAreaView testID="send-result-view" style={[styles.container, styles.containerFailed]}>
                <View style={[AppStyles.flex1, AppStyles.centerContent, AppStyles.paddingSml]}>
                    <Text style={[AppStyles.h3, AppStyles.strong, AppStyles.colorRed, AppStyles.textCenterAligned]}>
                        {Localize.t('send.sendingFailed')}
                    </Text>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorRed, AppStyles.textCenterAligned]}>
                        {Localize.t('send.somethingWentWrong')}
                    </Text>
                </View>

                <View style={AppStyles.flex2}>
                    <View style={styles.detailsCard}>
                        <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.code')}:</Text>
                        <Spacer />
                        <Text style={[AppStyles.p, AppStyles.monoBold]}>
                            {/* {_tx.SubmitResult?.engineResult || 'Error'} */}
                            {
                                _tx?.MetaData?.TransactionResult ||
                                _tx?.FinalResult?.code ||
                                _tx?.SubmitResult?.engineResult ||
                                'Error'
                            }
                        </Text>

                        <Spacer />
                        <View style={AppStyles.hr} />
                        <Spacer />
                        <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.description')}:</Text>
                        <Spacer />
                        <Text style={AppStyles.subtext}>{errorMsg}</Text>
                        {/* <Text style={AppStyles.subtext}>{JSON.stringify(_tx.SubmitResult, null, 2)}</Text> */}

                        <Spacer size={50} />

                        <Button
                            secondary
                            roundedSmall
                            label={Localize.t('global.copy')}
                            style={AppStyles.stretchSelf}
                            onPress={() => {
                                Clipboard.setString(
                                    _tx.FinalResult?.message || _tx.FinalResult?.code || 'Unexpected Error',
                                );
                                Toast(Localize.t('send.resultCopiedToClipboard'));
                            }}
                        />
                    </View>
                </View>

                <Footer>
                    <Button
                        onPress={this.onClosePress}
                        style={{ backgroundColor: AppColors.red }}
                        label={Localize.t('global.close')}
                    />
                </Footer>
            </SafeAreaView>
        );
    };

    renderVerificationFailed = () => {
        return (
            <SafeAreaView testID="send-result-view" style={[styles.container, styles.containerVerificationFailed]}>
                <View style={[AppStyles.flex1, AppStyles.centerContent, AppStyles.paddingSml]}>
                    <Text style={[AppStyles.h3, AppStyles.strong, AppStyles.colorOrange, AppStyles.textCenterAligned]}>
                        {Localize.t('send.verificationFailed')}
                    </Text>
                    <Text
                        style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorOrange, AppStyles.textCenterAligned]}
                    >
                        {Localize.t('send.couldNotVerifyTransaction')}
                    </Text>
                </View>

                <View style={AppStyles.flex2}>
                    <View style={styles.detailsCard}>
                        <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.description')}:</Text>
                        <Spacer />
                        <Text style={[AppStyles.subtext]}>{Localize.t('send.verificationFailedDescription')}</Text>
                    </View>
                </View>

                <Footer>
                    <Button
                        onPress={this.onClosePress}
                        style={{ backgroundColor: AppColors.orange }}
                        label={Localize.t('global.close')}
                    />
                </Footer>
            </SafeAreaView>
        );
    };

    renderQueued = () => {
        return (
            <SafeAreaView testID="send-result-view" style={[styles.container, styles.containerVerificationQueued]}>
                <View style={[AppStyles.flex1, AppStyles.centerContent, AppStyles.paddingSml]}>
                    <Text style={[AppStyles.h3, AppStyles.strong, AppStyles.colorBlue, AppStyles.textCenterAligned]}>
                        {Localize.t('send.txResultQueued')}
                    </Text>
                    <Text
                        style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorBlue, AppStyles.textCenterAligned]}
                    >
                        {Localize.t('send.txResultQueuedExplain')}
                    </Text>
                </View>

                <View style={AppStyles.flex2}>
                    <View style={styles.detailsCard}>
                        <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.description')}:</Text>
                        <Spacer />
                        <Text style={[AppStyles.subtext]}>{Localize.t('send.txResultQueuedLongExplain')}</Text>
                    </View>
                </View>

                <Footer>
                    <Button
                        onPress={this.onClosePress}
                        style={{ backgroundColor: AppColors.blue }}
                        label={Localize.t('global.close')}
                    />
                </Footer>
            </SafeAreaView>
        );
    };

    render() {
        const { payment, check, remit, altTxTypeTo } = this.context;

        const txType = (altTxTypeTo && altTxTypeTo !== '' ? altTxTypeTo.split(':')[0] : 'payment')
            .toLocaleLowerCase();

        const _tx = txType === 'remit' ? remit : txType === 'check' ? check : payment;

        // THIS IS A MANUAL SEND

        // console.log('resultstep _tx - MetaData', _tx.MetaData.TransactionResult);
        // console.log('resultstep _tx - FinalResult', _tx.FinalResult.code);
        // console.log('resultstep _tx - SubmitResult', _tx.SubmitResult?.engineResult);

        if (
            _tx?.MetaData?.TransactionResult === 'terQUEUED' ||
            _tx?.FinalResult?.code === 'terQUEUED'
            // LOG  resultstep _tx - MetaData tecNO_PERMISSION
            // LOG  resultstep _tx - FinalResult tecNO_PERMISSION
            // LOG  resultstep _tx - SubmitResult telCAN_NOT_QUEUE_FEE
            // ||
            // _tx?.SubmitResult?.engineResult === 'terQUEUED'
        ) {
            return this.renderQueued();
        }

        if (_tx.FinalResult?.success) {
            // submitted successfully but cannot be verified
            if (_tx.VerifyResult?.success === false) {
                return this.renderVerificationFailed();
            }

            return this.renderSuccess();
        }

        return this.renderFailed();
    }
}

/* Export Component ==================================================================== */
export default ResultStep;
