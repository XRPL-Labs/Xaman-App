import { StyleSheet } from 'react-native';

import { AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 5,
        paddingBottom: 5,
    },
    title: {
        fontSize: AppFonts.base.size,
        marginLeft: 10,
        marginRight: 10,
    },
    switch: {
        alignSelf: 'center',
    },
});
