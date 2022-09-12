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

NSString *codeForError(NSError *error)
{
  return [NSString stringWithFormat:@"%li", (long)error.code];
}

void rejectWithError(RCTPromiseRejectBlock reject, NSError *error)
{
  return reject(codeForError(error), error.localizedDescription, nil);
}

#pragma mark - VaultManager

RCT_EXPORT_METHOD(createVault:(NSString *)vaultName
                  data:(NSString *)data
                  key:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  
  
  
  NSError *errorw;
  BOOL result2 = [Keychain deleteItem:vaultName error:&errorw];
  
  // check if the vault already exist, we don't want to overwrite the existing vault
  // get the item from storage
  NSError *error;
  BOOL exist = [Keychain itemExist:vaultName error:&error];
  
  // error while fetching item from storage
  if(error != nil){
    return rejectWithError(reject, error);
  }
  
  if(exist){
    NSError *error = [NSError errorWithDomain:@"VAULT_ALREADY_EXIST" code:-1 userInfo:@{
      NSLocalizedDescriptionKey:@"Vault already exist, cannot overwrite current vault!"
    }];
    return rejectWithError(reject, error);
  }
  
  // try to encrypt the data with provied key
  NSDictionary *cipherResult = [Cipher encrypt:data key:key error:&error];

  // error while encrypting the data
  if(error != nil){
    return rejectWithError(reject, error);
  }
  
  // turn derived key dict to data so we can turn to string
  NSData *derivedKeyData = [NSJSONSerialization  dataWithJSONObject:[cipherResult objectForKey:@"derived_keys"] options:0 error:&error];
  
  // unexpected error happened during serialization error
  if(error != nil){
    return rejectWithError(reject, error);
  }
  
  // convert dict derived keys to string
  NSString *derivedKeyString = [[NSString alloc] initWithData:derivedKeyData encoding:NSUTF8StringEncoding];
  
  // store vault in the keychain
  BOOL result = [Keychain setItem:vaultName account:derivedKeyString data:[cipherResult objectForKey:@"cipher"] error:&error];

  // error while storing the data in the keychain
  if(error != nil){
    return rejectWithError(reject, error);
  }
  
  return resolve(@(result));
}

RCT_EXPORT_METHOD(vaultExist:(NSString *)vaultName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // check item exist in the keychian
  NSError *error;
  BOOL result = [Keychain itemExist:vaultName error:&error];
  
  // error while fetching item from storage
  if(error != nil){
    return rejectWithError(reject, error);
  }
  
  return resolve(@(result));
}


RCT_EXPORT_METHOD(openVault:(NSString *)vaultName
                  key:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // get the item from storage
  NSError *error;
  NSDictionary *item = [Keychain getItem:vaultName error:&error];
  
  if(error != nil){
    return rejectWithError(reject, error);
  }
  
  // no item found in the storage for the given name
  if(!item){
    NSError *error = [NSError errorWithDomain:@"VAULT_NOT_EXIST" code:-1 userInfo:@{
      NSLocalizedDescriptionKey:@"Unable to find the vault in the storage!"
    }];
    return rejectWithError(reject, error);
  }
  
  NSString *clearText = [Cipher decrypt:item[@"data"] key:key derivedKeysString:item[@"account"] error:&error];
  
  if(error != nil){
    return rejectWithError(reject, error);
  }
  
  return resolve(clearText);
  
}

RCT_EXPORT_METHOD(purgeVault:(NSString *)vaultName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSError *error;
  BOOL result = [Keychain deleteItem:vaultName error:&error];
    
  if(error != nil){
    return rejectWithError(reject, error);
  }
  
  return resolve(@(result));
}


RCT_EXPORT_METHOD(isMigrationRequired:(NSString *)vaultName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // get the item from storage
  NSError *error;
  NSDictionary *item = [Keychain getItem:vaultName error:&error];
  
  if(error != nil){
    return rejectWithError(reject, error);
  }
  
  // try to deserialize derived keys
  struct DerivedKeys derivedKeys = [Cipher getDerivedKeys:item[@"account"]];
  
  // unable to iniate the derived keys
  if(derivedKeys.version == nil){
    error = [NSError errorWithDomain:@"ERROR_GET_DERVIDED_KEYS" code:-2 userInfo:@{
      NSLocalizedDescriptionKey:@"Unable to parse derived keys!"
    }];
    return rejectWithError(reject, error);
  }
  
  NSNumber *latestCipherVersion = [Cipher getLatestCipherVersion];
  NSNumber *currentCipherVersion = derivedKeys.version;
  
  BOOL isMigrationRequired = [latestCipherVersion compare:currentCipherVersion] == NSOrderedDescending;
  
  return resolve(@{
    @"vault": vaultName,
    @"current_cipher_version": currentCipherVersion,
    @"latest_cipher_version": latestCipherVersion,
    @"migration_required":  @(isMigrationRequired)
  });
}

RCT_EXPORT_METHOD(getStorageEncryptionKey:(NSString *)keyName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // try to retrive the key
  NSError *error;
  NSDictionary *item = [Keychain getItem:keyName error:&error];
    
  if(error != nil){
    return rejectWithError(reject, error);
  }
  
  // key already exist in the keychain
  if(item != nil){
    return resolve(item[@"data"]);
  }
  
  // key not exist
  // if no key found in the keychain try to generate one and store in the keychain
  NSData *encryptionKeyData = [Crypto RandomBytesWithLength:64 error:&error];
  
  if(error != nil){
    return rejectWithError(reject, error);
  }
  
  // convert encryption key to hex
  NSString  *encryptionKey = [Crypto DataToHexWithData:encryptionKeyData];
  
  // store new encryption key in the keychain
  // store vault in the keychain
  BOOL result = [Keychain setItem:keyName account:@"" data:encryptionKey error:&error];
  
  if(error != nil || !result){
    return rejectWithError(reject, error);
  }
  
  // return new encryption key
  return resolve(encryptionKey);
}


@end
