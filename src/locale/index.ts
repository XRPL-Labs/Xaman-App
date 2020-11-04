/**
 * App Localization
 */

class Localize {
    instance: any;
    settings: any;

    constructor() {
        this.instance = require('i18n-js');
        this.instance.fallbacks = true;
        this.settings = undefined;
    }

    setLocale = (locale: string, settings?: any) => {
        try {
            // set en
            this.instance.translations.en = require('./en.json');

            // set locale settings
            if (settings) {
                this.settings = settings;
            }

            let translations;

            switch (locale) {
                case 'zh':
                    translations = require('./zh-CN.json');
                    break;
                case 'ja':
                    translations = require('./ja.json');
                    break;
                case 'es':
                    translations = require('./es.json');
                    break;
                case 'ko':
                    translations = require('./ko.json');
                    break;
                default:
                    break;
            }

            if (translations) {
                this.instance.translations[locale] = translations;
            }

            this.instance.locale = locale;
        } catch {
            // ignore
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
