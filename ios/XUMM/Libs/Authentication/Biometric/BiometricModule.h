#import <React/RCTBridgeModule.h>
#import <LocalAuthentication/LocalAuthentication.h>

@interface BiometricModule : NSObject <RCTBridgeModule>
  + (void)initialise;
@end
