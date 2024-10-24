#import "AppUpdate.h"

@implementation AppUpdateModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(checkUpdate: (RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject){
  @try {
    NSDictionary* infoDictionary = [[NSBundle mainBundle] infoDictionary];
    NSString* appID = infoDictionary[@"CFBundleIdentifier"];
    NSURL* url = [NSURL URLWithString:[NSString stringWithFormat:@"https://itunes.apple.com/lookup?bundleId=%@", appID]];
    NSData* data = [NSData dataWithContentsOfURL:url];
    
    if( data == nil){
      return resolve(@NO);
    }
    
    NSDictionary* lookup = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
    
    if ([lookup[@"resultCount"] integerValue] == 1){
      NSString *appStoreVersion = [[lookup objectForKey:@"results"][0] objectForKey:@"version"];
      NSString *minimumSupportedOSVersion = [[lookup objectForKey:@"results"][0] objectForKey:@"minimumOsVersion"];
      NSString *currentVersion = infoDictionary[@"CFBundleShortVersionString"];
      
      if(appStoreVersion != nil && minimumSupportedOSVersion != nil){
        NSString *systemVersion = [UIDevice currentDevice].systemVersion;
        
        // check if minimum OS version is supported in this device
        BOOL osVersionSupported = ([systemVersion compare:minimumSupportedOSVersion options:NSNumericSearch] != NSOrderedAscending);
        if (!osVersionSupported)
        {
          return resolve(@NO);
        }
        
        // if update available resolve the new version
        BOOL isUpdateAvailable = [appStoreVersion compare:currentVersion options:NSNumericSearch] == NSOrderedDescending;
        if (isUpdateAvailable){
          // new update is available
          return resolve(appStoreVersion);
        }
      }
    }
    
    return resolve(@NO);
  }
  @catch (NSException *exception) {
    return resolve(@NO);
  }
}

@end
