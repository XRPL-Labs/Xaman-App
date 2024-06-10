package libs.ui;

import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;

import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.google.android.gms.wallet.button.PayButton;
import com.google.android.gms.wallet.button.ButtonOptions;
import com.google.android.gms.wallet.button.ButtonConstants;
import com.xrpllabs.xumm.R;

import org.json.JSONArray;

import java.util.Map;

import javax.annotation.Nonnull;

@SuppressWarnings("unused")
class PayButtonModule extends ViewGroupManager<FrameLayout> {
    static final String REACT_CLASS = "NativePayButton";

    @NonNull
    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    public @Nonnull FrameLayout createViewInstance(@Nonnull ThemedReactContext context) {
        FrameLayout payButtonContainer = new FrameLayout(context);
        payButtonContainer.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        ));


        PayButton payButton = new PayButton(context);
        payButton.setId(R.id.pay_button_google_play);
        payButton.initialize(
                ButtonOptions.newBuilder()
                        .setButtonTheme(ButtonConstants.ButtonTheme.DARK)
                        .setButtonType(ButtonConstants.ButtonType.PAY)
                        .setAllowedPaymentMethods(new JSONArray().toString())
                        .build()
        );

        payButton.setOnClickListener(
                view -> ((ReactContext) view.getContext()).getJSModule(RCTEventEmitter.class).receiveEvent(
                        payButtonContainer.getId(), "onPress",
                        null));

        payButtonContainer.addView(payButton);

        return payButtonContainer;
    }

    @Override
    @Nullable
    public Map getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.of("onPress", MapBuilder.of("registrationName", "onPress"));
    }
}
