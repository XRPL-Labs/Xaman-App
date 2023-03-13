#import <Foundation/Foundation.h>

@interface PerformanceLogger : NSObject{
  NSString *tag;
  NSString *method;
  NSDate *startTime;
  bool started;
  bool ended;
  NSMutableDictionary *report;
}

- (id)initWithTag:(NSString *)tagName;
- (void)start:(NSString *)methodName;
- (void)end:(NSString *)methodName;
- (void)log;

@end
