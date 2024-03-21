import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { Payload } from '@common/libs/payload';
import { SetHook } from '@common/libs/ledger/transactions';

import { AccountModel } from '@store/models';

import { HooksExplainer } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export type HookData = {
    Flags?: number;
    HookHash?: string;
    HookNamespace?: string;
    CreateCode?: string;
    HookParameters: {
        HookParameter: {
            HookParameterName: string;
            HookParameterValue: string;
        };
    }[];
};

export interface Props extends Omit<TemplateProps, 'transaction'> {
    source: AccountModel;
    payload: Payload;
    transaction: SetHook;
}

export interface State {}
/* Component ==================================================================== */
class SetHookTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { source, payload, transaction } = this.props;

        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('global.hooks')}
                    </Text>
                </View>
                <View style={styles.contentBox}>
                    <HooksExplainer account={source} payload={payload} transaction={transaction} />
                </View>
            </>
        );
    }
}

export default SetHookTemplate;
