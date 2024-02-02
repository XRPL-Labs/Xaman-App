/**
 * Import Account/SecretNumbers Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert } from 'react-native';

import { derive } from 'xrpl-accountlib';

import Localize from '@locale';
// components
import { Button, Footer } from '@components/General';
import { SecretNumberInput } from '@components/Modules';

// style
import { AppStyles } from '@theme';

import { StepsContext } from '../../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {
    allFilled: boolean;
}

/* Component ==================================================================== */
class EnterSecretNumbers extends Component<Props, State> {
    static contextType = StepsContext;
    declare context: React.ContextType<typeof StepsContext>;

    private secretNumberInputRef: React.RefObject<SecretNumberInput>;

    constructor(props: Props) {
        super(props);

        this.state = {
            allFilled: false,
        };

        this.secretNumberInputRef = React.createRef();
    }

    goNext = () => {
        const { goNext, setImportedAccount, importOfflineSecretNumber } = this.context;

        const secretNumber = this.secretNumberInputRef.current?.getNumbers();

        try {
            // double check, this should never happen
            if (!secretNumber || !Array.isArray(secretNumber)) {
                Alert.alert(Localize.t('global.error'), 'No secret number provided!');
                return;
            }

            const account = derive.secretNumbers(secretNumber, importOfflineSecretNumber);

            // set imported account
            setImportedAccount(account, () => {
                // go to next step
                goNext('ConfirmPublicKey');
            });
        } catch (e) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.invalidSecretNumber'));
        }
    };

    onAllFilled = (filled: boolean) => {
        this.setState({
            allFilled: filled,
        });
    };

    render() {
        const { allFilled } = this.state;
        const { goBack, importOfflineSecretNumber } = this.context;

        return (
            <SafeAreaView testID="account-import-enter-secretNumbers" style={AppStyles.container}>
                <Text
                    style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontalSml]}
                >
                    {Localize.t('account.pleaseEnterYourSecretNumber')}
                </Text>

                <View style={[AppStyles.contentContainer, AppStyles.paddingHorizontal, AppStyles.centerAligned]}>
                    <SecretNumberInput
                        ref={this.secretNumberInputRef}
                        onAllFilled={this.onAllFilled}
                        checksum={!importOfflineSecretNumber}
                    />
                </View>

                <Footer style={[AppStyles.centerAligned, AppStyles.row]}>
                    <View style={[AppStyles.flex3, AppStyles.paddingRightSml]}>
                        <Button
                            testID="back-button"
                            light
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={goBack}
                        />
                    </View>
                    <View style={AppStyles.flex5}>
                        <Button
                            testID="next-button"
                            isDisabled={!allFilled}
                            textStyle={AppStyles.strong}
                            label={Localize.t('global.next')}
                            onPress={this.goNext}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default EnterSecretNumbers;
