import moment from 'moment-timezone';

import React, { PureComponent } from 'react';
import { View, Text, InteractionManager } from 'react-native';

import { InstanceTypes, LedgerEntryTypes } from '@common/libs/ledger/types/enums';

import { Badge, BadgeType } from '@components/General';

import { AppStyles } from '@theme';
import styles from './styles';

import { Props } from './types';

/* Types ==================================================================== */
interface State {
    label?: string;
}

/* Component ==================================================================== */
class Label extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            label: undefined,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.setLabel);
    }

    setLabel = () => {
        const { item, explainer } = this.props;

        this.setState({
            label: explainer?.getEventsLabel() ?? item.Type,
        });
    };

    renderItemLabel = () => {
        const { label } = this.state;

        return <Text style={AppStyles.h5}>{label}</Text>;
    };

    renderStatus = () => {
        const { item } = this.props;

        let badgeType: BadgeType;

        if (item.InstanceType === InstanceTypes.LedgerObject) {
            // ledger object
            if ([LedgerEntryTypes.Escrow].includes(item.Type)) {
                badgeType = BadgeType.Planned;
            } else {
                badgeType = BadgeType.Open;
            }
        } else {
            // transaction
            badgeType = BadgeType.Success;
        }

        return <Badge size="medium" type={badgeType} />;
    };

    renderDate = () => {
        const { item } = this.props;

        if ('Date' in item) {
            return <Text style={styles.dateText}>{moment(item.Date).format('LLLL')}</Text>;
        }

        return null;
    };

    render() {
        return (
            <View style={styles.labelContainer}>
                {this.renderItemLabel()}
                {this.renderStatus()}
                {this.renderDate()}
            </View>
        );
    }
}

export default Label;
