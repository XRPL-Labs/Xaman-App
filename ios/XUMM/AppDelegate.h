#import <UIKit/UIKit.h>
#import <React/RCTBridgeDelegate.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate>{
  BOOL blureViewActive;
}

@property (nonatomic, strong) UIWindow *window;

@end
