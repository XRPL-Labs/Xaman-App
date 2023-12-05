/**
 * Review error view
 */

import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { Button, Icon, InfoMessage, Spacer } from '@components/General';

import StyleService from '@services/StyleService';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
/* types ==================================================================== */

interface Props {
    errorMessage?: string;
    onBackPress: () => void;
}

interface State {}

/* Component ==================================================================== */
class ErrorView extends PureComponent<Props, State> {
    onBackPress = () => {
        const { onBackPress } = this.props;

        if (typeof onBackPress === 'function') {
            onBackPress();
        }
    };

    render() {
        const { errorMessage } = this.props;

        return (
            <View
                testID="review-error-view"
                style={[
                    AppStyles.container,
                    AppStyles.paddingSml,
                    { backgroundColor: StyleService.value('$lightRed') },
                ]}
            >
                <Icon name="IconInfo" style={{ tintColor: StyleService.value('$red') }} size={70} />
                <Text style={[AppStyles.h5, { color: StyleService.value('$red') }]}>{Localize.t('global.error')}</Text>
                <Spacer size={20} />
                <InfoMessage
                    type="error"
                    labelStyle={[AppStyles.p, AppStyles.bold]}
                    label={errorMessage || Localize.t('payload.unexpectedPayloadErrorOccurred')}
                />
                <Spacer size={40} />
                <Button testID="back-button" label={Localize.t('global.back')} onPress={this.onBackPress} />
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default ErrorView;
