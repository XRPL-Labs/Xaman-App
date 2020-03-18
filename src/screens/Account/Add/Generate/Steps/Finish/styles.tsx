import { StyleSheet } from 'react-native';

import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    backgroundImageStyle: { opacity: 0.02, height: AppSizes.screen.height },
    emojiIcon: {
        fontSize: AppFonts.h1.size * 2,
        paddingBottom: 50,
    },
});

export default styles;
