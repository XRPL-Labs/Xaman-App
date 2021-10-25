import React, { PureComponent } from 'react';
import { View, Text, SectionList } from 'react-native';

import { NodeChain } from '@store/types';

import styles from './styles';

// EventListItems
import { NodeListItem } from './NodeListItem';

/* Types ==================================================================== */
interface Props {
    dataSource: any;
    selectedNode: string;
    onItemPress: (item: any) => void;
    onItemRemovePress: (item: any) => void;
}

/* Component ==================================================================== */
class NodeList extends PureComponent<Props> {
    renderItem = ({ item }: { item: any }): React.ReactElement => {
        const { selectedNode, onItemPress, onItemRemovePress } = this.props;

        const selected = item.url === selectedNode;

        // only custom nodes can be remove
        const canRemove = !selected && item.chain === NodeChain.Custom;

        return (
            <NodeListItem
                onPress={onItemPress}
                item={item}
                selected={selected}
                onRemovePress={onItemRemovePress}
                canRemove={canRemove}
            />
        );
    };

    renderSectionHeader = ({ section: { title } }: any) => {
        return (
            <View style={styles.sectionHeader}>
                <Text numberOfLines={1} style={styles.sectionHeaderText}>
                    {title}
                </Text>
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
                keyExtractor={(item, index) => item.url + index}
            />
        );
    }
}

export default NodeList;
