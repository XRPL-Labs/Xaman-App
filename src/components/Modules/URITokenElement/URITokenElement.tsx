import React, { PureComponent } from 'react';
import { Animated, InteractionManager, Text, View, ViewStyle } from 'react-native';

import LedgerService from '@services/LedgerService';
import BackendService from '@services/BackendService';
import StyleService from '@services/StyleService';

import { Avatar, InfoMessage } from '@components/General';

import { Images } from '@common/helpers/images';
import { Truncate } from '@common/utils/string';

import { URIToken } from '@common/libs/ledger/objects';

import { URIToken as LedgerURIToken } from '@common/libs/ledger/types/ledger';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    object?: URIToken;
    uriTokenId: string;
    showBurnableStatus?: boolean;
    truncate: boolean;
    containerStyle?: ViewStyle | ViewStyle[];
}

interface State {
    isLoading: boolean;
    object?: URIToken;
    name?: string;
    image?: string;
}

/* Component ==================================================================== */
class URITokenElement extends PureComponent<Props, State> {
    private readonly animatedPlaceholder: Animated.Value;

    declare readonly props: Props & Required<Pick<Props, keyof typeof URITokenElement.defaultProps>>;

    static defaultProps: Partial<Props> = {
        truncate: true,
        showBurnableStatus: false,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            object: undefined,
            name: undefined,
            image: undefined,
        };

        this.animatedPlaceholder = new Animated.Value(1);
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchDetails);
    }

    fetchDetails = async () => {
        const { object } = this.props;

        // start placeholder animation
        this.startPlaceholderAnimation();

        // try to fetch the object
        const uriTokenObject = object ?? (await this.fetchURITokenObject());
        const tokenDetails = uriTokenObject?.Owner ? await this.getDetailsFromBackend(uriTokenObject) : undefined;

        this.setState({
            isLoading: false,
            object: uriTokenObject,
            name: tokenDetails?.name,
            image: tokenDetails?.image,
        });
    };

    fetchURITokenObject = (): Promise<URIToken | undefined> => {
        const { uriTokenId } = this.props;

        return LedgerService.getLedgerEntry<LedgerURIToken>({
            index: uriTokenId,
        })
            .then((resp) => {
                // something went wrong ?
                if ('error' in resp) {
                    return undefined;
                }

                if (resp.node?.LedgerEntryType === LedgerEntryTypes.URIToken) {
                    return new URIToken(resp.node);
                }

                return undefined;
            })
            .catch(() => {
                return undefined;
            });
    };

    getDetailsFromBackend = (object: URIToken) => {
        return BackendService.getNFTDetails(object.Owner, [object.URITokenID])
            .then((resp) => {
                const { tokenData } = resp;

                if (tokenData && object.URITokenID in tokenData) {
                    const { image, name } = tokenData[object.URITokenID];
                    return {
                        name,
                        image,
                    };
                }

                return undefined;
            })
            .catch(() => {
                // TODO: handle error
                return undefined;
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
        const { uriTokenId, truncate } = this.props;
        const { object } = this.state;
        const tokenId = object?.URITokenID || uriTokenId;

        if (!tokenId) {
            return 'No URIToken ID';
        }

        return truncate ? Truncate(tokenId, 32) : tokenId;
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
        const { containerStyle, showBurnableStatus, truncate } = this.props;
        const { isLoading, object } = this.state;

        if (isLoading) {
            return this.renderPlaceHolder();
        }

        return (
            <>
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
                {showBurnableStatus && object?.Flags?.lsfBurnable && (
                    <InfoMessage
                        type="warning"
                        label={Localize.t('payload.theIssuerCanBurnThisToken')}
                        containerStyle={AppStyles.marginTopSml}
                    />
                )}
            </>
        );
    }
}

export default URITokenElement;
