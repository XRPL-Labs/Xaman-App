import { Component } from 'react';

import { DIDDelete } from '@common/libs/ledger/transactions';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: DIDDelete;
}

export interface State {}

/* Component ==================================================================== */
class DIDDeleteTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        return null;
    }
}

export default DIDDeleteTemplate;
