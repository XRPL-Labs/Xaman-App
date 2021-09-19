/**
 * Style service
 */
import { has, get, toLower } from 'lodash';
import { Appearance } from 'react-native';

import { Images } from '@common/helpers/images';

import CoreRepository from '@store/repositories/core';
import { CoreSchema } from '@store/schemas/latest';
import { Themes } from '@store/types';

import { ColorsGeneral, ColorsTheme } from '@theme/colors';

/* Types  ==================================================================== */
export type StyleType = Record<string, any>;

/* Service  ==================================================================== */
class StyleService {
    private themeName: Themes;
    private currentStyle: any;

    constructor() {
        this.themeName = 'light';
        this.currentStyle = { ...ColorsTheme.light, ...ColorsGeneral };
    }

    initialize = (coreSettings: CoreSchema) => {
        return new Promise<void>((resolve, reject) => {
            try {
                // default theme
                let theme = 'light' as Themes;

                // if app is not initialized set default theme from OS settings
                if (!coreSettings?.initialized) {
                    // try to get user's appearance preferences from OS
                    const colorScheme = Appearance.getColorScheme();
                    if (colorScheme) {
                        theme = colorScheme;

                        // persist the changes
                        CoreRepository.saveSettings({
                            theme: colorScheme,
                        });
                    }
                } else {
                    // lowerCase the theme name is required as we stored
                    // theme name in title mode in version before 1.0.1
                    // @ts-ignore
                    theme = toLower(coreSettings.theme) || 'light';
                }

                this.setTheme(theme);

                return resolve();
            } catch (e) {
                return reject(e);
            }
        });
    };

    setTheme = (theme: Themes) => {
        if (this.themeName !== theme && has(ColorsTheme, theme)) {
            this.themeName = theme;
            this.currentStyle = { ...ColorsTheme[theme], ...ColorsGeneral };
        }
    };

    create = (styles: any) => {
        return Object.entries(styles).reduce((themed: any, style: any) => {
            const [key, value] = style;

            return { ...themed, [key]: this.applyTheme(value) };
        }, {});
    };

    applyTheme = (style: StyleType) => {
        if (typeof style === 'object') {
            return Object.entries(style).reduce((themed: any, item: any) => {
                const [key, value] = item;

                return { ...themed, [key]: this.value(value) };
            }, {});
        }
        return style;
    };

    value = (value: any): string => {
        if (this.isReference(value)) {
            const referenceKey: string = this.createKeyFromReference(value);
            return this.findValue(referenceKey);
        }
        return value;
    };

    private findValue = (name: string): any => {
        return this.currentStyle[name];
    };

    private isReference = (value: string): boolean => {
        return `${value}`.startsWith('$');
    };

    private createKeyFromReference = (value: string): string => {
        return `${value}`.substring(1);
    };

    isDarkMode = (): boolean => {
        return this.themeName !== 'light';
    };

    getImage = (image: Extract<keyof typeof Images, string>) => {
        // if dark mode and there is a light mode for image return light
        if (this.isDarkMode() && has(Images, `${image}Light`)) {
            return get(Images, `${image}Light`);
        }

        return get(Images, image);
    };

    getCurrentTheme = (): string => {
        return this.themeName;
    };
}

export default new StyleService();
