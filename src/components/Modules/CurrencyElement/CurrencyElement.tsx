import { isEmpty } from 'lodash';

import React, { Component } from 'react';
import { View, Text, ViewStyle, InteractionManager, TextStyle } from 'react-native';

import NetworkService from '@services/NetworkService';

import { getAccountName, AccountNameType } from '@common/helpers/resolver';
import { NormalizeCurrencyCode } from '@common/utils/amount';
import { Images } from '@common/helpers/images';

import { Avatar, LoadingIndicator } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    id?: string;
    issuer?: string;
    currency: string;
    containerStyle?: ViewStyle | ViewStyle[];
    textStyle?: TextStyle | TextStyle[];
}

interface State {
    issuerInfo: AccountNameType;
    isLoading: boolean;
}

/* Component ==================================================================== */
class CurrencyElement extends Component<Props, State> {
    private mounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            issuerInfo: undefined,
            isLoading: true,
        };
    }

    componentDidMount() {
        // track for mount status
        this.mounted = true;

        InteractionManager.runAfterInteractions(this.fetchDetails);
    }

    componentWillUnmount() {
        // track for mount status
        this.mounted = false;
    }

    fetchDetails = () => {
        const { issuer } = this.props;
        const { isLoading } = this.state;

        // no issuer
        if (!issuer) {
            return;
        }

        if (!isLoading) {
            this.setState({
                isLoading: true,
            });
        }

        getAccountName(issuer)
            .then((res) => {
                if (!isEmpty(res)) {
                    this.setState({
                        issuerInfo: res,
                    });
                }
            })
            .catch(() => {
                // ignore
            })
            .finally(() => {
                this.setState({
                    isLoading: false,
                });
            });
    };

    renderIssuedCurrency = () => {
        const { issuer, textStyle, currency } = this.props;
        const { isLoading, issuerInfo } = this.state;

        let avatarBadge = undefined as any;

        if (issuerInfo?.kycApproved) {
            avatarBadge = 'IconCheckXaman';
        }

        return (
            <>
                <Avatar source={{ uri: `https://xumm.app/avatar/${issuer}_180_50.png` }} badge={avatarBadge} border />
                <View style={styles.centerContent}>
                    <View style={[AppStyles.flex1, AppStyles.row]}>
                        {isLoading ? (
                            <>
                                <Text style={styles.nameText}>{Localize.t('global.loading')}... </Text>
                                <LoadingIndicator />
                            </>
                        ) : (
                            <Text numberOfLines={1} style={[styles.nameText, textStyle]}>
                                {issuerInfo?.name || Localize.t('global.noNameFound')}
                            </Text>
                        )}
                    </View>
                    <Text style={[styles.addressText, textStyle]}>{issuer}</Text>
                    <View style={styles.currencyContainer}>
                        <Text style={styles.currencyText}>
                            {Localize.t('global.currency')}:{' '}
                            <Text style={AppStyles.colorPrimary}>{NormalizeCurrencyCode(currency)}</Text>
                        </Text>
                    </View>
                </View>
            </>
        );
    };

    renderNativeCurrency = () => {
        const { currency, textStyle } = this.props;

        let avatarSource = undefined as any;

        if (currency === NetworkService.getNativeAsset()) {
            const { asset } = NetworkService.getNativeAssetIcons();
            avatarSource = { uri: asset };
        } else {
            avatarSource = Images.ImageUnknownTrustLine;
        }

        return (
            <>
                <Avatar source={avatarSource} border />
                <View style={styles.centerContent}>
                    <Text numberOfLines={1} style={[styles.nativeCurrencyText, textStyle]}>
                        {NormalizeCurrencyCode(currency)}
                    </Text>
                </View>
            </>
        );
    };

    renderContent = () => {
        const { issuer } = this.props;

        if (!issuer) {
            return this.renderNativeCurrency();
        }

        return this.renderIssuedCurrency();
    };

    render() {
        const { id, issuer, currency, containerStyle } = this.props;

        return (
            <View
                testID={`currency-${issuer ?? 'native'}-${currency}`}
                style={[styles.container, containerStyle]}
                key={id}
            >
                {this.renderContent()}
            </View>
        );
    }
}

export default CurrencyElement;
