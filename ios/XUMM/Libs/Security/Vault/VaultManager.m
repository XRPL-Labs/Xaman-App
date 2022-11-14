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

#define RECOVERY_SUFFIX @"_RECOVER"

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

void rejectWithError(RCTPromiseRejectBlock reject, NSError *error)
{
  return reject([NSString stringWithFormat:@"%li", (long)error.code], error.localizedDescription, nil);
}


NSString *getRecoveryVaultName(NSString *vaultName)
{
  return  [NSString stringWithFormat:@"%@%@", vaultName, RECOVERY_SUFFIX];
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
  
  
  // try to open the vault once before passing the result
  // with this we make sure we are able to access the data
  NSString *clearText = [VaultManagerModule openVault:vaultName key:key recoverable:NO];
  
  // check if open vault result is equal to stored data
  if(![clearText isEqualToString:data]){
    @throw [NSError errorWithDomain:@"UNABLE_TO_VERIFY_RESULT" code:-1 userInfo:@{
      NSLocalizedDescriptionKey:@"Unable to sanity check the created vault"
    }];
  }
  
  
  return result;
}

/*
 Open the encrypted vault with provided key and return the clear data
 */
+ (NSString *) openVault: (NSString *)vaultName key:(NSString *)key recoverable:(BOOL)recoverable
{
  NSError *error;
  // an indicator that vault is recovered
  BOOL isVaultRecovered = NO;
  NSString *recoveryVaultName = getRecoveryVaultName(vaultName);
  
  // try to get vault with provided  name
  NSDictionary *item = [Keychain getItem:vaultName error:&error];
  
  // unable to get item from keychain for some reason
  if(error != nil) @throw error;
  
  // if no item found and recoverable, check if recovery vault available
  if(!item && recoverable){
    // try to fetch recovery vault
    item = [Keychain getItem:recoveryVaultName error:&error];
    
    if(error != nil) @throw error;
    
    // we were able to fetch from recovery vault
    if(item != nil){
      isVaultRecovered = YES;
    }
  }
  
  // no item found in the storage for the given name
  if(!item || !item[@"data"] || !item[@"account"]){
    @throw [NSError errorWithDomain:@"VAULT_NOT_EXIST" code:-1 userInfo:@{
      NSLocalizedDescriptionKey:@"Vault is not exist in storage or unable to fetch!"
    }];
  }
  
  // try to decrypt the data
  NSString *clearText = [Cipher decrypt:item[@"data"] key:key derivedKeysString:item[@"account"] error:&error];
  
  // some error while decryption the cipher
  if(error != nil) @throw error;
  
  
  if(clearText == nil || [clearText isKindOfClass:[NSNull class]] || clearText.length==0) {
    @throw [NSError errorWithDomain:@"VAULT_DATA_IS_NIL" code:-1 userInfo:@{
      NSLocalizedDescriptionKey:@"Vault data is nil or empty"
    }];
  }
  
  // check if vault is recovered, then try to create the vault under the old name and remove recovery
  if(isVaultRecovered){
    @try {
      // create the vault under the given name
      [VaultManagerModule createVault:vaultName data:clearText key:key];
      // purge recovery vault
      [VaultManagerModule purgeVault:recoveryVaultName];
    } @catch (NSError *error) {
      // ignore in case of any error
    }
  }
  
  return clearText;
}


/*
 Re-key current vault with new key
 NOTE: in case of migration required this will create new vault with latest cipher
 */
+ (BOOL) reKeyVault: (NSString *)vaultName oldKey:(NSString *)oldKey newKey:(NSString *)newKey
{
  // try to open the vault with provided old key and get clear text
  NSString *cleartext = [VaultManagerModule openVault:vaultName key:oldKey recoverable:NO];
  
  // try to create the new vault under a temp recovery name with the old key
  // with this we will make sure we are able to recover the key in case of failure
  NSString *recoveryVaultName = getRecoveryVaultName(vaultName);
  // check if a recovery vault is already exist, then remove it
  // NOTE: removing recovery vault is safe as we could open the main vault
  if([VaultManagerModule vaultExist:recoveryVaultName]){
    [VaultManagerModule purgeVault:recoveryVaultName];
  }
  
  // create the recovery vault with the old key
  [VaultManagerModule createVault:recoveryVaultName data:cleartext key:oldKey];
  
  // after we made sure we can store the data in a safe way, purge old vault
  [VaultManagerModule purgeVault:vaultName];
  
  // create the vault again with the new key
  [VaultManagerModule createVault:vaultName data:cleartext key:newKey];
  
  // finally remove the created recovery vault
  [VaultManagerModule purgeVault:recoveryVaultName];
  
  return YES;
}


/*
 Re-key batch vaults with new key
 NOTE: in case of migration required this will create new vault with latest cipher
 */
+ (BOOL) reKeyBatchVaults: (NSArray *)vaultNames oldKey:(NSString *)oldKey newKey:(NSString *)newKey
{
  NSMutableDictionary *vaultsClearText = [[NSMutableDictionary alloc] init];
  
  // try to open all vaults with provided old key and get clear text
  for (NSString * vaultName in vaultNames){
    NSString *cleartext = [VaultManagerModule openVault:vaultName key:oldKey recoverable:NO];
    [vaultsClearText setObject:cleartext forKey:vaultName];
  }
  
  // try to create the new vault under a temp recovery name with the old key for all vaults
  // with this we will make sure we are able to recover the key in case of failure
  for (NSString * vaultName in vaultNames){
    // check if a recovery vault is already exist, then remove it
    // NOTE: removing recovery vault is safe as we could open the main vault
    if([VaultManagerModule vaultExist:getRecoveryVaultName(vaultName)]){
      [VaultManagerModule purgeVault:getRecoveryVaultName(vaultName)];
    }
    [VaultManagerModule createVault:getRecoveryVaultName(vaultName) data:[vaultsClearText objectForKey:vaultName] key:oldKey];
  }
  
  // remove old vault and create one
  for (NSString * vaultName in vaultNames){
    // after we made sure we can store the data in a safe way, purge old vault
    [VaultManagerModule purgeVault:vaultName];
    // create the vault again with the new key
    [VaultManagerModule createVault:vaultName data:[vaultsClearText objectForKey:vaultName] key:newKey];
  }
  
  // finally remove the created recovery vaults
  for (NSString * vaultName in vaultNames){
    [VaultManagerModule purgeVault:getRecoveryVaultName(vaultName)];
  }
  
  return YES;
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
  [Keychain setItem:keyName account:@"" data:encryptionKey error:&error];
  
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
  
  @catch (NSError *error) {
    reject(@"create_vault_failed", @"Failed to create vault", error);
  }
}


RCT_EXPORT_METHOD(openVault:(NSString *)vaultName
                  key:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    NSString *clearText = [VaultManagerModule openVault:vaultName key:key recoverable:YES];
    resolve(clearText);
  }@catch (NSError *error) {
    rejectWithError(reject, error);
  }
  
}

RCT_EXPORT_METHOD(reKeyVault:(NSString *)vaultName
                  oldKey:(NSString *)oldKey
                  newKey:(NSString *)newKey
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    BOOL result = [VaultManagerModule reKeyVault:vaultName oldKey:oldKey newKey:newKey];
    resolve(@(result));
  }
  @catch (NSError *error) {
    rejectWithError(reject, error);
  }
}


RCT_EXPORT_METHOD(reKeyBatchVaults:(NSArray *)vaultNames
                  oldKey:(NSString *)oldKey
                  newKey:(NSString *)newKey
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    BOOL result = [VaultManagerModule reKeyBatchVaults:vaultNames oldKey:oldKey newKey:newKey];
    resolve(@(result));
  }
  @catch (NSError *error) {
    rejectWithError(reject, error);
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
  @catch (NSError *error) {
    rejectWithError(reject, error);
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
  @catch (NSError *error) {
    rejectWithError(reject, error);
  }
}

RCT_EXPORT_METHOD(purgeAll:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    [VaultManagerModule purgeAll];
    resolve(@(YES));
  }
  @catch (NSError *error) {
    rejectWithError(reject, error);
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
  @catch (NSError *error) {
    rejectWithError(reject, error);
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
  @catch (NSError *error) {
    rejectWithError(reject, error);
  }
}


@end
