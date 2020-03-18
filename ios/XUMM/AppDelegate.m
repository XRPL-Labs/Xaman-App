#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLinkingManager.h>
#import <ReactNativeNavigation/ReactNativeNavigation.h>

#import <Firebase.h>
#import "RNFirebaseMessaging.h"
#import "RNFirebaseNotifications.h"

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
    NSURL *jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
    [ReactNativeNavigation bootstrap:jsCodeLocation launchOptions:launchOptions];
    
    [FIRApp configure];
    [RNFirebaseNotifications configure];
    
    return YES;
}

- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification {
    [[RNFirebaseNotifications instance] didReceiveLocalNotification:notification];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(nonnull NSDictionary *)userInfo
fetchCompletionHandler:(nonnull void (^)(UIBackgroundFetchResult))completionHandler{
    [[RNFirebaseNotifications instance] didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings {
    [[RNFirebaseMessaging instance] didRegisterUserNotificationSettings:notificationSettings];
}

// hide snapshot in task switcher
- (void)applicationWillResignActive:(UIApplication *)application {
    
    self.window.backgroundColor = [UIColor clearColor];

    UIBlurEffect *blurEffect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleLight];
    UIVisualEffectView *blurEffectView = [[UIVisualEffectView alloc] initWithEffect:blurEffect];
    blurEffectView.frame = self.window.bounds;
    blurEffectView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;

    blurEffectView.tag = 1234;
    blurEffectView.alpha = 0;
    [self.window addSubview:blurEffectView];
    [self.window bringSubviewToFront:blurEffectView];

    // fade in the view
    [UIView animateWithDuration:0.5 animations:^{
        blurEffectView.alpha = 1;
    }];
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
    
    // grab a reference to our custom blur view
    UIView *blurEffectView = [self.window viewWithTag:1234];

    // fade away colour view from main view
    [UIView animateWithDuration:0.5 animations:^{
        blurEffectView.alpha = 0;
    } completion:^(BOOL finished) {
        // remove when finished fading
        [blurEffectView removeFromSuperview];
    }];
}



@end
