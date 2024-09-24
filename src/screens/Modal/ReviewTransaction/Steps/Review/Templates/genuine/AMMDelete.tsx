import { isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { AMMDelete } from '@common/libs/ledger/transactions';

import { CurrencyElement } from '@components/Modules';

import Localize from '@locale';

import styles from '../styles';

import { TemplateProps } from '../types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: AMMDelete;
}

export interface State {}

/* Component ==================================================================== */
class AMMDeleteTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                {!isUndefined(transaction.Asset) && (
                    <>
                        <Text style={styles.label}>{Localize.t('events.asset')}</Text>
                        <View style={styles.contentBox}>
                            <CurrencyElement issuer={transaction.Asset.issuer} currency={transaction.Asset.currency} />
                        </View>
                    </>
                )}

                {!isUndefined(transaction.Asset2) && (
                    <>
                        <Text style={styles.label}>{Localize.t('events.asset2')}</Text>
                        <View style={styles.contentBox}>
                            <CurrencyElement
                                issuer={transaction.Asset2.issuer}
                                currency={transaction.Asset2.currency}
                            />
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default AMMDeleteTemplate;
