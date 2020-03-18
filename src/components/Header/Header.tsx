import React, { PureComponent } from 'react';
import { Text, TextStyle, TouchableOpacity, View, ViewStyle, Platform } from 'react-native';

import { Images } from '@common/helpers';
import { Icon } from '@components';

import { AppColors, AppStyles } from '@theme';

import styles from './styles';
/* Types ==================================================================== */

type placementType = 'left' | 'right' | 'center';

interface ChildrenProps {
    text?: string;
    textStyle?: TextStyle;
    icon?: Extract<keyof typeof Images, string>;
    iconSize?: number;
    onPress?: () => void;
}

interface Props {
    placement: placementType;
    leftComponent?: ChildrenProps;
    centerComponent?: ChildrenProps;
    rightComponent?: ChildrenProps;
    backgroundColor?: string;
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
    return (
        <TouchableOpacity
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
                            style={[styles.iconStyle, AppStyles.marginRightSml]}
                            size={children.iconSize || 30}
                            name={children.icon}
                        />
                    )}
                    <Text style={[styles.textStyleSmall, children.textStyle]}>{children.text}</Text>
                    {placement === 'right' && (
                        <Icon
                            style={[styles.iconStyle, AppStyles.marginLeftSml]}
                            size={children.iconSize || 30}
                            name={children.icon}
                        />
                    )}
                </View>
            )}
            {children.text && !children.icon && (
                <Text style={[styles.textStyle, children.textStyle]}>{children.text}</Text>
            )}

            {children.icon && !children.text && <Icon size={children.iconSize || 30} name={children.icon} />}
        </TouchableOpacity>
    );
};

/* Component ==================================================================== */
class Header extends PureComponent<Props> {
    static defaultProps = {
        placement: 'center',
        backgroundColor: AppColors.white,
    };

    render() {
        const { leftComponent, centerComponent, rightComponent, backgroundColor, placement } = this.props;

        return (
            <View style={[styles.container, backgroundColor && { backgroundColor }]}>
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
