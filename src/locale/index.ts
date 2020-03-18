/**
 * App Localization
 */

// libs
import i18n, { TranslateOptions } from 'i18n-js';
// locals
import en from './en.json';
import zh from './zh-CN.json';
import ja from './ja.json';
import es from './es.json';
import ko from './ko.json';

class Localize {
    instance: any;

    constructor() {
        this.instance = i18n;

        this.init();
    }

    init = () => {
        this.instance.fallbacks = true;

        // define translations
        this.instance.translations = {
            en,
            zh,
            ja,
            es,
            ko,
        };

        // this.instance.defaultLocale = "en";
        // this.instance.locale = "en";
    };

    setLocale = (locale: string) => {
        this.instance.locale = locale;
    };

    getCurrentLocale = (): string => this.instance.locale;

    t = (key: string, options?: TranslateOptions) => {
        return key ? this.instance.t(key, options) : key;
    };
}

export default new Localize();
