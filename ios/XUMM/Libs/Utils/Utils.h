#import <Foundation/Foundation.h>

#if __has_include(<React/RCTBridgeModule.h>)
    #import <React/RCTBridgeModule.h>
    #import <React/RCTRootView.h>
#elif __has_include("React/RCTBridgeModule.h")
    #import "React/RCTBridgeModule.h"
    #import "React/RCTRootView"
#else
    #import "RCTBridgeModule.h"
    #import "RCTRootView.h"
#endif

@interface UtilsModule : NSObject <RCTBridgeModule>

@end
