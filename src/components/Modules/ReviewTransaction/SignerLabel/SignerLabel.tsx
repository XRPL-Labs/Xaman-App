import React, { Component } from 'react';
import { Text } from 'react-native';

import { Payload } from '@common/libs/payload';

import Localize from '@locale';

import styles from './styles';

/* Types ==================================================================== */
interface Props {
    payload: Payload;
}

interface State {
    label?: string;
}

/* Component ==================================================================== */
class SignerLabel extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            label: undefined,
        };
    }

    static getDerivedStateFromProps(nextProps: Props): Partial<State> | null {
        return {
            label:
                nextProps.payload.isPseudoTransaction() || nextProps.payload.isMultiSign()
                    ? Localize.t('global.signAs')
                    : Localize.t('global.signWith'),
        };
    }

    render() {
        const { label } = this.state;

        return <Text style={styles.label}>{label}</Text>;
    }
}

export default SignerLabel;
