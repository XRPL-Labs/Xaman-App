import React, { PureComponent } from 'react';
import { View, Text, InteractionManager } from 'react-native';

import { Account } from '@common/libs/ledger/parser/types';

import { Icon } from '@components/General';
import AccountElement from '@components/Modules/AccountElement/AccountElement';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
import { Props } from './types';

interface State {
    participants?: any;
}

/* Component ==================================================================== */
class Participants extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);
        
        this.state = {
            participants: undefined,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.setParticipants);
    }

    setParticipants = () => {
        const { explainer } = this.props;

        this.setState({
            participants: explainer?.getParticipants(),
        });
    };

    getTokenDetails = (forced = false) => {
        const { cachedTokenDetails } = this.props;
        const { participants } = this.state;
        // Not if self (token swap)

        return (forced || participants?.start?.address !== participants?.end?.address) && cachedTokenDetails
            ? cachedTokenDetails
            : undefined;
    };

    renderStart = (start: Account | undefined) => {
        const { account } = this.props;

        // nothing to render
        if (!start?.address) {
            return null;
        }

        return (
            <>
                <Text style={styles.detailsLabelText}>{Localize.t('global.from')}</Text>
                <AccountElement
                    address={start.address}
                    tag={start.tag}
                    tokenDetails={this.getTokenDetails()}
                    containerStyle={styles.participant}
                    visibleElements={{
                        tag: start.address !== account.address,
                        avatar: true,
                        menu: start.address !== account.address,
                    }}
                />
            </>
        );
    };

    renderThrough = (through: Account | undefined) => {
        const { account } = this.props;

        // nothing to render
        if (!through?.address) {
            return null;
        }

        return (
            <>
                <Icon name="IconArrowDown" style={[AppStyles.centerSelf, styles.iconArrow]} />
                <Text style={styles.detailsLabelText}>{Localize.t('events.through')}</Text>
                <AccountElement
                    address={through.address}
                    tokenDetails={this.getTokenDetails()}
                    containerStyle={styles.participant}
                    visibleElements={{
                        tag: true,
                        avatar: true,
                        menu: through.address !== account.address,
                    }}
                />
            </>
        );
    };

    renderEnd = (end: Account | undefined) => {
        const { account } = this.props;

        // nothing to render
        if (!end?.address) {
            return null;
        }

        return (
            <>
                <Icon name="IconArrowDown" style={[AppStyles.centerSelf, styles.iconArrow]} />
                <Text style={styles.detailsLabelText}>{Localize.t('global.to')}</Text>
                <AccountElement
                    address={end.address}
                    tag={end.tag}
                    tokenDetails={this.getTokenDetails(true)}
                    containerStyle={styles.participant}
                    visibleElements={{
                        tag: true,
                        avatar: true,
                        menu: end.address !== account.address,
                    }}
                />
            </>
        );
    };

    render() {
        const { participants } = this.state;
        // const { cachedTokenDetails } = this.props;

        // nothing to show
        if (typeof participants === 'undefined') {
            return null;
        }

        return (
            <View style={styles.participantContainer}>
                {this.renderStart(participants.start)}
                {/* <Text>{cachedTokenDetails?.account}</Text> */}
                {this.renderThrough(participants.through)}
                {this.renderEnd(participants.end)}
            </View>
        );
    }
}

export default Participants;
