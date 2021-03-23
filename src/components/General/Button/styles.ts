import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

const styles = StyleService.create({
    buttonWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    button: {
        height: AppSizes.scale(55),
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: AppSizes.scale(75) / 4,
        paddingHorizontal: 15,
        alignSelf: 'stretch',
        justifyContent: 'center',
        borderColor: '$transparent',
        backgroundColor: '$blue',
    },
    textButton: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size * 1.1,
        textAlign: 'center',
        paddingHorizontal: 5,
        color: '$white',
    },

    // Active
    activeButton: {
        backgroundColor: '$red',
    },

    // Modifiers
    buttonBlock: {
        alignSelf: 'stretch',
    },

    // Secondary
    buttonSecondary: {
        backgroundColor: '$grey',
    },
    textButtonSecondary: {
        color: '$white',
    },

    // Light
    buttonLight: {
        backgroundColor: '$tint',
    },
    textButtonLight: {
        color: '$textPrimary',
    },
    iconButtonLight: {
        tintColor: '$textPrimary',
    },
    iconButtonContrast: {
        tintColor: '$textContrast',
    },

    // Rounded Small
    buttonRoundedSmall: {
        height: AppSizes.scale(33),
        // paddingHorizontal: 18,
        alignSelf: 'center',
        borderRadius: AppSizes.scale(33) / 2,
    },
    textButtonRoundedSmall: {
        fontSize: AppFonts.base.size * 0.9,
    },
    // Rounded Small Block
    buttonRoundedSmallBlock: {
        height: AppSizes.scale(33),
        paddingHorizontal: 18,
        alignSelf: 'stretch',
        borderRadius: AppSizes.scale(33) / 2,
    },
    textButtonRoundedSmallBlock: {
        fontSize: AppFonts.base.size * 0.9,
    },

    // Disabled
    buttonDisabled: {
        opacity: 0.4,
    },

    // Contrast
    buttonContrast: {
        backgroundColor: '$contrast',
    },
    textButtonContrast: {
        fontFamily: AppFonts.base.familyBold,
        color: '$textContrast',
        fontSize: AppFonts.base.size * 1.1,
    },
    // Rounded
    buttonRounded: {
        height: AppSizes.scale(42),
        paddingHorizontal: 30,
        alignSelf: 'center',
        borderRadius: AppSizes.scale(42) / 2,
    },
    textButtonRounded: {
        fontSize: AppFonts.base.size * 1,
    },
    /*
    // Light
    buttonLight: {
        backgroundColor: '$lightGrey,
    },
    textButtonLight: {
        fontFamily: AppFonts.base.familyBold,
        color: '$blue,
        fontSize: AppFonts.base.size * 1.1,
    },
    // Outline
    buttonOutline: {
        backgroundColor: '$white,
        borderColor: '$blue,
        borderWidth: 1.5,
    },
    textButtonOutline: {
        color: '$blue,
    },
    // Clear
    buttonClear: {
        backgroundColor: '$white,
        borderColor: '$transparent,
        borderWidth: 1.5,
        height: AppSizes.heightPercentageToDP(5.5),
        minHeight: 45,
        paddingHorizontal: 5,
    },
    textButtonClear: {
        color: '$black,
        fontSize: AppFonts.base.size * 1,
    },

    // Rounded Small
    buttonRoundedSmall: {
        height: AppSizes.scale(33),
        paddingHorizontal: 18,
        alignSelf: 'center',
        borderRadius: AppSizes.scale(33) / 2,
    },
    textButtonRoundedSmall: {
        fontSize: AppFonts.base.size * 0.9,
    },
    // Rounded Mini
    buttonRoundedMini: {
        height: AppSizes.scale(20),
        paddingHorizontal: 80,
        alignSelf: 'center',
        borderRadius: AppSizes.scale(33) / 2,
    },
    textButtonRoundedMini: {
        fontSize: AppFonts.base.size * 0.7,
    },
    */
    iconLeft: {
        marginRight: 3,
        tintColor: '$white',
    },
    iconRight: {
        marginLeft: 3,
        tintColor: '$white',
    },
    spinner: {
        flex: 1,
        alignSelf: 'center',
    },
});

export default styles;
