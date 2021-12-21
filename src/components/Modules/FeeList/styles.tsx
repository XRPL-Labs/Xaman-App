import StyleService from '@services/StyleService';

import { AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    sectionHeader: {
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderTopColor: '$tint',
        borderTopWidth: 1,
        backgroundColor: '$background',
    },
    sectionHeaderText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        paddingLeft: 8,
        color: '$textPrimary',
    },
});

export default styles;
