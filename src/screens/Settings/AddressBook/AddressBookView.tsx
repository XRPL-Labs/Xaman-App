/**
 * AddressBook List Screen
 */

import _ from 'lodash';
import Fuse from 'fuse.js';
import { Results } from 'realm';
import React, { Component } from 'react';
import { Navigation } from 'react-native-navigation';

import { View, Text, SectionList, TouchableHighlight, Image, ImageBackground } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';
import { AppScreens } from '@common/constants';

import { ContactRepository } from '@store/repositories';
import { ContactSchema } from '@store/schemas/latest';

import { Header, Button, SearchBar, TextAvatar } from '@components';

import Localize from '@locale';
// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    contacts: Results<ContactSchema>;
    dataSource: any;
}

/* Component ==================================================================== */
class AddressBookView extends Component<Props, State> {
    static screenName = AppScreens.Settings.AddressBook.List;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        const contacts = ContactRepository.getContacts().snapshot();

        this.state = {
            contacts,
            dataSource: this.convertContactsArrayToMap(contacts),
        };

        Navigation.events().bindComponent(this);
    }

    componentDidAppear() {
        const contacts = ContactRepository.getContacts().snapshot();

        this.setState({
            contacts,
            dataSource: this.convertContactsArrayToMap(contacts),
        });
    }

    updateUI = (contacts: Results<ContactSchema>) => {
        this.setState({
            contacts: contacts.snapshot(),
            dataSource: this.convertContactsArrayToMap(contacts.snapshot()),
        });
    };

    convertContactsArrayToMap = (contacts: Results<ContactSchema>) => {
        const contactsCategoryMap = [] as any;

        contacts.forEach((item) => {
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
        return _(contactsCategoryMap)
            .sortBy((o) => {
                return o.title;
            })
            .value();
    };

    onSearchChange = (text: string) => {
        const { contacts } = this.state;

        const contactsFilter = new Fuse(contacts, {
            keys: ['name', 'address', 'destinationTag'],
        });
        const newContacts = contactsFilter.search(text) as any;

        this.setState({
            dataSource: this.convertContactsArrayToMap(newContacts),
        });
    };

    onItemPress = (item: any) => {
        Navigator.push(AppScreens.Settings.AddressBook.Edit, {}, { contact: item });
    };

    renderSectionHeader = ({ section: { title } }: any) => {
        return (
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
        );
    };

    renderItem = (contact: any) => {
        const { item } = contact;

        return (
            <TouchableHighlight
                onPress={() => {
                    this.onItemPress(item);
                }}
                underlayColor="rgba(154, 154, 154, 0.25)"
            >
                <View style={[styles.row]}>
                    <TextAvatar label={item.name} />

                    <View style={[AppStyles.paddingLeftSml]}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.address}>{item.address}</Text>
                    </View>
                </View>
            </TouchableHighlight>
        );
    };

    render() {
        const { contacts, dataSource } = this.state;

        if (_.isEmpty(contacts)) {
            return (
                <View testID="address-book-view" style={[AppStyles.container]}>
                    <Header
                        leftComponent={{
                            icon: 'IconChevronLeft',
                            onPress: () => {
                                Navigator.pop();
                            },
                        }}
                        centerComponent={{ text: Localize.t('global.addressBook') }}
                    />
                    <View style={[AppStyles.contentContainer, AppStyles.padding]}>
                        <ImageBackground
                            source={Images.BackgroundShapes}
                            imageStyle={AppStyles.BackgroundShapes}
                            style={[AppStyles.BackgroundShapesWH, AppStyles.centerContent]}
                        >
                            <Image style={[AppStyles.emptyIcon]} source={Images.ImageNoContacts} />
                            <Text style={[AppStyles.emptyText]}>{Localize.t('settings.getStartedCreateContact')}</Text>
                            <Button
                                rounded
                                icon="IconPlus"
                                iconStyle={[AppStyles.imgColorWhite]}
                                label={Localize.t('settings.addContact')}
                                onPress={() => {
                                    Navigator.push(AppScreens.Settings.AddressBook.Add);
                                }}
                            />
                        </ImageBackground>
                    </View>
                </View>
            );
        }

        return (
            <View testID="address-book-view" style={[AppStyles.container]}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                    centerComponent={{ text: Localize.t('global.addressBook') }}
                    rightComponent={{
                        icon: 'IconPlus',
                        onPress: () => {
                            Navigator.push(AppScreens.Settings.AddressBook.Add);
                        },
                    }}
                />
                {/* <SearchBar
                    placeholder={Localize.t('settings.enterNameOrAddress')}
                    inputStyle={styles.searchInput}
                    containerStyle={styles.searchContainer}
                    onChangeText={this.onSearchChange}
                /> */}
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
