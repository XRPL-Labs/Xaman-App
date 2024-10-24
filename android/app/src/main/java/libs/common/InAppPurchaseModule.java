package libs.common;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.List;
import java.util.HashMap;
import java.util.Objects;

import android.util.Log;

import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.QueryProductDetailsParams;

import com.android.billingclient.api.QueryPurchasesParams;
import com.facebook.common.internal.ImmutableList;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;


import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;


@ReactModule(name = InAppPurchaseModule.NAME)
public class InAppPurchaseModule extends ReactContextBaseJavaModule implements PurchasesUpdatedListener {
    public static final String NAME = "InAppPurchaseModule";
    public static final String TAG = NAME;

    private static final String E_CLIENT_IS_NOT_READY = "E_CLIENT_IS_NOT_READY";
    private static final String E_PRODUCT_DETAILS_NOT_FOUND = "E_PRODUCT_DETAILS_NOT_FOUND";
    private static final String E_PRODUCT_IS_NOT_AVAILABLE = "E_PRODUCT_IS_NOT_AVAILABLE";
    private static final String E_NO_PENDING_PURCHASE = "E_NO_PENDING_PURCHASE";
    private static final String E_PURCHASE_CANCELED = "E_PURCHASE_CANCELED";
    private static final String E_PURCHASE_FAILED = "E_PURCHASE_FAILED";
    private static final String E_FINISH_TRANSACTION_FAILED = "E_FINISH_TRANSACTION_FAILED";
    private static final String E_ALREADY_PURCHASED = "E_ALREADY_PURCHASED";

    private static ReactApplicationContext reactContext;

    private final HashMap<String, ProductDetails> productDetailsHashMap = new HashMap<>();
    private final BillingClient billingClient;
    private final GoogleApiAvailability googleApiAvailability;

    private Promise billingFlowPromise;
    private boolean isUserPurchasing = false;


    InAppPurchaseModule(ReactApplicationContext context) {
        super(context);

        reactContext = context;

        billingClient = BillingClient.newBuilder(reactContext)
                .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                .setListener(this)
                .build();

        googleApiAvailability = GoogleApiAvailability.getInstance();
    }


    //---------------------------------
    // React methods - These methods are exposed to React JS
    //
    // startConnection
    // restorePurchases
    // purchase
    // finalizePurchase
    //
    //---------------------------------

    @ReactMethod(isBlockingSynchronousMethod = true)
    public boolean isUserPurchasing() {
        return isUserPurchasing;
    }


    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    // Starts a connection with Google BillingClient
    @ReactMethod
    public void startConnection(Promise promise) {
        // already ready to accept purchase
        if (isReady()) {
            promise.resolve(true);
            return;
        }

        // check if google api is available
        if (googleApiAvailability.isGooglePlayServicesAvailable(reactContext) != ConnectionResult.SUCCESS) {
            promise.reject(E_CLIENT_IS_NOT_READY, "Google play service is not available!");
            return;
        }

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    promise.resolve(true);
                } else {
                    promise.reject(E_CLIENT_IS_NOT_READY, "Unable to start billing client");
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                promise.reject(E_CLIENT_IS_NOT_READY, "billing client service disconnected");
            }
        });
    }

    @ReactMethod
    public void getProductDetails(String productId, Promise promise) {
        if (!isReady()) {
            promise.reject(E_CLIENT_IS_NOT_READY, "billing client is not ready, forgot to initialize?");
            return;
        }


        // try to fetch cached version of product details
        if (productDetailsHashMap.containsKey(productId)) {
            promise.resolve(this.productToJson(Objects.requireNonNull(productDetailsHashMap.get(productId))));
            return;
        }

        // no cached product details
        // fetch product details
        ImmutableList<QueryProductDetailsParams.Product> productList = ImmutableList.of(QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(BillingClient.ProductType.INAPP)
                .build());

        QueryProductDetailsParams queryProductDetailsParams = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

        billingClient.queryProductDetailsAsync(queryProductDetailsParams, (billingResult, list) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && !list.isEmpty()) {
                ProductDetails productDetails = list.get(0);

                // cache the product details
                productDetailsHashMap.put(list.get(0).getProductId(), productDetails);

                // Launch the billing flow
                promise.resolve(this.productToJson(productDetails));
            } else {
                Log.e(TAG, "Unable to load the product details with productId " + productId + " getResponseCode:" + billingResult.getResponseCode() + " list.size:" + list.size());
                promise.reject(E_PRODUCT_IS_NOT_AVAILABLE, "Unable to load the product details with productId " + productId);
            }
        });
    }

    @ReactMethod
    public void restorePurchases(Promise promise) {
        if (!isReady()) {
            promise.reject(E_CLIENT_IS_NOT_READY, "billing client is not ready, forgot to initialize?");
            return;
        }

        WritableArray productsToBeConsumed = Arguments.createArray();

        billingClient.queryPurchasesAsync(
                QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(),
                (billingResult, purchases) -> {
                    if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                        for (Purchase purchase : purchases) {

                            Log.d("IAP", String.valueOf(purchase));
                            // PURCHASED but not consumed
                            if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                                productsToBeConsumed.pushMap(purchaseToMap(purchase));
                            }
                        }
                        promise.resolve(productsToBeConsumed);
                    } else {
                        promise.reject(E_NO_PENDING_PURCHASE, String.valueOf(billingResult.getResponseCode()));
                    }
                }
        );
    }

    @ReactMethod
    public void purchase(String productId, Promise promise) {
        if (!isReady()) {
            promise.reject(E_CLIENT_IS_NOT_READY, "billingClient is not ready, forgot to initialize?");
            return;
        }

        // try to fetch cached version of product details
        if (productDetailsHashMap.containsKey(productId)) {
            launchBillingFlow(productDetailsHashMap.get(productId), promise);
            return;
        }

        promise.reject(E_PRODUCT_DETAILS_NOT_FOUND, "product details with id " + productId + " not found, make sure to run the getProductDetails method before purchase!");
    }


    //---------------------------------
    // Private methods
    //---------------------------------

    // Consumes a purchase token, indicating that the product has been provided to the user.
    @ReactMethod
    public void finalizePurchase(String purchaseToken, Promise promise) {
        billingClient.consumeAsync(ConsumeParams.newBuilder()
                .setPurchaseToken(purchaseToken)
                .build(), (billing, s) -> {
            if (billing.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                promise.resolve(purchaseToken);
            } else {
                promise.reject(E_FINISH_TRANSACTION_FAILED, "billing response code " + billing.getResponseCode());
            }
        });
    }

    // This method gets called when purchases are updated.
    @Override
    public void onPurchasesUpdated(@NonNull BillingResult billing, @Nullable List<Purchase> list) {
        // check if we already have the promise, if not just return.
        if (billingFlowPromise == null) {
            return;
        }

        // set the flag
        isUserPurchasing = false;

        // something went wrong with the purchase, reject the billingFlowPromise
        if (billing.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            switch (billing.getResponseCode()) {
                case BillingClient.BillingResponseCode.USER_CANCELED:
                    rejectBillingFlowPromise(E_PURCHASE_CANCELED, "purchase canceled by users");
                    break;
                case BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED:
                    rejectBillingFlowPromise(E_ALREADY_PURCHASED, "item already owned by users");
                default:
                    rejectBillingFlowPromise(E_PURCHASE_FAILED, "billing response code " + billing.getResponseCode());
                    break;
            }
            return;
        }


        // something is not right?
        if (list == null || list.isEmpty()) {
            rejectBillingFlowPromise(E_PURCHASE_FAILED, "the purchase list is empty!");
            return;
        }

        WritableArray productsToBeConsumed = Arguments.createArray();

        for (Purchase purchase : list) {
            if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                productsToBeConsumed.pushMap(purchaseToMap(purchase));
            }
        }

        // send back the purchase tokens
        resolveBillingFlowPromise(productsToBeConsumed);
    }

    // Checks if BillingClient is ready.
    // BillingClient takes some time to initialize, as it needs to establish a connection
    // with Google Play Billing APIs.
    public boolean isReady() {
        return billingClient.isReady();
    }

    // A private method to actually launch the billing flow once we've loaded the product details.
    // This method may fail and reject the promise if there's already a billing flow in progress.
    private void launchBillingFlow(ProductDetails productDetails, Promise promise) {
        // set flag
        isUserPurchasing = true;

        // if we already have an promise going on for billing flow, reject it as we don't want to start
        // the new flow without closing the old one
        if (billingFlowPromise != null) {
            promise.reject(E_PURCHASE_FAILED, "There is a Billing flow going on at the moment, can't start the new one!");
            return;
        }


        // assign the promise
        billingFlowPromise = promise;

        // lunch the billing flow
        billingClient.launchBillingFlow(
                Objects.requireNonNull(reactContext.getCurrentActivity()),
                BillingFlowParams.newBuilder()
                        .setProductDetailsParamsList(ImmutableList.of(
                                BillingFlowParams.ProductDetailsParams.newBuilder()
                                        .setProductDetails(productDetails)
                                        .build()
                        ))
                        .build()
        );
    }

    private WritableMap purchaseToMap(Purchase purchase) {
        final WritableMap purchaseMap = Arguments.createMap();
        purchaseMap.putString("purchaseToken", purchase.getPurchaseToken());
        purchaseMap.putInt("quantity", purchase.getQuantity());
        purchaseMap.putString("orderId", purchase.getOrderId());
        purchaseMap.putArray("products", Arguments.fromList(purchase.getProducts()));
        return purchaseMap;
    }

    private WritableMap productToJson(ProductDetails productDetails) {
        final WritableMap results = Arguments.createMap();
        results.putString("title", productDetails.getTitle());
        results.putString("description", productDetails.getDescription());
        results.putString("price", Objects.requireNonNull(productDetails.getOneTimePurchaseOfferDetails()).getFormattedPrice());
        results.putString("productId", productDetails.getProductId());

        return results;
    }


    private void resolveBillingFlowPromise(final WritableArray productsToBeConsumed) {
        try {
            billingFlowPromise.resolve(productsToBeConsumed);
            billingFlowPromise = null;
        } catch (Exception error) {
            Log.e(TAG, "resolveBillingFlowPromise: " + error.getMessage());
        }
    }

    private void rejectBillingFlowPromise(final String code, final String message) {
        try {
            billingFlowPromise.reject(code, message);
            Log.d(TAG, "rejectBillingFlowPromise " + code);
            billingFlowPromise = null;
        } catch (Exception error) {
            Log.e(TAG, "rejectBillingFlowPromise: " + error.getMessage());
        }
    }
}

