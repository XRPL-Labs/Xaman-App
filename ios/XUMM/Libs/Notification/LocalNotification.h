#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTBridge.h>

@import UserNotifications;

@interface LocalNotificationModule : NSObject <RCTBridgeModule>
+ (void)initialise;
@property(nonatomic) NSMutableDictionary<NSString *, void(^)(UNNotificationPresentationOptions)> *completionHandlers;
@end
