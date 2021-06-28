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


public class HTTPClientFactory implements OkHttpClientFactory {
    // TODO: remove "xumm-cdn.imgix.net" after migration period
    private static List<String> trustedHosts = Arrays.asList("xumm-cdn.imgix.net", "cdn.xumm.pro", "xumm.app");
    private static String defaultHost = "xumm.app";

    private final class HostSelectionInterceptor implements Interceptor {
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

    @Override
    public OkHttpClient createNewNetworkModuleClient() {

        HostSelectionInterceptor interceptor = new HostSelectionInterceptor();

        OkHttpClient.Builder client = new OkHttpClient.Builder()
                .connectTimeout(0, TimeUnit.MILLISECONDS)
                .readTimeout(0, TimeUnit.MILLISECONDS)
                .writeTimeout(0, TimeUnit.MILLISECONDS)
                .cookieJar(new ReactCookieJarContainer())
                .addInterceptor(interceptor);
        return client.build();
    }
}