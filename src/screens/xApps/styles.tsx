import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    contentContainer: {
        flex: 1,
        alignSelf: 'stretch',
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
        paddingHorizontal: AppSizes.paddingSml,
    },
    searchBarContainer: {
        marginVertical: AppSizes.paddingExtraSml,
    },
    searchIcon: {
        tintColor: '$contrast',
    },
});

export default styles;
