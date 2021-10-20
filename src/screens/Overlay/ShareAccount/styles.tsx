import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    qrCodeContainer: {
        width: '90%',
        backgroundColor: '$tint',
        alignSelf: 'center',
        borderRadius: 20,
        marginBottom: 25,
    },
    qrCode: {
        borderRadius: 14,
        borderWidth: 5,
        alignSelf: 'center',
        alignItems: 'center',
        borderColor: '$silver',
        padding: 5,
        margin: 30,
    },
    addressTextContainer: {
        width: '100%',
        backgroundColor: '$tint',
        marginTop: 15,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addressText: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.base.size,
        color: '$textPrimary',
    },
    footer: {
        paddingBottom: AppSizes.bottomStableInset,
    },
});

export default styles;
