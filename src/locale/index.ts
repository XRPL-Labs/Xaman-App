/**
 * App Localization
 */

import { I18n } from 'i18n-js';
import BigNumber from 'bignumber.js';

/* Types ==================================================================== */
type LocalizeSettings = {
    /* Character used for decimal separator */
    separator: string;
    /* Character used for thousands separator */
    delimiter: string;
    /* device language code */
    languageCode: string;
    /* device locale */
    locale: string;
};

/* Class ==================================================================== */
class Localize {
    instance: any;
    moment: any;
    meta: any;
    settings: LocalizeSettings;

    constructor() {
        this.instance = new I18n();
        this.moment = require('moment-timezone');
        this.meta = require('./meta.json');

        // set default values
        this.instance.enableFallback = true;
        this.instance.defaultLocale = 'en';
        this.settings = undefined;
    }

    getLocales = () => {
        return Object.keys(this.meta).map((localeCode) => {
            return {
                code: localeCode,
                name: this.meta[localeCode].name.en,
                nameLocal: this.meta[localeCode].name[localeCode],
            };
        });
    };

    resolveLocale = (locale: string) => {
        if (Object.keys(this.meta).indexOf(locale) > -1) {
            return locale;
        }

        const fallback = locale.toLowerCase().replace(/_/g, '-').split('-')[0];
        if (Object.keys(this.meta).indexOf(fallback) > -1) {
            return fallback;
        }

        return 'en';
    };

    setLocale = (locale: string, settings?: any): string => {
        try {
            // set en
            this.instance.translations.en = require('./en.json');

            // set locale settings
            if (settings) {
                this.settings = settings;
            }

            const resolvedLocale = this.resolveLocale(locale);

            // none EN locale found
            if (resolvedLocale !== '' && resolvedLocale !== 'en') {
                const generateLocals = require('./generated').default;
                this.instance.translations[resolvedLocale] = generateLocals[resolvedLocale];
                this.instance.locale = resolvedLocale;
                this.moment.locale(resolvedLocale, generateLocals[resolvedLocale].moment);
                return resolvedLocale;
            }

            // fallback to EN if we don't support the locale
            this.instance.locale = 'en';
            this.moment.locale('en');
            return 'en';
        } catch (e) {
            return 'en';
        }
    };

    setSettings = (settings: any) => {
        this.settings = settings;
    };

    getSettings = (): any => {
        return this.settings;
    };

    setLocaleBundle = (locale: string, translations: any) => {
        if (!locale || !translations) return;

        try {
            // load a custom translation into the instance
            this.instance.translations[locale] = translations;
            this.instance.locale = locale;
        } catch {
            // ignore
        }
    };

    /**
     * get current local
     */
    getCurrentLocale = (): string => this.instance.locale;

    /**
     * format the number
     * @param number number
     * @param precision decimal places precision
     * @param rounding should apply rounding
     * @returns string 1,333.855222
     */
    formatNumber = (number: number, precision = 8, rounding = true): string => {
        const formatOptions = { groupSize: 3, decimalSeparator: '.', groupSeparator: ',' };

        if (this.settings) {
            const { separator, delimiter } = this.settings;
            Object.assign(formatOptions, { decimalSeparator: separator, groupSeparator: delimiter });
        }

        // do not change decimal places
        if (!rounding) {
            return new BigNumber(number).toFormat(formatOptions);
        }

        return new BigNumber(number).decimalPlaces(precision, BigNumber.ROUND_DOWN).toFormat(formatOptions);
    };

    t = (key: string, options?: any) => {
        return key ? this.instance.t(key, options) : key;
    };
}

export default new Localize();
