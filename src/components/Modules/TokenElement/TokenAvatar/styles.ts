import StyleService from '@services/StyleService';
import { AppSizes } from '@theme/index';

/* Styles ==================================================================== */
export default StyleService.create({
    lpContainer: {
        // borderWidth: 1,
        // borderColor: 'red',
        width: 35,
        height: 35,
        borderRadius: 3,
    },
    dualAvatar: {
        // borderRadius: 200,
        // width: 23,
        // height: 23,
        // backgroundColor: '$light',
    },
    miniAvatar: {
        backgroundColor: '$light',
        borderRadius: 50,
    },
    virtualAssetSecondaryAvatar: {
        position: 'absolute',
        borderRadius: 50,
    },
    avatar1: {
        position: 'absolute',
        // top: -1,
        // left: -2,
    },
    avatar2: {
        position: 'absolute',
        left: AppSizes.scale(18),
        top: AppSizes.scale(18),
    },
    avatar2Lp: {
        position: 'absolute',
        left: AppSizes.scale(14),
        top: AppSizes.scale(14),
    },
});
