import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: AppSizes.paddingExtraSml,
        paddingBottom: AppSizes.paddingExtraSml,
    },
    rowLabel: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        color: '$textPrimary',
    },
    rowIcon: {
        tintColor: '$textPrimary',
    },
    hr: {
        borderBottomColor: '$tint',
        borderBottomWidth: 2,
        marginTop: 7,
        marginBottom: 7,
    },
});

export default styles;
