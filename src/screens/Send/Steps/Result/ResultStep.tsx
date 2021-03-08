/**
 * Send Result Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Image, TouchableWithoutFeedback, LayoutAnimation } from 'react-native';

import Clipboard from '@react-native-community/clipboard';

import { Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import { ContactRepository, AccountRepository } from '@store/repositories';

import { AppScreens } from '@common/constants';

// components
import { Button, Footer, AmountText, Spacer } from '@components/General';
import Localize from '@locale';
// style
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
    context: React.ContextType<typeof StepsContext>;

    private mounted: boolean;

    constructor(props: Props) {
        super(props);

        this.state = {
            showDetailsCard: false,
        };

        this.mounted = false;
    }

    componentDidMount() {
        const { payment } = this.context;

        this.mounted = true;

        if (payment.TransactionResult?.success) {
            setTimeout(() => {
                if (this.mounted) {
                    this.showDetailsCard();
                }
            }, 4500);
        }
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    showDetailsCard = () => {
        LayoutAnimation.spring();
        this.setState({
            showDetailsCard: true,
        });
    };

    renderAddToContactButton = () => {
        const { destination } = this.context;

        // if destination is already in the contact list or it's or own account just ignore
        const contact = ContactRepository.findBy('address', destination.address);
        const account = AccountRepository.findBy('address', destination.address);

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
                    onPress={() => {
                        Navigator.popToRoot();

                        setTimeout(() => {
                            Navigator.push(AppScreens.Settings.AddressBook.Add, {}, destination);
                        }, 1000);
                    }}
                />
            </>
        );
    };

    renderDetailsCard = () => {
        const { destination, amount, currency } = this.context;

        return (
            <View style={styles.detailsCard}>
                <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.amount')}:</Text>
                <Spacer />

                <AmountText
                    style={[AppStyles.h4, AppStyles.monoBold]}
                    value={amount}
                    currency={typeof currency === 'string' ? 'XRP' : currency.currency.currency}
                />

                <Spacer />
                <View style={AppStyles.hr} />
                <Spacer />
                <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.recipient')}:</Text>
                <Spacer />
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.colorBlue]}>{destination.name}</Text>
                <Text style={[AppStyles.subtext, AppStyles.mono]}>{destination.address}</Text>

                {this.renderAddToContactButton()}
            </View>
        );
    };

    renderSuccess = () => {
        const { showDetailsCard } = this.state;

        return (
            <SafeAreaView
                testID="send-result-view"
                style={[styles.container, { backgroundColor: AppColors.lightGreen }]}
            >
                <View style={[AppStyles.flex1, AppStyles.centerContent, AppStyles.paddingSml]}>
                    <Text style={[AppStyles.h3, AppStyles.strong, AppStyles.colorGreen, AppStyles.textCenterAligned]}>
                        {Localize.t('send.sendingDone')}
                    </Text>
                    <Text
                        style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreen, AppStyles.textCenterAligned]}
                    >
                        {Localize.t('send.transferredSuccessfully')}
                    </Text>
                </View>

                <View style={[AppStyles.flex2]}>
                    {showDetailsCard ? (
                        this.renderDetailsCard()
                    ) : (
                        <TouchableWithoutFeedback onPress={this.showDetailsCard}>
                            <Image style={styles.successImage} source={require('@common/assets/success.gif')} />
                        </TouchableWithoutFeedback>
                    )}
                </View>

                <Footer style={[]}>
                    <Button
                        onPress={() => {
                            Navigator.popToRoot();
                        }}
                        style={{ backgroundColor: AppColors.green }}
                        label={Localize.t('global.close')}
                    />
                </Footer>
            </SafeAreaView>
        );
    };

    renderFailed = () => {
        const { payment } = this.context;

        return (
            <SafeAreaView testID="send-result-view" style={[styles.container, { backgroundColor: AppColors.lightRed }]}>
                <View style={[AppStyles.flex1, AppStyles.centerContent, AppStyles.paddingSml]}>
                    <Text style={[AppStyles.h3, AppStyles.strong, AppStyles.colorRed, AppStyles.textCenterAligned]}>
                        {Localize.t('send.sendingFailed')}
                    </Text>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorRed, AppStyles.textCenterAligned]}>
                        {Localize.t('send.somethingWentWrong')}
                    </Text>
                </View>

                <View style={[AppStyles.flex2]}>
                    <View style={styles.detailsCard}>
                        <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.code')}:</Text>
                        <Spacer />
                        <Text style={[AppStyles.p, AppStyles.monoBold]}>
                            {payment.TransactionResult?.code || 'Error'}
                        </Text>

                        <Spacer />
                        <View style={AppStyles.hr} />
                        <Spacer />
                        <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.description')}:</Text>
                        <Spacer />
                        <Text style={[AppStyles.subtext]}>
                            {payment.TransactionResult?.message || 'No Description'}
                        </Text>

                        <Spacer size={50} />

                        <Button
                            secondary
                            roundedSmall
                            label={Localize.t('global.copy')}
                            style={AppStyles.stretchSelf}
                            onPress={() => {
                                Clipboard.setString(
                                    payment.TransactionResult?.message || payment.TransactionResult?.code || 'Error',
                                );
                                Toast(Localize.t('send.resultCopiedToClipboard'));
                            }}
                        />
                    </View>
                </View>

                <Footer style={[]}>
                    <Button
                        onPress={() => {
                            Navigator.popToRoot();
                        }}
                        style={{ backgroundColor: AppColors.red }}
                        label={Localize.t('global.close')}
                    />
                </Footer>
            </SafeAreaView>
        );
    };

    render() {
        const { payment } = this.context;

        if (payment.TransactionResult?.success) {
            return this.renderSuccess();
        }

        return this.renderFailed();
    }
}

/* Export Component ==================================================================== */
export default ResultStep;
