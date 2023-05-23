import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: '$transparent',
    },
    close: {
        marginBottom: 40,
    },
    tip: {
        borderRadius: 50,
        padding: 10,
        paddingHorizontal: 20,
        backgroundColor: '$transparentBlack',
        marginBottom: 20,
    },
    topLeft: {
        width: AppSizes.scale(40),
        height: AppSizes.scale(40),
        borderWidth: 2,
        borderColor: '$white',
        position: 'absolute',
        opacity: 0.5,
        borderRadius: 3,
        top: 40,
        left: 20,
        borderBottomWidth: 0,
        borderRightWidth: 0,
    },
    topRight: {
        width: AppSizes.scale(40),
        height: AppSizes.scale(40),
        borderWidth: 2,
        borderColor: '$white',
        position: 'absolute',
        opacity: 0.5,
        borderRadius: 3,
        top: 40,
        right: 20,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
    },
    bottomLeft: {
        width: AppSizes.scale(40),
        height: AppSizes.scale(40),
        borderWidth: 2,
        borderColor: '$white',
        position: 'absolute',
        opacity: 0.5,
        borderRadius: 3,
        bottom: 20,
        left: 20,
        borderTopWidth: 0,
        borderRightWidth: 0,
    },
    bottomRight: {
        width: AppSizes.scale(40),
        height: AppSizes.scale(40),
        borderWidth: 2,
        borderColor: '$white',
        position: 'absolute',
        opacity: 0.5,
        borderRadius: 3,
        bottom: 20,
        right: 20,
        borderTopWidth: 0,
        borderLeftWidth: 0,
    },
    rectangle: {
        height: AppSizes.scale(250),
        width: AppSizes.scale(300),
        borderWidth: 2,
        borderColor: '$white',
        backgroundColor: '$transparent',
    },
    rectangleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '$transparent',
    },
    scanIconTransparent: {
        tintColor: '$silver',
        opacity: 0.5,
    },
});

export default styles;
