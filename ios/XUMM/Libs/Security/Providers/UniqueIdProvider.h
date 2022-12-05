#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>

@interface UniqueIdProviderModule : NSObject <RCTBridgeModule>
extern NSString * const UNIQUE_UUID_KEY;
+ (NSString *)getDeviceUniqueId;
@property(nonatomic, strong, readonly) NSString *unique_uuid;
@end
