/**
 * App Localization
 */

class Localize {
    instance: any;

    constructor() {
        this.instance = require('i18n-js');
        this.instance.fallbacks = true;
    }

    setLocale = (locale: string) => {
        try {
            // set en
            this.instance.translations.en = require('./en.json');

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

    t = (key: string, options?: any) => {
        return key ? this.instance.t(key, options) : key;
    };
}

export default new Localize();
