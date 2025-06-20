package libs.common;

import com.facebook.react.modules.network.OkHttpClientFactory;
import com.facebook.react.modules.network.ReactCookieJarContainer;

import java.util.concurrent.TimeUnit;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.List;
import java.util.Arrays;

import okhttp3.OkHttpClient;
import okhttp3.Dns;
import okhttp3.HttpUrl;
import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.Dispatcher;

import java.io.IOException;
import android.util.Log;

public class HTTPClientFactory implements OkHttpClientFactory {
    private static final String TAG = "HTTPClientFactory";
    // TODO: remove "xumm-cdn.imgix.net", "cdn.xumm.pro". "xumm.app" after migration period
    private static final List<String> trustedHosts = Arrays.asList("xumm-cdn.imgix.net", "xrplcluster.com", "xahau.network", "custom-node.xrpl-labs.com", "cdn.xumm.pro", "xumm.app", "cdn.xaman.app", "xaman.app", "image-proxy.xrpl-labs.com");
    private static final String defaultHost = "xaman.app";

    @Override
    public OkHttpClient createNewNetworkModuleClient() {

        HostSelectionInterceptor interceptor = new HostSelectionInterceptor();
        IPv4PreferredDns ipv4Dns = new IPv4PreferredDns();
        ConnectionLoggingInterceptor connectionLogger = new ConnectionLoggingInterceptor();

        Dispatcher dispatcher = new Dispatcher();
        dispatcher.setMaxRequestsPerHost(64);
        dispatcher.setMaxRequests(128);

        OkHttpClient.Builder client = new OkHttpClient.Builder()
                .connectTimeout(0, TimeUnit.MILLISECONDS)
                .readTimeout(0, TimeUnit.MILLISECONDS)
                .writeTimeout(0, TimeUnit.MILLISECONDS)
                .dispatcher(dispatcher)
                .cookieJar(new ReactCookieJarContainer())
                .dns(ipv4Dns) // Add custom DNS resolver
                .addNetworkInterceptor(connectionLogger) // Add connection logging
                .addInterceptor(interceptor);
        return client.build();
    }

    private static final class HostSelectionInterceptor implements Interceptor {
        @Override
        public Response intercept(Chain chain) throws IOException {
            Request request = chain.request();
            String originalHost = request.url().host();

            if (!trustedHosts.contains(originalHost)) {
                // Log.d(TAG, "HostSelectionInterceptor: Redirecting from " + originalHost + " to " + defaultHost);
                HttpUrl newUrl = request.url().newBuilder()
                        .host(defaultHost)
                        .build();
                request = request.newBuilder()
                        .url(newUrl)
                        .build();
            } else {
                // Log.d(TAG, "HostSelectionInterceptor: Using trusted host " + originalHost);
            }
            return chain.proceed(request);
        }
    }

    /**
     * Interceptor to log connection attempts and outcomes
     */
    private static final class ConnectionLoggingInterceptor implements Interceptor {
        @Override
        public Response intercept(Chain chain) throws IOException {
            Request request = chain.request();
            String url = request.url().toString();
            
            // Log.d(TAG, "=== HTTP Request Start ===");
            // Log.d(TAG, "URL: " + url);
            // Log.d(TAG, "Host: " + request.url().host());
            
            long startTime = System.currentTimeMillis();
            
            try {
                Response response = chain.proceed(request);
                long duration = System.currentTimeMillis() - startTime;
                
                // Log.d(TAG, "=== HTTP Request Success ===");
                // Log.d(TAG, "Response Code: " + response.code());
                // Log.d(TAG, "Duration: " + duration + "ms");
                // Log.d(TAG, "Protocol: " + response.protocol());
                
                return response;
                
            } catch (IOException e) {
                long duration = System.currentTimeMillis() - startTime;
                
                // Log.e(TAG, "=== HTTP Request Failed ===");
                // Log.e(TAG, "URL: " + url);
                // Log.e(TAG, "Duration: " + duration + "ms");
                // Log.e(TAG, "Error: " + e.getMessage());
                // Log.e(TAG, "Error Type: " + e.getClass().getSimpleName());
                
                throw e;
            }
        }
    }

    /**
     * Custom DNS resolver that intelligently prefers IPv4 on dual-stack networks
     * but gracefully handles IPv6-only networks
     */
    private static final class IPv4PreferredDns implements Dns {
        @Override
        public List<InetAddress> lookup(String hostname) throws UnknownHostException {
            // Log.d(TAG, "=== DNS Lookup Start ===");
            // Log.d(TAG, "Hostname: " + hostname);
            
            try {
                // Get all addresses for the hostname
                InetAddress[] allAddresses = InetAddress.getAllByName(hostname);
                
                // Log.d(TAG, "Total addresses found: " + allAddresses.length);
                
                List<InetAddress> ipv4Addresses = new ArrayList<>();
                List<InetAddress> ipv6Addresses = new ArrayList<>();
                
                // Separate IPv4 and IPv6 addresses and log each one
                for (int i = 0; i < allAddresses.length; i++) {
                    InetAddress address = allAddresses[i];
                    String addressStr = address.getHostAddress();
                    String type = (address.getAddress().length == 4) ? "IPv4" : "IPv6";
                    
                    // Log.d(TAG, "Address " + (i+1) + ": " + addressStr + " (" + type + ")");
                    
                    if (address.getAddress().length == 4) {
                        // IPv4 address (4 bytes)
                        ipv4Addresses.add(address);
                    } else {
                        // IPv6 address (16 bytes)
                        ipv6Addresses.add(address);
                    }
                }
                
                // Log.d(TAG, "IPv4 addresses found: " + ipv4Addresses.size());
                // Log.d(TAG, "IPv6 addresses found: " + ipv6Addresses.size());
                
                // Strategy: prefer IPv4 on dual-stack, use what's available on single-stack
                List<InetAddress> result = new ArrayList<>();
                
                if (!ipv4Addresses.isEmpty() && !ipv6Addresses.isEmpty()) {
                    // Dual-stack: prefer IPv4 to avoid IPv6 SLAAC issues
                    // Log.d(TAG, "Dual-stack detected: Prioritizing IPv4 addresses");
                    result.addAll(ipv4Addresses);
                    result.addAll(ipv6Addresses); // Keep IPv6 as fallback
                } else if (!ipv4Addresses.isEmpty()) {
                    // IPv4-only network
                    // Log.d(TAG, "IPv4-only network detected");
                    result.addAll(ipv4Addresses);
                } else if (!ipv6Addresses.isEmpty()) {
                    // IPv6-only network: use IPv6 addresses
                    // Log.d(TAG, "IPv6-only network detected");
                    result.addAll(ipv6Addresses);
                } else {
                    // No addresses found, fall back to system DNS
                    Log.w(TAG, "No addresses found, falling back to system DNS");
                    return Dns.SYSTEM.lookup(hostname);
                }
                
                // Log the final resolution order
                // Log.d(TAG, "=== Final DNS Resolution Order ===");
                for (int i = 0; i < result.size(); i++) {
                    InetAddress addr = result.get(i);
                    String type = (addr.getAddress().length == 4) ? "IPv4" : "IPv6";
                    // Log.d(TAG, "Priority " + (i+1) + ": " + addr.getHostAddress() + " (" + type + ")");
                }
                
                return result;
                
            } catch (UnknownHostException e) {
                // If custom resolution fails, fall back to system DNS
                // Log.e(TAG, "DNS resolution failed: " + e.getMessage());
                // Log.d(TAG, "Falling back to system DNS");
                return Dns.SYSTEM.lookup(hostname);
            }
        }
    }
}