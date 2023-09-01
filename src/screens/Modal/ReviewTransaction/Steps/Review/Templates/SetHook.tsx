import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { SetHook } from '@common/libs/ledger/transactions';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

import { TemplateProps } from './types';

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
    transaction: SetHook;
}

export interface State {}
/* Component ==================================================================== */
class SetHookTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    renderHook = (hook: HookData, index: number) => {
        return (
            <Text key={`${index}`} style={styles.value}>
                {JSON.stringify(hook, null, 2)}
            </Text>
        );
    };

    render() {
        const { transaction } = this.props;

        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('global.hooks')}
                    </Text>
                </View>
                <View style={styles.contentBox}>{transaction.Hooks.map(this.renderHook)}</View>
            </>
        );
    }
}

export default SetHookTemplate;
