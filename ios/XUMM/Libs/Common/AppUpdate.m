#import "AppUpdate.h"

@implementation AppUpdateModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(checkUpdate: (RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject){
  NSDictionary* infoDictionary = [[NSBundle mainBundle] infoDictionary];
  NSString* appID = infoDictionary[@"CFBundleIdentifier"];
  NSURL* url = [NSURL URLWithString:[NSString stringWithFormat:@"http://itunes.apple.com/lookup?bundleId=%@", appID]];
  NSData* data = [NSData dataWithContentsOfURL:url];
  NSDictionary* lookup = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
  
  if ([lookup[@"resultCount"] integerValue] == 1){
    NSString* appStoreVersion = lookup[@"results"][0][@"version"];
    NSString* currentVersion = infoDictionary[@"CFBundleShortVersionString"];
    if ([appStoreVersion intValue] > [currentVersion intValue]){
      NSLog(@"Need to update [%@ != %@]", appStoreVersion, currentVersion);
      return resolve(appStoreVersion);
    }
  }
  
  return resolve(@NO);
  
}

@end
