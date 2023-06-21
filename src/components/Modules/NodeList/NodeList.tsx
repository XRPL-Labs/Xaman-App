import React, { PureComponent } from 'react';
import { View, Text, SectionList } from 'react-native';

import { NetworkService, StyleService } from '@services';

import { NodeSchema } from '@store/schemas/latest';
import { NetworkType } from '@store/types';

import { Badge } from '@components/General';

import Localize from '@locale';

import styles from './styles';

// EventListItems
import { NodeListItem } from './NodeListItem';

/* Types ==================================================================== */
interface Props {
    dataSource: any;
    onItemPress: (item: NodeSchema) => void;
    onItemRemovePress: (item: NodeSchema) => void;
}

interface State {
    connectedNetworkKey: any;
}

/* Component ==================================================================== */
class NodeList extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            connectedNetworkKey: undefined,
        };
    }

    componentDidMount() {
        const { key } = NetworkService.getConnectionDetails();

        this.setState({
            connectedNetworkKey: key,
        });
    }

    renderItem = ({ item, section }: { item: any; section: any }): React.ReactElement => {
        const { onItemPress, onItemRemovePress } = this.props;

        const { defaultNode, type } = section;
        const isDefault = item.endpoint === defaultNode.endpoint;

        // only custom nodes can be remove
        const canRemove = type === NetworkType.Custom;

        return (
            <NodeListItem
                onPress={onItemPress}
                item={item}
                isDefault={isDefault}
                onRemovePress={onItemRemovePress}
                canRemove={canRemove}
            />
        );
    };

    renderSectionHeader = ({ section: { title, color, key } }: any) => {
        const { connectedNetworkKey } = this.state;

        return (
            <View style={styles.sectionHeader}>
                <View style={[styles.colorCircle, { backgroundColor: color }]} />
                <Text numberOfLines={1} style={styles.sectionHeaderText}>
                    {title}
                </Text>
                {connectedNetworkKey === key && (
                    <Badge label={Localize.t('global.connected')} color={StyleService.value('$green')} />
                )}
            </View>
        );
    };

    render() {
        const { dataSource } = this.props;

        return (
            <SectionList
                sections={dataSource}
                renderItem={this.renderItem}
                renderSectionHeader={this.renderSectionHeader}
                initialNumToRender={50}
                maxToRenderPerBatch={50}
                keyExtractor={(item, index) => item.endpoint + index}
            />
        );
    }
}

export default NodeList;
