import { Platform } from 'react-native';

import StyleService from '@services/StyleService';
import { AppStyles, AppSizes } from '@theme';

const styles = StyleService.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? AppSizes.statusBarHeight : 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 99999,
        height: AppSizes.heightPercentageToDP(9) + (Platform.OS === 'ios' ? AppSizes.statusBarHeight : 0),
        backgroundColor: '$background',
    },

    fixedContainer: {
        flex: 3,
    },
    floatContainer: {
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
        tintColor: '$textPrimary',
    },
});

export default styles;
