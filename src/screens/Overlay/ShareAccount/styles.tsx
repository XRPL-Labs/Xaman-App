import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    visibleContent: {
        // height: Sizes.screen.heightHalf + 100,
        height: AppSizes.screen.height * 0.9,
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
        borderRadius: 20,
        borderWidth: 3,
        alignSelf: 'center',
        alignItems: 'center',
        borderColor: '$tint',
        // backgroundColor: '$tint,
        padding: 20,
        margin: 10,
        width: '100%',
    },
    qrCode: {
        borderRadius: 5,
        borderWidth: 5,
        borderColor: '$white',
    },
    addressText: {
        // width: '80%',
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.base.size * 0.9,
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
