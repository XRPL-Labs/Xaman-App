import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    labelContainer: {
        width: AppSizes.screen.width,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 25,
        gap: AppSizes.paddingExtraSml,
    },
    advisoryContainer: {
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        padding: AppSizes.paddingSml,
        backgroundColor: '$red',
    },
    itemContainer: {
        width: AppSizes.screen.width,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 25,
        paddingHorizontal: 25,
    },
    detailContainer: {
        paddingBottom: AppSizes.padding,
        paddingHorizontal: 25,
    },
    warningsContainer: {
        paddingHorizontal: 25,
        paddingBottom: 25,
    },
    participantContainer: {
        padding: 25,
        borderTopColor: '$tint',
        borderTopWidth: 1,
    },

    detailsLabelText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        marginBottom: 8,
        color: '$textPrimary',
    },
    detailsValueText: {
        fontFamily: AppFonts.base.familyMono,
        lineHeight: 20,
        fontSize: AppFonts.base.size * 0.9,
        color: '$textPrimary',
    },

    itemContainerGap: {
        gap: AppSizes.paddingExtraSml,
    },

    amountContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '$tint',
        paddingVertical: 20,
        paddingHorizontal: 30,
        borderRadius: 50,
    },
    amountContainerSmall: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '$tint',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 50,
    },

    dateText: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.small.size,
        color: '$grey',
        textAlign: 'left',
    },
    hashText: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.base.size * 0.9,
        color: '$grey',
        textAlign: 'left',
    },
    amountText: {
        flexWrap: 'wrap',
        flexShrink: 1,
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h5.size,
        textAlign: 'center',
        color: '$blue',
    },
    amountTextSmall: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h5.size,
        textAlign: 'center',
        color: '$textPrimary',
    },
    memoText: {
        fontFamily: AppFonts.base.family,
        lineHeight: 20,
        fontSize: AppFonts.base.size * 0.9,
        color: '$textPrimary',
    },

    outgoingColor: {
        color: '$red',
        tintColor: '$red',
    },
    incomingColor: {
        color: '$blue',
        tintColor: '$blue',
    },
    orangeColor: {
        color: '$orange',
        tintColor: '$orange',
    },
    naturalColor: {
        color: '$grey',
        tintColor: '$grey',
    },

    iconArrow: {
        marginTop: 12,
        marginBottom: -12,
    },

    nfTokenContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '$tint',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 50,
    },
});

export default styles;
