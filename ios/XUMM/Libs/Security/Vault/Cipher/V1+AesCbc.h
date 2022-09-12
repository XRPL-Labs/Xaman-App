#import <Foundation/Foundation.h>
#import "Cipher.h"

@interface CipherV1AesCbc : NSObject
+ (NSNumber *)getCipherVersion;
+ (NSDictionary *) encrypt: (NSString *)data  key: (NSString *)key;
+ (NSString *) decrypt: (NSString *)cipher key: (NSString *)key derivedKeys: (struct DerivedKeys)derivedKeys;
@end
