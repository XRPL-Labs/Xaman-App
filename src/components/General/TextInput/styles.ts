import { Platform } from 'react-native';

import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
export default StyleService.create({
    wrapper: {
        backgroundColor: '$tint',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'stretch',
        alignSelf: 'stretch',
        paddingHorizontal: 15,
        borderColor: '$tint',
        minHeight: 55,
        width: '100%',
        borderWidth: 2,
        borderRadius: 10,
    },
    nonMultiline: {
        height: AppSizes.heightPercentageToDP(7),
    },
    multiline: {
        paddingVertical: Platform.OS === 'ios' ? 10 : 0,
    },
    input: {
        flex: 1,
        fontSize: AppFonts.base.size,
        color: '$blue',
        fontFamily: AppFonts.base.family,
        // fontWeight: '600',
    },
    scanIcon: {
        tintColor: '$white',
    },
    scanButton: {
        position: 'absolute',
        right: 4,
        // top: Platform.OS === 'ios' ? 10 : 9,
        height: AppSizes.heightPercentageToDP(6),
        width: AppSizes.heightPercentageToDP(6),
        minHeight: 45,
        minWidth: 45,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: '$black',
    },
    // eslint-disable-next-line react-native/no-color-literals
    loadingOverlay: {
        position: 'absolute',
        left: 0,
        top: 0,
        borderRadius: 14,
        backgroundColor: '$lightGrey',
        width: '100%',
        height: '100%',
    },
    loadingIndicator: {
        position: 'absolute',
        left: '45%',
        top: '35%',
    },
});
