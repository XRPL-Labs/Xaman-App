import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    visibleContent: {
        height: AppSizes.moderateScale(670) + AppSizes.navigationBarHeight,
        backgroundColor: '$background',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderColor: '$tint',
        borderWidth: 1,
        shadowColor: '$grey',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 5,
        shadowOpacity: 0.3,
        padding: 15,
    },
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
    addressText: {
        width: '100%',
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.base.size,
        backgroundColor: '$tint',
        color: '$textPrimary',
        marginTop: 15,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
        overflow: 'hidden',
        textAlign: 'center',
        alignSelf: 'center',
    },
});

export default styles;
