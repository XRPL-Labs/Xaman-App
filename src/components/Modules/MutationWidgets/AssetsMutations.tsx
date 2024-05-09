import React, { PureComponent } from 'react';
import { View } from 'react-native';

import { AmountText, Icon } from '@components/General';
import { NFTokenElement } from '@components/Modules/NFTokenElement';

import { AssetDetails, AssetTypes, MonetaryFactorType, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { BalanceChangeType, OperationActions } from '@common/libs/ledger/parser/types';

import { AppStyles } from '@theme';
import styles from './styles';

import { Props } from './types';

/* Types ==================================================================== */
interface State {
    mutatedDec: BalanceChangeType[];
    mutatedInc: BalanceChangeType[];
    factorDec: MonetaryFactorType[];
    factorInc: MonetaryFactorType[];
    assets: AssetDetails[];
}

/* Component ==================================================================== */
class AssetsMutations extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            mutatedDec: [],
            mutatedInc: [],
            factorDec: [],
            factorInc: [],
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
                factorDec: monetaryDetails?.factor?.filter((f) => f.action === OperationActions.DEC) ?? [],
                factorInc: monetaryDetails?.factor?.filter((f) => f.action === OperationActions.INC) ?? [],
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
            default:
                return null;
        }
    };

    renderMonetaryElement = (change: BalanceChangeType | MonetaryFactorType, effect: MonetaryStatus) => {
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

    renderIcon = () => {
        return (
            <Icon size={22} style={[AppStyles.imgColorGrey, AppStyles.paddingVerticalSml]} name="IconSwitchAccount" />
        );
    };

    render() {
        const { mutatedDec, mutatedInc, factorInc, factorDec, assets } = this.state;

        return (
            <View style={[styles.itemContainer, styles.itemContainerGap]}>
                {assets.map(this.renderAssetElement)}
                {assets.length > 0 &&
                    ((mutatedDec.length > 0 && mutatedInc.length === 0) ||
                        (mutatedInc.length > 0 && mutatedDec.length === 0) ||
                        (!mutatedDec?.length && !mutatedInc?.length && (factorInc?.length || factorDec?.length))) &&
                    this.renderIcon()}
                {mutatedDec.map((mutate) => this.renderMonetaryElement(mutate, MonetaryStatus.IMMEDIATE_EFFECT))}
                {mutatedDec.length > 0 && mutatedInc.length > 0 && this.renderIcon()}
                {mutatedInc.map((mutate) => this.renderMonetaryElement(mutate, MonetaryStatus.IMMEDIATE_EFFECT))}

                {!mutatedDec?.length && !mutatedInc?.length && (factorInc?.length || factorDec?.length) && (
                    <>
                        {factorDec?.map((factor) => this.renderMonetaryElement(factor, factor.effect))}
                        {factorDec?.length > 0 && factorInc?.length > 0 && this.renderIcon()}
                        {factorInc?.map((factor) => this.renderMonetaryElement(factor, factor.effect))}
                    </>
                )}
            </View>
        );
    }
}

export default AssetsMutations;
