import StyleService from '@services/StyleService';

import { AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    separatorContainer: {
        width: '80%',
        marginTop: 22,
        marginBottom: 15,
        borderTopColor: '$grey',
        borderTopWidth: 1.5,
    },
    separatorText: {
        textAlign: 'center',
        marginTop: -10,
        paddingHorizontal: 10,
        alignSelf: 'center',
        backgroundColor: '$background',
        color: '$grey',
        fontFamily: AppFonts.base.familyBold,
    },
});

export default styles;
