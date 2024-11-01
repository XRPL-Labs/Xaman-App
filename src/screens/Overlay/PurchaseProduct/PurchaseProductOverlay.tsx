/**
 * Purchase product overlay
 */
import React, { Component } from 'react';
import { View, Text, Alert } from 'react-native';

import BackendService from '@services/BackendService';
import LoggerService from '@services/LoggerService';
import StyleService from '@services/StyleService';

import { Navigator } from '@common/helpers/navigator';

import { InAppPurchase, InAppPurchaseReceipt } from '@common/libs/iap';

import { AppScreens } from '@common/constants';

import { ActionPanel, Spacer, NativePaymentButton, CountDown, Button } from '@components/General';
import { ProductDetailsElement } from '@components/Modules/ProductDetailsElement';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';

import styles from './styles';

/* types ==================================================================== */
export interface Props {
    productId: string;
    productDescription: string;
    onSuccessPurchase?: () => void;
    onClose?: () => void;
}

export interface State {
    isPurchasing: boolean;
    isRestoring: boolean;
    isDetailsResolved: boolean;
    purchaseSuccess: boolean;
}

/* Component ==================================================================== */
class PurchaseProductOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.PurchaseProduct;

    private readonly actionPanel: React.RefObject<ActionPanel>;

    constructor(props: Props) {
        super(props);

        this.state = {
            isPurchasing: false,
            isRestoring: false,
            isDetailsResolved: false,
            purchaseSuccess: false,
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

    onDetailsResolved = () => {
        this.setState({
            isDetailsResolved: true,
        });
    };

    onSuccessPurchase = async () => {
        const { onSuccessPurchase } = this.props;

        if (typeof onSuccessPurchase === 'function') {
            onSuccessPurchase();
        }

        this.setState({
            purchaseSuccess: true,
        });
    };

    restorePurchase = () => {
        this.setState({
            isRestoring: true,
        });

        InAppPurchase.restorePurchases()
            .then(async (receipts) => {
                if (Array.isArray(receipts) && receipts.length > 0) {
                    // start the verifying process
                    await this.verifyPurchase(receipts[0]);
                } else {
                    Alert.alert(
                        Localize.t('monetization.noPurchaseFound'),
                        Localize.t('monetization.noPreviousPurchases'),
                    );
                }
            })
            .catch(() => {
                Alert.alert(
                    Localize.t('global.unexpectedErrorOccurred'),
                    Localize.t('monetization.errorRestorePurchase'),
                );
            })
            .finally(() => {
                this.setState({
                    isRestoring: false,
                });
            });
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
                const receipt = receipts[0];

                if ('error' in receipt) {
                    // something happened :\
                    throw new Error(receipt.error);
                } else {
                    // start the verifying process if transaction was successful
                    await this.verifyPurchase(receipt);
                }
            }
        } catch (error: any) {
            LoggerService.recordError('lunchPurchaseFlow: ', error);
            Alert.alert(
                Localize.t('monetization.purchaseFailed'),
                error.message || Localize.t('global.somethingWentWrong'),
            );
        } finally {
            this.setState({
                isPurchasing: false,
            });
        }
    };

    renderContent = () => {
        const { productId } = this.props;
        const { isPurchasing, isRestoring, isDetailsResolved, purchaseSuccess } = this.state;

        if (purchaseSuccess) {
            return (
                <View style={[AppStyles.flex1, AppStyles.centerAligned]}>
                    <Spacer size={20} />
                    <Text style={styles.successPurchaseText}>{Localize.t('monetization.allSet')}</Text>
                    <Spacer />
                    <Text style={styles.successPurchaseSubtext}>{Localize.t('monetization.thankYouForPurchase')}</Text>
                    <Spacer size={50} />
                    <Text style={styles.emojiIcon}>🎉</Text>
                    <Spacer size={80} />
                    <CountDown
                        seconds={5}
                        style={styles.countDownText}
                        onFinish={() => {
                            this.actionPanel.current?.slideDown();
                        }}
                        preFix={Localize.t('global.closingIn')}
                        postFix="s"
                    />
                </View>
            );
        }

        return (
            <>
                <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                    <ProductDetailsElement productId={productId} onDetailsResolved={this.onDetailsResolved} />
                </View>
                <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                    <Text style={styles.prePurchaseText}>{Localize.t('monetization.prePurchaseMessage')}</Text>
                </View>
                <View style={AppStyles.flex1}>
                    <NativePaymentButton
                        onPress={this.lunchPurchaseFlow}
                        isLoading={isPurchasing}
                        isDisabled={!isDetailsResolved}
                    />
                    <View style={styles.separatorContainer}>
                        <Text style={styles.separatorText}>{Localize.t('global.or')}</Text>
                    </View>
                    <Button
                        textStyle={styles.restorePurchase}
                        isLoading={isRestoring}
                        loadingIndicatorStyle={StyleService.select({ dark: 'light', light: 'dark' })}
                        onPress={this.restorePurchase}
                        label={Localize.t('monetization.restorePurchase')}
                        roundedMini
                        transparent
                    />
                </View>
            </>
        );
    };

    render() {
        return (
            <ActionPanel
                height={AppSizes.moderateScale(400)}
                onSlideDown={Navigator.dismissOverlay}
                ref={this.actionPanel}
                contentStyle={styles.actionPanel}
                extraBottomInset
            >
                {this.renderContent()}
            </ActionPanel>
        );
    }
}

/* Export Component ==================================================================== */
export default PurchaseProductOverlay;
