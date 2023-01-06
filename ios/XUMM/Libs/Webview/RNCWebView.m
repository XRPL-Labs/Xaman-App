/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNCWebView.h"
#import <React/RCTConvert.h>
#import <React/RCTAutoInsetsProtocol.h>
#import "RNCWKProcessPoolManager.h"
#import <UIKit/UIKit.h>


#import "objc/runtime.h"

static NSTimer *keyboardTimer;
static NSString *const HistoryShimName = @"ReactNativeHistoryShim";
static NSString *const MessageHandlerName = @"ReactNativeWebView";
static NSURLCredential* clientAuthenticationCredential;
static NSDictionary* customCertificatesForHost;

NSString *const CUSTOM_SELECTOR = @"_CUSTOM_SELECTOR_";


// runtime trick to remove WKWebView keyboard default toolbar
// see: http://stackoverflow.com/questions/19033292/ios-7-uiwebview-keyboard-issue/19042279#19042279
@interface _SwizzleHelperWK : UIView
@property (nonatomic, copy) WKWebView *webView;
@end
@implementation _SwizzleHelperWK
-(id)inputAccessoryView
{
  if (_webView == nil) {
    return nil;
  }
  
  if ([_webView respondsToSelector:@selector(inputAssistantItem)]) {
    UITextInputAssistantItem *inputAssistantItem = [_webView inputAssistantItem];
    inputAssistantItem.leadingBarButtonGroups = @[];
    inputAssistantItem.trailingBarButtonGroups = @[];
  }
  return nil;
}
@end



@interface RNCWebView () <WKUIDelegate, WKNavigationDelegate, WKScriptMessageHandler,

UIScrollViewDelegate,

RCTAutoInsetsProtocol>

@property (nonatomic, copy) RCTDirectEventBlock onLoadingStart;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingFinish;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingError;
@property (nonatomic, copy) RCTDirectEventBlock onLoadingProgress;
@property (nonatomic, copy) RCTDirectEventBlock onShouldStartLoadWithRequest;
@property (nonatomic, copy) RCTDirectEventBlock onHttpError;
@property (nonatomic, copy) RCTDirectEventBlock onMessage;
@property (nonatomic, copy) RCTDirectEventBlock onScroll;
@property (nonatomic, copy) RCTDirectEventBlock onContentProcessDidTerminate;

@property (nonatomic, copy) WKWebView *webView;

@property (nonatomic, strong) WKUserScript *postMessageScript;
@property (nonatomic, strong) WKUserScript *atStartScript;
@property (nonatomic, strong) WKUserScript *atEndScript;
@end

@implementation RNCWebView
{
  
  UIColor * _savedBackgroundColor;
  
  // Workaround for StatusBar appearance bug for iOS 12
  // https://github.com/react-native-webview/react-native-webview/issues/62
  BOOL _isFullScreenVideoOpen;
  
  UIStatusBarStyle _savedStatusBarStyle;
  
  BOOL _savedStatusBarHidden;
  BOOL _disablePromptDuringLoading;
  
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
  UIScrollViewContentInsetAdjustmentBehavior _savedContentInsetAdjustmentBehavior;
#endif
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000 /* __IPHONE_13_0 */
  BOOL _savedAutomaticallyAdjustsScrollIndicatorInsets;
#endif
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    
    super.backgroundColor = [UIColor clearColor];
    
    _savedStatusBarStyle = RCTSharedApplication().statusBarStyle;
    _savedStatusBarHidden = RCTSharedApplication().statusBarHidden;
    
    _disablePromptDuringLoading = YES;
    
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
    _savedContentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
#endif
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000 /* __IPHONE_13_0 */
    _savedAutomaticallyAdjustsScrollIndicatorInsets = NO;
#endif
  }
  
  
  [[NSNotificationCenter defaultCenter]addObserver:self
                                          selector:@selector(appDidBecomeActive)
                                              name:UIApplicationDidBecomeActiveNotification
                                            object:nil];
  
  [[NSNotificationCenter defaultCenter]addObserver:self
                                          selector:@selector(appWillResignActive)
                                              name:UIApplicationWillResignActiveNotification
                                            object:nil];
  if (@available(iOS 12.0, *)) {
    // Workaround for a keyboard dismissal bug present in iOS 12
    // https://openradar.appspot.com/radar?id=5018321736957952
    [[NSNotificationCenter defaultCenter]
     addObserver:self
     selector:@selector(keyboardWillHide)
     name:UIKeyboardWillHideNotification object:nil];
    [[NSNotificationCenter defaultCenter]
     addObserver:self
     selector:@selector(keyboardWillShow)
     name:UIKeyboardWillShowNotification object:nil];
    
    // Workaround for StatusBar appearance bug for iOS 12
    // https://github.com/react-native-webview/react-native-webview/issues/62
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(showFullScreenVideoStatusBars)
                                                 name:UIWindowDidBecomeVisibleNotification
                                               object:nil];
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(hideFullScreenVideoStatusBars)
                                                 name:UIWindowDidBecomeHiddenNotification
                                               object:nil];
    
  }
  
  return self;
}


- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldRecognizeSimultaneouslyWithGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer {
  // Only allow long press gesture
  if ([otherGestureRecognizer isKindOfClass:[UILongPressGestureRecognizer class]]) {
    return YES;
  }else{
    return NO;
  }
}

// Listener for long presses
- (void)startLongPress:(UILongPressGestureRecognizer *)pressSender
{
  // When a long press ends, bring up our custom UIMenu
  if(pressSender.state == UIGestureRecognizerStateEnded) {
    if (!self.menuItems || self.menuItems.count == 0) {
      return;
    }
    UIMenuController *menuController = [UIMenuController sharedMenuController];
    NSMutableArray *menuControllerItems = [NSMutableArray arrayWithCapacity:self.menuItems.count];
    
    for(NSDictionary *menuItem in self.menuItems) {
      NSString *menuItemLabel = [RCTConvert NSString:menuItem[@"label"]];
      NSString *menuItemKey = [RCTConvert NSString:menuItem[@"key"]];
      NSString *sel = [NSString stringWithFormat:@"%@%@", CUSTOM_SELECTOR, menuItemKey];
      UIMenuItem *item = [[UIMenuItem alloc] initWithTitle: menuItemLabel
                                                    action: NSSelectorFromString(sel)];
      
      [menuControllerItems addObject: item];
    }
    
    menuController.menuItems = menuControllerItems;
    [menuController setMenuVisible:YES animated:YES];
  }
}



- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)tappedMenuItem:(NSString *)eventType
{
  // Get the selected text
  // NOTE: selecting text in an iframe or shadow DOM will not work
  [self.webView evaluateJavaScript: @"window.getSelection().toString()" completionHandler: ^(id result, NSError *error) {
    if (error != nil) {
      RCTLogWarn(@"%@", [NSString stringWithFormat:@"Error evaluating injectedJavaScript: This is possibly due to an unsupported return type. Try adding true to the end of your injectedJavaScript string. %@", error]);
    } else {
      if (self.onCustomMenuSelection) {
        NSPredicate *filter = [NSPredicate predicateWithFormat:@"key contains[c] %@ ",eventType];
        NSArray *filteredMenuItems = [self.menuItems filteredArrayUsingPredicate:filter];
        NSDictionary *selectedMenuItem = filteredMenuItems[0];
        NSString *label = [RCTConvert NSString:selectedMenuItem[@"label"]];
        self.onCustomMenuSelection(@{
          @"key": eventType,
          @"label": label,
          @"selectedText": result
        });
      } else {
        RCTLogWarn(@"Error evaluating onCustomMenuSelection: You must implement an `onCustomMenuSelection` callback when using custom menu items");
      }
    }
  }];
}

// Overwrite method that interprets which action to call upon UIMenu Selection
// https://developer.apple.com/documentation/objectivec/nsobject/1571960-methodsignatureforselector
- (NSMethodSignature *)methodSignatureForSelector:(SEL)sel
{
  NSMethodSignature *existingSelector = [super methodSignatureForSelector:sel];
  if (existingSelector) {
    return existingSelector;
  }
  return [super methodSignatureForSelector:@selector(tappedMenuItem:)];
}

// Needed to forward messages to other objects
// https://developer.apple.com/documentation/objectivec/nsobject/1571955-forwardinvocation
- (void)forwardInvocation:(NSInvocation *)invocation
{
  NSString *sel = NSStringFromSelector([invocation selector]);
  NSRange match = [sel rangeOfString:CUSTOM_SELECTOR];
  if (match.location == 0) {
    [self tappedMenuItem:[sel substringFromIndex:17]];
  } else {
    [super forwardInvocation:invocation];
  }
}

// Allows the instance to respond to UIMenuController Actions
- (BOOL)canBecomeFirstResponder
{
  return YES;
}

// Control which items show up on the UIMenuController
- (BOOL)canPerformAction:(SEL)action withSender:(id)sender
{
  NSString *sel = NSStringFromSelector(action);
  // Do any of them have our custom keys?
  NSRange match = [sel rangeOfString:CUSTOM_SELECTOR];
  
  if (match.location == 0) {
    return YES;
  }
  return NO;
}

/**
 * See https://stackoverflow.com/questions/25713069/why-is-wkwebview-not-opening-links-with-target-blank/25853806#25853806 for details.
 */
- (WKWebView *)webView:(WKWebView *)webView createWebViewWithConfiguration:(WKWebViewConfiguration *)configuration forNavigationAction:(WKNavigationAction *)navigationAction windowFeatures:(WKWindowFeatures *)windowFeatures
{
  if (!navigationAction.targetFrame.isMainFrame) {
    [webView loadRequest:navigationAction.request];
  }
  return nil;
}

- (WKWebViewConfiguration *)setUpWkWebViewConfig
{
  WKWebViewConfiguration *wkWebViewConfig = [WKWebViewConfiguration new];
  WKPreferences *prefs = [[WKPreferences alloc]init];
  
  [prefs setValue:@TRUE forKey:@"javaScriptEnabled"];
  
  [prefs setValue:@FALSE forKey:@"javaScriptCanOpenWindowsAutomatically"];
  [prefs setValue:@FALSE forKey:@"allowFileAccessFromFileURLs"];
  [prefs setValue:@FALSE forKey:@"fullScreenEnabled"];
  
  [wkWebViewConfig setValue:@FALSE forKey:@"allowUniversalAccessFromFileURLs"];
  
  wkWebViewConfig.preferences = prefs;
  
  if (_incognito) {
    wkWebViewConfig.websiteDataStore = [WKWebsiteDataStore nonPersistentDataStore];
  }
  
  // as we don't enable caching this should be comment out
  // wkWebViewConfig.websiteDataStore = [WKWebsiteDataStore defaultDataStore];
  wkWebViewConfig.processPool = [[RNCWKProcessPoolManager sharedManager] sharedProcessPool];
  wkWebViewConfig.userContentController = [WKUserContentController new];
  
  // Shim the HTML5 history API:
  [wkWebViewConfig.userContentController addScriptMessageHandler:[[RNCWeakScriptMessageDelegate alloc] initWithDelegate:self]
                                                            name:HistoryShimName];
  [self resetupScripts:wkWebViewConfig];
  
  wkWebViewConfig.allowsAirPlayForMediaPlayback = FALSE;
  
#if WEBKIT_IOS_10_APIS_AVAILABLE
  wkWebViewConfig.mediaTypesRequiringUserActionForPlayback = TRUE
  ? WKAudiovisualMediaTypeAll
  : WKAudiovisualMediaTypeNone;
#else
  wkWebViewConfig.mediaTypesRequiringUserActionForPlayback = TRUE;
#endif
  
  return wkWebViewConfig;
}

- (void)didMoveToWindow
{
  if (self.window != nil && _webView == nil) {
    WKWebViewConfiguration *wkWebViewConfig = [self setUpWkWebViewConfig];
    
    _webView = [[WKWebView alloc] initWithFrame:self.bounds configuration: wkWebViewConfig];
    
    
    [self setBackgroundColor: _savedBackgroundColor];
    
    _webView.scrollView.delegate = self;
    
    _webView.UIDelegate = self;
    _webView.navigationDelegate = self;
    
    
    _webView.scrollView.scrollEnabled = YES;
    _webView.scrollView.pagingEnabled = NO;
    _webView.scrollView.bounces = NO;
    _webView.scrollView.showsHorizontalScrollIndicator = YES;
    _webView.scrollView.showsVerticalScrollIndicator = YES;
    _webView.scrollView.directionalLockEnabled = YES;
    _webView.allowsLinkPreview = NO;
    
    [_webView addObserver:self forKeyPath:@"estimatedProgress" options:NSKeyValueObservingOptionOld | NSKeyValueObservingOptionNew context:nil];
    _webView.allowsBackForwardNavigationGestures = FALSE;
    
    _webView.customUserAgent = _userAgent;
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
    if ([_webView.scrollView respondsToSelector:@selector(setContentInsetAdjustmentBehavior:)]) {
      _webView.scrollView.contentInsetAdjustmentBehavior = _savedContentInsetAdjustmentBehavior;
    }
#endif
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000 /* __IPHONE_13_0 */
    if (@available(iOS 13.0, *)) {
      _webView.scrollView.automaticallyAdjustsScrollIndicatorInsets = _savedAutomaticallyAdjustsScrollIndicatorInsets;
    }
#endif
    
    [self addSubview:_webView];
    [self hideKeyboardAccessoryView];
    [self enableMessaging];
    [self visitSource];
  }
  
  // Allow this object to recognize gestures
  if (self.menuItems != nil) {
    UILongPressGestureRecognizer *longPress = [[UILongPressGestureRecognizer alloc] initWithTarget:self action:@selector(startLongPress:)];
    longPress.delegate = self;
    
    longPress.minimumPressDuration = 0.4f;
    longPress.numberOfTouchesRequired = 1;
    longPress.cancelsTouchesInView = YES;
    [self addGestureRecognizer:longPress];
  }
  
}

- (void)removeFromSuperview
{
  if (_webView) {
    [_webView.configuration.userContentController removeScriptMessageHandlerForName:HistoryShimName];
    [_webView.configuration.userContentController removeScriptMessageHandlerForName:MessageHandlerName];
    [_webView removeObserver:self forKeyPath:@"estimatedProgress"];
    [_webView removeFromSuperview];
    
    _webView.scrollView.delegate = nil;
    
    _webView = nil;
    if (_onContentProcessDidTerminate) {
      NSMutableDictionary<NSString *, id> *event = [self baseEvent];
      _onContentProcessDidTerminate(event);
    }
  }
  
  [super removeFromSuperview];
}


-(void)showFullScreenVideoStatusBars
{
#pragma clang diagnostic ignored "-Wdeprecated-declarations"

  _isFullScreenVideoOpen = YES;
  RCTUnsafeExecuteOnMainQueueSync(^{
    [RCTSharedApplication() setStatusBarStyle:self->_savedStatusBarStyle animated:YES];
  });
#pragma clang diagnostic pop
}

-(void)hideFullScreenVideoStatusBars
{
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  
  _isFullScreenVideoOpen = NO;
  RCTUnsafeExecuteOnMainQueueSync(^{
    [RCTSharedApplication() setStatusBarHidden:self->_savedStatusBarHidden animated:YES];
    [RCTSharedApplication() setStatusBarStyle:self->_savedStatusBarStyle animated:YES];
  });
#pragma clang diagnostic pop
}

-(void)keyboardWillHide
{
  keyboardTimer = [NSTimer scheduledTimerWithTimeInterval:0 target:self selector:@selector(keyboardDisplacementFix) userInfo:nil repeats:false];
  [[NSRunLoop mainRunLoop] addTimer:keyboardTimer forMode:NSRunLoopCommonModes];
}
-(void)keyboardWillShow
{
  if (keyboardTimer != nil) {
    [keyboardTimer invalidate];
  }
}
-(void)keyboardDisplacementFix
{
  // Additional viewport checks to prevent unintentional scrolls
  UIScrollView *scrollView = self.webView.scrollView;
  double maxContentOffset = scrollView.contentSize.height - scrollView.frame.size.height;
  if (maxContentOffset < 0) {
    maxContentOffset = 0;
  }
  if (scrollView.contentOffset.y > maxContentOffset) {
    // https://stackoverflow.com/a/9637807/824966
    [UIView animateWithDuration:.25 animations:^{
      scrollView.contentOffset = CGPointMake(0, maxContentOffset);
    }];
  }
}


- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary<NSKeyValueChangeKey,id> *)change context:(void *)context{
  if ([keyPath isEqual:@"estimatedProgress"] && object == self.webView) {
    if(_onLoadingProgress){
      _disablePromptDuringLoading = YES;
      NSMutableDictionary<NSString *, id> *event = [self baseEvent];
      [event addEntriesFromDictionary:@{@"progress":[NSNumber numberWithDouble:self.webView.estimatedProgress]}];
      _onLoadingProgress(event);
    }
  }else{
    [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
  }
}


- (void)setBackgroundColor:(UIColor *)backgroundColor

{
  _savedBackgroundColor = backgroundColor;
  if (_webView == nil) {
    return;
  }
  
  CGFloat alpha = CGColorGetAlpha(backgroundColor.CGColor);
  BOOL opaque = (alpha == 1.0);
  
  self.opaque = _webView.opaque = opaque;
  _webView.scrollView.backgroundColor = backgroundColor;
  _webView.backgroundColor = backgroundColor;
  
}

/**
 * This method is called whenever JavaScript running within the web view calls:
 *   - window.webkit.messageHandlers[MessageHandlerName].postMessage
 */
- (void)userContentController:(WKUserContentController *)userContentController
      didReceiveScriptMessage:(WKScriptMessage *)message
{
  if ([message.name isEqualToString:HistoryShimName]) {
    if (_onLoadingFinish) {
      NSMutableDictionary<NSString *, id> *event = [self baseEvent];
      [event addEntriesFromDictionary: @{@"navigationType": message.body}];
      _onLoadingFinish(event);
      _disablePromptDuringLoading = NO;
    }
  } else if ([message.name isEqualToString:MessageHandlerName]) {
    if (_onMessage) {
      NSMutableDictionary<NSString *, id> *event = [self baseEvent];
      [event addEntriesFromDictionary: @{@"data": message.body}];
      _onMessage(event);
    }
  }
}

- (void)setSource:(NSDictionary *)source
{
  if (![_source isEqualToDictionary:source]) {
    _source = [source copy];
    
    if (_webView != nil) {
      [self visitSource];
    }
  }
}

- (void)refreshContentInset
{
  [RCTView autoAdjustInsetsForView:self
                    withScrollView:_webView.scrollView
                      updateOffset:YES];
}


- (void)visitSource
{
  // Check for a static html source first
  NSString *html = [RCTConvert NSString:_source[@"html"]];
  if (html) {
    NSURL *baseURL = [RCTConvert NSURL:_source[@"baseUrl"]];
    if (!baseURL) {
      baseURL = [NSURL URLWithString:@"about:blank"];
    }
    [_webView loadHTMLString:html baseURL:baseURL];
    return;
  }
  // Add cookie for subsequent resource requests sent by page itself, if cookie was set in headers on WebView
  NSString *headerCookie = [RCTConvert NSString:_source[@"headers"][@"cookie"]];
  if(headerCookie) {
    NSDictionary *headers = [NSDictionary dictionaryWithObjectsAndKeys:headerCookie,@"Set-Cookie",nil];
    NSURL *urlString = [NSURL URLWithString:_source[@"uri"]];
    NSArray *httpCookies = [NSHTTPCookie cookiesWithResponseHeaderFields:headers forURL:urlString];
    [self writeCookiesToWebView:httpCookies completion:nil];
  }
  
  NSURLRequest *request = [self requestForSource:_source];
  
  [self syncCookiesToWebView:^{
    // Because of the way React works, as pages redirect, we actually end up
    // passing the redirect urls back here, so we ignore them if trying to load
    // the same url. We'll expose a call to 'reload' to allow a user to load
    // the existing page.
    if ([request.URL isEqual:_webView.URL]) {
      return;
    }
    if (!request.URL) {
      // Clear the webview
      [_webView loadHTMLString:@"" baseURL:nil];
      return;
    }
    if (request.URL.host) {
      [_webView loadRequest:request];
    }
  }];
}

-(void)hideKeyboardAccessoryView
{
  if (_webView == nil) {
    return;
  }
  
  UIView* subview;
  
  for (UIView* view in _webView.scrollView.subviews) {
    if([[view.class description] hasPrefix:@"WK"])
      subview = view;
  }
  
  if(subview == nil) return;
  
  NSString* name = [NSString stringWithFormat:@"%@_SwizzleHelperWK", subview.class.superclass];
  Class newClass = NSClassFromString(name);
  
  if(newClass == nil)
  {
    newClass = objc_allocateClassPair(subview.class, [name cStringUsingEncoding:NSASCIIStringEncoding], 0);
    if(!newClass) return;
    
    Method method = class_getInstanceMethod([_SwizzleHelperWK class], @selector(inputAccessoryView));
    class_addMethod(newClass, @selector(inputAccessoryView), method_getImplementation(method), method_getTypeEncoding(method));
    
    objc_registerClassPair(newClass);
  }
  
  object_setClass(subview, newClass);
}


- (void)setUserAgent:(NSString*)userAgent
{
  _userAgent = userAgent;
  _webView.customUserAgent = userAgent;
}

// UIScrollViewDelegate method
- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  if (_onScroll != nil) {
    NSDictionary *event = @{
      @"contentOffset": @{
        @"x": @(scrollView.contentOffset.x),
        @"y": @(scrollView.contentOffset.y)
      },
      @"contentInset": @{
        @"top": @(scrollView.contentInset.top),
        @"left": @(scrollView.contentInset.left),
        @"bottom": @(scrollView.contentInset.bottom),
        @"right": @(scrollView.contentInset.right)
      },
      @"contentSize": @{
        @"width": @(scrollView.contentSize.width),
        @"height": @(scrollView.contentSize.height)
      },
      @"layoutMeasurement": @{
        @"width": @(scrollView.frame.size.width),
        @"height": @(scrollView.frame.size.height)
      },
      @"zoomScale": @(scrollView.zoomScale ?: 1),
    };
    _onScroll(event);
  }
}


- (void)postMessage:(NSString *)message
{
  NSDictionary *eventInitDict = @{@"data": message};
  NSString *source = [NSString
                      stringWithFormat:@"window.dispatchEvent(new MessageEvent('message', %@));",
                      RCTJSONStringify(eventInitDict, NULL)
  ];
  [self injectJavaScript: source];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  
  // Ensure webview takes the position and dimensions of RNCWebView
  _webView.frame = self.bounds;
  _webView.scrollView.contentInset = UIEdgeInsetsZero;
  
}

- (NSMutableDictionary<NSString *, id> *)baseEvent
{
  NSDictionary *event = @{
    @"url": _webView.URL.absoluteString ?: @"",
    @"title": _webView.title ?: @"",
    @"loading" : @(_webView.loading),
    @"canGoBack": @(_webView.canGoBack),
    @"canGoForward" : @(_webView.canGoForward)
  };
  return [[NSMutableDictionary alloc] initWithDictionary: event];
}


- (void)                    webView:(WKWebView *)webView
  didReceiveAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge
                  completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition disposition, NSURLCredential * _Nullable))completionHandler
{
  NSString* host = nil;
  if (webView.URL != nil) {
    host = webView.URL.host;
  }
  if ([[challenge protectionSpace] authenticationMethod] == NSURLAuthenticationMethodClientCertificate) {
    completionHandler(NSURLSessionAuthChallengeUseCredential, clientAuthenticationCredential);
    return;
  }
  if ([[challenge protectionSpace] serverTrust] != nil && customCertificatesForHost != nil && host != nil) {
    SecCertificateRef localCertificate = (__bridge SecCertificateRef)([customCertificatesForHost objectForKey:host]);
    if (localCertificate != nil) {
      NSData *localCertificateData = (NSData*) CFBridgingRelease(SecCertificateCopyData(localCertificate));
      SecTrustRef trust = [[challenge protectionSpace] serverTrust];
      long count = SecTrustGetCertificateCount(trust);
      for (long i = 0; i < count; i++) {
        SecCertificateRef serverCertificate = SecTrustGetCertificateAtIndex(trust, i);
        if (serverCertificate == nil) { continue; }
        NSData *serverCertificateData = (NSData *) CFBridgingRelease(SecCertificateCopyData(serverCertificate));
        if ([serverCertificateData isEqualToData:localCertificateData]) {
          NSURLCredential *useCredential = [NSURLCredential credentialForTrust:trust];
          if (challenge.sender != nil) {
            [challenge.sender useCredential:useCredential forAuthenticationChallenge:challenge];
          }
          completionHandler(NSURLSessionAuthChallengeUseCredential, useCredential);
          return;
        }
      }
    }
  }
  completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, nil);
}

#pragma mark - WKNavigationDelegate methods

/**
 * alert
 */
- (void)webView:(WKWebView *)webView runJavaScriptAlertPanelWithMessage:(NSString *)message initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(void))completionHandler
{
  if(_disablePromptDuringLoading){
    completionHandler();
    return;
  }
  
  UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"" message:message preferredStyle:UIAlertControllerStyleAlert];
  [alert addAction:[UIAlertAction actionWithTitle:@"Ok" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
    completionHandler();
  }]];
  [[self topViewController] presentViewController:alert animated:YES completion:NULL];
}

/**
 * confirm
 */
- (void)webView:(WKWebView *)webView runJavaScriptConfirmPanelWithMessage:(NSString *)message initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(BOOL))completionHandler{
  
  if(_disablePromptDuringLoading){
    completionHandler(nil);
    return;
  }
  
  UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"" message:message preferredStyle:UIAlertControllerStyleAlert];
  [alert addAction:[UIAlertAction actionWithTitle:@"Ok" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
    completionHandler(YES);
  }]];
  [alert addAction:[UIAlertAction actionWithTitle:@"Cancel" style:UIAlertActionStyleCancel handler:^(UIAlertAction *action) {
    completionHandler(NO);
  }]];
  [[self topViewController] presentViewController:alert animated:YES completion:NULL];
}

/**
 * prompt
 */
- (void)webView:(WKWebView *)webView runJavaScriptTextInputPanelWithPrompt:(NSString *)prompt defaultText:(NSString *)defaultText initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(NSString *))completionHandler{
  
  if(_disablePromptDuringLoading) {
    completionHandler(nil);
    return;
  }
  
  UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"" message:prompt preferredStyle:UIAlertControllerStyleAlert];
  [alert addTextFieldWithConfigurationHandler:^(UITextField *textField) {
    textField.text = defaultText;
  }];
  UIAlertAction *okAction = [UIAlertAction actionWithTitle:@"Ok" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
    completionHandler([[alert.textFields lastObject] text]);
  }];
  [alert addAction:okAction];
  UIAlertAction *cancelAction = [UIAlertAction actionWithTitle:@"Cancel" style:UIAlertActionStyleCancel handler:^(UIAlertAction *action) {
    completionHandler(nil);
  }];
  [alert addAction:cancelAction];
  alert.preferredAction = okAction;
  [[self topViewController] presentViewController:alert animated:YES completion:NULL];
}

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 150000 /* iOS 15 */
/**
 * Media capture permissions (prevent multiple prompts)
 */
- (void)                         webView:(WKWebView *)webView
  requestMediaCapturePermissionForOrigin:(WKSecurityOrigin *)origin
                        initiatedByFrame:(WKFrameInfo *)frame
                                    type:(WKMediaCaptureType)type
                         decisionHandler:(void (^)(WKPermissionDecision decision))decisionHandler {
  // always prompt for the permission
  decisionHandler(WKPermissionDecisionPrompt);
}
#endif


/**
 * topViewController
 */
-(UIViewController *)topViewController{
  return RCTPresentedViewController();
}



/**
 * Decides whether to allow or cancel a navigation.
 * @see https://fburl.com/42r9fxob
 */
- (void)                  webView:(WKWebView *)webView
  decidePolicyForNavigationAction:(WKNavigationAction *)navigationAction
                  decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler
{
  static NSDictionary<NSNumber *, NSString *> *navigationTypes;
  static dispatch_once_t onceToken;
  
  dispatch_once(&onceToken, ^{
    navigationTypes = @{
      @(WKNavigationTypeLinkActivated): @"click",
      @(WKNavigationTypeFormSubmitted): @"formsubmit",
      @(WKNavigationTypeBackForward): @"backforward",
      @(WKNavigationTypeReload): @"reload",
      @(WKNavigationTypeFormResubmitted): @"formresubmit",
      @(WKNavigationTypeOther): @"other",
    };
  });
  
  WKNavigationType navigationType = navigationAction.navigationType;
  NSURLRequest *request = navigationAction.request;
  BOOL isTopFrame = [request.URL isEqual:request.mainDocumentURL];
  
  if (_onShouldStartLoadWithRequest) {
    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    [event addEntriesFromDictionary: @{
      @"url": (request.URL).absoluteString,
      @"mainDocumentURL": (request.mainDocumentURL).absoluteString,
      @"navigationType": navigationTypes[@(navigationType)],
      @"isTopFrame": @(isTopFrame)
    }];
    if (![self.delegate webView:self
      shouldStartLoadForRequest:event
                   withCallback:_onShouldStartLoadWithRequest]) {
      decisionHandler(WKNavigationActionPolicyCancel);
      return;
    }
  }
  
  if (_onLoadingStart) {
    // We have this check to filter out iframe requests and whatnot
    if (isTopFrame) {
      NSMutableDictionary<NSString *, id> *event = [self baseEvent];
      [event addEntriesFromDictionary: @{
        @"url": (request.URL).absoluteString,
        @"navigationType": navigationTypes[@(navigationType)]
      }];
      _onLoadingStart(event);
    }
  }
  
  // Allow all navigation by default
  decisionHandler(WKNavigationActionPolicyAllow);
}

/**
 * Called when the web view’s content process is terminated.
 * @see https://developer.apple.com/documentation/webkit/wknavigationdelegate/1455639-webviewwebcontentprocessdidtermi?language=objc
 */
- (void)webViewWebContentProcessDidTerminate:(WKWebView *)webView
{
  RCTLogWarn(@"Webview Process Terminated");
  if (_onContentProcessDidTerminate) {
    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    _onContentProcessDidTerminate(event);
  }
}

/**
 * Decides whether to allow or cancel a navigation after its response is known.
 * @see https://developer.apple.com/documentation/webkit/wknavigationdelegate/1455643-webview?language=objc
 */
- (void)                    webView:(WKWebView *)webView
  decidePolicyForNavigationResponse:(WKNavigationResponse *)navigationResponse
                    decisionHandler:(void (^)(WKNavigationResponsePolicy))decisionHandler
{
  WKNavigationResponsePolicy policy = WKNavigationResponsePolicyAllow;
  if (_onHttpError && navigationResponse.forMainFrame) {
    if ([navigationResponse.response isKindOfClass:[NSHTTPURLResponse class]]) {
      NSHTTPURLResponse *response = (NSHTTPURLResponse *)navigationResponse.response;
      NSInteger statusCode = response.statusCode;
      
      if (statusCode >= 400) {
        NSMutableDictionary<NSString *, id> *httpErrorEvent = [self baseEvent];
        [httpErrorEvent addEntriesFromDictionary: @{
          @"url": response.URL.absoluteString,
          @"statusCode": @(statusCode)
        }];
        
        _onHttpError(httpErrorEvent);
      }
      
      NSString *disposition = nil;
      if (@available(iOS 13, *)) {
        disposition = [response valueForHTTPHeaderField:@"Content-Disposition"];
      }
      BOOL isAttachment = disposition != nil && [disposition hasPrefix:@"attachment"];
      if (isAttachment || !navigationResponse.canShowMIMEType) {
        RCTLogWarn(@"Downloading the file is not supported in Webview!");
      }
    }
  }
  
  decisionHandler(policy);
}

/**
 * Called when an error occurs while the web view is loading content.
 * @see https://fburl.com/km6vqenw
 */
- (void)               webView:(WKWebView *)webView
  didFailProvisionalNavigation:(WKNavigation *)navigation
                     withError:(NSError *)error
{
  if (_onLoadingError) {
    if ([error.domain isEqualToString:NSURLErrorDomain] && error.code == NSURLErrorCancelled) {
      // NSURLErrorCancelled is reported when a page has a redirect OR if you load
      // a new URL in the WebView before the previous one came back. We can just
      // ignore these since they aren't real errors.
      // http://stackoverflow.com/questions/1024748/how-do-i-fix-nsurlerrordomain-error-999-in-iphone-3-0-os
      return;
    }
    
    if ([error.domain isEqualToString:@"WebKitErrorDomain"] &&
        (error.code == 102 || error.code == 101)) {
      // Error code 102 "Frame load interrupted" is raised by the WKWebView
      // when the URL is from an http redirect. This is a common pattern when
      // implementing OAuth with a WebView.
      return;
    }
    
    NSMutableDictionary<NSString *, id> *event = [self baseEvent];
    [event addEntriesFromDictionary:@{
      @"didFailProvisionalNavigation": @YES,
      @"domain": error.domain,
      @"code": @(error.code),
      @"description": error.localizedDescription,
    }];
    _onLoadingError(event);
  }
}

- (void)evaluateJS:(NSString *)js
          thenCall: (void (^)(NSString*)) callback
{
  [self.webView evaluateJavaScript: js completionHandler: ^(id result, NSError *error) {
    if (callback != nil) {
      callback([NSString stringWithFormat:@"%@", result]);
    }
    if (error != nil) {
      RCTLogWarn(@"%@", [NSString stringWithFormat:@"Error evaluating injectedJavaScript: This is possibly due to an unsupported return type. Try adding true to the end of your injectedJavaScript string. %@", error]);
    }
  }];
}


/**
 * Called when the navigation is complete.
 * @see https://fburl.com/rtys6jlb
 */
- (void)webView:(WKWebView *)webView
didFinishNavigation:(WKNavigation *)navigation
{
  if (_onLoadingFinish) {
    _disablePromptDuringLoading = NO;
    _onLoadingFinish([self baseEvent]);
  }
}

- (void)injectJavaScript:(NSString *)script
{
  [self evaluateJS: script thenCall: nil];
}

- (void)goForward
{
  [_webView goForward];
}

- (void)goBack
{
  [_webView goBack];
}

- (void)reload
{
  /**
   * When the initial load fails due to network connectivity issues,
   * [_webView reload] doesn't reload the webpage. Therefore, we must
   * manually call [_webView loadRequest:request].
   */
  NSURLRequest *request = [self requestForSource:self.source];
  
  if (request.URL && !_webView.URL.absoluteString.length) {
    [_webView loadRequest:request];
  } else {
    [_webView reload];
  }
}


- (void)stopLoading
{
  [_webView stopLoading];
}

- (void)requestFocus
{
  [_webView becomeFirstResponder];
}


- (void)enableMessaging {
  self.postMessageScript =
  [
    [WKUserScript alloc]
    initWithSource: [
      NSString
      stringWithFormat:
        @"window.%@ = {"
      "  postMessage: function (data) {"
      "    window.webkit.messageHandlers.%@.postMessage(String(data));"
      "  }"
      "};", MessageHandlerName, MessageHandlerName
    ]
    injectionTime:WKUserScriptInjectionTimeAtDocumentStart
    /* TODO: For a separate (minor) PR: use logic like this (as react-native-wkwebview does) so that messaging can be used in all frames if desired.
     *       I am keeping it as YES for consistency with previous behaviour. */
    // forMainFrameOnly:_messagingEnabledForMainFrameOnly
    forMainFrameOnly:YES
  ];
  
  if(_webView != nil){
    [self resetupScripts:_webView.configuration];
  }
}

- (void)writeCookiesToWebView:(NSArray<NSHTTPCookie *>*)cookies completion:(void (^)(void))completion {
   if(completion) {
    completion();
  }
}

- (void)syncCookiesToWebView:(void (^)(void))completion {
  NSArray<NSHTTPCookie *> *cookies = [[NSHTTPCookieStorage sharedHTTPCookieStorage] cookies];
  [self writeCookiesToWebView:cookies completion:completion];
}

- (void)resetupScripts:(WKWebViewConfiguration *)wkWebViewConfig {
  [wkWebViewConfig.userContentController removeAllUserScripts];
  [wkWebViewConfig.userContentController removeScriptMessageHandlerForName:MessageHandlerName];
  
  NSString *html5HistoryAPIShimSource = [NSString stringWithFormat:
                                           @"(function(history) {\n"
                                         "  function notify(type) {\n"
                                         "    setTimeout(function() {\n"
                                         "      window.webkit.messageHandlers.%@.postMessage(type)\n"
                                         "    }, 0)\n"
                                         "  }\n"
                                         "  function shim(f) {\n"
                                         "    return function pushState() {\n"
                                         "      notify('other')\n"
                                         "      return f.apply(history, arguments)\n"
                                         "    }\n"
                                         "  }\n"
                                         "  history.pushState = shim(history.pushState)\n"
                                         "  history.replaceState = shim(history.replaceState)\n"
                                         "  window.addEventListener('popstate', function() {\n"
                                         "    notify('backforward')\n"
                                         "  })\n"
                                         "})(window.history)\n", HistoryShimName
  ];
  WKUserScript *script = [[WKUserScript alloc] initWithSource:html5HistoryAPIShimSource injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:YES];
  [wkWebViewConfig.userContentController addUserScript:script];
  

    if (self.postMessageScript){
      [wkWebViewConfig.userContentController addScriptMessageHandler:[[RNCWeakScriptMessageDelegate alloc] initWithDelegate:self]
                                                                name:MessageHandlerName];
      [wkWebViewConfig.userContentController addUserScript:self.postMessageScript];
    }
    if (self.atEndScript) {
      [wkWebViewConfig.userContentController addUserScript:self.atEndScript];
    }

  // Whether or not messaging is enabled, add the startup script if it exists.
  if (self.atStartScript) {
    [wkWebViewConfig.userContentController addUserScript:self.atStartScript];
  }
}

- (NSURLRequest *)requestForSource:(id)json {
  NSURLRequest *request = [RCTConvert NSURLRequest:self.source];
  return request;
}

@end

@implementation RNCWeakScriptMessageDelegate

- (instancetype)initWithDelegate:(id<WKScriptMessageHandler>)scriptDelegate {
  self = [super init];
  if (self) {
    _scriptDelegate = scriptDelegate;
  }
  return self;
}

- (void)userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message {
  [self.scriptDelegate userContentController:userContentController didReceiveScriptMessage:message];
}

@end
