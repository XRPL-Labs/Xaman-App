/**
 * App Localization
 */

class Localize {
    instance: any;
    settings: any;
    meta: any;

    constructor() {
        // require('moment/min/locales');
        this.instance = require('i18n-js');
        this.meta = require('./meta.json');
        this.instance.fallbacks = true;
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
                return resolvedLocale;
            }

            // fallback to EN if we don't support the locale
            this.instance.locale = 'en';
            return 'en';
        } catch (e) {
            return 'en';
        }
    };

    setSettings = (settings: any) => {
        this.settings = settings;
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

    getCurrentLocale = (): string => this.instance.locale;

    /**
     * format the number
     * @param n number
     * @returns string 1,333.855222
     */
    formatNumber = (n: number): string => {
        const options = { precision: 6, strip_insignificant_zeros: true };

        if (this.settings) {
            const { separator, delimiter } = this.settings;
            Object.assign(options, { separator, delimiter });
        }

        return this.instance.toNumber(n, options);
    };

    t = (key: string, options?: any) => {
        return key ? this.instance.t(key, options) : key;
    };
}

export default new Localize();
