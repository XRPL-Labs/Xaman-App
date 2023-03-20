import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    contentContainer: {
        flex: 1,
        alignSelf: 'stretch',
        paddingHorizontal: AppSizes.paddingSml,
    },
    featuredContainer: {
        borderRadius: 15,
        paddingHorizontal: AppSizes.paddingExtraSml,
        paddingVertical: AppSizes.paddingSml,

        backgroundColor: '$lightBlue',
    },
    appListContainer: {},
    searchBarContainer: {
        marginVertical: AppSizes.paddingExtraSml,
    },
    searchIcon: {
        tintColor: '$contrast',
    },
});

export default styles;
