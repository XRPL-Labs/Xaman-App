import moment from 'moment-timezone';

import React, { PureComponent } from 'react';
import { View, Text, InteractionManager } from 'react-native';

import { InstanceTypes, LedgerEntryTypes } from '@common/libs/ledger/types/enums';

import { Badge, BadgeType } from '@components/General';

import { AppStyles } from '@theme';
import styles from './styles';

import Localize from '@locale';

import { Props } from './types';
import { OperationActions } from '@common/libs/ledger/parser/types';

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
        const { account, item, explainer } = this.props; 
        // const { item } = this.props;

        const noMutation = 
            !explainer?.getMonetaryDetails()?.mutate?.[OperationActions.INC]?.[0] &&
            !explainer?.getMonetaryDetails()?.mutate?.[OperationActions.DEC]?.[0] &&
            account.address !== ((item as any)?.Account || (item as any)?.Issuer);
        
        if (noMutation && !item.Type.match(/Credential/)) {
            return <Text style={[
                AppStyles.h4,
                styles.noBold,
                ]}>{Localize.t('events.thirdPartyTx')}</Text>;
        }

        return <Text style={[
            AppStyles.h4,
            styles.noBold,
        ]}>{label}</Text>;
    };

    renderStatus = () => {
        const { item } = this.props;

        let badgeType: BadgeType;

        if (item.InstanceType === InstanceTypes.LedgerObject) {
            // ledger object
            if ([LedgerEntryTypes.Escrow].includes(item.Type)) {
                badgeType = BadgeType.Planned;
            } else if ([LedgerEntryTypes.Credential].includes(item.Type)) {
                badgeType = BadgeType.Pending;
                if (item?.Flags?.lsfAccepted) {
                    badgeType = BadgeType.Owned;
                }
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
            return <Text style={[
                styles.dateText,
            ]}>{moment(item.Date).format('LLLL')}</Text>;
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
