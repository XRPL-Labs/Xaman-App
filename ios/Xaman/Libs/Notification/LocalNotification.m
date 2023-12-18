#import "LocalNotification.h"

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTUtils.h>

@import UserNotifications;

@implementation LocalNotificationModule


RCT_EXPORT_MODULE();

+(void)initialise {
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = [LocalNotificationModule sharedInstance];
  
  [LocalNotificationModule sharedInstance].completionHandlers = [[NSMutableDictionary alloc] init];
}


RCT_EXPORT_METHOD(complete:(NSString*)handlerKey show:(BOOL*)show) {
  if (handlerKey != nil) {
    void(^completionHandler)(UNNotificationPresentationOptions) = [LocalNotificationModule sharedInstance].completionHandlers[handlerKey] ;
    if (completionHandler != nil) {
      [LocalNotificationModule sharedInstance].completionHandlers[handlerKey] = nil;
      
      if(show){
        completionHandler(UNNotificationPresentationOptionAlert + UNNotificationPresentationOptionSound);
      }else{
        completionHandler(UNNotificationPresentationOptionNone);
      }
    }
    
  }
}

RCT_EXPORT_METHOD(getBadge:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  resolve(@(RCTSharedApplication().applicationIconBadgeNumber));
}

RCT_EXPORT_METHOD(setBadge:(NSInteger)number
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  RCTSharedApplication().applicationIconBadgeNumber = number;
  resolve(@YES);
}

//Called when a notification is delivered to a foreground app.
-(void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  if (notification.request.content.userInfo) {
    NSDictionary *parsedUserInfo = [self parseUserInfo:notification.request.content.userInfo];
    NSString *handlerKey = parsedUserInfo[@"notificationId"];
        
    if (handlerKey != nil) {
      [LocalNotificationModule sharedInstance].completionHandlers[handlerKey] = completionHandler;
    }
  }else{
    completionHandler(UNNotificationPresentationOptionNone);
  }
}

- (NSDictionary*)parseUserInfo:(NSDictionary *)userInfo {
  
  NSMutableDictionary *notification = [[NSMutableDictionary alloc] init];
  NSMutableDictionary *data = [[NSMutableDictionary alloc] init];
  NSMutableDictionary *ios = [[NSMutableDictionary alloc] init];
  
  for (id k1 in userInfo) {
    if ([k1 isEqualToString:@"aps"]) {
      NSDictionary *aps = userInfo[k1];
      for (id k2 in aps) {
        if ([k2 isEqualToString:@"alert"]) {
          // alert can be a plain text string rather than a dictionary
          if ([aps[k2] isKindOfClass:[NSDictionary class]]) {
            NSDictionary *alert = aps[k2];
            for (id k3 in alert) {
              if ([k3 isEqualToString:@"body"]) {
                notification[@"body"] = alert[k3];
              } else if ([k3 isEqualToString:@"subtitle"]) {
                notification[@"subtitle"] = alert[k3];
              } else if ([k3 isEqualToString:@"title"]) {
                notification[@"title"] = alert[k3];
              } else if ([k3 isEqualToString:@"loc-args"]
                         || [k3 isEqualToString:@"loc-key"]
                         || [k3 isEqualToString:@"title-loc-args"]
                         || [k3 isEqualToString:@"title-loc-key"]) {
                // Ignore known keys
              } else {
                NSLog(@"Unknown alert key: %@", k2);
              }
            }
          } else {
            notification[@"title"] = aps[k2];
          }
        } else if ([k2 isEqualToString:@"badge"]) {
          ios[@"badge"] = aps[k2];
        } else if ([k2 isEqualToString:@"category"]) {
          ios[@"category"] = aps[k2];
        } else if ([k2 isEqualToString:@"sound"]) {
          notification[@"sound"] = aps[k2];
        } else {
          NSLog(@"Unknown aps key: %@", k2);
        }
      }
    } else if ([k1 isEqualToString:@"gcm.message_id"]) {
      notification[@"notificationId"] = userInfo[k1];
    } else if ([k1 isEqualToString:@"gcm.n.e"]
               || [k1 isEqualToString:@"gcm.notification.sound2"]
               || [k1 isEqualToString:@"google.c.a.c_id"]
               || [k1 isEqualToString:@"google.c.a.c_l"]
               || [k1 isEqualToString:@"google.c.a.e"]
               || [k1 isEqualToString:@"google.c.a.udt"]
               || [k1 isEqualToString:@"google.c.a.ts"]) {
      // Ignore known keys
    } else {
      // Assume custom data
      data[k1] = userInfo[k1];
    }
  }
  
  notification[@"data"] = data;
  notification[@"ios"] = ios;
  
  return notification;
}

# pragma mark - instance

+ (instancetype) sharedInstance {
  static LocalNotificationModule *instance = nil;
  static dispatch_once_t onceToken = 0;
  dispatch_once(&onceToken,^{
    if (instance == nil) {
      instance = [[LocalNotificationModule alloc] init];
    }
  });
  
  return instance;
}


- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

@end
