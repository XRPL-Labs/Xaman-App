package libs.common;


import android.util.Log;

import androidx.annotation.Nullable;

import java.util.List;
import java.util.Arrays;
import java.util.HashMap;
import java.util.ArrayList;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;


import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.AcknowledgePurchaseResponseListener;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.SkuDetails;
import com.android.billingclient.api.SkuDetailsParams;
import com.android.billingclient.api.SkuDetailsResponseListener;


public class InAppPurchaseModule extends ReactContextBaseJavaModule implements PurchasesUpdatedListener {

    private static final String TAG = "InAppPurchaseModule";

    // private static final String XUMMProProductIdentifier = "com.xrpllabs.xumm.pro.test2";
    private static final String XUMMProProductIdentifier = "android.test.purchased";
    private static final String XUMMProProductType = BillingClient.SkuType.INAPP;

    private static final String E_UNABLE_TO_INIT_MODULE = "E_UNABLE_TO_INIT_MODULE";
    private static final String E_CLIENT_IS_NOT_READY = "E_CLIENT_IS_NOT_READY";
    private static final String E_PRODUCT_IS_NOT_AVAILABLE = "E_PRODUCT_IS_NOT_AVAILABLE";
    private static final String E_PURCHAES_CANCELED = "E_PURCHAES_CANCELED";
    private static final String E_PURCHAES_FALIED = "E_PURCHAES_FALIED";
    private static final String E_ALREADY_PURCHASED = "E_ALREADY_PURCHASED";
    private static final String E_NO_PURCHASE_HISTORY = "E_NO_PURCHASE_HISTORY";


    private static ReactApplicationContext reactContext;
    private HashMap<String, ArrayList<Promise>> promises = new HashMap<>();

    private BillingClient mBillingClient;
    private HashMap<String, SkuDetails> skuDetailsHashMap = new HashMap<>();

    InAppPurchaseModule(ReactApplicationContext context) {
        super(context);

        reactContext = context;

        mBillingClient = BillingClient.newBuilder(context)
                .enablePendingPurchases()
                .setListener(this)
                .build();


    }

    @Override
    public String getName() {
        return "InAppPurchaseModule";
    }


    @ReactMethod
    public void init(Promise promise) {
        // already initialized
        if (mBillingClient != null && mBillingClient.isReady()) {
            promise.resolve(true);
            return;
        }
        mBillingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                try {

                    int billingResponseCode = billingResult.getResponseCode();
                    if (billingResponseCode == BillingClient.BillingResponseCode.OK) {
                        addCallback("INIT_PROMISE", promise);
                        // load SKU details
                        getSKUDetails();
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
        if (mBillingClient.isReady()) {
            Purchase.PurchasesResult purchasesResult = mBillingClient.queryPurchases(XUMMProProductType);

            List<Purchase> purchasedItems = purchasesResult.getPurchasesList();

            String purchaseToken = null;

            if (purchasedItems != null) {
                for (Purchase purchase : purchasedItems) {
                    if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                        purchaseToken = purchase.getPurchaseToken();
                    }
                }
                if (purchaseToken != null) {
                    promise.resolve(purchaseToken);
                } else {
                    promise.reject(E_NO_PURCHASE_HISTORY, "No purchase token is availabel, cannot verify!");
                }
            } else {
                promise.reject(E_NO_PURCHASE_HISTORY, "No purchase history available");
            }

        } else {
            promise.reject(E_CLIENT_IS_NOT_READY, "Client is not ready, forgot to initialize?");
        }
    }


    @ReactMethod
    public void purchase(Promise promise) {
        try {
            if (mBillingClient.isReady()) {
                SkuDetails skuDetails = skuDetailsHashMap.get(XUMMProProductIdentifier);


                BillingFlowParams mBillingFlowParams = BillingFlowParams.newBuilder()
                        .setSkuDetails(skuDetails)
                        .build();
                mBillingClient.launchBillingFlow(reactContext.getCurrentActivity(), mBillingFlowParams);

                addCallback("PURCHASE_PROMISE", promise);
            } else {
                promise.reject(E_CLIENT_IS_NOT_READY, "Client is not ready, forgot to initialize?");
            }
        } catch (Exception e) {
            Log.e(TAG, e.getMessage());
        }
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


    public void getSKUDetails() {
        SkuDetailsParams skuParams = SkuDetailsParams.newBuilder().setType(XUMMProProductType).setSkusList(Arrays.asList(XUMMProProductIdentifier)).build();
        mBillingClient.querySkuDetailsAsync(skuParams, new SkuDetailsResponseListener() {
            @Override
            public void onSkuDetailsResponse(BillingResult billingResult, List<SkuDetails> skuDetailsList) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && skuDetailsList != null && skuDetailsList.size() > 0) {
                    for (SkuDetails skuDetails : skuDetailsList) {
                        skuDetailsHashMap.put(skuDetails.getSku(), skuDetails);
                    }
                    resolveForKey("INIT_PROMISE", true);
                } else {
                    rejectForKey("INIT_PROMISE", E_PRODUCT_IS_NOT_AVAILABLE, "Unable to load product list", null);
                }
            }
        });
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
            if(!purchase.isAcknowledged()){
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

