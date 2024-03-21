import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    contentContainer: {
        flex: 1,
        alignSelf: 'stretch',
    },
    headerMessageContainer: {
        borderRadius: 15,
        marginHorizontal: AppSizes.paddingSml,
        marginBottom: 10,
        backgroundColor: '$lightBlue',
    },
    featuredContainer: {
        borderRadius: 15,
        marginHorizontal: AppSizes.paddingSml,
        paddingHorizontal: AppSizes.paddingExtraSml,
        paddingVertical: AppSizes.paddingSml,
        backgroundColor: '$lightBlue',
    },
    categorySelectContainer: {
        paddingHorizontal: AppSizes.paddingSml,
    },
    appListContainer: {
        flex: 1,
        paddingHorizontal: AppSizes.paddingList,
    },
    searchBarContainer: {
        marginHorizontal: AppSizes.paddingSml,
        marginVertical: AppSizes.paddingExtraSml,
    },
    searchIcon: {
        tintColor: '$contrast',
    },
    segmentButtonsContainer: {
        paddingHorizontal: AppSizes.paddingSml,
    },
    categoryChipsContainer: {
        paddingHorizontal: AppSizes.paddingSml,
    },
});

export default styles;
