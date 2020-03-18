//
//  CIColor+QRCode.m
//  QRCodeGenerator
//
//  Copyright (c) 2017 http://www.mobiledev.it Giovanni Scarrone
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//

#import "CIColor+QRCode.h"
#import "NSString+Utils.h"

@implementation CIColor (QRCode)

+ (instancetype)colorWithRGBA:(NSString *)rgba {
    CIColor *_color = nil;
    @try {
        CGFloat r = 0.0f;
        CGFloat g = 0.0f;
        CGFloat b = 0.0f;
        CGFloat a = 1.0f;
        
        NSString *colorString = [[[NSString getSafeString:rgba] stringByReplacingOccurrencesOfString:@"#" withString:@""] uppercaseString];
        
        NSScanner *scanner = [NSScanner scannerWithString:colorString];
        unsigned hexValue = 0;
        if ([scanner scanHexInt:&hexValue]) {
            switch ([colorString length]) {
                case 3:
                    r = (CGFloat)((hexValue & 0xF00) >> 8)    / 15.0;
                    g = (CGFloat)((hexValue & 0x0F0) >> 4)    / 15.0;
                    b = (CGFloat)(hexValue & 0x00F)           / 15.0;
                    break;
                case 4:
                    r = (CGFloat)((hexValue & 0xF000) >> 12)    / 15.0;
                    g = (CGFloat)((hexValue & 0x0F00) >> 8)    / 15.0;
                    b = (CGFloat)((hexValue & 0x00F0) >> 4)  / 15.0;
                    a = (CGFloat)(hexValue & 0x000F)          / 15.0;
                    break;
                case 6:
                    r = (CGFloat)((hexValue & 0xFF0000) >> 16)    / 255.0;
                    g = (CGFloat)((hexValue & 0x00FF00) >> 8)     / 255.0;
                    b = (CGFloat)(hexValue & 0x0000FF)           / 255.0;
                    break;
                case 8:
                    r = (CGFloat)((hexValue & 0xFF000000) >> 24)  / 255.0;
                    g = (CGFloat)((hexValue & 0x00FF0000) >> 16)  / 255.0;
                    b = (CGFloat)((hexValue & 0x0000FF00) >> 8)   / 255.0;
                    a = (CGFloat)(hexValue & 0x000000FF)          / 255.0;
                    break;
                default:
                    NSLog(@"%@", @"Invalid HEX: rgba");
            }
        } else {
            NSLog(@"%@", @"Invalid HEX: rgba");
        }
        
        _color = [CIColor colorWithRed:r green:g blue:b alpha:a];
    } @catch (NSException *exception) {
        NSLog(@"Error: %@", exception.reason);
    }
    return  _color;
}

@end
