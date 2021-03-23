import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    row: {
        width: AppSizes.screen.width,
        paddingHorizontal: AppSizes.paddingSml,
        paddingVertical: AppSizes.paddingSml,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '$background',
    },
    url: {
        fontSize: AppFonts.subtext.size,
        color: '$textPrimary',
    },
    chainLabel: {
        marginLeft: 10,
        padding: 2,
        borderRadius: 5,
    },
    chainLabelMain: {
        backgroundColor: '$lightGreen',
    },
    chainLabelTest: {
        backgroundColor: '$lightOrange',
    },
    sectionHeader: {
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderTopColor: '$tint',
        borderTopWidth: 1,
        backgroundColor: '$background',
        shadowColor: '$background',
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 5,
        shadowOpacity: 1,
    },
    sectionHeaderText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        paddingLeft: 8,
        color: '$textPrimary',
    },
    checkIcon: {
        tintColor: '$blue',
    },
});

export default styles;
