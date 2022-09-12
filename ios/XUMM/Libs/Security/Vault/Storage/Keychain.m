//
//  Keychain.m
//  Keychain
//
//  Created by Joel Arvidsson on 2015-05-20.
//  Copyright (c) 2015 Joel Arvidsson. All rights reserved.
//

#import "keychain.h"

#import <Security/Security.h>
#import <React/RCTConvert.h>

@implementation Keychain

+ (BOOL)deleteItem:(NSString *)name error:(NSError **)error
{
  NSDictionary *query = @{
    (__bridge NSString *)kSecClass: (__bridge id)(kSecClassInternetPassword),
    (__bridge NSString *)kSecAttrServer: name,
    (__bridge NSString *)kSecReturnAttributes: (__bridge id)kCFBooleanTrue,
    (__bridge NSString *)kSecReturnData: (__bridge id)kCFBooleanFalse
  };
  
  OSStatus osStatus =  SecItemDelete((__bridge CFDictionaryRef) query);
  
  if (osStatus != noErr && osStatus != errSecItemNotFound) {
    *error = [NSError errorWithDomain:NSOSStatusErrorDomain code:osStatus userInfo:nil];
    return NO;
  }
  
  return YES;
}

+ (BOOL)setItem:(NSString *)name
        account:(NSString*)account
           data:(NSString*)data
          error:(NSError **)error
{
  NSDictionary *attributes =
  @{
    (id)kSecClass: (id)kSecClassInternetPassword,
    (id)kSecAttrServer: name,
    (id)kSecAttrAccount: account,
    (id)kSecValueData: [data dataUsingEncoding:NSUTF8StringEncoding],
    (id)kSecAttrAccessible: (id)kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
  };
  
  OSStatus osStatus = SecItemAdd((__bridge CFDictionaryRef) attributes, NULL);
  
  if (osStatus != noErr && osStatus != errSecItemNotFound) {
    *error = [NSError errorWithDomain:NSOSStatusErrorDomain code:osStatus userInfo:nil];
    return NO;
  }
  
  return YES;
}

+ (BOOL)itemExist:(NSString *)name
            error:(NSError **)error
{
  NSDictionary *query =
  @{
    (id)kSecClass: (id)kSecClassInternetPassword,
    (id)kSecAttrServer: name,
    (id)kSecMatchLimit: (id)kSecMatchLimitOne,
    (id)kSecUseAuthenticationUI:(id)kSecUseAuthenticationUIFail
  };
  
  OSStatus osStatus = SecItemCopyMatching((__bridge CFDictionaryRef) query, nil);
  
  switch (osStatus) {
    case noErr:
    case errSecInteractionNotAllowed:
      return YES;
    case errSecItemNotFound:
      return NO;
  }
  
  *error = [NSError errorWithDomain:NSOSStatusErrorDomain code:osStatus userInfo:nil];
  return NO;
}


+ (NSDictionary *)getItem:(NSString *)name
                error:(NSError **)error
{
  
  NSDictionary *query = @{
    (__bridge NSString *)kSecClass: (__bridge id)(kSecClassInternetPassword),
    (__bridge NSString *)kSecAttrServer: name,
    (__bridge NSString *)kSecReturnAttributes: (__bridge id)kCFBooleanTrue,
    (__bridge NSString *)kSecReturnData: (__bridge id)kCFBooleanTrue,
    (__bridge NSString *)kSecMatchLimit: (__bridge NSString *)kSecMatchLimitOne
  };
  
  
  // check item is exist before returning the data
  NSDictionary *item = nil;
  CFTypeRef itemTypeRef = NULL;
  OSStatus osStatus = SecItemCopyMatching((__bridge CFDictionaryRef) query, (CFTypeRef*)&itemTypeRef);
  
  if (osStatus != noErr && osStatus != errSecItemNotFound) {
    *error = [NSError errorWithDomain:NSOSStatusErrorDomain code:osStatus userInfo:nil];
    return nil;
  }
  
  item = (__bridge NSDictionary*)(itemTypeRef);
  if (!item) {
    return nil;
  }
  
  NSString *account = (NSString *) [item objectForKey:(__bridge id)(kSecAttrAccount)];
  NSString *data = [[NSString alloc] initWithData:[item objectForKey:(__bridge id)(kSecValueData)] encoding:NSUTF8StringEncoding];
  
  CFRelease(itemTypeRef);
  
  return @{
    @"name": name,
    @"account": account,
    @"data": data,
  };
}

@end
