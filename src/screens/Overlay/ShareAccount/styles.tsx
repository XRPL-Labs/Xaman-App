import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';
import { Platform } from 'react-native';

/* Styles ==================================================================== */
const styles = StyleService.create({
    panelContent: {
        padding: 0,
    },
    requestLink: {
        position: 'absolute',
        bottom: 10,
        // left: 0,
        // right: 0,
    },
    qrCodeContainer: {
        width: '100%',
        borderColor: '$tint',
        borderWidth: 3,
        backgroundColor: '$white',
        alignSelf: 'center',
        borderRadius: 10,
        marginBottom: 25,
        marginTop: 10,
    },
    qrImgContainer: {
        // borderWidth: 1,
        // borderColor: 'red',
        position: 'absolute',
        top: 75,
        transform: [ { translateY: -75 } ],
    },
    qrCode: {
        // alignSelf: 'center',
        alignItems: 'center',
        borderColor: '$silver',
        // padding: 10,
        margin: Platform.select({
            ios: 15,
            android: 0,
        }),
        height: 150,
        overflow: 'hidden',
    },
    sharebtnContainer: {
        marginHorizontal: -14,
        marginBottom: -20,
        marginTop: 20,
    },
    sharebtn: {
        borderRadius: 0,
        margin: 0,
        height: 35,
    },
    addressTextContainer: {
        width: '100%',
        // backgroundColor: '$tint',
        borderColor: '$tint',
        borderWidth: 3,
        marginTop: 10,
        paddingHorizontal: 12,
        paddingVertical: 18,
        borderRadius: 10,
        overflow: 'hidden',
    },
    addressText: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.base.size,
        textAlign: 'center',
        color: '$textPrimary',
    },
    footer: {
        marginBottom: AppSizes.padding + 20,
    },
});

export default styles;
