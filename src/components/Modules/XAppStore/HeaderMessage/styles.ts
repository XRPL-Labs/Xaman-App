import { StyleSheet } from 'react-native';
import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 15,
        borderColor: '$contrast',
        marginBottom: AppSizes.paddingSml,
    },
    closeButton: {
        paddingTop: AppSizes.paddingExtraSml,
        paddingRight: AppSizes.paddingExtraSml,
    },
    closeButtonIcon: {
        tintColor: '$contrast',
    },
    titleText: {
        fontFamily: AppFonts.pb.family,
        fontSize: AppFonts.pb.size * 1.1,
        color: '$textPrimary',
        paddingTop: AppSizes.paddingSml,
        paddingHorizontal: AppSizes.paddingSml,
    },
    contentContainer: {
        paddingTop: AppSizes.paddingExtraSml,
        paddingBottom: AppSizes.paddingSml,
        paddingHorizontal: AppSizes.paddingSml,
    },
});
