import React, { PureComponent } from 'react';
import { View, Text, SectionList } from 'react-native';

import StyleService from '@services/StyleService';

import { NodeModel } from '@store/models';

import styles from './styles';

// EventListItems
import { NodeListItem } from './NodeListItem';

/* Types ==================================================================== */
interface Props {
    dataSource: any;
    onItemPress: (item: NodeModel) => void;
}

interface State {}

/* Component ==================================================================== */
class NodeList extends PureComponent<Props, State> {
    renderItem = ({ item, section }: { item: any; section: any }): React.ReactElement => {
        const { onItemPress } = this.props;

        const { defaultNode, data } = section;
        const isDefault = item.endpoint === defaultNode.endpoint;

        return <NodeListItem onPress={onItemPress} item={item} selectable={data.length > 1} isDefault={isDefault} />;
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
                indicatorStyle={StyleService.isDarkMode() ? 'white' : 'default'}
            />
        );
    }
}

export default NodeList;
