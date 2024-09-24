/**
 * Purchase product overlay
 */
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import BackendService from '@services/BackendService';
import LoggerService from '@services/LoggerService';

import { Navigator } from '@common/helpers/navigator';

import { InAppPurchase, InAppPurchaseReceipt } from '@common/libs/iap';

import { AppScreens } from '@common/constants';

import { ActionPanel, Spacer, NativePaymentButton } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';

/* types ==================================================================== */
export interface Props {
    productId: string;
    productDescription: string;
    onSuccessPurchase?: () => void;
    onClose?: () => void;
}

export interface State {
    isPurchasing: boolean;
}

/* Component ==================================================================== */
class PurchaseProductOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.PurchaseProduct;

    private readonly actionPanel: React.RefObject<ActionPanel>;

    constructor(props: Props) {
        super(props);

        this.state = {
            isPurchasing: false,
        };

        this.actionPanel = React.createRef();
    }

    static options() {
        return {
            statusBar: {
                visible: true,
                style: 'light',
            },
            topBar: {
                visible: false,
            },
        };
    }

    onClose = async () => {
        const { onClose } = this.props;

        if (typeof onClose === 'function') {
            onClose();
        }

        // close overlay
        await Navigator.dismissOverlay();
    };

    onSuccessPurchase = async () => {
        const { onSuccessPurchase } = this.props;

        if (typeof onSuccessPurchase === 'function') {
            onSuccessPurchase();
        }
        // close overlay
        await Navigator.dismissOverlay();
    };

    verifyPurchase = async (purchaseReceipt: InAppPurchaseReceipt) => {
        try {
            // success purchase, lets verify with the backend
            const { verified, consumable } = await BackendService.verifyPurchase(purchaseReceipt);

            if (verified && consumable) {
                let transactionReceiptIdentifier: string | undefined;

                if ('transactionIdentifier' in purchaseReceipt) {
                    transactionReceiptIdentifier = purchaseReceipt.transactionIdentifier;
                } else if ('purchaseToken' in purchaseReceipt) {
                    transactionReceiptIdentifier = purchaseReceipt.purchaseToken;
                }

                if (!transactionReceiptIdentifier) {
                    throw new Error('verifyPurchase: transactionIdentifier or purchaseToken not found!');
                }

                await InAppPurchase.finalizePurchase(transactionReceiptIdentifier);
            }

            const { applied } = await BackendService.acknowledgePurchase(purchaseReceipt);

            // call on success purchase
            if (applied) {
                this.onSuccessPurchase();
            }
        } catch (error) {
            LoggerService.recordError('verifyPurchase: ', error);
        }
    };

    lunchPurchaseFlow = async () => {
        const { productId } = this.props;

        try {
            this.setState({
                isPurchasing: true,
            });
            const receipts = await InAppPurchase.purchase(productId);
            if (Array.isArray(receipts) && receipts.length > 0) {
                // start the verifying process
                await this.verifyPurchase(receipts[0]);
            }
        } catch (error) {
            LoggerService.recordError('lunchPurchaseFlow: ', error);
        } finally {
            this.setState({
                isPurchasing: false,
            });
        }
    };

    renderContent = () => {
        const { productDescription } = this.props;
        const { isPurchasing } = this.state;

        return (
            <>
                <Text
                    style={[
                        AppStyles.centerContent,
                        AppStyles.paddingVerticalSml,
                        AppStyles.pbold,
                        AppStyles.textCenterAligned,
                    ]}
                >
                    {productDescription}
                </Text>
                <Spacer size={20} />
                <Text style={[AppStyles.baseText, AppStyles.textCenterAligned]}>
                    {Localize.t('monetization.prePurchaseMessage')}
                </Text>
                <Spacer size={50} />
                <View style={AppStyles.flex1}>
                    <NativePaymentButton onPress={this.lunchPurchaseFlow} isLoading={isPurchasing} />
                </View>
            </>
        );
    };

    render() {
        return (
            <ActionPanel
                height={AppSizes.moderateScale(300)}
                onSlideDown={Navigator.dismissOverlay}
                extraBottomInset
                ref={this.actionPanel}
            >
                {this.renderContent()}
            </ActionPanel>
        );
    }
}

/* Export Component ==================================================================== */
export default PurchaseProductOverlay;
