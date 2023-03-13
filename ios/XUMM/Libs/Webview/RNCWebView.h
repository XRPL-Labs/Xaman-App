/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTView.h>
#import <React/RCTDefines.h>
#import <WebKit/WebKit.h>

@class RNCWebView;

@protocol RNCWebViewDelegate <NSObject>

- (BOOL)webView:(RNCWebView *_Nonnull)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *_Nonnull)request
   withCallback:(RCTDirectEventBlock _Nonnull)callback;

@end

@interface RNCWeakScriptMessageDelegate : NSObject<WKScriptMessageHandler>

@property (nonatomic, weak, nullable) id<WKScriptMessageHandler> scriptDelegate;

- (nullable instancetype)initWithDelegate:(id<WKScriptMessageHandler> _Nullable)scriptDelegate;

@end

@interface RNCWebView : RCTView

@property (nonatomic, weak) id<RNCWebViewDelegate> _Nullable delegate;
@property (nonatomic, copy) NSDictionary * _Nullable source;
@property (nonatomic, assign) BOOL incognito;
@property (nonatomic, copy) NSString * _Nullable userAgent;

@property (nonatomic, copy) NSArray<NSDictionary *> * _Nullable menuItems;
@property (nonatomic, copy) RCTDirectEventBlock onCustomMenuSelection;

- (void)postMessage:(NSString *_Nullable)message;
- (void)goForward;
- (void)goBack;
- (void)reload;
- (void)stopLoading;
- (void)requestFocus;

@end
