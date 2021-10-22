#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLinkingManager.h>

#import <ReactNativeNavigation/ReactNativeNavigation.h>

#import <Firebase.h>


#import "Libs/Notification/LocalNotification.h"


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
  [ReactNativeNavigation bootstrapWithDelegate:self launchOptions:launchOptions];
  
  // bootstrap local notification
  [LocalNotificationModule initialise];
  
  // init firebase app
  if ([FIRApp defaultApp] == nil) {
    [FIRApp configure];
  }
  
  
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge {
  return [ReactNativeNavigation extraModulesForBridge:bridge];
}

// hide snapshot in task switcher
- (void)applicationWillResignActive:(UIApplication *)application {
  UIBlurEffect *blurEffect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleLight];
  UIVisualEffectView *blurEffectView = [[UIVisualEffectView alloc] initWithEffect:blurEffect];
  
  UIWindow *topWindow = [[[UIApplication sharedApplication].windows sortedArrayUsingComparator:^NSComparisonResult(UIWindow *win1, UIWindow *win2) {
      return win1.windowLevel - win2.windowLevel;
  }] lastObject];
  
  blurEffectView.frame = topWindow.frame;
  blurEffectView.tag = 763609;
  blurEffectView.alpha = 0;
  [topWindow addSubview:blurEffectView];
  [UIView animateWithDuration:0.5 animations:^{
    blurEffectView.alpha = 1;
  }];
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
  UIWindow *topWindow = [[[UIApplication sharedApplication].windows sortedArrayUsingComparator:^NSComparisonResult(UIWindow *win1, UIWindow *win2) {
      return win1.windowLevel - win2.windowLevel;
  }] lastObject];

  UIView *blurEffectView = [topWindow viewWithTag:763609];
  if (blurEffectView){
    // fade away colour view from main view
    [UIView animateWithDuration:0.5 animations:^{
      blurEffectView.alpha = 0;
    } completion:^(BOOL finished) {
      // remove when finished fading
      [blurEffectView removeFromSuperview];
    }];
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
