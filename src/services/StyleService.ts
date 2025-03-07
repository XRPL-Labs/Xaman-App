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
type ImageType = { uri: string };

let __id = 0;

/* Service  ==================================================================== */
class StyleService {    
    private styleDefinitions: Map<string, any> = new Map();
    private styleReferences: Map<string, any> = new Map();
    
    private regularValues: Map<string, any> = new Map();

    public hairlineWidth = StyleSheet.hairlineWidth;

    constructor() {
        this.regularValues.set('themeName', 'light');
        this.regularValues.set('currentStyle', { ...ColorsTheme.light, ...ColorsGeneral });
    }

    // Update all living references with fresh values
    private updateAllReferences() {
        // console.log('Updating all style references to', this.regularValues.get('themeName'));
        // Update style references
        this.styleDefinitions.forEach((styleDefinition, id) => {
            // Generate fresh styles
            const freshStyles = this.createFr(styleDefinition);
            const livingReference = this.styleReferences.get(id);
            
            if (livingReference) {
                // Update all properties, keeping the same reference
                Object.keys(livingReference).forEach(key => {
                    delete livingReference[key];
                });
                
                Object.keys(freshStyles).forEach(key => {
                    livingReference[key] = freshStyles[key];
                });
            }
        });
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

                    if (coreSettings.themeAutoSwitch) {
                        const colorScheme = Appearance.getColorScheme();
                        if (colorScheme) {
                            // For this session only
                            theme = colorScheme === 'light'
                                ? 'light'
                                : theme === 'light' // If configured in light mode but dark requested, use default dark
                                ? 'dark'
                                : theme;
                        }
                    }
                }

                this.setTheme(theme);

                resolve();
            } catch (e) {
                reject(e);
            }
        });
    };

    setTheme = (theme: Themes) => {
        if (this.regularValues.get('themeName') !== theme && has(ColorsTheme, theme)) {
            this.regularValues.set('themeName', theme);
            this.regularValues.set('isDarkMode', theme !== 'light');
            this.regularValues.set('currentStyle', { ...ColorsTheme[theme], ...ColorsGeneral });
            
            // Immediately update all references when theme changes
            this.updateAllReferences();
        }
    };

    // "For real" versions that compute the actual values
    createFr = <T extends NamedStyles<T> | NamedStyles<any>>(styles: T | NamedStyles<T>): T => {
        return Object.entries(styles).reduce((themed: any, style: any) => {
            const [key, value] = style;

            return { ...themed, [key]: this.applyTheme(value) };
        }, {});
    };

    // select<T extends string | number>(spec: { light?: T; dark?: T; default?: T }): T | undefined {
    // Wrapped, but will be parsed by the outter render
    // @ts-ignore
    select<T extends string | number>(spec: { light?: T; dark?: T; default?: T }): T | undefined {
        // Wrapped, but will be parsed by the outter render
        // @ts-ignore
        return `$(${JSON.stringify(spec)})`;
        // return 'light' in spec && !this.isDarkMode()
        //     ? spec.light
        //     : 'dark' in spec && this.isDarkMode()
        //       ? spec.dark
        //       : spec.default;
    }

    // Public methods that create and return living references
    create = <T extends NamedStyles<T> | NamedStyles<any>>(styles: T | NamedStyles<T>): T => {
        // Generate a unique ID for this style definition
        __id++;
        const id = String(__id);

        // console.log('create', id)
        
        // Store the style definition
        this.styleDefinitions.set(id, styles);
        
        // Create the initial styles
        const initialStyles: { [key: string]: any } = this.createFr(styles);
        
        // Create a living reference object (empty object to start)
        const livingReference: { [key: string]: any } = {};
        
        // Copy all properties from initial styles
        Object.keys(initialStyles).forEach(key => {
            livingReference[key] = initialStyles[key];
        });
        
        // Store the living reference
        this.styleReferences.set(id, livingReference);
        
        // Return the living reference
        return livingReference as T;
    };

    // No living references for images - they will be calculated on each call
    getImage = (image: Extract<keyof typeof Images, string>): ImageType => {
        // if dark mode and there is a light mode for image return light
        if (this.isDarkMode() && `${image}Light` in Images) {
            return get(Images, `${image}Light`)!;
        }

        return get(Images, image);
    };

    getImageIfLightModeIfDarkMode = (
        imageIfLightMode: Extract<keyof typeof Images, string>,
        imageIfDarkMode: Extract<keyof typeof Images, string>,
    ): ImageType => {
        // if dark mode and there is a light mode for image return light
        if (this.isDarkMode() && `${imageIfDarkMode}` in Images) {
            return get(Images, `${imageIfDarkMode}`)!;
        }

        return get(Images, imageIfLightMode);
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
            if (value.startsWith('$({')) {
                const explodedValue = JSON.parse(value.slice(2, -1))?.[this.isDarkMode() ? 'dark' : 'light'];
                value = explodedValue;
            }

            if (typeof value === 'string' && value.startsWith('$')) {
                const referenceKey: string = this.createKeyFromReference(value);
                return this.findValue(referenceKey);    
            }
            
            return value;
        }

        return value;
    };

    private findValue = (name: string): any => {
        return this.regularValues.get('currentStyle')[name];
    };

    private isReference = (value: string): boolean => {
        return `${value}`.startsWith('$');
    };

    private createKeyFromReference = (value: string): string => {
        return `${value}`.substring(1);
    };

    isDarkMode = (): boolean => {
        return this.regularValues.get('isDarkMode');
    };

    getBackdropInterpolateColor = () => {
        if (this.regularValues.get('themeName') === 'dark' || this.regularValues.get('themeName') === 'moonlight') {
            return ['rgba(50,50,50,0)', 'rgba(50,50,50,0.7)'];
        }

        return ['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)'];
    };

    getCurrentTheme = (): string => {
        return this.regularValues.get('themeName');
    };
}

export default new StyleService();
