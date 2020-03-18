/**
 * Generate Account/Explain seed/ secret numbers steps

 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Image } from 'react-native';
import { XRPL_Account } from 'xrpl-accountlib';

// components
import { Button, InfoMessage, Spacer, Footer } from '@components';
import { Images } from '@common/helpers';

import Localize from '@locale';

import { GenerateSteps } from '@screens/Account/Add/Generate';

// style
import { AppStyles } from '@theme';

/* types ==================================================================== */
export interface Props {
    account: XRPL_Account;
    goBack: (step?: GenerateSteps, settings?: any) => void;
    goNext: (step?: GenerateSteps, settings?: any) => void;
}

export interface State {}

/* Component ==================================================================== */
class SeedExplanationStep extends Component<Props, State> {
    render() {
        const { goNext } = this.props;

        return (
            <SafeAreaView testID="account-generate-explanation-private" style={[AppStyles.pageContainerFull]}>
                <View style={[AppStyles.centerAligned, AppStyles.marginBottomSml]}>
                    <Image style={[AppStyles.emptyIcon]} source={Images.ImageSecretWarning} />
                </View>

                <View style={[AppStyles.contentContainer, AppStyles.centerAligned, AppStyles.paddingSml]}>
                    <Text style={[AppStyles.baseText, AppStyles.textCenterAligned]}>
                        {Localize.t('account.privateKeyRowsDesc')}
                    </Text>

                    <Spacer size={30} />

                    <Text style={[AppStyles.baseText, AppStyles.textCenterAligned]}>
                        {Localize.t('account.writeDownPrivateKey')}
                    </Text>

                    <Spacer size={20} />

                    <InfoMessage type="error" label={Localize.t('account.neverSharePrivateKey')} />
                    <Spacer size={20} />
                </View>

                <Footer style={[AppStyles.row]}>
                    <View style={[AppStyles.flex5]}>
                        <Button
                            testID="next-button"
                            textStyle={AppStyles.strong}
                            label={Localize.t('global.nextIUnderstand')}
                            onPress={() => {
                                goNext('ViewPrivateKey');
                            }}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default SeedExplanationStep;
