import StyleService from '@services/StyleService';

import { AppFonts } from '@theme';

export const styles = StyleService.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: '$white',
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '$grey',
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 3,
    },
    buttonWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconLeft: {
        marginRight: 3,
    },
    iconRight: {
        marginLeft: 3,
    },
    textButton: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size * 1.1,
        textAlign: 'center',
        color: '$black',
        paddingHorizontal: 5,
    },
});
