/**
 * Generate Account/Explain seed/ secret numbers steps
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Image } from 'react-native';

// components
import { Button, InfoMessage, Spacer, Footer } from '@components/General';

import StyleService from '@services/StyleService';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';

import { StepsContext } from '../../Context';
/* types ==================================================================== */
export interface Props {}

export interface State {}
/* Component ==================================================================== */
class SeedExplanationStep extends Component<Props, State> {
    static contextType = StepsContext;
    declare context: React.ContextType<typeof StepsContext>;

    goNext = () => {
        const { goNext } = this.context;

        goNext('ViewPrivateKey');
    };

    render() {
        return (
            <SafeAreaView testID="account-generate-explanation-private-view" style={AppStyles.container}>
                <View style={[AppStyles.centerAligned, AppStyles.marginBottomSml]}>
                    <Image style={[AppStyles.emptyIcon]} source={StyleService.getImage('ImageSecretWarning')} />
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

                <Footer style={AppStyles.row}>
                    <View style={AppStyles.flex5}>
                        <Button
                            testID="next-button"
                            textStyle={AppStyles.strong}
                            label={Localize.t('global.nextIUnderstand')}
                            onPress={this.goNext}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default SeedExplanationStep;
