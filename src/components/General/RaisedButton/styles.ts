import StyleService from '@services/StyleService';

import { AppFonts } from '@theme';

export const styles = StyleService.create({
    container: {
        flex: 1,
        backgroundColor: '$transparent',
        zIndex: 10,
        shadowColor: '$blue',
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 3,
    },
    container__text: {
        fontWeight: 'bold',
        zIndex: 10,
        textAlign: 'center',
    },
    container__view: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    container__placeholder: {
        width: '55%',
    },
    container__activity: {
        position: 'absolute',
        zIndex: 5,
    },
    bottom: {
        width: '100%',
        borderRadius: 13,
        backgroundColor: '$white',
        position: 'absolute',
        bottom: 0,
        left: 0,
    },
    content: {
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
    },
    children: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3,
        overflow: 'hidden',
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
