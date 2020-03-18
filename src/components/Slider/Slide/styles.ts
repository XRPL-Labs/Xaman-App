import { StyleSheet } from 'react-native';

import { AppStyles } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        // opacity: 0.5,

        flex: 1,
        width: '100%',
    },
    animatedView: {
        flex: 1,
        ...AppStyles.padding,
    },
});

/* Export ==================================================================== */
export default styles;
