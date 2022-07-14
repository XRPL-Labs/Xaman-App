#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>

@interface UniqueIdProviderModule : NSObject <RCTBridgeModule>
@property(nonatomic, strong, readonly) NSString *unique_uuid;
@end
