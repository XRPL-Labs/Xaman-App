import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

const styles = StyleService.create({
    container: {
        height: AppSizes.scale(65),
        flexDirection: 'row',
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    button: {
        flex: 1,
        marginVertical: 15,
    },
    selectedButton: {
        backgroundColor: '$tint',
        borderRadius: 12,
        shadowColor: '$background',
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 4,
        shadowOpacity: 0.1,
        // elevation: 1,
    },
    selectedButtonText: {
        color: '$textPrimary',
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
});

export default styles;
