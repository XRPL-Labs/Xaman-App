import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'red' },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: AppSizes.paddingExtraSml,
        paddingHorizontal: AppSizes.paddingSml,
        borderTopColor: '$tint',
        borderTopWidth: 1,
        backgroundColor: '$tint',
    },
    sectionHeaderText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        paddingLeft: AppSizes.paddingExtraSml,
        color: '$textPrimary',
    },
    colorCircle: {
        width: 15,
        height: 15,
        borderRadius: 15 / 2,
    },
});

export default styles;
