import React, { PureComponent } from 'react';
import { Platform, Text, TextStyle, TouchableOpacity, View, ViewStyle, ImageStyle } from 'react-native';

import { Images } from '@common/helpers/images';
import { Icon } from '@components/General/Icon';

import { AppColors, AppStyles, AppSizes } from '@theme';

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
}

interface Props {
    placement: placementType;
    leftComponent?: ChildrenProps;
    centerComponent?: ChildrenProps;
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
    if (children == null || children === false) {
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

    return (
        <TouchableOpacity
            testID={children.testID}
            style={[
                {
                    alignItems: ALIGN_STYLE[placement],
                },
                styles.childContainer,
                style,
            ]}
            activeOpacity={children.onPress ? 0.8 : 1}
            onPress={children.onPress || null}
        >
            {children.text && children.icon && (
                <View style={[AppStyles.row]}>
                    {(placement === 'left' || placement === 'center') && (
                        <Icon
                            style={[styles.iconStyle, AppStyles.marginRightSml, children.iconStyle]}
                            size={children.iconSize || 30}
                            name={children.icon}
                        />
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
                <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.textStyle, children.textStyle]}>
                    {children.text}
                </Text>
            )}

            {children.icon && !children.text && (
                <Icon size={children.iconSize || 30} name={children.icon} style={children.iconStyle} />
            )}
        </TouchableOpacity>
    );
};

/* Component ==================================================================== */
class Header extends PureComponent<Props> {
    static Height = AppSizes.heightPercentageToDP(9) + (Platform.OS === 'ios' ? AppSizes.statusBarHeight : 0);

    static defaultProps = {
        placement: 'center',
        backgroundColor: AppColors.white,
    };

    render() {
        const {
            leftComponent,
            centerComponent,
            rightComponent,
            backgroundColor,
            placement,
            containerStyle,
        } = this.props;

        return (
            <View style={[styles.container, backgroundColor && { backgroundColor }, containerStyle]}>
                <Children style={placement === 'center' && styles.rightLeftContainer} placement="left">
                    {leftComponent}
                </Children>

                <Children
                    style={[
                        styles.centerContainer,
                        placement !== 'center' && {
                            paddingHorizontal: Platform.select({
                                android: 16,
                                default: 15,
                            }),
                        },
                    ]}
                    placement={placement}
                >
                    {centerComponent}
                </Children>

                <Children style={placement === 'center' && styles.rightLeftContainer} placement="right">
                    {rightComponent}
                </Children>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default Header;
