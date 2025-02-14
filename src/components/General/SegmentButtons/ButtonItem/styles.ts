import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

const styles = StyleService.create({
    container: {
        flexDirection: 'row',
        paddingVertical: AppSizes.paddingSml,
    },
    button: {
        // borderRadius: AppSizes.scale(75) / 5,
        marginRight: AppSizes.paddingExtraSml,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    buttonText: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.subtext.size,
        color: '$grey',
    },
    buttonTextSelected: {
        color: '$textContrast',
    },
});

export default styles;
