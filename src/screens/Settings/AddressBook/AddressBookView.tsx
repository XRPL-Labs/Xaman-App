/**
 * AddressBook List Screen
 */

import { isEmpty, sortBy, flatMap } from 'lodash';
import Realm from 'realm';
import Fuse from 'fuse.js';

import React, { Component } from 'react';
import { View, Text, SectionList, Image, ImageBackground } from 'react-native';

import { Navigation } from 'react-native-navigation';

import StyleService from '@services/StyleService';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { ContactRepository } from '@store/repositories';
import { ContactModel } from '@store/models';

import { TouchableDebounce, Header, Button, SearchBar, Avatar } from '@components/General';

import Localize from '@locale';

import { AddContactViewProps } from '@screens/Settings/AddressBook/Add';
import { EditContactViewProps } from '@screens/Settings/AddressBook/Edit';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    contacts: Realm.Results<ContactModel>;
    dataSource: any;
}

/* Component ==================================================================== */
class AddressBookView extends Component<Props, State> {
    static screenName = AppScreens.Settings.AddressBook.List;

    private navigationListener: any;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        const contacts = ContactRepository.getContacts();

        this.state = {
            contacts,
            dataSource: this.convertContactsArrayToMap(contacts),
        };
    }

    componentDidMount() {
        this.navigationListener = Navigation.events().bindComponent(this);
    }

    componentWillUnmount() {
        if (this.navigationListener) {
            this.navigationListener.remove();
        }
    }

    componentDidAppear() {
        const contacts = ContactRepository.getContacts();

        this.setState({
            contacts,
            dataSource: this.convertContactsArrayToMap(contacts),
        });
    }

    convertContactsArrayToMap = (contacts: Realm.Results<ContactModel>) => {
        const contactsCategoryMap = [] as any;

        sortBy(contacts, 'name').forEach((item) => {
            if (!item || !item.name) return;

            const firstLetter = item.name.charAt(0).toUpperCase();

            if (
                contactsCategoryMap.filter((r: any) => {
                    return r.title === firstLetter;
                }).length < 1
            ) {
                contactsCategoryMap.push({ title: firstLetter, data: [] });
            }
            contactsCategoryMap
                .filter((r: any) => {
                    return r.title === firstLetter;
                })[0]
                .data.push(item);
        });

        // Sort
        return sortBy(contactsCategoryMap, (o) => {
            return o.title;
        });
    };

    onSearchChange = (text: string) => {
        const { contacts } = this.state;

        if (!text) {
            this.setState({
                dataSource: this.convertContactsArrayToMap(contacts),
            });
            return;
        }

        const contactsFilter = new Fuse(contacts as unknown as readonly unknown[], {
            keys: ['name', 'address', 'destinationTag'],
            shouldSort: false,
            includeScore: false,
        });

        const newContacts = flatMap(contactsFilter.search(text), 'item') as any;

        this.setState({
            dataSource: this.convertContactsArrayToMap(newContacts),
        });
    };

    onItemPress = (item: ContactModel) => {
        Navigator.push<EditContactViewProps>(AppScreens.Settings.AddressBook.Edit, {
            contact: item,
        });
    };

    onAddContactPress = () => {
        Navigator.push<AddContactViewProps>(AppScreens.Settings.AddressBook.Add, {});
    };

    renderSectionHeader = ({ section: { title } }: any) => {
        return (
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
        );
    };

    renderItem = (contact: { item: ContactModel }) => {
        const { item } = contact;

        return (
            <TouchableDebounce
                onPress={() => {
                    this.onItemPress(item);
                }}
                activeOpacity={0.8}
            >
                <View style={styles.row}>
                    <Avatar size={40} source={{ uri: `https://xumm.app/avatar/${item.address}_180_50.png` }} />
                    <View style={styles.contentContainer}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.address}>{item.address}</Text>
                    </View>
                </View>
            </TouchableDebounce>
        );
    };

    render() {
        const { contacts, dataSource } = this.state;

        if (isEmpty(contacts)) {
            return (
                <View testID="address-book-view" style={AppStyles.container}>
                    <Header
                        leftComponent={{
                            icon: 'IconChevronLeft',
                            onPress: Navigator.pop,
                        }}
                        centerComponent={{ text: Localize.t('global.addressBook') }}
                    />
                    <View style={[AppStyles.contentContainer, AppStyles.padding]}>
                        <ImageBackground
                            source={StyleService.getImage('BackgroundShapes')}
                            imageStyle={AppStyles.BackgroundShapes}
                            style={[AppStyles.BackgroundShapesWH, AppStyles.centerContent]}
                        >
                            <Image style={[AppStyles.emptyIcon]} source={StyleService.getImage('ImageNoContacts')} />
                            <Text style={[AppStyles.emptyText]}>{Localize.t('settings.getStartedCreateContact')}</Text>
                            <Button
                                rounded
                                icon="IconPlus"
                                iconStyle={AppStyles.imgColorWhite}
                                label={Localize.t('settings.addContact')}
                                onPress={this.onAddContactPress}
                            />
                        </ImageBackground>
                    </View>
                </View>
            );
        }

        return (
            <View testID="address-book-view" style={AppStyles.container}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: Navigator.pop,
                    }}
                    centerComponent={{ text: Localize.t('global.addressBook') }}
                    rightComponent={{
                        icon: 'IconPlus',
                        onPress: () => {
                            Navigator.push<AddContactViewProps>(AppScreens.Settings.AddressBook.Add, {});
                        },
                    }}
                />
                <SearchBar
                    onChangeText={this.onSearchChange}
                    placeholder={Localize.t('settings.enterNameOrAddress')}
                    containerStyle={styles.searchContainer}
                />
                <SectionList
                    sections={dataSource}
                    renderItem={this.renderItem}
                    renderSectionHeader={this.renderSectionHeader}
                />
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default AddressBookView;
