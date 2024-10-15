import React, { PureComponent } from 'react';
import { View, Text, Animated, InteractionManager } from 'react-native';

import { InAppPurchase, ProductDetails } from '@common/libs/iap';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */

interface Props {
    productIdentifier: string;
    onDetailsResolved?: () => void;
}

interface State {
    productDetails?: ProductDetails;
}

/* Component ==================================================================== */
class ProductDetailsElement extends PureComponent<Props, State> {
    private readonly animatedPlaceholder: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.state = {
            productDetails: undefined,
        };

        this.animatedPlaceholder = new Animated.Value(1);
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchDetails);
    }

    fetchDetails = () => {
        const { productIdentifier, onDetailsResolved } = this.props;

        // start placeholder animation
        this.startPlaceholderAnimation();

        // fetch details from backend
        InAppPurchase.getProductDetails(productIdentifier)
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
                // ignore
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

    renderPlaceHolder = () => {
        return (
            <View style={styles.container}>
                <View style={[AppStyles.flex1, AppStyles.leftAligned]}>
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

    render() {
        const { productDetails } = this.state;

        if (!productDetails) {
            return this.renderPlaceHolder();
        }

        return (
            <View style={styles.container}>
                <View style={[AppStyles.flex1, AppStyles.leftAligned]}>
                    <Text style={styles.description} numberOfLines={3}>
                        {productDetails?.description}
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
