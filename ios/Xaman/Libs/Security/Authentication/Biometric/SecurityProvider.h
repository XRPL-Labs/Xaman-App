#import <Foundation/Foundation.h>

#include <Security/Security.h>
#import <LocalAuthentication/LocalAuthentication.h>

extern NSString *const ENCRYPTION_ERROR_CANCELLED;
extern NSString *const ENCRYPTION_ERROR_FAILED;
extern NSString *const ENCRYPTION_SUCCESS;


@interface SecurityProvider : NSObject
+ (bool)isKeyReady;
+ (void)generateKey;
+ (void)deleteInvalidKey;
+ (NSString *)signRandomBytes: (LAContext *)authentication_context;
@end
