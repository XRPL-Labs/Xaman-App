import React, { Component } from 'react';
import { InteractionManager, View } from 'react-native';
import { isEmpty, isEqual } from 'lodash';

import { AccountModel } from '@store/models';

import { AppScreens } from '@common/constants';

import { LedgerObjects } from '@common/libs/ledger/objects/types';

import { ExplainerFactory } from '@common/libs/ledger/factory';
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';

import { Navigator } from '@common/helpers/navigator';

import AccountResolver, { AccountNameType } from '@common/helpers/resolver';

import { TouchableDebounce } from '@components/General';

import { ExplainerAbstract } from '@common/libs/ledger/factory/types';
import { PseudoTransactions, Transactions } from '@common/libs/ledger/transactions/types';

import * as Blocks from './Blocks';

import { TransactionDetailsViewProps } from '@screens/Events/Details';

import { AppSizes, AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountModel;
    item: LedgerObjects & MutationsMixinType;
    timestamp?: number;
}

export interface State {
    isLoading: boolean;
    participant?: AccountNameType;
    explainer?: ExplainerAbstract<Transactions | PseudoTransactions | LedgerObjects>;
}

/* Component ==================================================================== */
class LedgerObjectItem extends Component<Props, State> {
    static Height = AppSizes.heightPercentageToDP(7.5);

    private mounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            participant: undefined,
            explainer: undefined,
        };
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        const { item, timestamp } = this.props;
        const { isLoading, participant, explainer } = this.state;

        return (
            !isEqual(nextProps.item?.Index, item?.Index) ||
            !isEqual(nextState.isLoading, isLoading) ||
            !isEqual(nextState.participant, participant) ||
            !isEqual(nextState.explainer, explainer) ||
            !isEqual(nextProps.timestamp, timestamp)
        );
    }

    componentDidMount() {
        // track mounted
        this.mounted = true;

        // fetch recipient details
        InteractionManager.runAfterInteractions(this.setDetails);
    }

    componentDidUpdate(prevProps: Props) {
        const { item, timestamp } = this.props;

        // force the lookup if timestamp changed or item changed
        if (timestamp !== prevProps.timestamp || item?.Index !== prevProps.item?.Index) {
            InteractionManager.runAfterInteractions(this.setDetails);
        }
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    setDetails = async () => {
        const { item, account } = this.props;
        const { isLoading } = this.state;

        // set is loading flag if not true
        if (!isLoading) {
            this.setState({
                isLoading: true,
            });
        }

        const explainer = ExplainerFactory.fromLedgerObject(item, account);

        if (typeof explainer === 'undefined') {
            this.setState({
                isLoading: false,
            });
            return;
        }

        // get participants
        const participants = explainer.getParticipants();

        const otherParty =
            participants.start?.address && participants.start?.address !== account.address
                ? participants.start
                : participants.end?.address && participants.end?.address !== account.address
                  ? participants.end
                  : { address: account.address };

        try {
            // get participant details
            const resp = await AccountResolver.getAccountName(otherParty.address, otherParty.tag);
            if (!isEmpty(resp) && this.mounted) {
                this.setState({
                    explainer,
                    participant: resp,
                    isLoading: false,
                });
            }
        } catch (error) {
            if (this.mounted) {
                this.setState({
                    explainer,
                    participant: { ...otherParty },
                    isLoading: false,
                });
            }
        }
    };

    onPress = () => {
        const { item, account } = this.props;

        Navigator.push<TransactionDetailsViewProps>(AppScreens.Transaction.Details, {
            item,
            account,
        });
    };

    render() {
        const { item, account } = this.props;
        const { participant, explainer } = this.state;

        return (
            <TouchableDebounce
                onPress={this.onPress}
                activeOpacity={0.6}
                style={[styles.container, { height: LedgerObjectItem.Height }]}
            >
                <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                    <Blocks.AvatarBlock participant={participant} item={item} />
                </View>
                <View style={[AppStyles.flex3, AppStyles.centerContent]}>
                    <Blocks.LabelBlock item={item} account={account} participant={participant} />
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <Blocks.ActionBlock item={item} explainer={explainer} participant={participant} />
                        <Blocks.IndicatorIconBlock item={item} account={account} />
                    </View>
                </View>
                <View style={[AppStyles.flex2, AppStyles.rightAligned, AppStyles.centerContent]}>
                    <Blocks.MonetaryBlock explainer={explainer} />
                </View>
            </TouchableDebounce>
        );
    }
}

export default LedgerObjectItem;
