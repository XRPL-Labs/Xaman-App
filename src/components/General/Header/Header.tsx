import React, { PureComponent } from 'react';
import { Platform, Text, TextStyle, View, ViewStyle, ImageStyle } from 'react-native';

import { Images } from '@common/helpers/images';

import { TouchableDebounce } from '@components/General/TouchableDebounce';
import { Icon } from '@components/General/Icon';

import { AppStyles, AppSizes } from '@theme';

import styles from './styles';

/* Types ==================================================================== */
type placementType = 'left' | 'right' | 'center';

interface ChildrenProps {
    testID?: string;
    text?: string;
    textStyle?: TextStyle;
    icon?: Extract<keyof typeof Images, string>;
    iconSize?: number;
    iconStyle?: ImageStyle;
    render?: any;
    onPress?: () => void;
    extraComponent?: React.ReactNode;
}

interface Props {
    placement: placementType;
    leftComponent?: ChildrenProps;
    centerComponent?: ChildrenProps;
    subComponent?: ChildrenProps;
    rightComponent?: ChildrenProps;
    backgroundColor?: string;
    containerStyle?: ViewStyle;
}

/* Constants ==================================================================== */
enum ALIGN_STYLE {
    left = 'flex-start',
    right = 'flex-end',
    center = 'center',
}

/* Component ==================================================================== */
const Children = ({
    style,
    placement,
    children,
}: {
    style: ViewStyle | ViewStyle[];
    placement: placementType;
    children: ChildrenProps;
}) => {
    if (!children) {
        return (
            <View
                style={[
                    {
                        alignItems: ALIGN_STYLE[placement],
                    },
                    styles.childContainer,
                    style,
                ]}
            />
        );
    }

    if (children.render) {
        return React.createElement(children.render);
    }

    const onPress = () => {
        if (typeof children.onPress === 'function') {
            children.onPress();
        }
    };

    return (
        <TouchableDebounce
            testID={children.testID}
            style={[
                {
                    alignItems: ALIGN_STYLE[placement],
                },
                styles.childContainer,
                style,
            ]}
            activeOpacity={children.onPress ? 0.8 : 1}
            onPress={onPress}
        >
            {children.text && children.icon && (
                <View style={AppStyles.row}>
                    {(placement === 'left' || placement === 'center') && (
                        <Icon style={styles.iconStyle} size={children.iconSize || 30} name={children.icon} />
                    )}
                    <Text style={[styles.textStyleSmall, children.textStyle]}>{children.text}</Text>
                    {placement === 'right' && (
                        <Icon
                            style={[styles.iconStyle, AppStyles.marginLeftSml, children.iconStyle]}
                            size={children.iconSize || 30}
                            name={children.icon}
                        />
                    )}
                </View>
            )}
            {children.text && !children.icon && (
                <Text numberOfLines={1} style={[styles.textStyle, children.textStyle]}>
                    {children.text}
                </Text>
            )}

            {children.icon && !children.text && (
                <Icon
                    size={children.iconSize || 30}
                    name={children.icon}
                    style={[styles.iconStyle, children.iconStyle]}
                />
            )}

            {children.extraComponent && children.extraComponent}
        </TouchableDebounce>
    );
};

/* Component ==================================================================== */
class Header extends PureComponent<Props> {
    static Height = AppSizes.heightPercentageToDP(9) + (Platform.OS === 'ios' ? AppSizes.statusBarHeight : 0);

    static defaultProps = {
        placement: 'center',
    };

    getChildStyle = (position: 'left' | 'right' | 'center') => {
        const { placement, centerComponent } = this.props;

        const positions = ['left', 'center', 'right'];

        if (placement !== 'center' && !centerComponent && position === 'center') {
            return null;
        }

        if (positions.filter((p) => p !== placement).indexOf(position) === -1) {
            return styles.fixedContainer;
        }
        return styles.floatContainer;
    };

    render() {
        const { leftComponent, centerComponent, rightComponent, backgroundColor, placement, containerStyle } =
            this.props;

        return (
            <View style={[styles.container, backgroundColor && { backgroundColor }, containerStyle]}>
                <Children style={this.getChildStyle('left')} placement="left">
                    {leftComponent}
                </Children>

                <Children
                    style={[
                        this.getChildStyle('center'),
                        placement !== 'center' && {
                            paddingHorizontal: Platform.select({
                                android: 16,
                                default: 15,
                            }),
                        },
                    ]}
                    placement="center"
                >
                    {centerComponent}
                </Children>

                <Children style={this.getChildStyle('right')} placement="right">
                    {rightComponent}
                </Children>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default Header;
