import { StyleSheet } from 'react-native';

import { AppColors, AppFonts } from '@theme';

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 5,
        marginLeft: 5,
        alignSelf: 'center',
    },
    label: {
        color: AppColors.white,
        fontSize: AppFonts.small.size * 0.7,
        fontFamily: AppFonts.base.familyBold,
    },
});

export default styles;
