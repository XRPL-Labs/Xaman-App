#import <Foundation/Foundation.h>

@interface Keychain : NSObject
+ (NSDictionary *)getItem:(NSString *)name error:(NSError **)error;
+ (BOOL)deleteItem:(NSString *)name error:(NSError **)error;
+ (BOOL)setItem:(NSString *)name account:(NSString *)account data:(NSString *)data error:(NSError **)error;
+ (BOOL)itemExist:(NSString *)name error:(NSError **)error;
@end
