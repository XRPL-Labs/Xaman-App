#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>

@interface UniqueIdProviderModule : NSObject <RCTBridgeModule>
+ (NSString *)getDeviceUniqueId;
@property(nonatomic, strong, readonly) NSString *unique_uuid;
@end
