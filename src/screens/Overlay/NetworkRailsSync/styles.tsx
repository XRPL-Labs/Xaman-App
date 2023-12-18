/* eslint-disable react-native/no-color-literals */

import StyleService from '@services/StyleService';

import { AppStyles, AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    contentContainer: {
        flex: 1,
        alignSelf: 'stretch',
        justifyContent: 'center',
        paddingVertical: AppSizes.paddingExtraSml,
        paddingHorizontal: AppSizes.paddingExtraSml,
    },
    headerContainer: {
        backgroundColor: '$tint',
        borderTopRightRadius: AppSizes.screen.width * 0.07,
        borderTopLeftRadius: AppSizes.screen.width * 0.07,
        flexDirection: 'row',
        alignItems: 'center',
        padding: AppSizes.paddingSml,
    },
    scrollContainer: {
        paddingBottom: AppSizes.paddingSml,
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
    changesRow: {
        flexDirection: 'row',
        marginTop: AppSizes.paddingExtraSml,
        padding: AppSizes.paddingExtraSml,
        borderWidth: 2,
        borderRadius: AppSizes.borderRadius,
    },

    changesRowGreen: {
        backgroundColor: '$lightGreen',
        borderColor: '$green',
    },
    changesRowRed: {
        backgroundColor: '$lightRed',
        borderColor: '$red',
    },
    changesRowOrange: {
        backgroundColor: '$lightOrange',
        borderColor: '$orange',
    },
    changesTitle: {
        fontFamily: AppFonts.p.familyBold,
        fontSize: AppFonts.p.size,
        color: '$textPrimary',
    },
    changesText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
    },
    changesValue: {
        fontFamily: AppFonts.subtext.family,
    },
    changesRemoved: {
        color: '$red',
    },
    changesAdded: {
        color: '$green',
    },
    changesModified: {
        color: '$orange',
    },
    dismissButton: {
        alignItems: 'flex-end',
        padding: 5,
    },
    networkNameText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        color: '$textPrimary',
        textAlign: 'center',
        paddingHorizontal: AppSizes.paddingExtraSml,
    },
});

export default styles;
