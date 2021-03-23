import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        // height: Sizes.screen.heightHalf + 100,
        backgroundColor: '$background',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        shadowColor: '$grey',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 5,
        shadowOpacity: 0.3,
        padding: 15,
    },
    nextButton: {
        backgroundColor: '$green',
    },
    textInput: {
        textAlign: 'center',
    },
    avatarContainer: {
        height: AppSizes.scale(45),
        width: AppSizes.scale(45),
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImage: {
        height: AppSizes.scale(30),
        width: AppSizes.scale(30),
        tintColor: '$grey',
        resizeMode: 'contain',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '$lightGrey',
    },
    title: {
        fontFamily: AppFonts.base.familyBold,
        color: '$green',
        fontSize: AppFonts.base.size,
    },
    subtitle: {
        fontFamily: AppFonts.base.familyMono,
        color: '$green',
        fontSize: AppFonts.base.size * 0.8,
    },
});

export default styles;
