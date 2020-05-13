import { StyleSheet } from 'react-native';

import { getStatusBarHeight } from '@common/helpers/interface';

import { AppStyles, AppSizes } from '@theme';

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: getStatusBarHeight(true),
        // paddingLeft: 25,
        // paddingRight: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 99999,
        height: AppSizes.heightPercentageToDP(9) + getStatusBarHeight(true),
    },

    centerContainer: {
        flex: 3,
    },
    rightLeftContainer: {
        flex: 1,
    },
    childContainer: {
        height: '100%',
        justifyContent: 'center',
    },
    textStyle: {
        ...AppStyles.h5,
        textAlign: 'center',
    },
    textStyleSmall: {
        ...AppStyles.pbold,
        textAlign: 'center',
    },
    iconStyle: {
        alignSelf: 'center',
    },
});

export default styles;
