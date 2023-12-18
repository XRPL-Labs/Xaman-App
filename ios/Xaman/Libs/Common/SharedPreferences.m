#import "SharedPreferences.h"

@implementation SharedPreferencesModule


static NSString * const SuiteName = @"xumm";


RCT_EXPORT_MODULE();


RCT_EXPORT_METHOD(set:(NSString *)key value:(NSString *)value
            resolver:(RCTPromiseResolveBlock)resolve
            rejecter:(RCTPromiseRejectBlock)reject) {
  NSUserDefaults *userDefaults = [[NSUserDefaults alloc] initWithSuiteName:SuiteName];
  [userDefaults setObject:value forKey:key];
  resolve(@YES);
}

RCT_EXPORT_METHOD(get:(NSString *)key
         resolver:(RCTPromiseResolveBlock)resolve
         rejecter:(RCTPromiseRejectBlock)reject) {
  NSUserDefaults *userDefaults = [[NSUserDefaults alloc] initWithSuiteName:SuiteName];
  NSString *result = [userDefaults stringForKey:key];
  if (result) {
    resolve(result);
  } else {
    resolve([NSNull null]);
  }
}

RCT_EXPORT_METHOD(del:(NSString *)key
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject) {
  NSUserDefaults *userDefaults = [[NSUserDefaults alloc] initWithSuiteName:SuiteName];
  [userDefaults removeObjectForKey:key];
  resolve(@YES);
}

@end
