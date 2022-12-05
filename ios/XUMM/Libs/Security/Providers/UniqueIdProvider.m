// Initial work from:
// https://gist.github.com/miguelcma/e8f291e54b025815ca46

#import "UniqueIdProvider.h"

@import UIKit;

@implementation UniqueIdProviderModule

NSString * const UNIQUE_UUID_KEY = @"deviceUID";

#pragma mark - Public methods

RCT_EXPORT_MODULE();

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getDeviceUniqueId) {
  return [self getUniqueId];
}


+ (NSString *)getDeviceUniqueId {
  return [[UniqueIdProviderModule sharedInstance] getUniqueId];
}

+ (UniqueIdProviderModule *)sharedInstance {
    static UniqueIdProviderModule* instance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[UniqueIdProviderModule alloc] init];
    });
    return instance;
}

#pragma mark - Instance methods

- (id)init:(NSString *)key {
  self = [super init];
  if (self) {
    _unique_uuid = nil;
  }
  return self;
}

/*! Returns the Device UID.
 The UID is obtained in a chain of fallbacks:
 - Keychain
 - NSUserDefaults
 - Apple IFV (Identifier for Vendor)
 - Generate a random UUID if everything else is unavailable
 At last, the UID is persisted if needed to.
 */
- (NSString *)getUniqueId {
  if (!_unique_uuid) _unique_uuid = [self valueForKeychainKey:UNIQUE_UUID_KEY service:UNIQUE_UUID_KEY];
  if (!_unique_uuid) _unique_uuid = [self valueForUserDefaultsKey:UNIQUE_UUID_KEY];
  if (!_unique_uuid) _unique_uuid = [self appleIFV];
  if (!_unique_uuid) _unique_uuid = [self randomUUID];
  
  /*! Persist UUID to NSUserDefaults and Keychain, if not yet saved
   */
  if(_unique_uuid){
    if (![self valueForUserDefaultsKey:UNIQUE_UUID_KEY]) {
      [self setValue:_unique_uuid forUserDefaultsKey:UNIQUE_UUID_KEY];
    }
    if (![self valueForKeychainKey:UNIQUE_UUID_KEY service:UNIQUE_UUID_KEY]) {
      [self setValue:_unique_uuid forKeychainKey:UNIQUE_UUID_KEY inService:UNIQUE_UUID_KEY];
    }
  }
  
  return _unique_uuid;
}

#pragma mark - Keychain methods

/*! Create as generic NSDictionary to be used to query and update Keychain items.
 *  param1
 *  param2
 */
+ (NSMutableDictionary *)keychainItemForKey:(NSString *)key service:(NSString *)service {
  NSMutableDictionary *keychainItem = [[NSMutableDictionary alloc] init];
  keychainItem[(__bridge id)kSecClass] = (__bridge id)kSecClassGenericPassword;
  keychainItem[(__bridge id)kSecAttrAccessible] = (__bridge id)kSecAttrAccessibleAfterFirstUnlock;
  keychainItem[(__bridge id)kSecAttrAccount] = key;
  keychainItem[(__bridge id)kSecAttrService] = service;
  return keychainItem;
}

/*! Sets
 *  param1
 *  param2
 */
- (OSStatus)setValue:(NSString *)value forKeychainKey:(NSString *)key inService:(NSString *)service {
  NSMutableDictionary *keychainItem = [[self class] keychainItemForKey:key service:service];
  keychainItem[(__bridge id)kSecValueData] = [value dataUsingEncoding:NSUTF8StringEncoding];
  OSStatus status = SecItemAdd((__bridge CFDictionaryRef)keychainItem, NULL);
  
  if (status == errSecDuplicateItem) {
    [self deleteValue:key inService:service];
    status =  SecItemAdd((__bridge CFDictionaryRef)keychainItem, NULL);
  }
  return  status;
}

/*! Updates
 *  param1
 *  param2
 */
- (OSStatus)updateValue:(NSString *)value forKeychainKey:(NSString *)key inService:(NSString *)service {
  NSDictionary *query = [NSDictionary dictionaryWithObjectsAndKeys:
                         (__bridge id)kSecClassGenericPassword, kSecClass,
                         key, kSecAttrAccount,
                         service, kSecAttrService,
                         nil];
  
  NSDictionary *attributesToUpdate = [NSDictionary dictionaryWithObjectsAndKeys:
                                      [value dataUsingEncoding:NSUTF8StringEncoding], kSecValueData,
                                      nil];
  
  return SecItemUpdate((__bridge CFDictionaryRef)query, (__bridge CFDictionaryRef)attributesToUpdate);
}

- (OSStatus)deleteValue:(NSString *)key inService:(NSString *)service {
  NSDictionary *query = [NSDictionary dictionaryWithObjectsAndKeys:
                         (__bridge id)kSecClassGenericPassword, kSecClass,
                         key, kSecAttrAccount,
                         service, kSecAttrService,
                         nil];
  
  OSStatus status= SecItemDelete((__bridge CFDictionaryRef)query);
  return  status;
  
}


- (NSString *)valueForKeychainKey:(NSString *)key service:(NSString *)service {
  OSStatus status;
  NSMutableDictionary *keychainItem = [[self class] keychainItemForKey:key service:service];
  keychainItem[(__bridge id)kSecReturnData] = (__bridge id)kCFBooleanTrue;
  keychainItem[(__bridge id)kSecReturnAttributes] = (__bridge id)kCFBooleanTrue;
  CFDictionaryRef result = nil;
  status = SecItemCopyMatching((__bridge CFDictionaryRef)keychainItem, (CFTypeRef *)&result);
  if (status != noErr) {
    return nil;
  }
  NSDictionary *resultDict = (__bridge_transfer NSDictionary *)result;
  NSData *data = resultDict[(__bridge id)kSecValueData];
  if (!data) {
    return nil;
  }
  return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
}

#pragma mark - NSUserDefaults methods

- (BOOL)setValue:(NSString *)value forUserDefaultsKey:(NSString *)key {
  [[NSUserDefaults standardUserDefaults] setObject:value forKey:key];
  return [[NSUserDefaults standardUserDefaults] synchronize];
}

- (NSString *)valueForUserDefaultsKey:(NSString *)key {
  return [[NSUserDefaults standardUserDefaults] objectForKey:key];
}

#pragma mark - UID Generation methods

- (NSString *)appleIFV {
  if(NSClassFromString(@"UIDevice") && [UIDevice instancesRespondToSelector:@selector(identifierForVendor)]) {
    // only available in iOS >= 6.0
    return [[UIDevice currentDevice].identifierForVendor UUIDString];
  }
  return nil;
}

- (NSString *)randomUUID {
  if(NSClassFromString(@"NSUUID")) {
    return [[NSUUID UUID] UUIDString];
  }
  CFUUIDRef uuidRef = CFUUIDCreate(kCFAllocatorDefault);
  CFStringRef cfuuid = CFUUIDCreateString(kCFAllocatorDefault, uuidRef);
  CFRelease(uuidRef);
  NSString *uuid = [((__bridge NSString *) cfuuid) copy];
  CFRelease(cfuuid);
  return uuid;
}

@end
