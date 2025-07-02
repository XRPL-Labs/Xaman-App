import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    labelContainer: {
        width: AppSizes.screen.uncorrectedWidth, // Fixes square fold devices
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
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
        width: AppSizes.screen.uncorrectedWidth,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 25,
        paddingHorizontal: 25,
    },
    actionButton: {
        borderRadius: 12,
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
        paddingTop: 5,
        // borderTopColor: '$tint',
        // borderTopWidth: 1,
    },
    noBold: {
        fontFamily: AppFonts.base.family,
    },
    detailsLabelText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        marginBottom: 8,
        color: '$textPrimary',
    },
    detailsValueText: {
        fontFamily: AppFonts.base.family,
        lineHeight: 20,
        fontSize: AppFonts.base.size * 0.9,
        color: '$textPrimary',
    },
    thirdPartyTxContainer: {
        flexDirection: 'column',
        paddingHorizontal: 20,
    },
    thirdPartyTx: {
        fontFamily: AppFonts.base.family,
        lineHeight: 25,
        fontSize: AppFonts.base.size * 1.2,
        color: '$textPrimary',
    },
    itemContainerGap: {
        gap: AppSizes.paddingExtraSml,
    },
    amountContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: '$tint',
        borderWidth: 1,
        borderColor: '$tint',
        width: '100%',
        paddingVertical: 15,
        paddingHorizontal: 50,
        borderRadius: 10,
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
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.small.size,
        color: '$textPrimary',
        textAlign: 'center',
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
    uriTokenContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '$tint',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 50,
    },
    participant: {
        borderWidth: 1,
        borderColor: '$tint',
    },
});

export default styles;
