#import "Utils.h"

#import <Foundation/Foundation.h>
#include <sys/types.h>
#include <sys/sysctl.h>
#import <AudioToolbox/AudioToolbox.h>
#import <AudioToolbox/AudioServices.h>

@import UIKit;
@import Darwin.sys.sysctl;

static NSString * const JMJailbreakTextFile = @"/private/jailbreak.txt";
static NSString * const JMisJailBronkenKey = @"isJailBroken";
static NSString * const JMisDebuggedKey = @"isDebugged";
static NSString * const JMCanMockLocationKey = @"canMockLocation";

static UISelectionFeedbackGenerator *selectionGenerator = nil;
static NSMutableDictionary<NSNumber*, UIImpactFeedbackGenerator*> *impactGeneratorMap = nil;
static UINotificationFeedbackGenerator *notificationGenerator = nil;


@implementation UtilsModule
{
  bool hasListeners;
}

RCT_EXPORT_MODULE();


- (NSArray<NSString *> *)supportedEvents
{
  return @[@"Utils.timeout"];;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)loadBundle
{
  [self.bridge reload];
}

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

// Will be called when this module's first listener is added.
-(void)startObserving {
    hasListeners = YES;
}

// Will be called when this module's last listener is removed, or on dealloc.
-(void)stopObserving {
    hasListeners = NO;
}

- (NSString *)platform
{
    size_t size;
    sysctlbyname("hw.machine", NULL, &size, NULL, 0);
    char *machine = malloc(size);
    sysctlbyname("hw.machine", machine, &size, NULL, 0);
    NSString *platform = [NSString stringWithUTF8String:machine];
    free(machine);
    return platform;
}

- (int)deviceVersion:(NSString *)deviceType
{
    NSString *platform = [self platform];
    int deviceVersion = 0;
    
    if ([platform containsString:deviceType]) {
        NSString *platformSplit = [platform componentsSeparatedByString:@","][0];
        NSCharacterSet *setToRemove = [NSCharacterSet decimalDigitCharacterSet];
        NSCharacterSet *setToKeep = [setToRemove invertedSet];
        
        NSString *platformVersion = [[platformSplit componentsSeparatedByCharactersInSet:setToKeep]
         componentsJoinedByString:@""];
        deviceVersion = [platformVersion intValue];
    }
    return deviceVersion;
}

-(Boolean)supportsHaptic {
    return [[UIDevice currentDevice] systemVersion].floatValue >= 10.0
        && [self deviceVersion:@"iPhone"] > 8;
}

-(Boolean)supportsHapticFor6SAnd6SPlus {
    return [[UIDevice currentDevice] systemVersion].floatValue >= 10.0
        && ([[self platform] isEqualToString:@"iPhone8,1"]  // iPhone 6S
        || [[self platform] isEqualToString:@"iPhone8,2"]); // iPhone 6S Plus
}

-(void)generateSelectionFeedback{
    if (selectionGenerator == nil){
        selectionGenerator = [[UISelectionFeedbackGenerator alloc] init];
        [selectionGenerator prepare];
    }
    [selectionGenerator selectionChanged];
    [selectionGenerator prepare];
}

-(void)generateImpactFeedback:(UIImpactFeedbackStyle)style{
    NSNumber *key = [NSNumber numberWithInteger: style];
    if (impactGeneratorMap == nil)
        impactGeneratorMap = [[NSMutableDictionary alloc] init];
    if ([impactGeneratorMap objectForKey:key] == nil){
        [impactGeneratorMap setValue:[[UIImpactFeedbackGenerator alloc] initWithStyle:style] forKey:key];
        [[impactGeneratorMap objectForKey:key] prepare];
    }
    UIImpactFeedbackGenerator *generator = [impactGeneratorMap objectForKey:key];
    [generator impactOccurred];
    [generator prepare];
}

-(void)generateNotificationFeedback:(UINotificationFeedbackType)notificationType{
    if (notificationGenerator == nil){
        notificationGenerator = [[UINotificationFeedbackGenerator alloc] init];
        [notificationGenerator prepare];
    }
    [notificationGenerator notificationOccurred:notificationType];
    [notificationGenerator prepare];
}

- (NSArray *)pathsToCheck
{
    return @[
             @"/Applications/Cydia.app",
             @"/Library/MobileSubstrate/MobileSubstrate.dylib",
             @"/bin/bash",
             @"/usr/sbin/sshd",
             @"/etc/apt",
             @"/private/var/lib/apt",
             @"/usr/sbin/frida-server",
             @"/usr/bin/cycript",
             @"/usr/local/bin/cycript",
             @"/usr/lib/libcycript.dylib",
             @"/Applications/FakeCarrier.app",
             @"/Applications/Icy.app",
             @"/Applications/IntelliScreen.app",
             @"/Applications/MxTube.app",
             @"/Applications/RockApp.app",
             @"/Applications/SBSettings.app",
             @"/Applications/WinterBoard.app",
             @"/Applications/blackra1n.app",
             @"/Library/MobileSubstrate/DynamicLibraries/LiveClock.plist",
             @"/Library/MobileSubstrate/DynamicLibraries/Veency.plist",
             @"/System/Library/LaunchDaemons/com.ikey.bbot.plist",
             @"/System/Library/LaunchDaemons/com.saurik.Cydia.Startup.plist",
             @"/bin/sh",
             @"/etc/ssh/sshd_config",
             @"/private/var/lib/cydia",
             @"/private/var/mobile/Library/SBSettings/Themes",
             @"/private/var/stash",
             @"/private/var/tmp/cydia.log",
             @"/usr/bin/sshd",
             @"/usr/libexec/sftp-server",
             @"/usr/libexec/ssh-keysign",
             @"/var/cache/apt",
             @"/var/lib/apt",
             @"/var/lib/cydia",
             ];
}

- (NSArray *)schemesToCheck
{
    return @[
             @"cydia://package/com.example.package",
             ];
}

- (BOOL)checkPaths
{
    BOOL existsPath = NO;
    
    for (NSString *path in [self pathsToCheck]) {
        if ([[NSFileManager defaultManager] fileExistsAtPath:path]){
            existsPath = YES;
            break;
        }
    }
    
    return existsPath;
}

- (BOOL)checkSchemes
{
    BOOL canOpenScheme = NO;
    
    for (NSString *scheme in [self schemesToCheck]) {
        if([[UIApplication sharedApplication] canOpenURL:[NSURL URLWithString:scheme]]){
            canOpenScheme = YES;
            break;
        }
    }
    
    return canOpenScheme;
}

- (BOOL)canViolateSandbox{
    NSError *error;
    BOOL grantsToWrite = NO;
    NSString *stringToBeWritten = @"This is an anti-spoofing test.";
    [stringToBeWritten writeToFile:JMJailbreakTextFile atomically:YES
                          encoding:NSUTF8StringEncoding error:&error];
    if(!error){
        //Device is jailbroken
        grantsToWrite = YES;
    }
    
    [[NSFileManager defaultManager] removeItemAtPath:JMJailbreakTextFile error:nil];
    
    return grantsToWrite;
}


- (time_t)uptime
{
    struct timeval boottime;
    int mib[2] = {CTL_KERN, KERN_BOOTTIME};
    size_t size = sizeof(boottime);
    time_t now;
    time_t uptime = -1;
    
    (void) time(&now);
    
    if (sysctl(mib, 2, &boottime, &size, NULL, 0) != -1 && boottime.tv_sec != 0) {
        uptime = now - (boottime.tv_sec);
    }
    
    return uptime;
}


RCT_REMAP_METHOD(isDebugged, debugged_resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    struct kinfo_proc info;
    size_t info_size = sizeof(info);
    int name[4];
    
    name[0] = CTL_KERN;
    name[1] = KERN_PROC;
    name[2] = KERN_PROC_PID;
    name[3] = getpid();
    
    if (sysctl(name, 4, &info, &info_size, NULL, 0) == -1) {
        NSLog(@"sysctl() failed: %s", strerror(errno));
        return resolve(@NO);
    }
    
    if ((info.kp_proc.p_flag & P_TRACED) != 0) {
        return resolve(@YES);
    }
    
    return resolve(@NO);
}


RCT_REMAP_METHOD(isJailBroken, jailbreak_resolver:(RCTPromiseResolveBlock)resolve  rejecter:(RCTPromiseRejectBlock)reject)
{
    if([self checkPaths] || [self checkSchemes] || [self canViolateSandbox]) {
        resolve(@YES);
    }
    else {
        resolve(@NO);
    }
}

RCT_EXPORT_METHOD(restartBundle) {
    if ([NSThread isMainThread]) {
        [self loadBundle];
    } else {
        dispatch_sync(dispatch_get_main_queue(), ^{
            [self loadBundle];
        });
    }
    return;
}

RCT_EXPORT_METHOD(exitApp)
{
    exit(0);
}

RCT_EXPORT_METHOD(getElapsedRealtime: (RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    resolve([NSString stringWithFormat:@"%ld", [self uptime]]);
}


RCT_EXPORT_METHOD(getTimeZone:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  @try{
    NSTimeZone *timeZone = [NSTimeZone localTimeZone];
    resolve(timeZone.name);
  }
  @catch(NSException *exception){
    NSMutableDictionary * info = [NSMutableDictionary dictionary];
    [info setValue:exception.name forKey:@"ExceptionName"];
    [info setValue:exception.reason forKey:@"ExceptionReason"];
    [info setValue:exception.userInfo forKey:@"ExceptionUserInfo"];
    NSError *error = [[NSError alloc] initWithDomain:@"Root Detection Module" code:0 userInfo:info];
    reject(@"failed to execute",@"",error);
  }
}

// From:
// https://github.com/junina-de/react-native-haptic-feedback
RCT_EXPORT_METHOD(hapticFeedback:(NSString *)type)
{
    
    if ([self supportsHaptic]){
        
        if ([type isEqual: @"impactLight"]) {
            [self generateImpactFeedback:UIImpactFeedbackStyleLight];
        } else if ([type isEqual:@"impactMedium"]) {
            [self generateImpactFeedback:UIImpactFeedbackStyleMedium];
        } else if ([type isEqual:@"impactHeavy"]) {
            [self generateImpactFeedback:UIImpactFeedbackStyleHeavy];
        } else if ([type isEqual:@"notificationSuccess"]) {
            [self generateNotificationFeedback:UINotificationFeedbackTypeSuccess];
        } else if ([type isEqual:@"notificationWarning"]) {
            [self generateNotificationFeedback:UINotificationFeedbackTypeWarning];
        } else if ([type isEqual:@"notificationError"]) {
            [self generateNotificationFeedback:UINotificationFeedbackTypeError];
        } else {
            [self generateSelectionFeedback];
        }
        
    } else if ([self supportsHapticFor6SAnd6SPlus]) {
        
        // generates alternative haptic feedback
        if ([type isEqual: @"selection"]) {
            AudioServicesPlaySystemSound((SystemSoundID) 1519);
        } else if ([type isEqual: @"impactMedium"]) {
            AudioServicesPlaySystemSound((SystemSoundID) 1520);
        } else if ([type isEqual:@"notificationWarning"]) {
            AudioServicesPlaySystemSound((SystemSoundID) 1521);
        }
        
    } else {
        AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
    }
    
}


RCT_EXPORT_METHOD(timeoutEvent:(NSString *)timeoutId timeout:(int)timeout
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    __block UIBackgroundTaskIdentifier task = [[UIApplication sharedApplication] beginBackgroundTaskWithName:@"UtilsModule" expirationHandler:^{
        [[UIApplication sharedApplication] endBackgroundTask:task];
    }];

    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, timeout * NSEC_PER_MSEC), dispatch_get_main_queue(), ^{
        if ([self bridge] != nil && self->hasListeners) {
            [self sendEventWithName:@"Utils.timeout" body:timeoutId];
        }
  
        [[UIApplication sharedApplication] endBackgroundTask:task];
    });
    resolve([NSNumber numberWithBool:YES]);
}

@end
