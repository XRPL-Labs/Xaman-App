import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

const styles = StyleService.create({
    container: {
        width: '92%',
        backgroundColor: '$transparent',
        justifyContent: 'center',
    },
    containerPin: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    pinInput: {
        flex: 1,
        height: AppSizes.verticalScale(55),
        maxHeight: 70,
        backgroundColor: '$tint',
        justifyContent: 'center',
        marginLeft: 5,
        marginRight: 5,
        borderRadius: AppSizes.verticalScale(10),
        borderColor: '$grey',
        borderWidth: 1,
    },
    pinInputActive: {
        borderColor: '$blue',
        backgroundColor: '$lightBlue',
        textAlign: 'center',
    },
    pinText: {
        color: '$blue',
        fontSize: AppFonts.h2.size,
        fontFamily: AppFonts.base.familyBold,
        textAlign: 'center',
    },
});

export default styles;
