#import "BiometricModule.h"
#import "SecurityProvider.h"

// constants
static NSString *const TYPE_BIOMETRIC_FACEID = @"FaceID";
static NSString *const TYPE_BIOMETRIC_TOUCHID = @"TouchID";
// errors
static NSString *const ERROR_USER_CANCEL = @"USER_CANCEL";
static NSString *const ERROR_NOT_SUPPORTED = @"BIOMETRIC_NOT_SUPPORTED";
static NSString *const ERROR_NOT_ENROLLED = @"NOT_ENROLLED";
static NSString *const ERROR_NOT_AVAILABLE = @"NOT_AVAILABLE";
static NSString *const ERROR_BIOMETRIC = @"BIOMETRIC_ERROR";
static NSString *const ERROR_NOT_MEET_SECURITY_REQUIREMENTS = @"NOT_MEET_SECURITY_REQUIREMENTS";
static NSString *const ERROR_BIOMETRIC_HAS_BEEN_CHANGED = @"BIOMETRIC_HAS_BEEN_CHANGED";
static NSString *const ERROR_UNABLE_REFRESH_AUTHENTICATION_KEY = @"UNABLE_REFRESH_AUTHENTICATION_KEY";

@implementation BiometricModule

RCT_EXPORT_MODULE();

+(void)initialise {
  // generate key if not exist
  if(![SecurityProvider isKeyReady]){
    [SecurityProvider generateKey];
  }
}

// get normalize biomtery type
- (NSString *)getBiometryType:(LAContext *)context {
  return context.biometryType == LABiometryTypeFaceID ? TYPE_BIOMETRIC_FACEID : TYPE_BIOMETRIC_TOUCHID;
}

// get normalized sensore errors
-(NSString *) getSensorError: (LAContext *)context {
  
  NSError *error;
  // can autherize, everything seems fine, no errros
  if ([context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error]) {
    return NULL;
  }
  
  // biometrics are not available, reutrn error
  switch (error.code) {
    case LAErrorBiometryNotAvailable:
      return ERROR_NOT_AVAILABLE;
    case LAErrorBiometryNotEnrolled:
      return ERROR_NOT_ENROLLED;
    default:
      return ERROR_NOT_SUPPORTED;
  }
  
}

RCT_EXPORT_METHOD(isSensorAvailable:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_global_queue( DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    LAContext *context = [[LAContext alloc] init];
    NSString *error = [self getSensorError:context];
    
    // can authorize with biometrics
    if(error == NULL){
      
      // if sensor is available but the key is not generated
      if(![SecurityProvider isKeyReady]){
        reject(ERROR_NOT_MEET_SECURITY_REQUIREMENTS, nil, nil);
        return;
      }
      
      resolve([self getBiometryType:context]);
      return;
    }
    
    reject(error, nil, nil);
  });
}

RCT_EXPORT_METHOD(authenticate: (NSString *)reason
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_global_queue( DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    
    LAContext *context = [[LAContext alloc] init];
    NSString *error = [self getSensorError:context];
    
    // pre check for authentication availabality
    if(error != NULL){
      reject(error, nil, nil);
      return;
    }
    
    // set the athentication reason
    context.localizedReason = reason;
    // remove fallback button
    context.localizedFallbackTitle = @"";
    
    
    // try to sign random bytes with private key
    // NOTE: this will trigger biometric authentication
    NSString *result = [SecurityProvider signRandomBytes:context];
    
    
    if([result isEqual:ENCRYPTION_SUCCESS]){
      resolve([self getBiometryType:context]);
      return;
    }
    
    // biometrics are not available, reutrn error
    if([result isEqual:ENCRYPTION_ERROR_CANCELLED]){
      reject(ERROR_USER_CANCEL, nil, nil);
      return;
    }
    
    // authentication has been changed or unable to create signature for any reason
    // Biometric should be disable when getting this error
    reject(ERROR_BIOMETRIC_HAS_BEEN_CHANGED, nil, nil);
  });
}

RCT_EXPORT_METHOD(refreshAuthenticationKey:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_global_queue( DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    // remove old invalidated key
    [SecurityProvider deleteInvalidKey];
    
    // generate new key
    [SecurityProvider generateKey];
    
    
    // check if new key is ready
    if([SecurityProvider isKeyReady]){
      resolve(@YES);
      return;
    }
    
    reject(ERROR_UNABLE_REFRESH_AUTHENTICATION_KEY, nil, nil);
  });
}

@end
