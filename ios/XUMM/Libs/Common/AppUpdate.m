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
      NSString *currentVersion = infoDictionary[@"CFBundleShortVersionString"];
      
      if(appStoreVersion != nil){
        NSInteger appStoreVersionNum = [appStoreVersion stringByReplacingOccurrencesOfString:@"." withString:@""].integerValue;
        NSInteger currentVersionNum = [currentVersion stringByReplacingOccurrencesOfString:@"." withString:@""].integerValue;
        
        // need the update resolve the need version number
        if (appStoreVersionNum > currentVersionNum){
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
