import StyleService from '@services/StyleService';
import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    actionPanel: {},
    prePurchaseText: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.subtext.size,
        textAlign: 'center',
        color: '$textPrimary',
    },
    successPurchaseText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.h4.size,
        textAlign: 'center',
        color: '$textPrimary',
    },
    successPurchaseSubtext: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.base.size,
        textAlign: 'center',
        color: '$textPrimary',
    },
    successIcon: {
        tintColor: '$green',
    },
    countDownText: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.base.size * 0.7,
        textAlign: 'center',
        color: '$textSecondary',
    },
    separatorContainer: {
        width: '50%',
        marginTop: AppSizes.paddingSml,
        borderTopColor: '$textSecondary',
        borderTopWidth: 1.5,
        alignSelf: 'center',
    },
    separatorText: {
        textAlign: 'center',
        marginTop: -10,
        paddingHorizontal: 10,
        alignSelf: 'center',
        backgroundColor: '$background',
        color: '$textSecondary',
        fontFamily: AppFonts.base.familyBold,
    },
    restorePurchase: {
        color: '$textSecondary',
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.small.size,
        textDecorationLine: 'underline',
    },
});

export default styles;
