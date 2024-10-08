import React, { PureComponent } from 'react';
import { View, Text, Animated } from 'react-native';

import StyleService from '@services/StyleService';

import { Avatar, TouchableDebounce } from '@components/General';

import { Images } from '@common/helpers/images';

import Localize from '@locale';

import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
export interface NFTData {
    token: string;
    issuer?: string;
    name?: string;
    image?: string;
}

interface Props extends NFTData {
    index: number;
    discreetMode: boolean;
    totalTokens: number;
    onPress: (item: NFTData) => void;
}

interface State {}

/* Component ==================================================================== */
class ListItem extends PureComponent<Props, State> {
    static Height = AppSizes.scale(55);

    private readonly animatedFade: Animated.Value;
    private readonly animatedPlaceholder: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.state = {};

        this.animatedFade = new Animated.Value(0.3);
        this.animatedPlaceholder = new Animated.Value(1);
    }

    componentDidMount() {
        const { index, name } = this.props;

        // if image is null then we need to wait for the data to be loaded from backend
        // start the placeholder
        if (name === undefined) {
            setTimeout(this.startPlaceholderAnimation, index * 400);
        } else {
            this.animatedFade.setValue(1);
        }
    }

    componentDidUpdate(prevProps: Readonly<Props>) {
        const { name, index } = this.props;

        if (prevProps.name === undefined && name !== undefined) {
            // show the element with animation
            setTimeout(this.startFadeInAnimation, index * 10);
        }

        if (prevProps.name !== undefined && name === undefined) {
            setTimeout(this.startPlaceholderAnimation, index * 400);
        }
    }

    startPlaceholderAnimation = () => {
        const { name, totalTokens } = this.props;

        // if data provided stop the placeholder animation
        if (name !== undefined) {
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
        ]).start(() => {
            setTimeout(this.startPlaceholderAnimation, totalTokens * 200);
        });
    };

    startFadeInAnimation = () => {
        Animated.timing(this.animatedFade, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    };

    onItemPress = () => {
        const { onPress, token, name, issuer, image } = this.props;

        if (typeof onPress === 'function') {
            onPress({
                token,
                name,
                issuer,
                image,
            });
        }
    };

    getTokenId = () => {
        const { token } = this.props;

        if (!token) {
            return '';
        }

        return token;
    };

    getTokenName = () => {
        const { name } = this.props;

        if (!name) {
            return `[${Localize.t('global.noNameFound')}]`;
        }

        return name;
    };

    getImageSource = () => {
        const { image } = this.props;

        if (!image) {
            return StyleService.getImage('ImageBlankNFT');
        }

        return { uri: image };
    };

    renderPlaceHolder = () => {
        return (
            <View style={[styles.container, { height: ListItem.Height }]}>
                <Animated.View style={[styles.tokenImageContainer, { opacity: this.animatedPlaceholder }]}>
                    <Avatar source={Images.ImageBlankNFTLight} border size={35} />
                </Animated.View>
                <View style={[AppStyles.flex4, AppStyles.leftAligned]}>
                    <Animated.Text
                        style={[styles.label, styles.labelPlaceholder, { opacity: this.animatedPlaceholder }]}
                        numberOfLines={1}
                    >
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Animated.Text>
                    <Animated.Text
                        style={[
                            styles.description,
                            styles.descriptionPlaceholder,
                            { opacity: this.animatedPlaceholder },
                        ]}
                        numberOfLines={1}
                    >
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Animated.Text>
                </View>
            </View>
        );
    };

    render() {
        const { name } = this.props;

        if (name === undefined) {
            return this.renderPlaceHolder();
        }

        return (
            <Animated.View style={{ opacity: this.animatedFade }}>
                <TouchableDebounce
                    onPress={this.onItemPress}
                    activeOpacity={0.6}
                    style={[styles.container, { height: ListItem.Height }]}
                >
                    <View style={styles.tokenImageContainer}>
                        <Avatar source={this.getImageSource()} border size={35} />
                    </View>
                    <View style={[AppStyles.flex1, AppStyles.leftAligned]}>
                        <Text style={styles.label} numberOfLines={1}>
                            {this.getTokenName()}
                        </Text>
                        <Text ellipsizeMode="middle" style={styles.description} numberOfLines={1}>
                            {this.getTokenId()}
                        </Text>
                    </View>
                </TouchableDebounce>
            </Animated.View>
        );
    }
}

export default ListItem;
