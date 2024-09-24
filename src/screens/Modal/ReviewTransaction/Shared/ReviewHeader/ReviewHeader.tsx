/**
 * Review transaction header
 */

import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { SignableMutatedTransaction } from '@common/libs/ledger/transactions/types';
import { PseudoTransactionTypes } from '@common/libs/ledger/types/enums';

import { Button } from '@components/General';
import { NetworkLabel } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
interface Props {
    transaction: SignableMutatedTransaction | undefined;
    onClose: () => void;
}

interface State {
    title?: string;
}
/* Component ==================================================================== */
class ReviewHeader extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            title: undefined,
        };
    }

    static getDerivedStateFromProps(nextProps: Props): Partial<State> | null {
        if (nextProps.transaction) {
            return {
                title:
                    nextProps.transaction.Type === PseudoTransactionTypes.SignIn
                        ? Localize.t('global.signIn')
                        : Localize.t('global.reviewTransaction'),
            };
        }
        return null;
    }

    render() {
        const { title } = this.state;
        const { onClose } = this.props;

        return (
            <View style={styles.container}>
                <View style={AppStyles.row}>
                    <View style={[AppStyles.flex1, AppStyles.leftAligned, AppStyles.paddingRightSml]}>
                        <Text numberOfLines={1} style={[AppStyles.h5, AppStyles.textCenterAligned]}>
                            {title}
                        </Text>
                        <NetworkLabel type="both" />
                    </View>
                    <View style={AppStyles.rightAligned}>
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
        );
    }
}

/* Export Component ==================================================================== */
export default ReviewHeader;
