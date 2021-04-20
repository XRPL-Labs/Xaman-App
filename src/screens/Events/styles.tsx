import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        backgroundColor: '$background',
    },
    filterIcon: {
        tintColor: '$blue',
    },
    sectionHeader: {
        backgroundColor: '$background',
        paddingBottom: 0,
        paddingTop: 10,
        shadowColor: '$white',
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 5,
        shadowOpacity: 1,
    },
    sectionListContainer: {
        flex: 1,
        paddingLeft: AppSizes.padding,
        paddingRight: AppSizes.padding,
        paddingBottom: AppSizes.paddingSml,
        backgroundColor: '$background',
    },
    listEmptyContainer: {
        flex: 1,
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
});

export default styles;
