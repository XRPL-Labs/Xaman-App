/**
 * Import Account/Verify Signature
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert, Image } from 'react-native';

import * as AccountLib from 'xrpl-accountlib';
import { encodeForSigning } from 'ripple-binary-codec';

import RNTangemSdk, { Card } from 'tangem-sdk-react-native';

import { Images } from '@common/helpers/images';
import { GetWalletDerivedPublicKey, GetSignOptions } from '@common/utils/tangem';

// components
import { Button, Footer, Spacer } from '@components/General';

// locale
import Localize from '@locale';

// style
import { AppStyles } from '@theme';

import { StepsContext } from '../../Context';

import styles from './styles';
/* types ==================================================================== */
export interface Props {}

export interface State {}

/* Component ==================================================================== */
class VerifySignatureStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    componentDidMount(): void {
        RNTangemSdk.startSession({}).catch(() => {
            // ignore
        });
    }

    componentWillUnmount(): void {
        setTimeout(() => {
            RNTangemSdk.stopSession().catch(() => {
                // ignore
            });
        }, 5000);
    }

    goBack = () => {
        const { goBack } = this.context;

        goBack();
    };

    signAndVerify = async () => {
        const { account } = this.context;

        // get derived address
        // NOTE: as this the address that been shown to the user with get it from account object
        const { address } = account;

        const tangemCard = JSON.parse(account.additionalInfoString) as Card;
        // we can get public key from account object
        // but as we use card data to sign in the other parts we get it from card data
        const publicKey = GetWalletDerivedPublicKey(tangemCard);

        // create dummy transaction
        const dummyTransaction = { Account: address };

        // prepare the transaction for signing
        const preparedTx = AccountLib.rawSigning.prepare(dummyTransaction, publicKey);

        // get sign options base on HD wallet support
        const tangemSignOptions = GetSignOptions(tangemCard, preparedTx.hashToSign);

        // sign with tangem card
        const { signatures } = await RNTangemSdk.sign(tangemSignOptions).catch((e) => {
            throw e;
        });

        // get signature
        const signature = signatures instanceof Array ? signatures[0] : signatures;

        const { txJson } = AccountLib.rawSigning.complete(preparedTx, signature);

        const signatureValid = AccountLib.utils.verifySignature(
            encodeForSigning(txJson),
            txJson.TxnSignature,
            publicKey,
        );

        return signatureValid;
    };

    goNext = async () => {
        const { goNext } = this.context;

        try {
            const verified = await this.signAndVerify();

            if (verified) {
                goNext('ConfirmPublicKey');
            } else {
                Alert.alert(Localize.t('global.error'), Localize.t('account.unableToVerifyTheSignature'));
            }
        } catch (e) {
            // ignore use cancel operation
            // @ts-ignore
            if (e?.message && e?.message === 'The user cancelled the operation') {
                return;
            }
            Alert.alert(Localize.t('global.error'), Localize.t('account.unableToVerifyTheSignature'));
        }
    };

    render() {
        const { isLoading } = this.context;

        return (
            <SafeAreaView testID="account-import-verify-signature-view" style={[AppStyles.container]}>
                <View style={[AppStyles.centerAligned, AppStyles.marginVerticalSml]}>
                    <Image style={[styles.headerImage]} source={Images.ImageSecurityFirst} />
                </View>

                <View style={[AppStyles.contentContainer, AppStyles.centerAligned, AppStyles.padding]}>
                    <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned]}>
                        {Localize.t('account.signatureVerification')}
                    </Text>
                    <Spacer size={40} />
                    <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                        {Localize.t('account.signatureVerificationExplain')}
                    </Text>
                    <Spacer size={20} />
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.textCenterAligned]}>
                        {Localize.t('account.yourXRPLedgerAccountWillNotBeTouched')}
                    </Text>
                    <Spacer size={20} />
                </View>

                <Footer style={[AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[AppStyles.flex3, AppStyles.paddingRightSml]}>
                        <Button
                            testID="back-button"
                            light
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={this.goBack}
                        />
                    </View>
                    <View style={[AppStyles.flex5]}>
                        <Button
                            testID="next-button"
                            textStyle={AppStyles.strong}
                            label={Localize.t('global.verify')}
                            onPress={this.goNext}
                            isLoading={isLoading}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default VerifySignatureStep;
