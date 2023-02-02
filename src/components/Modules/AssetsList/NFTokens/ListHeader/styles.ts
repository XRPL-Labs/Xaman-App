import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10,
        paddingHorizontal: AppSizes.paddingSml,
        backgroundColor: '$background',
    },
    tokenText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.h5.size,
        color: '$textPrimary',
        textAlign: 'center',
    },
    pickerIcon: {
        tintColor: '$contrast',
        marginLeft: 3,
        marginTop: 4,
    },
});
