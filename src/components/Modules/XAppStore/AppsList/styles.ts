import StyleService from '@services/StyleService';
import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
export default StyleService.create({
    container: {},
    listEmptyContainer: {
        flex: 1,
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    sectionHeader: {
        backgroundColor: '$background',
        paddingVertical: AppSizes.paddingExtraSml,
    },
    sectionHeaderText: {
        fontSize: AppFonts.base.size,
        fontFamily: AppFonts.base.familyExtraBold,
        color: '$textPrimary',
    },
});
