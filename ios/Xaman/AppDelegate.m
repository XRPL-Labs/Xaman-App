#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>

#import <Firebase.h>
#import <ReactNativeNavigation/ReactNativeNavigation.h>

#import "Libs/Notification/LocalNotification.h"
#import "Libs/Security/Authentication/Biometric/BiometricModule.h"
#import "Libs/Common/InAppPurchase/InAppPurchase.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity
 restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // bootstrap rnn
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  [ReactNativeNavigation bootstrapWithBridge:bridge];

  // init firebase app
  if ([FIRApp defaultApp] == nil) {
    [FIRApp configure];
  }

  // bootstrap local notification and Biometric module
  [LocalNotificationModule initialise];
  [BiometricModule initialise];


  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self getBundleURL];
}

- (NSURL *)getBundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge {
  return [ReactNativeNavigation extraModulesForBridge:bridge];
}

// hide snapshot in task switcher
- (void)applicationWillResignActive:(UIApplication *)application {
  // ignore if user is authenticating with biometric or processing in app purchase
  if([BiometricModule isUserAuthenticating] || [InAppPurchaseModule isUserPurchasing]){
    return;
  }

  NSPredicate *isKeyWindow = [NSPredicate predicateWithFormat:@"isKeyWindow == YES"];
  UIWindow *topWindow = [[[UIApplication sharedApplication] windows] filteredArrayUsingPredicate:isKeyWindow].firstObject;

  UIViewController *rootViewController = topWindow.rootViewController;
  UIViewController *currentViewController = rootViewController;

  if ([rootViewController presentedViewController]) {
    currentViewController = [rootViewController presentedViewController];
  }

  if(![NSStringFromClass([currentViewController class]) hasPrefix:@"RNN"]){
    return;
  }

  UIBlurEffect *blurEffect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleLight];
  UIVisualEffectView *blurEffectView = [[UIVisualEffectView alloc] initWithEffect:blurEffect];

  blurEffectView.frame = topWindow.frame;
  blurEffectView.tag = 0xDEADBEEF;
  blurEffectView.alpha = 0;
  [topWindow addSubview:blurEffectView];
  [UIView animateWithDuration:0.5 animations:^{
    blurEffectView.alpha = 1;
  }];
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
  NSArray *windows = [UIApplication sharedApplication].windows;
  for(UIWindow *window in [windows reverseObjectEnumerator]) {
    UIView *blurEffectView = [window viewWithTag:0xDEADBEEF];
    if (blurEffectView){
      // fade away colour view from main view
      [UIView animateWithDuration:0.5 animations:^{
        blurEffectView.alpha = 0;
      } completion:^(BOOL finished) {
        // remove when finished fading
        [blurEffectView removeFromSuperview];
      }];
      return;
    }
  }
}

- (BOOL)application:(UIApplication *)application shouldAllowExtensionPointIdentifier:(NSString *)extensionPointIdentifier
{
  // disable custom keyboard
  if ([extensionPointIdentifier isEqualToString:@"com.apple.keyboard-service"]) {
    return NO;
  }
  return YES;
}

@end
