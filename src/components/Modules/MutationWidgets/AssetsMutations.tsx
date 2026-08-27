import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';

import { AmountText, Icon } from '@components/General';
import { NFTokenElement } from '@components/Modules/NFTokenElement';
import { URITokenElement } from '@components/Modules/URITokenElement';

import { AssetDetails, AssetTypes, MonetaryFactorType, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { BalanceChangeType } from '@common/libs/ledger/parser/types';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

import { Props } from './types';
import NetworkService from '@services/NetworkService';

const ACTION_DEC = 'DEC';
const ACTION_INC = 'INC';
const EFFECT_IMMEDIATE = 'IMMEDIATE_EFFECT';
const EFFECT_POTENTIAL = 'POTENTIAL_EFFECT';
const EFFECT_NONE = 'NO_EFFECT';

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
        if (typeof explainer === 'undefined') {
            return null;
        }

        try {
            const monetaryDetails = explainer.getMonetaryDetails();
            const assetDetails = explainer.getAssetDetails();
            const mutate = monetaryDetails && monetaryDetails.mutate;

            return {
                mutatedDec: (mutate && mutate.DEC) || [],
                mutatedInc: (mutate && mutate.INC) || [],
                factor: (monetaryDetails && monetaryDetails.factor) || [],
                assets: assetDetails || [],
            };
        } catch {
            return {
                mutatedDec: [],
                mutatedInc: [],
                factor: [],
                assets: [],
            };
        }
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

        const label = 'label' in change ? change.label : undefined;
        const isDec = change.action === ACTION_DEC;
        const isImmediate = effect === EFFECT_IMMEDIATE;
        const isPotential = effect === EFFECT_POTENTIAL;
        const tone = isImmediate
            ? isDec
                ? styles.outgoingColor
                : styles.incomingColor
            : isDec
              ? styles.orangeColor
              : styles.naturalColor;
        const iconName = isImmediate
            ? isDec
                ? 'IconCornerRightUp'
                : 'IconCornerRightDown'
            : isPotential
              ? 'IconRepeat'
              : undefined;

        return (
            <View
                key={`monetary-${label || ''}-${change.action}-${change.value}-${change.currency}`}
                style={styles.amountRow}
            >
                {!!label && <Text style={styles.amountFactorLabel}>{label}</Text>}
                <View style={styles.amountContainer}>
                    {!!iconName && (
                        <Icon
                            name={iconName}
                            size={22}
                            style={[{ tintColor: tone.tintColor }, styles.amountIcon]}
                        />
                    )}
                    <AmountText
                        value={change.value}
                        currency={change.currency}
                        prefix={isDec && '-'}
                        truncateLp
                        style={[styles.amountText, { color: tone.color }]}
                    />
                </View>
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

        const labeled = factor?.filter((f) => !!f.label) || [];
        const unlabeled = factor?.filter((f) => !f.label) || [];
        const factorDec = unlabeled.filter((f) => f.action === ACTION_DEC);
        const factorInc = unlabeled.filter((f) => f.action === ACTION_INC);
        const notEffected = unlabeled.filter((f) => !f.action);
        const hasNotEffected = notEffected.length > 0;
        const hasEitherFactors = factorInc.length > 0 || factorDec.length > 0;
        const hasBothFactors = factorInc.length > 0 && factorDec.length > 0;

        const noMutation = hasNoMutations &&
            account.address !== ((item as any)?.Account || (item as any)?.Subject || (item as any)?.Issuer) &&
            !item.Type.match(/Credential/) &&
            !item.Type.match(/Check/) &&
            !item.Type.match(/Preauth/) &&
            !item.Type.match(/Cron/) &&
            !item.Type.match(/Vault/) &&
            !(item.Type.match(/Clawback/) && (item as any)?.Holder === account.address);
        
        let specificAmount = null;
        if (noMutation) {
            if (item.Type.match(/NFTokenOffer/) && item.Flags?.lsfSellNFToken) {
                try {
                    const amount = (item as any)?._object?.Amount;   
                    if (typeof amount === 'string') {
                        specificAmount = {
                            currency: NetworkService.getNativeAsset(),
                            value: Number(amount) / 1_000_000,
                        };
                    } else if (typeof amount === 'object' && amount?.value) {
                        specificAmount = {
                            currency: amount?.currency,
                            value: Number(amount?.value),
                        };
                    }
                } catch (e) {
                    //
                }
            }
        }


        return (
            <View style={[styles.itemContainer, styles.itemContainerGap]}>
                {assets?.map(this.renderAssetElement)}
                {labeled.length > 0 &&
                    labeled.map((f) => this.renderMonetaryElement(f, f.effect))}
                {labeled.length === 0 && assets?.length > 0 &&
                    (hasEitherMutation || (hasNoMutations && hasEitherFactors)) &&
                    this.renderSwitchIcon()}
                {labeled.length === 0 &&
                    mutatedDec?.map((m) => this.renderMonetaryElement(m, EFFECT_IMMEDIATE as MonetaryStatus))}
                {labeled.length === 0 && hasBothMutation && this.renderSwitchIcon()}
                {labeled.length === 0 &&
                    mutatedInc?.map((m) => this.renderMonetaryElement(m, EFFECT_IMMEDIATE as MonetaryStatus))}
                {labeled.length === 0 && specificAmount && specificAmount.value > 0 && (
                    <View style={styles.amountContainer}>
                        <AmountText
                            value={specificAmount.value}
                            currency={specificAmount.currency}
                            prefix="-"
                            truncateLp
                            style={[
                                styles.amountText,
                                {
                                    color: styles.outgoingColor.color,
                                },
                            ]}
                        />
                    </View>
                )}
                {labeled.length === 0 && noMutation && (
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
                        ]}>{Localize.t(
                            (item as any)?.MetaData?.ParentRemitID
                                ? 'events.remitInnerTxExplain'
                                : 'events.thirdPartyTxExplain',
                        )}</Text>
                    </View>
                )}
                {labeled.length === 0 && hasNoMutations && !noMutation && hasEitherFactors && (
                    <>
                        {factorDec?.map((f) => this.renderMonetaryElement(f, f?.effect))}
                        {hasBothFactors && this.renderSwitchIcon()}
                        {factorInc?.map((f) => this.renderMonetaryElement(f, f?.effect))}
                    </>
                )}
                {labeled.length === 0 &&
                    hasNoMutations &&
                    hasNotEffected &&
                    notEffected?.map((f) => this.renderMonetaryElement(f, EFFECT_NONE as MonetaryStatus))}
            </View>
        );
    }
}

export default AssetsMutations;
