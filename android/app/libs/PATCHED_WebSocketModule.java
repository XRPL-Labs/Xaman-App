/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.websocket;

import android.util.Log;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.fbreact.specs.NativeWebSocketModuleSpec;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.network.CustomClientBuilder;
import com.facebook.react.modules.network.ForwardingCookieHandler;
import java.io.IOException;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import okhttp3.Dns;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okio.ByteString;

@ReactModule(name = NativeWebSocketModuleSpec.NAME)
public final class WebSocketModule extends NativeWebSocketModuleSpec {
  private static final String TAG = "WebSocketModule";
  
  public interface ContentHandler {
    void onMessage(String text, WritableMap params);

    void onMessage(ByteString byteString, WritableMap params);
  }

  private static class IPv4PreferredDns implements Dns {
    @Override
    public List<InetAddress> lookup(String hostname) throws UnknownHostException {
      Log.i(TAG, "IPv4PreferredDns: Starting DNS lookup for hostname: " + hostname);
      
      List<InetAddress> addresses = Dns.SYSTEM.lookup(hostname);
      List<InetAddress> ipv4Addresses = new ArrayList<>();
      List<InetAddress> ipv6Addresses = new ArrayList<>();
      
      Log.i(TAG, "IPv4PreferredDns: Found " + addresses.size() + " total addresses for " + hostname);
      
      // Separate IPv4 and IPv6 addresses
      for (InetAddress address : addresses) {
        if (address instanceof Inet4Address) {
          ipv4Addresses.add(address);
          Log.i(TAG, "IPv4PreferredDns: Found IPv4 address: " + address.getHostAddress());
        } else {
          ipv6Addresses.add(address);
          Log.i(TAG, "IPv4PreferredDns: Found IPv6 address: " + address.getHostAddress());
        }
      }
      
      // If no IPv4 addresses found but IPv6 exists, use IPv6
      if (ipv4Addresses.isEmpty() && !ipv6Addresses.isEmpty()) {
        Log.w(TAG, "IPv4PreferredDns: No IPv4 addresses found for " + hostname + ", using IPv6 addresses");
        return ipv6Addresses;
      }
      
      // If IPv4 addresses exist, use only IPv4 addresses
      if (!ipv4Addresses.isEmpty()) {
        Log.i(TAG, "IPv4PreferredDns: Using only IPv4 addresses for " + hostname + " - IPv4 count: " + ipv4Addresses.size());
        if (ipv4Addresses.get(0) instanceof Inet4Address) {
          Log.i(TAG, "IPv4PreferredDns: Primary IPv4 address: " + ipv4Addresses.get(0).getHostAddress() + " for " + hostname);
        }
        return ipv4Addresses;
      }
      
      // Fallback to original addresses if neither IPv4 nor IPv6 found (shouldn't happen)
      Log.w(TAG, "IPv4PreferredDns: No addresses found, falling back to original list for " + hostname);
      return addresses;
    }
  }

  private final Map<Integer, WebSocket> mWebSocketConnections = new ConcurrentHashMap<>();
  private final Map<Integer, ContentHandler> mContentHandlers = new ConcurrentHashMap<>();

  private ForwardingCookieHandler mCookieHandler;

  private static @Nullable CustomClientBuilder customClientBuilder = null;

  public WebSocketModule(ReactApplicationContext context) {
    super(context);
    mCookieHandler = new ForwardingCookieHandler(context);
    Log.i(TAG, "========== IPv4 PREFERRED WEBSOCKET MODULE (B) LOADED ==========");
  }

  public static void setCustomClientBuilder(CustomClientBuilder ccb) {
    customClientBuilder = ccb;
  }

  private static void applyCustomBuilder(OkHttpClient.Builder builder) {
    if (customClientBuilder != null) {
      customClientBuilder.apply(builder);
    }
  }

  @Override
  public void invalidate() {
    Log.i(TAG, "Invalidating WebSocket module - closing all connections");
    for (WebSocket socket : mWebSocketConnections.values()) {
      socket.close(1001 /* endpoint is going away */, null);
    }
    mWebSocketConnections.clear();
    mContentHandlers.clear();
  }

  private void sendEvent(String eventName, WritableMap params) {
    ReactApplicationContext reactApplicationContext = getReactApplicationContext();
    if (reactApplicationContext.hasActiveReactInstance()) {
      reactApplicationContext.emitDeviceEvent(eventName, params);
    }
  }

  public void setContentHandler(final int id, final ContentHandler contentHandler) {
    if (contentHandler != null) {
      mContentHandlers.put(id, contentHandler);
    } else {
      mContentHandlers.remove(id);
    }
  }

  @Override
  public void connect(
      final String url,
      @Nullable final ReadableArray protocols,
      @Nullable final ReadableMap options,
      final double socketID) {
    final int id = (int) socketID;
    
    Log.i(TAG, "Connecting to WebSocket with IPv4 preference enabled - URL: " + url + ", ID: " + id);
    
    OkHttpClient.Builder okHttpBuilder =
        new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .writeTimeout(10, TimeUnit.SECONDS)
            .readTimeout(0, TimeUnit.MINUTES) // Disable timeouts for read
            .dns(new IPv4PreferredDns()); // Prefer IPv4 over IPv6

    applyCustomBuilder(okHttpBuilder);

    OkHttpClient client = okHttpBuilder.build();

    Request.Builder builder = new Request.Builder().tag(id).url(url);

    String cookie = getCookie(url);
    if (cookie != null) {
      builder.addHeader("Cookie", cookie);
    }

    boolean hasOriginHeader = false;

    if (options != null
        && options.hasKey("headers")
        && options.getType("headers").equals(ReadableType.Map)) {

      ReadableMap headers = options.getMap("headers");
      ReadableMapKeySetIterator iterator = headers.keySetIterator();

      while (iterator.hasNextKey()) {
        String key = iterator.nextKey();
        if (ReadableType.String.equals(headers.getType(key))) {
          if (key.equalsIgnoreCase("origin")) {
            hasOriginHeader = true;
          }
          builder.addHeader(key, headers.getString(key));
        } else {
          FLog.w(ReactConstants.TAG, "Ignoring: requested " + key + ", value not a string");
        }
      }
    }

    if (!hasOriginHeader) {
      builder.addHeader("origin", getDefaultOrigin(url));
    }

    if (protocols != null && protocols.size() > 0) {
      StringBuilder protocolsValue = new StringBuilder("");
      for (int i = 0; i < protocols.size(); i++) {
        String v = protocols.getString(i).trim();
        if (!v.isEmpty() && !v.contains(",")) {
          protocolsValue.append(v);
          protocolsValue.append(",");
        }
      }
      if (protocolsValue.length() > 0) {
        protocolsValue.replace(protocolsValue.length() - 1, protocolsValue.length(), "");
        builder.addHeader("Sec-WebSocket-Protocol", protocolsValue.toString());
      }
    }

    client.newWebSocket(
        builder.build(),
        new WebSocketListener() {

          @Override
          public void onOpen(WebSocket webSocket, Response response) {
            mWebSocketConnections.put(id, webSocket);
            Log.i(TAG, "Successfully connected to WebSocket with IPv4 preference - ID: " + id);
            WritableMap params = Arguments.createMap();
            params.putInt("id", id);
            params.putString("protocol", response.header("Sec-WebSocket-Protocol", ""));
            sendEvent("websocketOpen", params);
          }

          @Override
          public void onClosing(WebSocket websocket, int code, String reason) {
            Log.i(TAG, "WebSocket closing - ID: " + id + ", Code: " + code + ", Reason: " + reason);
            websocket.close(code, reason);
          }

          @Override
          public void onClosed(WebSocket webSocket, int code, String reason) {
            Log.i(TAG, "WebSocket closed - ID: " + id + ", Code: " + code + ", Reason: " + reason);
            WritableMap params = Arguments.createMap();
            params.putInt("id", id);
            params.putInt("code", code);
            params.putString("reason", reason);
            sendEvent("websocketClosed", params);
          }

          @Override
          public void onFailure(WebSocket webSocket, Throwable t, Response response) {
            Log.e(TAG, "WebSocket connection failed - ID: " + id + ", Error: " + t.getMessage());
            notifyWebSocketFailed(id, t.getMessage());
          }

          @Override
          public void onMessage(WebSocket webSocket, String text) {
            Log.d(TAG, "Received text message - ID: " + id + ", Length: " + text.length());
            WritableMap params = Arguments.createMap();
            params.putInt("id", id);
            params.putString("type", "text");

            ContentHandler contentHandler = mContentHandlers.get(id);
            if (contentHandler != null) {
              contentHandler.onMessage(text, params);
            } else {
              params.putString("data", text);
            }
            sendEvent("websocketMessage", params);
          }

          @Override
          public void onMessage(WebSocket webSocket, ByteString bytes) {
            Log.d(TAG, "Received binary message - ID: " + id + ", Bytes: " + bytes.size());
            WritableMap params = Arguments.createMap();
            params.putInt("id", id);
            params.putString("type", "binary");

            ContentHandler contentHandler = mContentHandlers.get(id);
            if (contentHandler != null) {
              contentHandler.onMessage(bytes, params);
            } else {
              String text = bytes.base64();

              params.putString("data", text);
            }

            sendEvent("websocketMessage", params);
          }
        });

    // Trigger shutdown of the dispatcher's executor so this process can exit cleanly
    client.dispatcher().executorService().shutdown();
  }

  @Override
  public void close(double code, String reason, double socketID) {
    int id = (int) socketID;
    Log.i(TAG, "Closing WebSocket - ID: " + id + ", Code: " + (int)code + ", Reason: " + reason);
    WebSocket client = mWebSocketConnections.get(id);
    if (client == null) {
      // WebSocket is already closed
      // Don't do anything, mirror the behaviour on web
      Log.w(TAG, "Attempted to close already closed WebSocket - ID: " + id);
      return;
    }
    try {
      client.close((int) code, reason);
      mWebSocketConnections.remove(id);
      mContentHandlers.remove(id);
    } catch (Exception e) {
      Log.e(TAG, "Could not close WebSocket connection for id " + id, e);
      FLog.e(ReactConstants.TAG, "Could not close WebSocket connection for id " + id, e);
    }
  }

  @Override
  public void send(String message, double socketID) {
    final int id = (int) socketID;
    Log.d(TAG, "Sending text message - ID: " + id + ", Length: " + message.length());
    WebSocket client = mWebSocketConnections.get(id);
    if (client == null) {
      // This is a programmer error -- display development warning
      Log.e(TAG, "Cannot send message - WebSocket client is null for ID: " + id);
      WritableMap params = Arguments.createMap();
      params.putInt("id", id);
      params.putString("message", "client is null");
      sendEvent("websocketFailed", params);
      params = Arguments.createMap();
      params.putInt("id", id);
      params.putInt("code", 0);
      params.putString("reason", "client is null");
      sendEvent("websocketClosed", params);
      mWebSocketConnections.remove(id);
      mContentHandlers.remove(id);
      return;
    }
    try {
      client.send(message);
    } catch (Exception e) {
      Log.e(TAG, "Failed to send text message - ID: " + id + ", Error: " + e.getMessage());
      notifyWebSocketFailed(id, e.getMessage());
    }
  }

  @Override
  public void sendBinary(String base64String, double socketID) {
    final int id = (int) socketID;
    Log.d(TAG, "Sending binary message (base64) - ID: " + id + ", Length: " + base64String.length());
    WebSocket client = mWebSocketConnections.get(id);
    if (client == null) {
      // This is a programmer error -- display development warning
      Log.e(TAG, "Cannot send binary message - WebSocket client is null for ID: " + id);
      WritableMap params = Arguments.createMap();
      params.putInt("id", id);
      params.putString("message", "client is null");
      sendEvent("websocketFailed", params);
      params = Arguments.createMap();
      params.putInt("id", id);
      params.putInt("code", 0);
      params.putString("reason", "client is null");
      sendEvent("websocketClosed", params);
      mWebSocketConnections.remove(id);
      mContentHandlers.remove(id);
      return;
    }
    try {
      client.send(ByteString.decodeBase64(base64String));
    } catch (Exception e) {
      Log.e(TAG, "Failed to send binary message - ID: " + id + ", Error: " + e.getMessage());
      notifyWebSocketFailed(id, e.getMessage());
    }
  }

  public void sendBinary(ByteString byteString, int id) {
    Log.d(TAG, "Sending binary message (ByteString) - ID: " + id + ", Bytes: " + byteString.size());
    WebSocket client = mWebSocketConnections.get(id);
    if (client == null) {
      // This is a programmer error -- display development warning
      Log.e(TAG, "Cannot send binary ByteString - WebSocket client is null for ID: " + id);
      WritableMap params = Arguments.createMap();
      params.putInt("id", id);
      params.putString("message", "client is null");
      sendEvent("websocketFailed", params);
      params = Arguments.createMap();
      params.putInt("id", id);
      params.putInt("code", 0);
      params.putString("reason", "client is null");
      sendEvent("websocketClosed", params);
      mWebSocketConnections.remove(id);
      mContentHandlers.remove(id);
      return;
    }
    try {
      client.send(byteString);
    } catch (Exception e) {
      Log.e(TAG, "Failed to send binary ByteString - ID: " + id + ", Error: " + e.getMessage());
      notifyWebSocketFailed(id, e.getMessage());
    }
  }

  @Override
  public void ping(double socketID) {
    final int id = (int) socketID;
    Log.d(TAG, "Sending ping - ID: " + id);
    WebSocket client = mWebSocketConnections.get(id);
    if (client == null) {
      // This is a programmer error -- display development warning
      Log.e(TAG, "Cannot send ping - WebSocket client is null for ID: " + id);
      WritableMap params = Arguments.createMap();
      params.putInt("id", id);
      params.putString("message", "client is null");
      sendEvent("websocketFailed", params);
      params = Arguments.createMap();
      params.putInt("id", id);
      params.putInt("code", 0);
      params.putString("reason", "client is null");
      sendEvent("websocketClosed", params);
      mWebSocketConnections.remove(id);
      mContentHandlers.remove(id);
      return;
    }
    try {
      client.send(ByteString.EMPTY);
    } catch (Exception e) {
      Log.e(TAG, "Failed to send ping - ID: " + id + ", Error: " + e.getMessage());
      notifyWebSocketFailed(id, e.getMessage());
    }
  }

  private void notifyWebSocketFailed(int id, String message) {
    Log.e(TAG, "WebSocket failed - ID: " + id + ", Message: " + message);
    WritableMap params = Arguments.createMap();
    params.putInt("id", id);
    params.putString("message", message);
    sendEvent("websocketFailed", params);
  }

  /**
   * Get the default HTTP(S) origin for a specific WebSocket URI
   *
   * @param uri
   * @return A string of the endpoint converted to HTTP protocol (http[s]://host[:port])
   */
  private static String getDefaultOrigin(String uri) {
    try {
      String defaultOrigin;
      String scheme = "";

      URI requestURI = new URI(uri);
      switch (requestURI.getScheme()) {
        case "wss":
          scheme += "https";
          break;
        case "ws":
          scheme += "http";
          break;
        case "http":
        case "https":
          scheme += requestURI.getScheme();
          break;
        default:
          break;
      }

      if (requestURI.getPort() != -1) {
        defaultOrigin =
            String.format("%s://%s:%s", scheme, requestURI.getHost(), requestURI.getPort());
      } else {
        defaultOrigin = String.format("%s://%s", scheme, requestURI.getHost());
      }

      return defaultOrigin;
    } catch (URISyntaxException e) {
      throw new IllegalArgumentException("Unable to set " + uri + " as default origin header");
    }
  }

  /**
   * Get the cookie for a specific domain
   *
   * @param uri
   * @return The cookie header or null if none is set
   */
  private String getCookie(String uri) {
    try {
      URI origin = new URI(getDefaultOrigin(uri));
      Map<String, List<String>> cookieMap = mCookieHandler.get(origin, new HashMap());
      List<String> cookieList = cookieMap.get("Cookie");

      if (cookieList == null || cookieList.isEmpty()) {
        return null;
      }

      return cookieList.get(0);
    } catch (URISyntaxException | IOException e) {
      throw new IllegalArgumentException("Unable to get cookie from " + uri);
    }
  }

  @Override
  public void addListener(String eventName) {}

  @Override
  public void removeListeners(double count) {}
}