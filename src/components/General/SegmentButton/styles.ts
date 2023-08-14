import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

const styles = StyleService.create({
    container: {
        flexDirection: 'row',
        paddingVertical: AppSizes.paddingSml,
    },
    button: {
        borderRadius: AppSizes.scale(75) / 10,
        marginRight: AppSizes.paddingExtraSml,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    buttonText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        color: '$grey',
    },
    buttonTextSelected: {
        color: '$textContrast',
    },
});

export default styles;
