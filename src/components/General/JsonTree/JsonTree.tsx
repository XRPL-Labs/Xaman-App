/**
 * Json view tree
 *
 *  <JsonTree data={{}}  />
 *
 */
import React, { PureComponent } from 'react';
import { Text, View, ViewStyle } from 'react-native';

import { Icon } from '@components/General/Icon';
import { TouchableDebounce } from '@components/General/TouchableDebounce';

import { AppColors } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
export interface Props {
    propertyName?: string;
    data: Record<string, any> | any[];
    level: number;
    comma?: boolean;
    containerStyle?: ViewStyle | ViewStyle[];
}

export interface State {
    collapsed: boolean;
}

/* Component ==================================================================== */
class JsonTree extends PureComponent<Props, State> {
    public static defaultProps: Partial<Props> = {
        level: 0,
    };

    constructor(props: Props) {
        super(props);

        // automatically collapse if items are too long to show
        let collapsed = false;
        if (props.level > 0 && typeof props.data === 'object' && Object.keys(props.data).length > 2) {
            collapsed = true;
        }

        this.state = {
            collapsed,
        };
    }

    toggleCollapse = () => {
        this.setState((prevState) => {
            return { collapsed: !prevState.collapsed };
        });
    };

    renderArrayContent = (data: any[], key: string, level: number) => {
        const { comma } = this.props;

        return (
            <>
                <TouchableDebounce activeOpacity={1} onPress={this.toggleCollapse} style={styles.rowContainer}>
                    <Icon name="IconMinus" size={10} style={styles.minusIconContainer} />
                    <Text style={styles.propertyText}>{key && `${key}: `}</Text>
                    <Text style={styles.symbolTextStyle}>&#91;</Text>
                </TouchableDebounce>
                {data.map((item: any, index) => (
                    <JsonTree
                        key={`array-${key}-${level}-${index}`}
                        propertyName={`${index}`}
                        data={item}
                        level={level + 1}
                        comma={data.length - 1 !== index}
                    />
                ))}
                <Text style={styles.symbolTextStyle}>&#93;{comma && <Text style={styles.propertyText}>,</Text>}</Text>
            </>
        );
    };

    renderObjectContent = (data: Record<string, any>, key: string, level: number) => {
        const { comma } = this.props;
        return (
            <>
                <TouchableDebounce activeOpacity={1} onPress={this.toggleCollapse} style={styles.rowContainer}>
                    <Icon name="IconMinus" size={10} style={styles.minusIconContainer} />
                    <Text style={styles.propertyText}>{key && `${key}: `}</Text>
                    <Text style={styles.symbolTextStyle}>&#123;</Text>
                </TouchableDebounce>
                {Object.keys(data).map((k, index) => (
                    <JsonTree
                        key={`object-${k}-${level}`}
                        propertyName={k}
                        data={data[k]}
                        level={level + 1}
                        comma={Object.keys(data).length - 1 !== index}
                    />
                ))}
                <Text style={styles.symbolTextStyle}>&#125;{comma && <Text style={styles.propertyText}>,</Text>}</Text>
            </>
        );
    };

    renderScalarContent = (data: string | number | boolean, key: string) => {
        const { comma } = this.props;

        let valueColor: string | undefined;
        let valueString: string | undefined;

        switch (typeof data) {
            case 'string':
                valueColor = AppColors.green;
                valueString = `"${data}"`;
                break;
            case 'number':
                valueColor = AppColors.blue;
                valueString = `${data}`;
                break;
            case 'boolean':
                valueColor = AppColors.grey;
                valueString = `${data ? 'true' : 'false'}`;
                break;
            default:
                valueString = `${data}`;
                break;
        }

        return (
            <View style={styles.rowContainer}>
                <Text style={styles.propertyText}>{key}: </Text>
                <Text
                    numberOfLines={1}
                    selectable
                    style={[styles.textValue, valueColor ? { color: valueColor } : undefined]}
                >
                    {valueString}
                </Text>
                {comma && <Text style={styles.propertyText}>,</Text>}
            </View>
        );
    };

    renderCollapsedContent = (data: Record<string, any> | any[], key: string) => {
        const brackets = Array.isArray(data) ? '[...]' : '{...}';
        return (
            <TouchableDebounce activeOpacity={1} onPress={this.toggleCollapse}>
                <View style={styles.rowContainer}>
                    <Icon name="IconPlus" size={10} style={styles.plusIconContainer} />
                    <Text style={styles.propertyText}>{key}: </Text>
                    <Text style={styles.symbolTextStyle}>{brackets}</Text>
                </View>
            </TouchableDebounce>
        );
    };

    renderContent = () => {
        const { propertyName, data, level = 0 } = this.props;
        const { collapsed } = this.state;

        if (collapsed) {
            return this.renderCollapsedContent(data, propertyName!);
        }

        if (Array.isArray(data)) {
            return this.renderArrayContent(data, propertyName!, level);
        }

        if (typeof data === 'object') {
            return this.renderObjectContent(data, propertyName!, level);
        }

        return this.renderScalarContent(data, propertyName!);
    };

    render() {
        const { level, containerStyle } = this.props;

        return (
            <View style={[styles.container, level > 0 && containerStyle]}>
                {level > 0 && <View style={styles.seperatorLine} />}
                <View style={{ marginLeft: level * 5 }}>{this.renderContent()}</View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default JsonTree;
