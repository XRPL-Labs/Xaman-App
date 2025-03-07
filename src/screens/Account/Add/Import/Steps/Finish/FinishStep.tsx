/* eslint-disable jsx-a11y/accessible-emoji */

/**
 * Import Account/Finish  Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, ImageBackground, Text } from 'react-native';

import StyleService from '@services/StyleService';

// components
import { Button, Footer } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {
    isLoading: boolean;
}

/* Component ==================================================================== */
class FinishStep extends Component<Props, State> {
    static contextType = StepsContext;
    declare context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: false,
        };
    }

    onFinishPress = () => {
        const { goNext } = this.context;

        // set is loading true as operation can take some time
        this.setState({ isLoading: true }, () => {
            // triggering goNext in the latest phase will store the account and dismiss the screen
            requestAnimationFrame(() => {
                goNext();
            });
        });
    };

    render() {
        const { isLoading } = this.state;

        return (
            <SafeAreaView style={AppStyles.container}>
                <ImageBackground
                    testID="account-import-finish-view"
                    source={StyleService.getImageIfLightModeIfDarkMode('BackgroundShapesLight', 'BackgroundShapes')}
                    style={[AppStyles.container]}
                    imageStyle={styles.backgroundImageStyle}
                    resizeMode="cover"
                >
                    <View
                        style={[
                            AppStyles.flex1,
                            AppStyles.paddingSml,
                            AppStyles.centerAligned,
                            AppStyles.centerContent,
                        ]}
                    >
                        <Text style={styles.emojiIcon}>🎉</Text>
                        <Text style={AppStyles.h5}>{Localize.t('account.accountImportCompleted')}</Text>
                        <Text style={[AppStyles.p, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                            {Localize.t('account.youJustImportedAccount')}
                        </Text>
                    </View>

                    <Footer>
                        <Button
                            testID="finish-button"
                            isLoading={isLoading}
                            label={Localize.t('account.yeahLetsGo')}
                            onPress={this.onFinishPress}
                        />
                    </Footer>
                </ImageBackground>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default FinishStep;
