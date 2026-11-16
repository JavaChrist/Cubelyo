package fr.javachrist.cubelyo;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.android.billingclient.api.UnfetchedProduct;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.json.JSONException;

/**
 * Google Play Billing (achats uniques, produits « inapp »). Le plugin lit les prix localisés, lance l'achat
 * et liste les achats de l'appareil. Il ne valide rien, ne consomme rien et n'accuse jamais réception : la route
 * /api/play/verify relit chaque jeton auprès de l'API Google Play Developer, consomme les lots ou accuse réception
 * des achats « sans publicité » (sans accusé sous 3 jours, Google rembourse). Voir docs/billing.md.
 */
@CapacitorPlugin(name = "PlayBilling")
public class PlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private BillingClient client;
    private final Map<String, ProductDetails> details = new HashMap<>();
    private final Map<String, ProductDetails.OneTimePurchaseOfferDetails> offers = new HashMap<>();
    @Nullable private PluginCall purchaseCall;
    @Nullable private String purchaseProductId;

    @Override
    public void load() {
        client = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection()
            .build();
    }

    @Override
    protected void handleOnDestroy() {
        if (client != null) client.endConnection();
    }

    private void whenReady(PluginCall call, Runnable action) {
        if (client.isReady()) {
            action.run();
            return;
        }
        client.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) action.run();
                else rejectWith(call, result);
            }

            @Override
            public void onBillingServiceDisconnected() {}
        });
    }

    private void rejectWith(PluginCall call, BillingResult result) {
        if (call == purchaseCall) {
            purchaseCall = null;
            purchaseProductId = null;
        }
        call.reject("Google Play Billing : " + result.getDebugMessage(), "billing_" + result.getResponseCode());
    }

    @PluginMethod
    public void getProducts(PluginCall call) {
        JSArray ids = call.getArray("productIds");
        List<QueryProductDetailsParams.Product> products = new ArrayList<>();
        try {
            for (String id : ids.<String>toList()) {
                products.add(QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(id)
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build());
            }
        } catch (JSONException | NullPointerException error) {
            call.reject("productIds invalides", "invalidRequest");
            return;
        }
        if (products.isEmpty()) {
            call.reject("productIds vide", "invalidRequest");
            return;
        }
        whenReady(call, () -> client.queryProductDetailsAsync(
            QueryProductDetailsParams.newBuilder().setProductList(products).build(),
            (result, query) -> {
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    rejectWith(call, result);
                    return;
                }
                JSArray list = new JSArray();
                // Produits que Google Play n'a pas rendus, avec la raison : affichée dans la boutique pour le diagnostic.
                JSArray unfetched = new JSArray();
                for (ProductDetails product : query.getProductDetailsList()) {
                    ProductDetails.OneTimePurchaseOfferDetails offer = offerOf(product);
                    if (offer == null) {
                        JSObject missing = new JSObject();
                        missing.put("productId", product.getProductId());
                        missing.put("reason", "noOffer");
                        unfetched.put(missing);
                        continue;
                    }
                    details.put(product.getProductId(), product);
                    offers.put(product.getProductId(), offer);
                    JSObject item = new JSObject();
                    item.put("productId", product.getProductId());
                    item.put("formattedPrice", offer.getFormattedPrice());
                    item.put("priceMicros", offer.getPriceAmountMicros());
                    item.put("currency", offer.getPriceCurrencyCode());
                    list.put(item);
                }
                for (UnfetchedProduct product : query.getUnfetchedProductList()) {
                    JSObject missing = new JSObject();
                    missing.put("productId", product.getProductId());
                    missing.put("reason", unfetchedReason(product.getStatusCode()));
                    unfetched.put(missing);
                }
                JSObject response = new JSObject();
                response.put("products", list);
                response.put("unfetched", unfetched);
                call.resolve(response);
            }
        ));
    }

    /**
     * Option d'achat à vendre. `getOneTimePurchaseOfferDetails()` ne rend que l'option « rétrocompatible » ;
     * un produit créé dans la nouvelle Play Console peut ne pas en avoir : on prend alors la première offre de la liste.
     */
    @Nullable
    private static ProductDetails.OneTimePurchaseOfferDetails offerOf(ProductDetails product) {
        ProductDetails.OneTimePurchaseOfferDetails offer = product.getOneTimePurchaseOfferDetails();
        if (offer != null) return offer;
        List<ProductDetails.OneTimePurchaseOfferDetails> all = product.getOneTimePurchaseOfferDetailsList();
        return all == null || all.isEmpty() ? null : all.get(0);
    }

    private static String unfetchedReason(int code) {
        switch (code) {
            case UnfetchedProduct.StatusCode.INVALID_PRODUCT_ID_FORMAT: return "invalidId";
            case UnfetchedProduct.StatusCode.PRODUCT_NOT_FOUND: return "notFound";
            case UnfetchedProduct.StatusCode.NO_ELIGIBLE_OFFER: return "noOffer";
            default: return "unknown";
        }
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId");
        ProductDetails product = productId == null ? null : details.get(productId);
        if (product == null) {
            call.reject("Produit inconnu : appeler getProducts d'abord", "invalidRequest");
            return;
        }
        if (purchaseCall != null) {
            call.reject("Un achat est déjà en cours", "busy");
            return;
        }
        BillingFlowParams.ProductDetailsParams.Builder productParams =
            BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(product);
        ProductDetails.OneTimePurchaseOfferDetails offer = offers.get(productId);
        if (offer != null && offer.getOfferToken() != null) productParams.setOfferToken(offer.getOfferToken());
        BillingFlowParams params = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(Collections.singletonList(productParams.build()))
            .build();
        purchaseCall = call;
        purchaseProductId = productId;
        whenReady(call, () -> getActivity().runOnUiThread(() -> {
            BillingResult result = client.launchBillingFlow(getActivity(), params);
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                onPurchasesUpdated(result, null);
            }
        }));
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult result, @Nullable List<Purchase> purchases) {
        PluginCall call = purchaseCall;
        String productId = purchaseProductId;
        purchaseCall = null;
        purchaseProductId = null;
        int code = result.getResponseCode();
        JSObject matched = null;
        if (purchases != null) {
            for (Purchase purchase : purchases) {
                JSObject item = toJs(purchase);
                // Achat arrivé après coup (paiement en attente devenu payé, achat hors de l'application) :
                // signalé à l'interface, qui le fait vérifier par le serveur.
                notifyListeners("purchaseUpdated", item);
                if (productId != null && purchase.getProducts().contains(productId)) matched = item;
            }
        }
        if (call == null) return;
        JSObject response = new JSObject();
        if (code == BillingClient.BillingResponseCode.OK && matched != null) {
            response.put("status", "PURCHASED".equals(matched.getString("state")) ? "purchased" : "pending");
            response.put("purchase", matched);
        } else if (code == BillingClient.BillingResponseCode.USER_CANCELED) {
            response.put("status", "canceled");
        } else if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            response.put("status", "alreadyOwned");
        } else {
            response.put("status", "error");
            response.put("code", code);
        }
        call.resolve(response);
    }

    @PluginMethod
    public void queryPurchases(PluginCall call) {
        whenReady(call, () -> client.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(),
            (result, purchases) -> {
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    rejectWith(call, result);
                    return;
                }
                JSArray list = new JSArray();
                for (Purchase purchase : purchases) list.put(toJs(purchase));
                JSObject response = new JSObject();
                response.put("purchases", list);
                call.resolve(response);
            }
        ));
    }

    private static JSObject toJs(Purchase purchase) {
        JSObject item = new JSObject();
        item.put("purchaseToken", purchase.getPurchaseToken());
        item.put("productIds", new JSArray(purchase.getProducts()));
        item.put("orderId", purchase.getOrderId());
        item.put("acknowledged", purchase.isAcknowledged());
        int state = purchase.getPurchaseState();
        item.put("state", state == Purchase.PurchaseState.PURCHASED ? "PURCHASED"
            : state == Purchase.PurchaseState.PENDING ? "PENDING" : "UNSPECIFIED");
        return item;
    }
}
