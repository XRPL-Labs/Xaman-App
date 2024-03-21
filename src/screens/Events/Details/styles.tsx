import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    detailContainer: {
        paddingBottom: AppSizes.padding,
    },

    memoContainer: {
        width: AppSizes.screen.width,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 25,
        paddingHorizontal: 25,
    },
    reserveContainer: {
        width: AppSizes.screen.width,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 25,
        paddingHorizontal: 25,
    },
    extraHeaderContainer: {
        padding: 25,
        borderTopColor: '$tint',
        borderTopWidth: 1,
    },
    actionButtonsContainer: {
        paddingHorizontal: 25,
        paddingBottom: 25,
    },
    warningsContainer: {
        paddingHorizontal: 25,
        paddingBottom: 25,
    },
    detailsContainer: {
        borderTopColor: '$tint',
        borderTopWidth: 1,
        width: AppSizes.screen.width,
        padding: 25,
    },

    nfTokenContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '$tint',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 50,
    },
    amountContainerSmall: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '$tint',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 50,
    },

    hashText: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.base.size * 0.9,
        color: '$grey',
        textAlign: 'left',
    },
    labelText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        marginBottom: 8,
        color: '$textPrimary',
    },
    contentText: {
        fontFamily: AppFonts.base.familyMono,
        lineHeight: 20,
        fontSize: AppFonts.base.size * 0.9,
        color: '$textPrimary',
    },
    memoText: {
        fontFamily: AppFonts.base.family,
        lineHeight: 20,
        fontSize: AppFonts.base.size * 0.9,
        color: '$textPrimary',
    },
    advisoryHeader: {
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        padding: AppSizes.paddingSml,
        backgroundColor: '$red',
    },
});

export default styles;
