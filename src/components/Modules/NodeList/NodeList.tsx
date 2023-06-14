import React, { PureComponent } from 'react';
import { View, Text, SectionList } from 'react-native';

import { NodeSchema } from '@store/schemas/latest';

import { NetworkType } from '@store/types';

import styles from './styles';

// EventListItems
import { NodeListItem } from './NodeListItem';

/* Types ==================================================================== */
interface Props {
    dataSource: any;
    onItemPress: (item: NodeSchema) => void;
    onItemRemovePress: (item: NodeSchema) => void;
}

/* Component ==================================================================== */
class NodeList extends PureComponent<Props> {
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

    renderSectionHeader = ({ section: { title, color } }: any) => {
        return (
            <View style={styles.sectionHeader}>
                <View style={[styles.colorCircle, { backgroundColor: color }]} />
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
                initialNumToRender={50}
                maxToRenderPerBatch={50}
                keyExtractor={(item, index) => item.endpoint + index}
            />
        );
    }
}

export default NodeList;
