import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

const Styles = StyleService.create({
    container: {
        height: AppSizes.scale(55),
        borderRadius: AppSizes.scale(55) * 0.25,
        alignSelf: 'stretch',
        borderWidth: 1,
        justifyContent: 'center',
        backgroundColor: '$blue',
        borderColor: '$blue',
    },
    containerSecondary: {
        backgroundColor: '$green',
        borderColor: '$green',
    },
    containerDisabled: {
        opacity: 0.8,
        backgroundColor: '$silver',
        borderColor: '$silver',
    },
    label: {
        alignSelf: 'center',
        position: 'absolute',
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.h5.size * 0.9,
        color: '$white',
        paddingLeft: 20,
    },
    thumpContainer: {
        alignItems: 'flex-end',
        alignSelf: 'flex-start',
        marginVertical: 1,
        marginHorizontal: 5,
    },
    iconContainer: {
        height: AppSizes.scale(44),
        borderRadius: AppSizes.scale(45) * 0.21,
        backgroundColor: '$transparentWhite',
        width: AppSizes.scale(45),
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainerSecondary: {
        backgroundColor: '$lightGreen',
    },
    spinner: {
        flex: 1,
        alignSelf: 'center',
    },
});

export default Styles;
