import { isEqual, isEmpty } from 'lodash';

import React, { Component } from 'react';
import { View, Text, ViewStyle, InteractionManager, TextStyle } from 'react-native';

import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import { TouchableDebounce, Avatar, Badge, Icon, LoadingIndicator } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */

export type AccountElementType = {
    id?: string;
    address: string;
    tag?: number;
};

export type VisibleElementsType = {
    tag?: boolean;
    source?: boolean;
    avatar?: boolean;
    button?: boolean;
};

interface Props {
    id?: string;
    address: string;
    tag?: number;
    info?: AccountNameType;
    visibleElements?: VisibleElementsType;
    containerStyle?: ViewStyle | ViewStyle[];
    textStyle?: TextStyle | TextStyle[];
    onPress?: (account: AccountElementType) => void;
    onButtonPress?: (account: AccountElementType) => void;
    onInfoUpdate?: (info: AccountNameType) => void;
}

interface State {
    info: AccountNameType;
    isLoading: boolean;
}

/* Component ==================================================================== */
class AccountElement extends Component<Props, State> {
    static defaultProps = {
        visibleElements: {
            tag: true,
            avatar: true,
            source: false,
            button: false,
        },
    };

    private mounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            info: props.info,
            isLoading: !props.info,
        };
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        if (typeof nextProps.info !== 'undefined' && !isEqual(nextProps.info, prevState.info)) {
            return {
                info: nextProps.info,
            };
        }

        return null;
    }

    componentDidMount() {
        const { info } = this.props;

        // track for mount status
        this.mounted = true;

        // we need to check the info
        if (typeof info === 'undefined') {
            InteractionManager.runAfterInteractions(this.fetchDetails);
        }
    }

    componentWillUnmount() {
        // track for mount status
        this.mounted = false;
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        const { address, tag, textStyle, containerStyle } = this.props;
        const { info, isLoading } = this.state;

        return (
            !isEqual(nextProps.address, address) ||
            !isEqual(nextProps.tag, tag) ||
            !isEqual(nextProps.textStyle, textStyle) ||
            !isEqual(nextProps.containerStyle, containerStyle) ||
            !isEqual(nextState.info, info) ||
            !isEqual(nextState.isLoading, isLoading)
        );
    }

    fetchDetails = () => {
        const { address, tag, onInfoUpdate } = this.props;
        const { isLoading } = this.state;

        if (!isLoading) {
            this.setState({
                isLoading: true,
            });
        }

        getAccountName(address, tag)
            .then((res) => {
                if (!isEmpty(res)) {
                    this.setState(
                        {
                            info: res,
                        },
                        () => {
                            if (typeof onInfoUpdate === 'function') {
                                onInfoUpdate(res);
                            }
                        },
                    );
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

    onPress = () => {
        const { id, address, tag, onPress } = this.props;

        if (typeof onPress === 'function') {
            onPress({
                id,
                address,
                tag,
            });
        }
    };

    onButtonPress = () => {
        const { id, address, tag, onButtonPress } = this.props;

        if (typeof onButtonPress === 'function') {
            onButtonPress({
                id,
                address,
                tag,
            });
        }
    };

    renderAvatar = () => {
        const { address, visibleElements } = this.props;
        const { info } = this.state;

        if (!visibleElements?.avatar) return null;

        let badge = undefined as any;

        if (info?.kycApproved) {
            badge = 'IconCheckXaman';
        }

        return <Avatar source={{ uri: `https://xumm.app/avatar/${address}_180_50.png` }} badge={badge} border />;
    };

    renderSource = () => {
        const { visibleElements } = this.props;
        const { info } = this.state;

        if (info?.source && visibleElements?.source) {
            // @ts-ignore
            return <Badge type={info.source} />;
        }

        return null;
    };

    renderName = () => {
        const { textStyle } = this.props;
        const { isLoading, info } = this.state;

        if (isLoading || typeof info === 'undefined') {
            return (
                <>
                    <Text style={styles.nameText}>{Localize.t('global.loading')}... </Text>
                    <LoadingIndicator />
                </>
            );
        }

        return (
            <View style={[AppStyles.flex1, AppStyles.row]}>
                <Text numberOfLines={1} style={[styles.nameText, textStyle]}>
                    {info.name || Localize.t('global.noNameFound')}
                </Text>
                {this.renderSource()}
            </View>
        );
    };

    renderAddress = () => {
        const { address, textStyle } = this.props;

        return <Text style={[styles.addressText, textStyle]}>{address}</Text>;
    };

    renderDestinationTag = () => {
        const { tag, visibleElements } = this.props;

        if (!['number', 'string'].includes(typeof tag) || !visibleElements?.tag) return null;

        return (
            <View style={styles.destinationTagContainer}>
                <Text style={styles.destinationTagText}>
                    {Localize.t('global.destinationTag')}: <Text style={AppStyles.colorBlue}>{tag}</Text>
                </Text>
            </View>
        );
    };

    renderActions = () => {
        const { visibleElements } = this.props;

        if (!visibleElements?.button) return null;

        return (
            <TouchableDebounce
                onPress={this.onButtonPress}
                activeOpacity={0.7}
                style={[AppStyles.flex1, AppStyles.rightAligned, AppStyles.centerContent]}
            >
                <Icon name="IconMoreVertical" size={30} style={AppStyles.imgColorGrey} />
            </TouchableDebounce>
        );
    };

    render() {
        const { id, address, containerStyle, onPress } = this.props;

        return (
            <TouchableDebounce
                testID={`recipient-${address}`}
                activeOpacity={onPress ? 0.7 : 1}
                onPress={this.onPress}
                style={[styles.container, containerStyle]}
                key={id}
            >
                {this.renderAvatar()}
                <View style={styles.centerContent}>
                    <View style={AppStyles.row}>{this.renderName()}</View>
                    {this.renderAddress()}
                    {this.renderDestinationTag()}
                </View>
                {this.renderActions()}
            </TouchableDebounce>
        );
    }
}

export default AccountElement;
