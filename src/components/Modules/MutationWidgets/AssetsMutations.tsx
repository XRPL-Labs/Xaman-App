import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';

import { AmountText, Icon } from '@components/General';
import { NFTokenElement } from '@components/Modules/NFTokenElement';
import { URITokenElement } from '@components/Modules/URITokenElement';

import { AssetDetails, AssetTypes, MonetaryFactorType, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { BalanceChangeType, OperationActions } from '@common/libs/ledger/parser/types';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

import { Props } from './types';

/* Types ==================================================================== */
interface State {
    mutatedDec: BalanceChangeType[];
    mutatedInc: BalanceChangeType[];
    factor: MonetaryFactorType[];
    assets: AssetDetails[];
}

/* Component ==================================================================== */
class AssetsMutations extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            mutatedDec: [],
            mutatedInc: [],
            factor: [],
            assets: [],
        };
    }

    static getDerivedStateFromProps(props: Props): Partial<State> | null {
        const { explainer } = props;
        if (typeof explainer !== 'undefined') {
            const monetaryDetails = explainer.getMonetaryDetails();
            const assetDetails = explainer.getAssetDetails();

            return {
                mutatedDec: monetaryDetails?.mutate[OperationActions.DEC],
                mutatedInc: monetaryDetails?.mutate[OperationActions.INC],
                factor: monetaryDetails?.factor,
                assets: assetDetails,
            };
        }

        return null;
    }

    renderAssetElement = (asset: AssetDetails) => {
        const { account } = this.props;

        switch (asset.type) {
            case AssetTypes.NFToken:
                return (
                    <NFTokenElement
                        key={asset.nfTokenId}
                        account={account.address}
                        nfTokenId={asset.nfTokenId}
                        containerStyle={styles.nfTokenContainer}
                    />
                );
            case AssetTypes.URIToken:
                return (
                    <URITokenElement
                        key={asset.uriTokenId}
                        uriTokenId={asset.uriTokenId}
                        containerStyle={styles.uriTokenContainer}
                    />
                );
            default:
                return null;
        }
    };

    renderMonetaryElement = (change: BalanceChangeType | MonetaryFactorType, effect: MonetaryStatus) => {
        if (!change) {
            return null;
        }

        return (
            <View key={`monetary-${change.action}-${change.value}-${change.currency}`} style={styles.amountContainer}>
                {effect === MonetaryStatus.IMMEDIATE_EFFECT && (
                    <Icon
                        name={change.action === OperationActions.DEC ? 'IconCornerRightUp' : 'IconCornerRightDown'}
                        size={22}
                        style={[
                            {
                                tintColor:
                                    effect === MonetaryStatus.IMMEDIATE_EFFECT
                                        ? change.action === OperationActions.DEC
                                            ? styles.outgoingColor.tintColor
                                            : styles.incomingColor.tintColor
                                        : change.action === OperationActions.DEC
                                          ? styles.orangeColor.tintColor
                                          : styles.naturalColor.tintColor,
                            },
                            AppStyles.marginRightSml,
                        ]}
                    />
                )}
                <AmountText
                    value={change.value}
                    currency={change.currency}
                    prefix={change.action === OperationActions.DEC && '-'}
                    truncateLp
                    style={[
                        styles.amountText,
                        {
                            color:
                                effect === MonetaryStatus.IMMEDIATE_EFFECT
                                    ? change.action === OperationActions.DEC
                                        ? styles.outgoingColor.color
                                        : styles.incomingColor.color
                                    : change.action === OperationActions.DEC
                                      ? styles.orangeColor.color
                                      : styles.naturalColor.color,
                        },
                    ]}
                />
            </View>
        );
    };

    renderSwitchIcon = () => {
        return (
            <Icon size={22} style={[AppStyles.imgColorGrey, AppStyles.paddingVerticalSml]} name="IconSwitchAccount" />
        );
    };

    render() {
        const { mutatedDec, mutatedInc, factor, assets } = this.state;
        const { account, item } = this.props;

        // let hasBalanceChanges = true;
        // const mutations = item.BalanceChange(account.address);
        // if (!mutations?.[OperationActions.INC]?.[0] && !mutations?.[OperationActions.DEC]?.[0]) {
        //     hasBalanceChanges = false;
        // }

        // Extract complex conditions to variables
        const hasMutatedDec = mutatedDec?.length > 0;
        const hasMutatedInc = mutatedInc?.length > 0;
        const hasEitherMutation = (hasMutatedDec && !hasMutatedInc) || (!hasMutatedDec && hasMutatedInc);
        const hasBothMutation = hasMutatedDec && hasMutatedInc;
        const hasNoMutations = !hasMutatedDec && !hasMutatedInc;

        const factorDec = factor?.filter((f) => f.action === OperationActions.DEC);
        const factorInc = factor?.filter((f) => f.action === OperationActions.INC);
        const notEffected = factor?.filter((f) => !f.action);
        const hasNotEffected = notEffected?.length > 0;
        const hasEitherFactors = !!factorInc?.length || !!factorDec?.length;
        const hasBothFactors = factorInc?.length > 0 && factorDec?.length > 0;

        const noMutation = hasNoMutations &&
            account.address !== ((item as any)?.Account || (item as any)?.Subject || (item as any)?.Issuer) &&
            !item.Type.match(/Credential/);

        return (
            <View style={[styles.itemContainer, styles.itemContainerGap]}>
                {assets?.map(this.renderAssetElement)}
                {assets?.length > 0 &&
                    (hasEitherMutation || (hasNoMutations && hasEitherFactors)) &&
                    this.renderSwitchIcon()}
                {mutatedDec?.map((m) => this.renderMonetaryElement(m, MonetaryStatus.IMMEDIATE_EFFECT))}
                {hasBothMutation && this.renderSwitchIcon()}
                {mutatedInc?.map((m) => this.renderMonetaryElement(m, MonetaryStatus.IMMEDIATE_EFFECT))}
                {noMutation && (
                    // #45 - https://github.com/WietseWind/Xaman-App/issues/45
                    <View key='monetary-hasNoMutations' style={[
                        styles.amountContainer,
                        styles.thirdPartyTxContainer,
                    ]}>
                        <Text style={[
                            styles.thirdPartyTx,
                            AppStyles.bold,
                        ]}>{item.Type}</Text>
                        <Text style={[
                            styles.detailsValueText,
                            AppStyles.marginTopNegativeSml,
                            AppStyles.paddingTopSml,
                            AppStyles.textCenterAligned,
                            AppStyles.colorOrange,
                        ]}>{Localize.t('events.thirdPartyTxExplain')}</Text>
                    </View>
                )}
                {hasNoMutations && !noMutation && hasEitherFactors && (
                    <>
                        {factorDec?.map((f) => this.renderMonetaryElement(f, f?.effect))}
                        {hasBothFactors && this.renderSwitchIcon()}
                        {factorInc?.map((f) => this.renderMonetaryElement(f, f?.effect))}
                    </>
                )}
                {hasNoMutations &&
                    hasNotEffected &&
                    notEffected?.map((f) => this.renderMonetaryElement(f, MonetaryStatus.NO_EFFECT))}
            </View>
        );
    }
}

export default AssetsMutations;
