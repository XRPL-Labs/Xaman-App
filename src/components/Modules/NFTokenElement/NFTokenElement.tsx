import React, { PureComponent } from 'react';
import { View, Text, Animated, InteractionManager, ViewStyle } from 'react-native';

import BackendService from '@services/BackendService';
import StyleService from '@services/StyleService';

import { Avatar } from '@components/General';

import { Images } from '@common/helpers/images';
import { Truncate } from '@common/utils/string';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */

interface Props {
    account: string;
    nfTokenId: string;
    truncate: boolean;
    containerStyle?: ViewStyle | ViewStyle[];
}

interface State {
    isLoading: boolean;
    name?: string;
    image?: string;
}

/* Component ==================================================================== */
class NFTokenElement extends PureComponent<Props, State> {
    private readonly animatedPlaceholder: Animated.Value;

    declare readonly props: Props & Required<Pick<Props, keyof typeof NFTokenElement.defaultProps>>;

    static defaultProps: Partial<Props> = {
        truncate: true,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            name: undefined,
            image: undefined,
        };

        this.animatedPlaceholder = new Animated.Value(1);
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchDetails);
    }

    fetchDetails = () => {
        const { account, nfTokenId } = this.props;

        // start placeholder animation
        this.startPlaceholderAnimation();

        // fetch details from backend
        BackendService.getXLS20Details(account, [nfTokenId])
            .then((resp: any) => {
                const { tokenData } = resp;
                if (typeof tokenData === 'object' && Object.prototype.hasOwnProperty.call(tokenData, nfTokenId)) {
                    const { image, name } = tokenData[nfTokenId];

                    this.setState({
                        image,
                        name,
                    });
                }
            })
            .catch(() => {
                // ignore
            })
            .finally(() => {
                this.setState({
                    isLoading: false,
                });
            });
    };

    startPlaceholderAnimation = () => {
        const { isLoading } = this.state;

        if (!isLoading) {
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

    getTokenId = () => {
        const { nfTokenId, truncate } = this.props;

        if (!nfTokenId) {
            return 'No NFTokenID';
        }

        if (truncate) {
            return Truncate(nfTokenId, 32);
        }

        return nfTokenId;
    };

    getTokenName = () => {
        const { name } = this.state;

        if (!name) {
            return `[${Localize.t('global.noNameFound')}]`;
        }

        return name;
    };

    getImageSource = () => {
        const { image } = this.state;

        if (!image) {
            return StyleService.getImage('ImageBlankNFT');
        }

        return { uri: image };
    };

    renderPlaceHolder = () => {
        return (
            <View style={styles.container}>
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
        const { containerStyle, truncate } = this.props;
        const { isLoading } = this.state;

        if (isLoading) {
            return this.renderPlaceHolder();
        }

        return (
            <View style={[styles.container, containerStyle]}>
                <View style={styles.tokenImageContainer}>
                    <Avatar source={this.getImageSource()} border size={35} />
                </View>
                <View style={[AppStyles.flex1, AppStyles.leftAligned]}>
                    <Text style={styles.label} numberOfLines={1}>
                        {this.getTokenName()}
                    </Text>
                    <Text style={styles.description} numberOfLines={truncate ? 1 : 3}>
                        {this.getTokenId()}
                    </Text>
                </View>
            </View>
        );
    }
}

export default NFTokenElement;
