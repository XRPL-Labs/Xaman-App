/**
 * Style service
 */
import { has, get } from 'lodash';
import { Appearance, StyleSheet } from 'react-native';

import { Images } from '@common/helpers/images';

import CoreRepository from '@store/repositories/core';
import CoreModel from '@store/models/objects/core';

import { Themes } from '@store/types';

import { ColorsGeneral, ColorsTheme } from '@theme/colors';

import { ImageStyle, TextStyle, ViewStyle } from 'react-native/Libraries/StyleSheet/StyleSheetTypes';
/* Types  ==================================================================== */
type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };
export type StyleType = Record<string, any>;

/* Service  ==================================================================== */
class StyleService {
    private themeName: Themes;
    private currentStyle: any;

    public hairlineWidth = StyleSheet.hairlineWidth;

    constructor() {
        this.themeName = 'light';
        this.currentStyle = { ...ColorsTheme.light, ...ColorsGeneral };
    }

    initialize = (coreSettings: CoreModel) => {
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
                    // theme name in title mode in version before v1.0.1
                    theme = (coreSettings.theme?.toLowerCase() || 'light') as Themes;
                }

                this.setTheme(theme);

                resolve();
            } catch (e) {
                reject(e);
            }
        });
    };

    setTheme = (theme: Themes) => {
        if (this.themeName !== theme && has(ColorsTheme, theme)) {
            this.themeName = theme;
            this.currentStyle = { ...ColorsTheme[theme], ...ColorsGeneral };
        }
    };

    create = <T extends NamedStyles<T> | NamedStyles<any>>(styles: T | NamedStyles<T>): T => {
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

    value = (value: string): string => {
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

    select<T extends string | number>(spec: { light?: T; dark?: T; default?: T }): T | undefined {
        return 'light' in spec && !this.isDarkMode()
            ? spec.light
            : 'dark' in spec && this.isDarkMode()
              ? spec.dark
              : spec.default;
    }

    getImage = (image: Extract<keyof typeof Images, string>): { uri: string } => {
        // if dark mode and there is a light mode for image return light
        if (this.isDarkMode() && `${image}Light` in Images) {
            return get(Images, `${image}Light`)!;
        }

        return get(Images, image);
    };

    getCurrentTheme = (): string => {
        return this.themeName;
    };
}

export default new StyleService();
