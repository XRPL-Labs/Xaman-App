import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    sectionList: {
        flex: 1,
        alignSelf: 'stretch',
        backgroundColor: '$background',
    },
    sectionListContainer: {
        paddingLeft: AppSizes.padding,
        paddingRight: AppSizes.padding,
        paddingBottom: AppSizes.paddingSml,
    },
    sectionHeader: {
        backgroundColor: '$background',
        paddingBottom: 0,
        paddingTop: 10,
        marginBottom: 5,
        shadowColor: '$background',
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 5,
        shadowOpacity: 1,
    },
    sectionHeaderText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.p.size,
        color: '$textPrimary',
    },
    sectionHeaderDateText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
        color: '$grey',
    },
    listEmptyContainer: {
        flex: 1,
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
});
