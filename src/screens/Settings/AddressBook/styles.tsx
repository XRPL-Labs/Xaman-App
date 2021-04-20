import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    searchInput: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.base.size,
    },
    searchContainer: {
        marginHorizontal: AppSizes.paddingSml,
        marginBottom: 15,
    },
    row: {
        width: AppSizes.screen.width,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: AppSizes.paddingSml + 3,
        paddingVertical: 10,
    },
    contentContainer: {
        paddingLeft: 10,
    },
    name: {
        fontSize: 16,
        fontWeight: '500',
        color: '$textPrimary',
    },
    address: {
        fontSize: 11,
        color: '$textSecondary',
    },
    sectionHeader: {
        paddingVertical: 5,
        paddingHorizontal: 12,
        marginHorizontal: 20,
        borderRadius: 5,
        backgroundColor: '$tint',
    },
    sectionHeaderText: {
        fontSize: AppFonts.p.size,
        fontFamily: AppFonts.base.familyMono,
        paddingLeft: 8,
        color: '$textPrimary',
    },
});

export default styles;
