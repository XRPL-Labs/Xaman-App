import React, { PureComponent } from 'react';
import { View, Text, InteractionManager } from 'react-native';

import { Account } from '@common/libs/ledger/parser/types';

import { Icon } from '@components/General';
import AccountElement from '@components/Modules/AccountElement/AccountElement';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';
import credentialStyles from '@screens/Modal/ReviewTransaction/Steps/Review/Templates/styles';

/* Types ==================================================================== */
import { Props } from './types';
import { Credential } from '@common/libs/ledger/objects';
import { HexEncoding } from '@common/utils/string';

interface State {
    // participants?: any;
}

/* Component ==================================================================== */
class Participants extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);
        
        this.state = {
            // participants: undefined,
        };
    }

    componentDidMount() {
        // InteractionManager.runAfterInteractions(this.setParticipants);
    }

    // setParticipants = () => {
    //     const { explainer } = this.props;

    //     this.setState({
    //         participants: explainer?.getParticipants(),
    //     });
    // };

    getTokenDetails = (
        // forced = false,
    ) => {
        // const { cachedTokenDetails } = this.props;
        // const { participants } = this.state;
        // // Not if self (token swap)

        // return (forced || participants?.start?.address !== participants?.end?.address) && cachedTokenDetails
        //     ? cachedTokenDetails
        //     : undefined;
    };

    renderItem = (item: Credential) => {
        return (
            <View key={`credential-${item.CredentialType}-${item.Issuer}`} style={[
                styles.credentialContainer,
                AppStyles.paddingBottomExtraSml,
                styles.noOffsetBottom,
                AppStyles.marginBottomSml,
                AppStyles.marginTopNegativeSml,
            ]}>
                <AccountElement address={item.Issuer} containerStyle={credentialStyles.attachedAccountElement} />
                <View style={[
                    credentialStyles.authorizeCredentialsContainer,
                    styles.noOffsetBottom,
                    styles.credentialRadius,
                    styles.credentialTypeLineHeight,
                ]}>
                    <Text style={[
                        AppStyles.monoSubText,
                        AppStyles.colorGrey,
                    ]}>
                        {Localize.t('global.credentialType')}:{' '}
                        <Text style={AppStyles.colorBlue}>{
                            HexEncoding.displayHex(String(item.CredentialType))
                        }</Text>
                    </Text>
                </View>
            </View>
        );
    };

    render() {
        const { item } = this.props;
        // const { cachedTokenDetails } = this.props;
        const items =
            (item as any)?.AcceptedCredentials ||
            (item as any)?.AuthorizeCredentials || 
            null;
        
        if (!items) {
            return null;
        }
        
        return (
            <View style={styles.participantContainer}>
                <Text style={styles.detailsLabelText}>{Localize.t('global.includedCredentials')}</Text>
                <View style={AppStyles.marginTopSml}>{
                    items.map((itm: Credential) => this.renderItem(itm))
                }</View>
            </View>
        );
    }
}

export default Participants;
