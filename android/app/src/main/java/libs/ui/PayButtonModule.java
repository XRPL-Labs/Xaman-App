package libs.ui;


import android.util.Log;
import android.view.View;
import android.view.ViewTreeObserver;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;

import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.google.android.gms.wallet.button.PayButton;
import com.google.android.gms.wallet.button.ButtonOptions;
import com.google.android.gms.wallet.button.ButtonConstants;

import com.xrpllabs.xumm.R;

import org.json.JSONArray;

import java.util.Map;

import javax.annotation.Nonnull;

// Workaround for fixing https://github.com/facebook/react-native/issues/17968
class CustomFrameLayout extends FrameLayout {
    private final Runnable mLayoutRunnable = new Runnable() {
        @Override
        public void run() {
            measure(
                    View.MeasureSpec.makeMeasureSpec(getWidth(), View.MeasureSpec.EXACTLY),
                    View.MeasureSpec.makeMeasureSpec(getHeight(), View.MeasureSpec.EXACTLY)
            );
            layout(getLeft(), getTop(), getRight(), getBottom());
        }
    };

    public CustomFrameLayout(@Nonnull ThemedReactContext context) {
        super(context);
    }

    @Override
    public void requestLayout() {
        super.requestLayout();
        post(mLayoutRunnable);
    }
}


@SuppressWarnings("unused")
class PayButtonModule extends ViewGroupManager<FrameLayout> {
    static final String REACT_CLASS = "NativePayButton";

    static final String DEFAULT_BUTTON_STYLE = "dark";
    private FrameLayout payButtonContainer;
    private ThemedReactContext reactContext;
    private int buttonTheme;

    @NonNull
    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    public @Nonnull FrameLayout createViewInstance(@Nonnull ThemedReactContext context) {
        reactContext = context;

        payButtonContainer = new CustomFrameLayout(context);
        payButtonContainer.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        ));

        PayButton payButton = initWithPaymentButtonStyle(DEFAULT_BUTTON_STYLE, context);

        payButton.requestLayout();
        payButtonContainer.addView(payButton);
        return payButtonContainer;
    }

    @Override
    @Nullable
    public Map getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.of("onPress", MapBuilder.of("registrationName", "onPress"));
    }

    private PayButton initWithPaymentButtonStyle(String style, ThemedReactContext context) {
        buttonTheme = this.getButtonTheme(style);

        PayButton payButton = new PayButton(context);
        payButton.setId(R.id.pay_button_google_play);
        payButton.initialize(
                ButtonOptions.newBuilder()
                        .setButtonTheme(buttonTheme)
                        .setButtonType(ButtonConstants.ButtonType.PAY)
                        .setAllowedPaymentMethods(new JSONArray().toString())
                        .build()
        );

        payButton.setOnClickListener(view -> ((ReactContext) view.getContext()).getJSModule(RCTEventEmitter.class).receiveEvent(
                payButtonContainer.getId(), "onPress",
                null));

        return payButton;

    }

    private int getButtonTheme(String style) {
        switch (style) {
            case "light":
                return ButtonConstants.ButtonTheme.LIGHT;
            default:
                return ButtonConstants.ButtonTheme.DARK;
        }
    }

    @ReactProp(name = "buttonStyle")
    public void setButtonStyle(FrameLayout layout, String value) {
        PayButton oldPayButton = layout.findViewById(R.id.pay_button_google_play);

        if (oldPayButton != null && buttonTheme != this.getButtonTheme(value)) {
            layout.removeView(oldPayButton);

            PayButton payButton = initWithPaymentButtonStyle(value, reactContext);
            layout.addView(payButton);
        }
    }
}
