import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        flexDirection: 'row',
        // justifyContent: 'center',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 7,
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
    filterActive: {
        position: 'absolute',
        top: -1,
        right: -2,
        backgroundColor: '$red',
        width: 8,
        height: 8,
        borderRadius: 8,
        zIndex: 2,
    },
    listHeaderButton: {
        height: undefined,
        // paddingVertical: AppSizes.paddingSml,
    },
    rightButtonContainer: {
        flexDirection: 'row',
        flex: 1,
        // borderWidth: 1,
        // borderColor: '$red',
    },
    listOptionsButton: {
        marginLeft: AppSizes.paddingSml * 0.4,
        paddingRight: 5,
        paddingLeft: 7,
    },
    addTokenButton: {
        paddingLeft: 8,
        paddingRight: 7,
    },
});
