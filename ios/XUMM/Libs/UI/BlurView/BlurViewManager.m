// Licence:
// https://github.com/Kureev/react-native-blur

#import "BlurViewManager.h"
#import "UIView+Blur.h"

@implementation BlurViewManager

RCT_EXPORT_MODULE();

RCT_EXPORT_VIEW_PROPERTY(blurType, NSString);
RCT_EXPORT_VIEW_PROPERTY(blurAmount, NSNumber);
RCT_EXPORT_VIEW_PROPERTY(reducedTransparencyFallbackColor, UIColor);

- (UIView *)view
{
    return [[BlurView alloc] init];
}

@end
