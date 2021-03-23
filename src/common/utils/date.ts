import moment from 'moment-timezone';

/**
 * format the date
 * @param date
 * @returns string September 4 1986 8:30 PM
 */
const FormatDate = (date: string): string => {
    return moment(date).format('lll');
};

/* Export ==================================================================== */
export { FormatDate };
