import React, { Component } from 'react';

import { TextPlaceholder } from '@components/General';

import Localize from '@locale';

import styles from './styles';

import { Props } from './types';
import { AppStyles } from '@theme/index';
/* Types ==================================================================== */
interface State {
    actionLabel?: string;
}

interface IProps extends Pick<Props, 'item' | 'explainer' | 'participant'> {}
/* Component ==================================================================== */
class ActionBlock extends Component<IProps, State> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            actionLabel: undefined,
        };
    }

    static getDerivedStateFromProps(nextProps: IProps): Partial<State> | null {
        if (typeof nextProps.explainer === 'undefined') {
            return null;
        }

        return {
            actionLabel: nextProps.explainer.getEventsLabel() ?? nextProps.item.Type,
        };
    }

    render() {
        const { participant, item } = this.props;
        const { actionLabel } = this.state;

        const rejected = (item as any)?.MetaData?.TransactionResult === 'tecHOOK_REJECTED';

        return (
            <TextPlaceholder style={[
                styles.actionText,
                rejected ? AppStyles.colorRed : {},
            ]} numberOfLines={1} isLoading={!participant || !actionLabel}>
                {rejected ? Localize.t('errors.tecHOOK_REJECTED_Short') : actionLabel }  
            </TextPlaceholder>
        );
    }
}

export default ActionBlock;
