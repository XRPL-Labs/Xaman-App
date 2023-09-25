#import "AppUtils.h"

#include <sys/types.h>
#include <sys/sysctl.h>

#import <Foundation/Foundation.h>

#import <AudioToolbox/AudioToolbox.h>
#import <AudioToolbox/AudioServices.h>

#import <React/RCTReloadCommand.h>

#import <RNFBMessaging/RNFBMessaging+UNUserNotificationCenter.h>

@import UIKit;
@import Darwin.sys.sysctl;


@implementation AppUtilsModule
{
  bool hasListeners;
}

RCT_EXPORT_MODULE();


- (NSArray<NSString *> *)supportedEvents
{
  return @[@"Utils.timeout"];;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}


+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

// Will be called when this module's first listener is added.
-(void)startObserving {
  hasListeners = YES;
}

// Will be called when this module's last listener is removed, or on dealloc.
-(void)stopObserving {
  hasListeners = NO;
}


- (NSDictionary *)constantsToExport {
  return @{
    @"appVersion": [self getAppVersion],
    @"buildNumber": [self getBuildNumber],
    @"isDebug": @(self.isDebug),
  };
}

- (NSString *) getAppVersion {
  return [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
}

- (NSString *) getBuildNumber {
  return [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleVersion"];
}

- (BOOL) isDebug {
  #if DEBUG
    return YES;
  #else
    return NO;
  #endif
}

RCT_EXPORT_METHOD(restartBundle) {
  if ([NSThread isMainThread]) {
    // clear initialNotification from RNF messaging
    [RNFBMessagingUNUserNotificationCenter sharedInstance].initialNotification = nil;
    RCTTriggerReloadCommandListeners(@"Manual restartBundle");
  } else {
    dispatch_sync(dispatch_get_main_queue(), ^{
      [RNFBMessagingUNUserNotificationCenter sharedInstance].initialNotification = nil;
      RCTTriggerReloadCommandListeners(@"Manual restartBundle");
    });
  }
  return;
}

RCT_EXPORT_METHOD(exitApp)
{
  exit(0);
}


RCT_EXPORT_METHOD(timeoutEvent:(NSString *)timeoutId timeout:(int)timeout
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  __block UIBackgroundTaskIdentifier task = [[UIApplication sharedApplication] beginBackgroundTaskWithName:@"AppUtilsModule" expirationHandler:^{
    [[UIApplication sharedApplication] endBackgroundTask:task];
  }];
  
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, timeout * NSEC_PER_MSEC), dispatch_get_main_queue(), ^{
    if ([self bridge] != nil && self->hasListeners) {
      [self sendEventWithName:@"Utils.timeout" body:timeoutId];
    }
    
    [[UIApplication sharedApplication] endBackgroundTask:task];
  });
  resolve([NSNumber numberWithBool:YES]);
}

@end
