#import "Dimension.h"

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@implementation DimensionModule

RCT_EXPORT_MODULE();

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"layoutInsets": [self getLayoutInsets]
  };
}

- (NSDictionary *) getLayoutInsets
{
  return @{
    @"top": @(UIApplication.sharedApplication.keyWindow.safeAreaInsets.top),
    @"bottom": @(UIApplication.sharedApplication.keyWindow.safeAreaInsets.bottom)
  } ;
}

RCT_EXPORT_METHOD(getLayoutInsets: (RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  return resolve(@[self.getLayoutInsets]);
}

@end
