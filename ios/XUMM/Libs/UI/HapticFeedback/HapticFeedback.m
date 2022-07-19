// From:
// https://github.com/junina-de/react-native-haptic-feedback

#import "HapticFeedback.h"

#import <Foundation/Foundation.h>

#import <AudioToolbox/AudioToolbox.h>
#import <AudioToolbox/AudioServices.h>

#include <sys/types.h>
#include <sys/sysctl.h>

static UISelectionFeedbackGenerator *selectionGenerator = nil;
static NSMutableDictionary<NSNumber*, UIImpactFeedbackGenerator*> *impactGeneratorMap = nil;
static UINotificationFeedbackGenerator *notificationGenerator = nil;

@implementation HapticFeedbackModule

RCT_EXPORT_MODULE();

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
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


RCT_EXPORT_METHOD(trigger:(NSString *)type)
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

@end
