#import "DeviceUtils.h"

#include <sys/types.h>
#include <sys/sysctl.h>
#import <sys/utsname.h>

#import <Foundation/Foundation.h>

@import UIKit;

@implementation DeviceUtilsModule

RCT_EXPORT_MODULE();

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (NSDictionary *)constantsToExport {
  return @{
    @"osVersion": [self getOSVersion],
    @"brand": @"Apple",
    @"model": [self getModel],
    @"layoutInsets": [self getLayoutInsets],
  };
}

- (NSString *) getOSVersion {
  UIDevice *currentDevice = [UIDevice currentDevice];
  return currentDevice.systemVersion;
}

- (NSString *) getModel {
  struct utsname systemInfo;
  uname(&systemInfo);
  NSString* deviceId = [NSString stringWithCString:systemInfo.machine
                                          encoding:NSUTF8StringEncoding];
  #if TARGET_IPHONE_SIMULATOR
    deviceId = [NSString stringWithFormat:@"%s", getenv("SIMULATOR_MODEL_IDENTIFIER")];
  #endif
  
  return deviceId;
}

- (NSDictionary *) getLayoutInsets
{
  return @{
    @"top": @(UIApplication.sharedApplication.keyWindow.safeAreaInsets.top),
    @"bottom": @(UIApplication.sharedApplication.keyWindow.safeAreaInsets.bottom)
  };
}


- (NSArray *)pathsToCheck
{
  return @[
    @"/Applications/Cydia.app",
    @"/Library/MobileSubstrate/MobileSubstrate.dylib",
    @"/bin/bash",
    @"/usr/sbin/sshd",
    @"/etc/apt",
    @"/private/var/lib/apt",
    @"/usr/sbin/frida-server",
    @"/usr/bin/cycript",
    @"/usr/local/bin/cycript",
    @"/usr/lib/libcycript.dylib",
    @"/Applications/FakeCarrier.app",
    @"/Applications/Icy.app",
    @"/Applications/IntelliScreen.app",
    @"/Applications/MxTube.app",
    @"/Applications/RockApp.app",
    @"/Applications/SBSettings.app",
    @"/Applications/WinterBoard.app",
    @"/Applications/blackra1n.app",
    @"/Library/MobileSubstrate/DynamicLibraries/LiveClock.plist",
    @"/Library/MobileSubstrate/DynamicLibraries/Veency.plist",
    @"/System/Library/LaunchDaemons/com.ikey.bbot.plist",
    @"/System/Library/LaunchDaemons/com.saurik.Cydia.Startup.plist",
    @"/bin/sh",
    @"/etc/ssh/sshd_config",
    @"/private/var/lib/cydia",
    @"/private/var/mobile/Library/SBSettings/Themes",
    @"/private/var/stash",
    @"/private/var/tmp/cydia.log",
    @"/usr/bin/sshd",
    @"/usr/libexec/sftp-server",
    @"/usr/libexec/ssh-keysign",
    @"/var/cache/apt",
    @"/var/lib/apt",
    @"/var/lib/cydia",
  ];
}

- (NSArray *)schemesToCheck
{
  return @[
    @"cydia://package/com.example.package",
  ];
}

- (BOOL)checkPaths
{
  BOOL existsPath = NO;
  
  for (NSString *path in [self pathsToCheck]) {
    if ([[NSFileManager defaultManager] fileExistsAtPath:path]){
      existsPath = YES;
      break;
    }
  }
  
  return existsPath;
}

- (BOOL)checkSchemes
{
  BOOL canOpenScheme = NO;
  
  for (NSString *scheme in [self schemesToCheck]) {
    if([[UIApplication sharedApplication] canOpenURL:[NSURL URLWithString:scheme]]){
      canOpenScheme = YES;
      break;
    }
  }
  
  return canOpenScheme;
}

- (BOOL)canViolateSandbox{
  NSString *JMJailbreakTextFile = @"/private/jailbreak.txt";
  NSError *error;
  BOOL grantsToWrite = NO;
  NSString *stringToBeWritten = @"This is an anti-spoofing test.";
  [stringToBeWritten writeToFile:JMJailbreakTextFile atomically:YES
                        encoding:NSUTF8StringEncoding error:&error];
  if(!error){
    //Device is jailbroken
    grantsToWrite = YES;
  }
  
  [[NSFileManager defaultManager] removeItemAtPath:JMJailbreakTextFile error:nil];
  
  return grantsToWrite;
}


RCT_REMAP_METHOD(isJailBroken, jailbreak_resolver:(RCTPromiseResolveBlock)resolve  rejecter:(RCTPromiseRejectBlock)reject)
{
  if([self checkPaths] || [self checkSchemes] || [self canViolateSandbox]) {
    resolve(@YES);
  }
  else {
    resolve(@NO);
  }
}

RCT_EXPORT_METHOD(getElapsedRealtime: (RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  struct timeval boottime;
  int mib[2] = {CTL_KERN, KERN_BOOTTIME};
  size_t size = sizeof(boottime);
  time_t now;
  time_t uptime = -1;
  
  (void) time(&now);
  
  if (sysctl(mib, 2, &boottime, &size, NULL, 0) != -1 && boottime.tv_sec != 0) {
    uptime = now - (boottime.tv_sec);
  }
  
  resolve([NSString stringWithFormat:@"%ld", uptime]);
}


RCT_EXPORT_METHOD(getTimeZone:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  @try{
    NSTimeZone *timeZone = [NSTimeZone localTimeZone];
    resolve(timeZone.name);
  }
  @catch(NSException *exception){
    NSMutableDictionary * info = [NSMutableDictionary dictionary];
    [info setValue:exception.name forKey:@"ExceptionName"];
    [info setValue:exception.reason forKey:@"ExceptionReason"];
    [info setValue:exception.userInfo forKey:@"ExceptionUserInfo"];
    NSError *error = [[NSError alloc] initWithDomain:@"getTimeZone Module" code:0 userInfo:info];
    reject(@"failed to execute",@"",error);
  }
}

RCT_EXPORT_METHOD(getLocalSetting:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  @try{
    NSLocale *locale = [NSLocale currentLocale];
    NSString *languageCode = [[NSLocale preferredLanguages] objectAtIndex:0];
    
    resolve(@{
      @"locale": [locale localeIdentifier],
      @"languageCode": [languageCode lowercaseString],
      @"separator": [locale objectForKey:NSLocaleDecimalSeparator],
      @"delimiter": [locale objectForKey:NSLocaleGroupingSeparator],
    });
  }
  @catch(NSException *exception){
    NSMutableDictionary * info = [NSMutableDictionary dictionary];
    [info setValue:exception.name forKey:@"ExceptionName"];
    [info setValue:exception.reason forKey:@"ExceptionReason"];
    [info setValue:exception.userInfo forKey:@"ExceptionUserInfo"];
    NSError *error = [[NSError alloc] initWithDomain:@"getLocalSetting Module" code:0 userInfo:info];
    reject(@"failed to execute",@"",error);
  }
}

@end
