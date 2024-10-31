import React, { PureComponent } from 'react';
import { View, Text, Animated, InteractionManager } from 'react-native';

import { InAppPurchase, ProductDetails } from '@common/libs/iap';

import { Button } from '@components/General';

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
                <View style={[AppStyles.flex1, AppStyles.leftAligned]}>
                    <Animated.Text
                        style={[styles.description, styles.textPlaceholder, { opacity: this.animatedPlaceholder }]}
                    >
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Animated.Text>
                    <Animated.Text
                        style={[styles.description, styles.textPlaceholder, { opacity: this.animatedPlaceholder }]}
                    >
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Animated.Text>
                    <Animated.Text
                        style={[styles.price, styles.textPlaceholder, { opacity: this.animatedPlaceholder }]}
                    >
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Animated.Text>
                </View>
            </View>
        );
    };

    renderError = () => {
        return (
            <View style={styles.container}>
                <View style={AppStyles.flex1}>
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
                <View style={[AppStyles.flex1, AppStyles.leftAligned]}>
                    <Text style={styles.description} numberOfLines={2}>
                        {productDetails?.description || 'Unlock a full month of unlimited app use'}
                    </Text>
                    <Text style={styles.price}>
                        {productDetails?.price}{' '}
                        <Text style={styles.title}>({Localize.t('monetization.oneTimeCharge')})</Text>
                    </Text>
                </View>
            </View>
        );
    }
}

export default ProductDetailsElement;
