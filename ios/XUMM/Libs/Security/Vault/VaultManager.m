//
//  VaultManager.m
//  VaultManager
//
// Created by XRPL-Labs on 01/09/2022.
//
#import "VaultManager.h"

#import <React/RCTConvert.h>
#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

#import "Storage/Keychain.h"
#import "Cipher/Cipher.h"

#import "XUMM-Swift.h"

@implementation VaultManagerModule

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_queue_create("VaultManager.Queue", DISPATCH_QUEUE_SERIAL);
}


#pragma mark - VaultManager

NSError *errorFromException(NSException *exception)
{
    return [NSError errorWithDomain:@"VaultManagerModule" code:0 userInfo:
            @{
              NSLocalizedDescriptionKey: exception.name,
              NSLocalizedFailureReasonErrorKey: exception.reason ?: @"",
              }];
}


/*
 Create a new encrypted vault with given name/data and encrypt with provided key
 NOTE: existing vault cannot be overwritten
*/
+ (BOOL) createVault: (NSString *)vaultName
                  data:(NSString *)data
                  key:(NSString *)key
{
  // check if the vault already exist, we don't want to overwrite the existing vault
  // get the item from storage
  NSError *error;
  BOOL exist = [Keychain itemExist:vaultName error:&error];
  
  // error while fetching item from storage
  if(error != nil) @throw error;
  
  // vault already exist, just reject
  if(exist){
    @throw [NSError errorWithDomain:@"VAULT_ALREADY_EXIST" code:-1 userInfo:@{
      NSLocalizedDescriptionKey:@"Vault already exist, cannot overwrite current vault!"
    }];
  }
  
  // try to encrypt the data with provided key
  NSDictionary *cipherResult = [Cipher encrypt:data key:key error:&error];

  // error while encrypting the data
  if(error != nil) @throw error;
  
  // turn derived key dict to data so we can turn to string
  NSData *derivedKeyData = [NSJSONSerialization  dataWithJSONObject:[cipherResult objectForKey:@"derived_keys"] options:0 error:&error];
  
  // unexpected error happened during serialization error
  if(error != nil) @throw error;
  
  // convert dict derived keys to string
  NSString *derivedKeyString = [[NSString alloc] initWithData:derivedKeyData encoding:NSUTF8StringEncoding];
  
  // store vault in the keychain
  BOOL result = [Keychain setItem:vaultName account:derivedKeyString data:[cipherResult objectForKey:@"cipher"] error:&error];

  // error while storing the data in the keychain
  if(error != nil) @throw error;
  
  return result;
}

/*
 Open the encrypted vault with provided key and return the clear data
*/
+ (NSString *) openVault: (NSString *)vaultName key:(NSString *)key
{
  // get the item from storage
  NSError *error;
  NSDictionary *item = [Keychain getItem:vaultName error:&error];
  
  // unable to get item from keychain for some reason
  if(error != nil) @throw error;
  
  // no item found in the storage for the given name
  if(!item){
    @throw [NSError errorWithDomain:@"VAULT_NOT_EXIST" code:-1 userInfo:@{
      NSLocalizedDescriptionKey:@"Unable to find the vault in the storage!"
    }];
  }
  
  // try to decrypt the data
  NSString *clearText = [Cipher decrypt:item[@"data"] key:key derivedKeysString:item[@"account"] error:&error];
  
  // some error while decryption the cipher
  if(error != nil) @throw error;
  
  return clearText;
}


/*
 Check vault is already exist with given name
*/
+ (BOOL) vaultExist: (NSString *)vaultName
{
  // check item exist in the keychain
  NSError *error;
  BOOL result = [Keychain itemExist:vaultName error:&error];
  
  // error while fetching item from storage
  if(error != nil) @throw error;
  
  return result;
}

/*
 Purge a vault with given name
 NOTE: this action cannot be undo and is permanent
*/
+ (BOOL) purgeVault: (NSString *)vaultName
{
  // try to remove the vault in the keychain
  NSError *error;
  BOOL result = [Keychain deleteItem:vaultName error:&error];
    
  // unexpected error happened
  if(error != nil) @throw error;
  
  return result;
}

/*
  Purge ALL vaults in the keychain
  NOTE: this action cannot be undo and is permanent, used with caution
*/
+ (void) purgeAll
{
  // clear the entire keychain
  [Keychain clear];
}


/*
 Check a vault is encrypted with the latest Cipher or it needs a migrations
*/
+ (NSDictionary *) isMigrationRequired: (NSString *)vaultName
{
  // get the item from storage
  NSError *error;
  NSDictionary *item = [Keychain getItem:vaultName error:&error];
  
  // unexpected error while retrieving the vault
  if(error != nil) @throw error;
  
  // try to deserialize derived keys
  struct DerivedKeys derivedKeys = [Cipher getDerivedKeys:item[@"account"]];
  
  // unable to initiate the derived keys
  if(derivedKeys.version == nil){
    @throw [NSError errorWithDomain:@"ERROR_GET_DERVIDED_KEYS" code:-1 userInfo:@{
      NSLocalizedDescriptionKey:@"Unable to parse derived keys!"
    }];
  }
  
  NSNumber *latestCipherVersion = [Cipher getLatestCipherVersion];
  NSNumber *currentCipherVersion = derivedKeys.version;
  
  BOOL isMigrationRequired = [latestCipherVersion compare:currentCipherVersion] == NSOrderedDescending;
  
  return @{
    @"vault": vaultName,
    @"current_cipher_version": currentCipherVersion,
    @"latest_cipher_version": latestCipherVersion,
    @"migration_required":  @(isMigrationRequired)
  };
}

/*
 Get the storage encryption key from keychain
 NOTE: this method will generate new key and store it in case of missing key
*/
+ (NSString *) getStorageEncryptionKey:(NSString *)keyName
{
  // try to retrieve the key
  NSError *error;
  NSDictionary *item = [Keychain getItem:keyName error:&error];
    
  
  // unexpected error while fetching the key
  if(error != nil) @throw error;
  
  // key already exist in the keychain
  if(item != nil){
    return item[@"data"];
  }
  
  // key not exist
  // if no key found in the keychain try to generate one and store in the keychain
  NSData *encryptionKeyData = [Crypto RandomBytesWithLength:64 error:&error];
  
  // error while generating random key
  if(error != nil) @throw error;
  
  // convert encryption key to hex
  NSString  *encryptionKey = [Crypto DataToHexWithData:encryptionKeyData];
  
  // store new encryption key in the keychain
  BOOL result = [Keychain setItem:keyName account:@"" data:encryptionKey error:&error];
  
  // error while storing new encryption key
  if(error != nil) @throw error;
  
  // return new encryption key
  return encryptionKey;
}

#pragma mark - JS interface

RCT_EXPORT_METHOD(createVault:(NSString *)vaultName
                  data:(NSString *)data
                  key:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    BOOL result = [VaultManagerModule createVault:vaultName data:data key:key];
    resolve(@(result));
  }
  @catch (NSException *exception) {
    reject(@"create_vault_failed", @"Failed to create vault", errorFromException(exception));
  }
}


RCT_EXPORT_METHOD(openVault:(NSString *)vaultName
                  key:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    NSString *clearText = [VaultManagerModule openVault:vaultName key:key];
    resolve(clearText);
  }
  @catch (NSException *exception) {
    reject(@"open_vault_failed", @"Failed to open vault", errorFromException(exception));
  }
}

RCT_EXPORT_METHOD(vaultExist:(NSString *)vaultName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    BOOL result = [VaultManagerModule vaultExist:vaultName];
    resolve(@(result));
  }
  @catch (NSException *exception) {
    reject(@"vault_exist_failed", @"Failed to check vault exist", errorFromException(exception));
  }
}

RCT_EXPORT_METHOD(purgeVault:(NSString *)vaultName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    BOOL result = [VaultManagerModule purgeVault:vaultName];
    resolve(@(result));
  }
  @catch (NSException *exception) {
    reject(@"purge_vault_failed", @"Failed to purge vault", errorFromException(exception));
  }
}

RCT_EXPORT_METHOD(purgeAll:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    [VaultManagerModule purgeAll];
    resolve(@(YES));
  }
  @catch (NSException *exception) {
    reject(@"purge_vault_failed", @"Failed to purge vault", errorFromException(exception));
  }
}

RCT_EXPORT_METHOD(isMigrationRequired:(NSString *)vaultName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    NSDictionary *result = [VaultManagerModule isMigrationRequired:vaultName];
    resolve(result);
  }
  @catch (NSException *exception) {
    reject(@"is_migration_required_failed", @"Failed to check for the vault migraiton status", errorFromException(exception));
  }
}

RCT_EXPORT_METHOD(getStorageEncryptionKey:(NSString *)keyName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    NSString *result = [VaultManagerModule getStorageEncryptionKey:keyName];
    resolve(result);
  }
  @catch (NSException *exception) {
    reject(@"get_storage_encryption_key_failed", @"Failed to fetch/generate storage encryption key", errorFromException(exception));
  }
}


@end
