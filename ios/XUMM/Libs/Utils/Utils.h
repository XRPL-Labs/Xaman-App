#import <Foundation/Foundation.h>

#if __has_include(<React/RCTBridgeModule.h>)
    #import <React/RCTBridgeModule.h>
    #import <React/RCTRootView.h>
    #import <React/RCTEventEmitter.h>
    #import <React/RCTReloadCommand.h>
#elif __has_include("React/RCTBridgeModule.h")
    #import "React/RCTBridgeModule.h"
    #import "React/RCTRootView.h"
    #import "React/RCTEventEmitter.h"
    #import "React/RCTReloadCommand.h"
#else
    #import "RCTBridgeModule.h"
    #import "RCTRootView.h"
    #import "RCTEventEmitter.h"
    #import "RCTReloadCommand.h"
#endif

@interface UtilsModule : RCTEventEmitter <RCTBridgeModule>

@end
