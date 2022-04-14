import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: {
        width: AppSizes.screen.width,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 25,
    },
    detailContainer: {
        paddingBottom: AppSizes.padding,
    },
    amountHeaderContainer: {
        width: AppSizes.screen.width,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 25,
        paddingHorizontal: 25,
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
    detailsContainer: {
        borderTopColor: '$tint',
        borderTopWidth: 1,
        width: AppSizes.screen.width,
        padding: 25,
    },
    amountContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '$tint',
        paddingVertical: 20,
        paddingHorizontal: 30,
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
    amountText: {
        flexWrap: 'wrap',
        flexShrink: 1,
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h4.size,
        textAlign: 'center',
        color: '$blue',
    },
    amountTextSmall: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h5.size,
        textAlign: 'center',
        color: '$textPrimary',
    },
    statusText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.h5.size,
        textAlign: 'center',
        marginBottom: 20,
    },
    statusSuccess: {
        color: '$green',
    },
    statusFailed: {
        color: '$red',
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
    dangerHeader: {
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        padding: AppSizes.paddingSml,
        backgroundColor: '$red',
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
});

export default styles;
