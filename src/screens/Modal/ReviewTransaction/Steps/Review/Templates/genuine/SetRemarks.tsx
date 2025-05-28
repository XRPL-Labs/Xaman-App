import { isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { SetRemarks } from '@common/libs/ledger/transactions';
import Localize from '@locale';

import styles from '../styles';

import { TemplateProps } from '../types';
import { Remark } from '@common/libs/ledger/types/common';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: SetRemarks;
}

export interface State {}

/* Component ==================================================================== */
class RemarkTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    renderRemarks = () => {
        const { transaction } = this.props;

        if (isUndefined(transaction.Remarks)) {
            return null;
        }

        return transaction.Remarks.map((remark: Remark, index: number) => {
            const flagEntries = remark.Flags && typeof remark.Flags === 'object' ? Object.entries(remark.Flags) : [];

            return (
                <View key={`remark-${index}`}>
                    <Text style={styles.value}>
                        <Text style={styles.hookParamText}>{remark.RemarkName}</Text>
                        {' : '}
                        <Text style={styles.hookParamText}>{remark.RemarkValue}</Text>
                        {flagEntries.length > 0 &&
                            flagEntries.map(([flagKey, flagValue]) =>
                                flagValue ? (
                                    <React.Fragment key={flagKey}>
                                        {' : '}
                                        <Text style={styles.hookParamText}>{flagKey}</Text>
                                    </React.Fragment>
                                ) : null,
                            )}
                    </Text>
                </View>
            );
        });
    };

    render() {
        const { transaction } = this.props;

        return (
            <>
                {!isUndefined(transaction.ObjectID) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.objectID')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.ObjectID}</Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.Remarks) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.remarks')}</Text>
                        <View style={styles.contentBox}>{this.renderRemarks()}</View>
                    </>
                )}
            </>
        );
    }
}

export default RemarkTemplate;
