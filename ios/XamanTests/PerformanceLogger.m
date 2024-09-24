//
//  PerformanceLogger.m
//  XamanTests
//
//  Created by XRPL-Labs on 05/10/2022.
//

#import <Foundation/Foundation.h>

#import "PerformanceLogger.h"


@implementation PerformanceLogger

- (id)initWithTag:(NSString *)tagName {
  self = [super init];
  
  tag = tagName;
  
  report = [[NSMutableDictionary alloc] init];
  [report setValue:tagName forKey:@"TAG"];
  
  return self;
}


- (void)start:(NSString *)methodName{
  if(started && !ended){
    @throw [NSException exceptionWithName:@"Performance Logger"
                                   reason:@"Performance logger already started, stop first!"
                                 userInfo:nil];
  }
  
  started = YES;
  ended = NO;
  method = methodName;
  startTime = [NSDate date];
}

- (void)end:(NSString *)methodName{
  if(!started){
    @throw [NSException exceptionWithName:@"Performance Logger"
                                   reason:@"Performance logger is not started!"
                                 userInfo:nil];
  }
  
  if(![method isEqualToString:methodName]){
    @throw [NSException exceptionWithName:@"Performance Logger"
                                   reason:@"Performance logger tries to stop unknown method!"
                                 userInfo:nil];
  }
  
  started = FALSE;
  ended = TRUE;
  
  NSInteger executionTime = fmod([[NSDate date] timeIntervalSinceDate:startTime], 1) * 1000;
  
  [report setValue:[NSNumber numberWithDouble:executionTime] forKey:method];
}


- (void)log {
  NSError *error;
  NSData *reportData = [NSJSONSerialization  dataWithJSONObject:report options:0 error:&error];
  
  if(error != nil){
    @throw error;
  }
  
  NSString *reportString = [[NSString alloc] initWithData:reportData encoding:NSUTF8StringEncoding];
  
  NSLog(@"%@", reportString);
}



@end

