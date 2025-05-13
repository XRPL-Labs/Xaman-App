package libs.common;

import com.facebook.react.modules.network.OkHttpClientFactory;
import com.facebook.react.modules.network.ReactCookieJarContainer;

import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import okhttp3.HttpUrl;
import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Dispatcher;

public class HTTPClientFactory implements OkHttpClientFactory {
    // TODO: remove "xumm-cdn.imgix.net", "cdn.xumm.pro". "xumm.app" after migration period
    private static final List<String> trustedHosts = Arrays.asList("xumm-cdn.imgix.net", "cdn.xumm.pro", "xumm.app", "cdn.xaman.app", "xaman.app", "image-proxy.xrpl-labs.com");
    private static final String defaultHost = "xaman.app";

    @Override
    public OkHttpClient createNewNetworkModuleClient() {

        HostSelectionInterceptor interceptor = new HostSelectionInterceptor();

        Dispatcher dispatcher = new Dispatcher();
            dispatcher.setMaxRequestsPerHost(64);
            dispatcher.setMaxRequests(128);

        OkHttpClient.Builder client = new OkHttpClient.Builder()
                .connectTimeout(0, TimeUnit.MILLISECONDS)
                .readTimeout(0, TimeUnit.MILLISECONDS)
                .writeTimeout(0, TimeUnit.MILLISECONDS)
                .dispatcher(dispatcher)
                .cookieJar(new ReactCookieJarContainer())
                .addInterceptor(interceptor);
        return client.build();
    }

    private static final class HostSelectionInterceptor implements Interceptor {
        @Override
        public okhttp3.Response intercept(Chain chain) throws IOException {
            Request request = chain.request();

            if (!trustedHosts.contains(request.url().host())) {
                HttpUrl newUrl = request.url().newBuilder()
                        .host(defaultHost)
                        .build();
                request = request.newBuilder()
                        .url(newUrl)
                        .build();
            }
            return chain.proceed(request);
        }
    }
}
