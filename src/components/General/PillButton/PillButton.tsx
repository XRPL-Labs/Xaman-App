import React, { Component } from 'react';
import {
    View,
    Text,
    // Platform,
    // TextStyle,
    ViewStyle,
} from 'react-native';

// import { AppColors } from '@theme';
import styles from './styles';
import { TouchableDebounce } from '../TouchableDebounce';

export interface PillButtonItem {
    onActivate?: () => void;
    label: string;
    id: string;
}

/* Types ==================================================================== */
interface Props {
    testID?: string;
    // title?: string;
    // titleStyle?: TextStyle;
    style?: ViewStyle | ViewStyle[];
    items: PillButtonItem[];
    active: string;
    // direction?: 'right' | 'left';
    // checked: boolean;
    // isDisabled?: boolean;
    // onChange: (value: boolean) => void;
}

interface State {
    active: string;
}

/* Component ==================================================================== */
class PillButton extends Component<Props, State> {
    declare readonly props: Props & Required<Pick<Props, keyof typeof PillButton.defaultProps>>;

    static defaultProps: Partial<Props> = {
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            active: props.active.toLowerCase(),
        };
    }

    // onValueChange = (value: boolean) => {
    //     const { onChange } = this.props;
    //     if (onChange) {
    //         onChange(value);
    //     }
    // };

    onPress = (item: PillButtonItem) => {
        const { active } = this.state;

        if (item.id === active) {
            return;
        }

        this.setState({
            active: (item?.id || '').toLowerCase(),
        });

        if (item.onActivate && typeof item.onActivate === 'function') {
            item.onActivate();
        }
    };

    render() {
        const { items, testID, style } = this.props;
        const { active } = this.state;

        return (
            <View
                testID={testID}
                style={[
                    styles.container,
                    style,
                ]}
                needsOffscreenAlphaCompositing
                renderToHardwareTextureAndroid
            >
                {items.map((item, index) => {
                    const isActive = active === item.id.toLowerCase();
                    return (
                        <TouchableDebounce
                            key={`pill-button-${index}`}
                            style={[
                                styles.item,
                                isActive && styles.activeItem,
                                index === 0 && styles.firstItem,
                                index === items.length - 1 && styles.lastItem,
                                isActive && index === 0 && styles.firstItemActive,
                                isActive && index === items.length - 1 && styles.lastItemActive,
                            ]}
                            onPress={() => this.onPress(item)}
                        >
                            <Text style={[
                                styles.title,
                                active.toLowerCase() === item.id.toLowerCase() && styles.activeTitle,
                            ]}>{item.label}</Text>
                        </TouchableDebounce>
                    );
                })}
            </View>
        );
        // let extraProps = {};

        // // apply colors for android
        // if (Platform.OS === 'android') {
        //     extraProps = {
        //         trackColor: { true: AppColors.blue, false: AppColors.grey },
        //         thumbColor: AppColors.light,
        //     };
        // }
        
        // const opacity = { opacity: isDisabled && Platform.OS === 'android' ? 0.5 : 1 };

        // return (
        //     <View style={styles.container}>
        //         {direction === 'right' && title && <Text style={styles.title}>{title}</Text>}
        //         <View style={[
        //             styles.switch,
        //             style,
        //         ]}>
        //             <View>
        //                 <RNSwitch
        //                     testID={testID}
        //                     disabled={isDisabled}
        //                     onValueChange={this.onValueChange}
        //                     // eslint-disable-next-line react-native/no-inline-styles
        //                     style={[
        //                         styles.switch,
        //                         // style,
        //                         opacity,
        //                     ]}
        //                     value={checked}
        //                     // eslint-disable-next-line react/jsx-props-no-spreading
        //                     {...extraProps}
        //                 />
        //             </View>
        //         </View>
        //         {direction === 'left' && title && <Text style={styles.title}>{title}</Text>}
        //     </View>
        // );
    }
}

export default PillButton;
