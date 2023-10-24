/* eslint-disable react-native/no-color-literals */

import StyleService from '@services/StyleService';

import { AppStyles, AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    scrollContainer: {
        paddingVertical: AppSizes.paddingSml,
        width: '100%',
    },
    loadingContainer: {
        flex: 1,
        alignSelf: 'stretch',
        justifyContent: 'center',
    },
    title: {
        ...AppStyles.h5,
        textAlign: 'center',
    },
    changesContainer: {
        paddingBottom: AppSizes.paddingExtraSml,
    },
    changesTitle: {
        fontFamily: AppFonts.p.familyBold,
        fontSize: AppFonts.p.size,
        color: '$textPrimary',
    },
    changesValue: {
        marginLeft: AppSizes.paddingSml,
        fontFamily: AppFonts.subtext.family,
        fontSize: AppFonts.subtext.size,
        color: '$textPrimary',
    },
    changesRemoved: {
        backgroundColor: '$lightRed',
    },
    changesAdded: {
        backgroundColor: '$lightGreen',
    },
    changesModified: {
        backgroundColor: '$lightOrange',
    },
    dismissButton: {
        alignItems: 'flex-end',
        padding: 5,
    },
});

export default styles;
