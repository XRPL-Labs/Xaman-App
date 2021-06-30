import { StyleSheet } from 'react-native';

import StyleService from '@services/StyleService';
import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { position: 'relative', flex: 1, flexDirection: 'column' },
    rowContainer: {
        width: '100%',
        paddingHorizontal: AppSizes.paddingSml,
        paddingVertical: AppSizes.paddingSml,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '$background',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor: '$tint',
    },
    checkIcon: {
        tintColor: '$blue',
    },
    descriptionText: {
        // paddingVertical: AppSizes.paddingSml,
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.base.size,
        fontWeight: 'bold',
        color: '$textPrimary',
    },
});

export default styles;
