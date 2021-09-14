import React, { PureComponent } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

import { AmountText, Icon, Avatar } from '@components/General';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import { TrustLineSchema } from '@store/schemas/latest';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    line: TrustLineSchema;
    selfIssued: boolean;
    discreetMode: boolean;
    onPress: (line: TrustLineSchema) => void;
}

/* Component ==================================================================== */
class TrustLineItem extends PureComponent<Props> {
    onPress = () => {
        const { line, onPress } = this.props;

        if (typeof onPress === 'function') {
            onPress(line);
        }
    };

    getIssuerLabel = () => {
        const { selfIssued, line } = this.props;

        if (selfIssued) return Localize.t('home.selfIssued');

        if (line.currency.name) {
            return `${line.counterParty.name} ${NormalizeCurrencyCode(line.currency.currency)}`;
        }

        return `${line.counterParty.name}`;
    };

    getCurrencyName = () => {
        const { line } = this.props;

        if (line.currency.name) {
            return `${line.currency.name}`;
        }

        return NormalizeCurrencyCode(line.currency.currency);
    };

    getAvatar = () => {
        const { line } = this.props;

        // show alert on top of avatar if rippling set
        if ((line.no_ripple === false || line.limit === 0) && !line.obligation) {
            return (
                <Avatar
                    border
                    size={35}
                    source={{ uri: line.counterParty.avatar }}
                    badge={() => <Icon name="ImageTriangle" size={15} />}
                    badgeColor="transparent"
                />
            );
        }

        return <Avatar border size={35} source={{ uri: line.counterParty.avatar }} />;
    };

    renderBalance = () => {
        const { line, discreetMode } = this.props;

        return (
            <AmountText
                prefix={() => {
                    if (line.currency.avatar) {
                        return (
                            <View style={styles.currencyAvatarContainer}>
                                <Image
                                    style={[styles.currencyAvatar, discreetMode && AppStyles.imgColorGrey]}
                                    source={{ uri: line.currency.avatar }}
                                />
                            </View>
                        );
                    }
                    return undefined;
                }}
                value={line.balance}
                style={[AppStyles.pbold, AppStyles.monoBold]}
                discreet={discreetMode}
                discreetStyle={AppStyles.colorGrey}
            />
        );
    };

    render() {
        const { line } = this.props;

        return (
            <TouchableOpacity
                testID={`line-${line.currency.issuer}`}
                onPress={this.onPress}
                activeOpacity={0.8}
                style={[styles.currencyItem]}
            >
                <View style={[AppStyles.flex1, AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[styles.brandAvatarContainer]}>{this.getAvatar()}</View>
                    <View style={[AppStyles.column, AppStyles.centerContent]}>
                        <Text numberOfLines={1} style={[styles.currencyItemLabelSmall]}>
                            {this.getCurrencyName()}
                        </Text>
                        <Text numberOfLines={1} style={[styles.issuerLabel]}>
                            {this.getIssuerLabel()}
                        </Text>
                    </View>
                </View>
                <View
                    style={[
                        AppStyles.flex1,
                        AppStyles.row,
                        AppStyles.centerContent,
                        AppStyles.centerAligned,
                        AppStyles.flexEnd,
                    ]}
                >
                    {this.renderBalance()}
                </View>
            </TouchableOpacity>
        );
    }
}

export default TrustLineItem;
