import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    backgroundImageStyle: { tintColor: '$tint', opacity: 0.4, height: AppSizes.screen.height },
    emojiIcon: {
        fontSize: AppFonts.h1.size * 2,
        paddingBottom: 50,
    },
});

export default styles;
