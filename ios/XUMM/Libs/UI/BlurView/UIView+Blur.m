#import "UIView+Blur.h"
#import "BlurEffectWithAmount.h"

@interface BlurView ()

@end

@implementation BlurView

- (instancetype)init
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(reduceTransparencyStatusDidChange:)
                                          name:UIAccessibilityReduceTransparencyStatusDidChangeNotification
                                          object:nil];
  }

  return self;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    self.blurEffectView = [[UIVisualEffectView alloc] init];
    self.blurEffectView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    self.blurEffectView.frame = frame;

    self.reducedTransparencyFallbackView = [[UIView alloc] init];
    self.reducedTransparencyFallbackView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    self.reducedTransparencyFallbackView.frame = frame;

    self.blurAmount = @10;
    self.blurType = @"dark";
    [self updateBlurEffect];
    [self updateFallbackView];

    self.clipsToBounds = true;

    [self addSubview:self.blurEffectView];
  }

  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  self.blurEffectView.frame = self.bounds;
  self.reducedTransparencyFallbackView.frame = self.bounds;
}

- (void)setBlurType:(NSString *)blurType
{
  if (blurType && ![self.blurType isEqual:blurType]) {
    _blurType = blurType;
    [self updateBlurEffect];
  }
}

- (void)setBlurAmount:(NSNumber *)blurAmount
{
  if (blurAmount && ![self.blurAmount isEqualToNumber:blurAmount]) {
    _blurAmount = blurAmount;
    [self updateBlurEffect];
  }
}

- (void)setReducedTransparencyFallbackColor:(nullable UIColor *)reducedTransparencyFallbackColor
{
  if (reducedTransparencyFallbackColor && ![self.reducedTransparencyFallbackColor isEqual:reducedTransparencyFallbackColor]) {
    _reducedTransparencyFallbackColor = reducedTransparencyFallbackColor;
    [self updateFallbackView];
  }
}

- (UIBlurEffectStyle)blurEffectStyle
{
  if ([self.blurType isEqual: @"xlight"]) return UIBlurEffectStyleExtraLight;
  if ([self.blurType isEqual: @"light"]) return UIBlurEffectStyleLight;
  if ([self.blurType isEqual: @"dark"]) return UIBlurEffectStyleDark;
  
  return UIBlurEffectStyleDark;
}

- (BOOL)useReduceTransparencyFallback
{
  return UIAccessibilityIsReduceTransparencyEnabled() == YES && self.reducedTransparencyFallbackColor != NULL;
}

- (void)updateBlurEffect
{
  UIBlurEffectStyle style = [self blurEffectStyle];
  self.blurEffect = [BlurEffectWithAmount effectWithStyle:style andBlurAmount:self.blurAmount];
  self.blurEffectView.effect = self.blurEffect;
}

- (void)updateFallbackView
{
  if ([self useReduceTransparencyFallback]) {
    if (![self.subviews containsObject:self.reducedTransparencyFallbackView]) {
      [self insertSubview:self.reducedTransparencyFallbackView atIndex:0];
    }

    if ([self.subviews containsObject:self.blurEffectView]) {
      [self.blurEffectView removeFromSuperview];
    }
  } else {
    if ([self.subviews containsObject:self.reducedTransparencyFallbackView]) {
      [self.reducedTransparencyFallbackView removeFromSuperview];
    }

    if (![self.subviews containsObject:self.blurEffectView]) {
      [self insertSubview:self.blurEffectView atIndex:0];
    }
  }

  self.reducedTransparencyFallbackView.backgroundColor = self.reducedTransparencyFallbackColor;
}

- (void)reduceTransparencyStatusDidChange:(__unused NSNotification *)notification
{
  [self updateFallbackView];
}

@end
