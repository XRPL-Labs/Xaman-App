// WARNING: THE FUNCTIONALITY OF THIS MODULE HAS NOT BEEN TESTED YET

package libs.common;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.List;
import java.util.HashMap;
import java.util.ArrayList;

import android.util.Log;

import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.ProductDetailsResponseListener;
import com.android.billingclient.api.PurchasesResponseListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.facebook.common.internal.ImmutableList;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.AcknowledgePurchaseResponseListener;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;


@ReactModule(name = InAppPurchaseModule.NAME)
public class InAppPurchaseModule extends ReactContextBaseJavaModule implements PurchasesUpdatedListener {

    private static final String TAG = "InAppPurchaseModule";

    private static final String XUMMProProductIdentifier = "com.xrpllabs.xumm.pro.test";

    private static final String E_UNABLE_TO_INIT_MODULE = "E_UNABLE_TO_INIT_MODULE";
    private static final String E_PLAYSERVICE_NO_AVAILABLE = "E_UNABLE_TO_INIT_MODULE";
    private static final String E_CLIENT_IS_NOT_READY = "E_CLIENT_IS_NOT_READY";
    private static final String E_PRODUCT_IS_NOT_AVAILABLE = "E_PRODUCT_IS_NOT_AVAILABLE";
    private static final String E_PURCHAES_CANCELED = "E_PURCHAES_CANCELED";
    private static final String E_PURCHAES_FALIED = "E_PURCHAES_FALIED";
    private static final String E_ALREADY_PURCHASED = "E_ALREADY_PURCHASED";
    private static final String E_NO_PURCHASE_HISTORY = "E_NO_PURCHASE_HISTORY";


    private static ReactApplicationContext reactContext;
    private HashMap<String, ArrayList<Promise>> promises = new HashMap<>();

    private final GoogleApiAvailability googleApiAvailability;

    private BillingClient.Builder mBillingClientBuilder;
    private BillingClient mBillingClient;
    private HashMap<String, ProductDetails> productDetailsHashMap = new HashMap<>();

    InAppPurchaseModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;

        mBillingClientBuilder = BillingClient.newBuilder(context).enablePendingPurchases();
        googleApiAvailability = GoogleApiAvailability.getInstance();
    }

    public static final String NAME = "InAppPurchaseModule";

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }


    @ReactMethod
    public void init(Promise promise) {
        // already initialized
        if (mBillingClient != null && mBillingClient.isReady()) {
            promise.resolve(true);
            return;
        }

        if (googleApiAvailability.isGooglePlayServicesAvailable(reactContext) != ConnectionResult.SUCCESS) {
            promise.reject(E_PLAYSERVICE_NO_AVAILABLE, "google play service is not available!");
            return;
        }

        mBillingClient = mBillingClientBuilder.setListener(this).build();

        mBillingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                try {

                    int billingResponseCode = billingResult.getResponseCode();
                    if (billingResponseCode == BillingClient.BillingResponseCode.OK) {
                        addCallback("INIT_PROMISE", promise);
                        // load product details
                        loadProductDetails();
                    } else {
                        promise.reject(E_UNABLE_TO_INIT_MODULE, "Unable to initialize billing client");
                    }
                } catch (Exception e) {
                    promise.reject(e);
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                try {
                    promise.reject(E_UNABLE_TO_INIT_MODULE, "Billing service disconnected");
                } catch (Exception e) {
                    // ignore
                }
            }
        });
    }


    @ReactMethod
    public void restorePurchase(Promise promise) {
        if (mBillingClient == null || !mBillingClient.isReady()) {
            promise.reject(E_CLIENT_IS_NOT_READY, "Client is not ready, forgot to initialize?");
            return;
        }

        mBillingClient.queryPurchasesAsync(
                QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build(),
                new PurchasesResponseListener() {
                    public void onQueryPurchasesResponse(
                            BillingResult billingResult,
                            List<Purchase> purchases) {

                        String purchaseToken = null;

                        if (purchases != null) {
                            for (Purchase purchase : purchases) {
                                if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                                    purchaseToken = purchase.getPurchaseToken();
                                }
                            }
                            if (purchaseToken != null) {
                                promise.resolve(purchaseToken);
                            } else {
                                promise.reject(E_NO_PURCHASE_HISTORY, "No purchase token is available, unable to verify!");
                            }
                        } else {
                            promise.reject(E_NO_PURCHASE_HISTORY, "No purchase history available");
                        }
                    }
                }
        );


    }


    @ReactMethod
    public void purchase(Promise promise) {
        if (mBillingClient == null || !mBillingClient.isReady()) {
            promise.reject(E_CLIENT_IS_NOT_READY, "Client is not ready, forgot to initialize?");
            return;
        }

        ProductDetails productDetails = productDetailsHashMap.get(XUMMProProductIdentifier);

        if (productDetails == null) {
            promise.reject(E_PRODUCT_IS_NOT_AVAILABLE, "");
            return;
        }

        String offerToken = productDetails
                .getSubscriptionOfferDetails()
                .get(0)
                .getOfferToken();

        ImmutableList<BillingFlowParams.ProductDetailsParams> productDetailsParamsList =
                ImmutableList.of(
                        BillingFlowParams.ProductDetailsParams.newBuilder()
                                .setProductDetails(productDetails)
                                .setOfferToken(offerToken)
                                .build()
                );


        BillingFlowParams billingFlowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(productDetailsParamsList)
                .build();


        // Launch the billing flow
        BillingResult billingResult = mBillingClient.launchBillingFlow(reactContext.getCurrentActivity(), billingFlowParams);

        addCallback("PURCHASE_PROMISE", promise);
    }



    @ReactMethod
    public void close(Promise promise) {
        try {
            // close the connection if exist
            if (mBillingClient != null && mBillingClient.isReady()) {
                mBillingClient.endConnection();
                mBillingClient = null;
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject(e);
        }
    }


    public void loadProductDetails() {
        ImmutableList<QueryProductDetailsParams.Product> productList = ImmutableList.of(QueryProductDetailsParams.Product.newBuilder()
                .setProductId(XUMMProProductIdentifier)
                .setProductType(BillingClient.ProductType.SUBS)
                .build());

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

        mBillingClient.queryProductDetailsAsync(
                params,
                new ProductDetailsResponseListener() {
                    public void onProductDetailsResponse(BillingResult billingResult, List<ProductDetails> productDetailsList) {
                        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && productDetailsList != null && productDetailsList.size() > 0) {
                            for (ProductDetails productDetails : productDetailsList) {
                                productDetailsHashMap.put(productDetails.getProductId(), productDetails);
                            }
                            resolveForKey("INIT_PROMISE", true);
                        } else {
                            rejectForKey("INIT_PROMISE", E_PRODUCT_IS_NOT_AVAILABLE, "Unable to load product list", null);
                        }
                    }
                }
        );
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, @Nullable List<Purchase> purchases) {
        int responseCode = billingResult.getResponseCode();
        if (responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            Log.d(TAG, "Success payment");
            for (Purchase purchase : purchases) {
                acknowledgePurchase(purchase);
            }
        } else if (responseCode == BillingClient.BillingResponseCode.USER_CANCELED) {
            Log.d(TAG, "User canceled purchase");
            rejectForKey("PURCHASE_PROMISE", E_PURCHAES_CANCELED, "Purchase canceled by users", null);
        } else if (responseCode == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            Log.d(TAG, "User already own this product");
            rejectForKey("PURCHASE_PROMISE", E_ALREADY_PURCHASED, "User already bought this product", null);
        } else {
            Log.d(TAG, "Purchase failed");
            rejectForKey("PURCHASE_PROMISE", E_PURCHAES_FALIED, "Purchase failed", null);
        }
    }


    public void acknowledgePurchase(Purchase purchase) {
        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
            resolveForKey("PURCHASE_PROMISE", purchase.getPurchaseToken());
            if (!purchase.isAcknowledged()) {
                AcknowledgePurchaseParams acknowledgePurchaseParams = AcknowledgePurchaseParams.newBuilder()
                        .setPurchaseToken(purchase.getPurchaseToken())
                        .build();
                mBillingClient.acknowledgePurchase(acknowledgePurchaseParams, new AcknowledgePurchaseResponseListener() {
                    @Override
                    public void onAcknowledgePurchaseResponse(BillingResult billingResult) {
                        Log.d(TAG, "Purchase Acknowledged");
                    }
                });
            }
        }
    }


    private void addCallback(final String key, final Promise promise) {
        try {
            ArrayList<Promise> list;
            if (promises.containsKey(key)) {
                list = promises.get(key);
            } else {
                list = new ArrayList<Promise>();
                promises.put(key, list);
            }

            list.add(promise);
        } catch (Exception e) {
            Log.e(TAG, e.getMessage());
        }
    }

    private void resolveForKey(final String key, final Object value) {
        try {
            if (promises.containsKey(key)) {
                ArrayList<Promise> list = promises.get(key);
                for (Promise promise : list) {
                    promise.resolve(value);
                }
                promises.remove(key);
            }
        } catch (Exception e) {
            Log.e(TAG, e.getMessage());
        }
    }

    private void rejectForKey(final String key, final String code, final String message, final Exception err) {
        try {
            if (promises.containsKey(key)) {
                ArrayList<Promise> list = promises.get(key);
                for (Promise promise : list) {
                    promise.reject(code, message, err);
                }
                promises.remove(key);
            }
        } catch (Exception e) {
            Log.e(TAG, e.getMessage());
        }
    }
}

