import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    listContainer: {
        paddingBottom: AppSizes.padding,
    },
    itemRow: {
        height: AppSizes.scale(65),
        paddingRight: 20,
        paddingLeft: 13,
        paddingTop: 20,
        paddingBottom: 20,
        marginBottom: 10,
        borderRadius: 18,
        backgroundColor: '$tint',
    },
    itemRowSelected: {
        borderBottomWidth: 0,
        backgroundColor: '$lightBlue',
    },
    radioCircle: {
        width: AppSizes.scale(23),
        height: AppSizes.scale(23),
        borderWidth: 3,
        borderColor: '$grey',
        // borderRadius: AppSizes.scale(23) / 2,
        borderRadius: 100,
    },
    radioCircleSelected: {
        width: AppSizes.scale(23),
        height: AppSizes.scale(23),
        borderWidth: AppSizes.scale(6),
        borderColor: '$blue',
        // borderRadius: AppSizes.scale(23) / 2,
        borderRadius: 100,
        backgroundColor: '$background',
    },
    searchContainer: {
        backgroundColor: '$background',

        paddingBottom: AppSizes.paddingMid,
    },
    sectionHeader: {
        paddingHorizontal: 0,
        backgroundColor: '$background',
        paddingTop: 5,
        paddingBottom: 5,
        shadowColor: '$white',
    },
    clearSearchButton: {
        height: AppSizes.scale(25),
        paddingHorizontal: 10,
        alignSelf: 'flex-end',
    },
});

export default styles;
