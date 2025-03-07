import { StyleSheet } from 'react-native';

import { AppSizes } from '@theme';

const styles = StyleSheet.create({
    icon: {
        width: AppSizes.screen.width * 0.5,
        height: AppSizes.screen.height * 0.25,
        resizeMode: 'contain',    
    },
});

export default styles;
