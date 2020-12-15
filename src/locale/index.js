"use strict";
/**
 * App Localization
 */
exports.__esModule = true;
var Localize = /** @class */ (function () {
    function Localize() {
        var _this = this;
        this.setLocale = function (locale, settings) {
            try {
                // set en
                _this.instance.translations.en = require('./en.json');
                // set locale settings
                if (settings) {
                    _this.settings = settings;
                }
                var translations = void 0;
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
                    _this.instance.translations[locale] = translations;
                }
                _this.instance.locale = locale;
            }
            catch (_a) {
                // ignore
            }
        };
        this.setSettings = function (settings) {
            _this.settings = settings;
        };
        this.setLocaleBundle = function (locale, translations) {
            if (!locale || !translations)
                return;
            try {
                // load a custom translation into the instance
                _this.instance.translations[locale] = translations;
                _this.instance.locale = locale;
            }
            catch (_a) {
                // ignore
            }
        };
        this.getCurrentLocale = function () { return _this.instance.locale; };
        /**
         * format the number
         * @param n number
         * @returns string 1,333.855222
         */
        this.formatNumber = function (n) {
            var options = { precision: 6, strip_insignificant_zeros: true };
            if (_this.settings) {
                var _a = _this.settings, separator = _a.separator, delimiter = _a.delimiter;
                Object.assign(options, { separator: separator, delimiter: delimiter });
            }
            return _this.instance.toNumber(n, options);
        };
        this.t = function (key, options) {
            return key ? _this.instance.t(key, options) : key;
        };
        this.instance = require('i18n-js');
        this.instance.fallbacks = true;
        this.settings = undefined;
    }
    return Localize;
}());
exports["default"] = new Localize();
