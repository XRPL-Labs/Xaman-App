import React, { Component } from 'react';
import { View } from 'react-native';

import { SignIn } from '@common/libs/ledger/transactions/pseudo';

import { TemplateProps } from '../types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: SignIn;
}

export interface State {}

/* Component ==================================================================== */
class SignInTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    // @ts-ignore
    render() {
        return <View />;
    }
}

export default SignInTemplate;
