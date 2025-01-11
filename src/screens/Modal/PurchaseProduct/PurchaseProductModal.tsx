/**
 * Purchase product modal
 */

import React, { Component } from 'react';
import { View, Text, Alert, ImageBackground, Linking, Image } from 'react-native';

import BackendService from '@services/BackendService';
import LoggerService from '@services/LoggerService';
import StyleService from '@services/StyleService';

import { Navigator } from '@common/helpers/navigator';

import { InAppPurchase, InAppPurchaseReceipt } from '@common/libs/iap';

import { AppScreens } from '@common/constants';
import { ComplianceLinks } from '@common/constants/endpoints';

import { Spacer, CountDown, Button, Icon, Footer } from '@components/General';
import { ProductDetailsElement } from '@components/Modules/ProductDetailsElement';

import { Images } from '@common/helpers/images';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';

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
class PurchaseProductModal extends Component<Props, State> {
    static screenName = AppScreens.Modal.PurchaseProduct;

    constructor(props: Props) {
        super(props);

        this.state = {
            isPurchasing: false,
            isRestoring: false,
            isDetailsResolved: false,
            purchaseSuccess: false,
        };
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

        // close modal
        await Navigator.dismissModal();
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
        const { productId, productDescription } = this.props;
        const { isPurchasing, isRestoring, isDetailsResolved, purchaseSuccess } = this.state;

        if (purchaseSuccess) {
            return (
                <View>
                    <View style={[AppStyles.flex1, AppStyles.centerContent, AppStyles.paddingHorizontal]}>
                        <Spacer size={20} />
                        <Text style={styles.successPurchaseText}>{Localize.t('monetization.allSet')}</Text>
                        <Spacer />
                        <Text style={styles.successPurchaseSubtext}>
                            {Localize.t('monetization.thankYouForPurchase')}
                        </Text>
                        <Spacer size={50} />
                        <Icon name="IconCheckXaman" size={80} style={styles.checkMarkImage} />
                    </View>
                    <Footer safeArea>
                        <CountDown
                            seconds={5}
                            style={styles.countDownText}
                            onFinish={this.onClose}
                            preFix={Localize.t('global.closingIn')}
                            postFix="s"
                        />
                    </Footer>
                </View>
            );
        }

        return (
            <>
                <View style={[AppStyles.paddingTopSml, AppStyles.paddingHorizontalSml, AppStyles.rightSelf]}>
                    <Button label={Localize.t('global.close')} onPress={this.onClose} light roundedMini />
                </View>

                <View style={[AppStyles.flex2, AppStyles.centerAligned, AppStyles.paddingHorizontal]}>
                    <Image source={Images.XamanAppIcon} style={styles.appIcon} />
                    <Text style={styles.productDescriptionText}>{productDescription}</Text>
                    <Text style={styles.prePurchaseText}>{Localize.t('monetization.prePurchaseMessage')}</Text>
                </View>

                <View style={[AppStyles.flex6, styles.actionContainer]}>
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        <ProductDetailsElement productId={productId} onDetailsResolved={this.onDetailsResolved} />
                    </View>
                    <View style={[AppStyles.flex1, AppStyles.stretchSelf, AppStyles.centerContent]}>
                        <View style={[AppStyles.flex1, AppStyles.centerContent, AppStyles.gapExtraSml]}>
                            <Text style={styles.notesText}>{Localize.t('monetization.prePurchaseTip')}</Text>
                            <Text style={styles.notesText}>
                                Read our{' '}
                                <Text
                                    style={AppStyles.link}
                                    onPress={() => Linking.openURL(ComplianceLinks.TermsOfUse)}
                                >
                                    {Localize.t('monetization.termsAndConditions')}
                                </Text>{' '}
                                and{' '}
                                <Text
                                    style={AppStyles.link}
                                    onPress={() => Linking.openURL(ComplianceLinks.PrivacyStatement)}
                                >
                                    {Localize.t('monetization.privacyPolicy')}
                                </Text>{' '}
                                here.
                            </Text>
                        </View>

                        <View style={[AppStyles.flex2, AppStyles.centerContent]}>
                            <Button
                                contrast
                                label={Localize.t('monetization.payNow')}
                                onPress={this.lunchPurchaseFlow}
                                isLoading={isPurchasing}
                                isDisabled={!isDetailsResolved}
                                loadingIndicatorStyle={StyleService.select({ dark: 'dark', light: 'light' })}
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
                    </View>
                </View>
            </>
        );
    };

    render() {
        return (
            <ImageBackground
                imageStyle={styles.backgroundImageStyle}
                style={styles.container}
                source={Images.BackgroundPattern}
            >
                {this.renderContent()}
            </ImageBackground>
        );
    }
}

/* Export Component ==================================================================== */
export default PurchaseProductModal;
