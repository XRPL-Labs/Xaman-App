import React, { PureComponent } from 'react';
import { View, Text, Animated, InteractionManager } from 'react-native';

import { InAppPurchase, ProductDetails } from '@common/libs/iap';

import { Button, Icon } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';
/* Types ==================================================================== */

interface Props {
    productId: string;
    onDetailsResolved?: () => void;
}

interface State {
    productDetails?: ProductDetails;
    hasError: boolean;
}

/* Component ==================================================================== */
class ProductDetailsElement extends PureComponent<Props, State> {
    private readonly animatedPlaceholder: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.state = {
            productDetails: undefined,
            hasError: false,
        };

        this.animatedPlaceholder = new Animated.Value(1);
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchDetails);
    }

    fetchDetails = () => {
        const { productId, onDetailsResolved } = this.props;

        // start placeholder animation
        this.startPlaceholderAnimation();

        // fetch details from backend
        InAppPurchase.getProductDetails(productId)
            .then((resp) => {
                this.setState(
                    {
                        productDetails: resp,
                    },
                    () => {
                        if (typeof onDetailsResolved === 'function') {
                            onDetailsResolved();
                        }
                    },
                );
            })
            .catch(() => {
                this.setState({
                    hasError: true,
                });
            });
    };

    startPlaceholderAnimation = () => {
        const { productDetails } = this.state;

        if (productDetails) {
            return;
        }

        Animated.sequence([
            Animated.timing(this.animatedPlaceholder, {
                toValue: 0.3,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(this.animatedPlaceholder, {
                toValue: 0.8,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]).start(this.startPlaceholderAnimation);
    };

    retryFetchDetails = () => {
        // set the error flag to false and try again
        this.setState(
            {
                hasError: false,
            },
            this.fetchDetails,
        );
    };

    renderPlaceHolder = () => {
        return (
            <View style={styles.container}>
                <Animated.Text
                    style={[styles.description, styles.textPlaceholder, { opacity: this.animatedPlaceholder }]}
                >
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </Animated.Text>

                <View style={AppStyles.paddingExtraSml}>
                    <View style={[AppStyles.row, AppStyles.centerAligned, AppStyles.gapExtraSml]}>
                        <Icon name="IconCheckXaman" style={styles.checkMarkIconPlaceholder} size={14} />
                        <Animated.Text
                            style={[styles.benefitsText, styles.textPlaceholder, { opacity: this.animatedPlaceholder }]}
                        >
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        </Animated.Text>
                    </View>
                    <View style={[AppStyles.row, AppStyles.centerAligned, AppStyles.gapExtraSml]}>
                        <Icon name="IconCheckXaman" style={styles.checkMarkIconPlaceholder} size={14} />
                        <Animated.Text
                            style={[styles.benefitsText, styles.textPlaceholder, { opacity: this.animatedPlaceholder }]}
                        >
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        </Animated.Text>
                    </View>
                    <View style={[AppStyles.row, AppStyles.centerAligned, AppStyles.gapExtraSml]}>
                        <Icon name="IconCheckXaman" style={styles.checkMarkIconPlaceholder} size={14} />
                        <Animated.Text
                            style={[styles.benefitsText, styles.textPlaceholder, { opacity: this.animatedPlaceholder }]}
                        >
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        </Animated.Text>
                    </View>
                </View>

                <View style={styles.priceContainer}>
                    <Animated.Text
                        style={[styles.price, styles.textPlaceholder, { opacity: this.animatedPlaceholder }]}
                    >
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Animated.Text>
                    <Animated.Text
                        style={[styles.priceDescription, styles.textPlaceholder, { opacity: this.animatedPlaceholder }]}
                    >
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Animated.Text>
                </View>
            </View>
        );
    };

    renderError = () => {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{Localize.t('monetization.couldNotFetchProductDetails')}</Text>
                <Button
                    light
                    roundedMini
                    icon="IconRefresh"
                    iconSize={14}
                    onPress={this.retryFetchDetails}
                    label={Localize.t('global.tryAgain')}
                />
            </View>
        );
    };

    render() {
        const { productDetails, hasError } = this.state;

        if (!productDetails) {
            if (hasError) {
                return this.renderError();
            }
            return this.renderPlaceHolder();
        }

        return (
            <View style={styles.container}>
                <Text style={styles.description} numberOfLines={2}>
                    {productDetails?.description || '30 days of unrestricted Xaman use'}
                </Text>

                <View style={AppStyles.paddingExtraSml}>
                    {['benefitsTextOne', 'benefitsTextTwo', 'benefitsTextThree'].map((benefit, index) => (
                        <View key={index} style={[AppStyles.row, AppStyles.centerAligned, AppStyles.gapExtraSml]}>
                            <Icon name="IconCheckXaman" style={styles.checkMarkIcon} size={14} />
                            <Text style={styles.benefitsText} numberOfLines={1}>
                                {Localize.t(`monetization.${benefit}`)}
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={styles.priceContainer}>
                    <Text style={styles.price}>{productDetails?.price}</Text>
                    <Text style={styles.priceDescription}>({Localize.t('monetization.oneTimeCharge')})</Text>
                </View>
            </View>
        );
    }
}

export default ProductDetailsElement;
