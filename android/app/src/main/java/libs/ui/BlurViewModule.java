package libs.ui;

import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;

import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Objects;

import javax.annotation.Nonnull;

import eightbitlab.com.blurview.BlurView;
import eightbitlab.com.blurview.RenderScriptBlur;

@SuppressWarnings("unused")
class BlurViewModule extends ViewGroupManager<BlurView> {
    private static final int defaultBlurAmount = 10;

    static final String REACT_CLASS = "BlurView";

    @NonNull
    @Override
    public String getName() {
        return REACT_CLASS;
    }


    @Override
    public @Nonnull BlurView createViewInstance(@Nonnull ThemedReactContext ctx) {
        BlurView blurView = new BlurView(ctx);
        View decorView = Objects.requireNonNull(ctx.getCurrentActivity()).getWindow().getDecorView();
        ViewGroup rootView = decorView.findViewById(android.R.id.content);
        Drawable windowBackground = decorView.getBackground();

        blurView.setupWith(rootView, new RenderScriptBlur(ctx))
                .setFrameClearDrawable(windowBackground)
                .setBlurRadius(defaultBlurAmount)
                .setBlurAutoUpdate(true);
        return blurView;
    }

    @ReactProp(name = "blurAmount", defaultInt = defaultBlurAmount)
    public void setBlurAmount(BlurView view, int amount) {
        long blurRadius = Math.round(amount * 0.8);
        if(blurRadius > 25){
            blurRadius = 25;
        }
        view.setBlurRadius(blurRadius);
        view.invalidate();
    }

    @ReactProp(name = "blurType")
    public void setBlurType(BlurView view, String type) {
        int color = 0;
        switch (type) {
            case "light":
                color =  Color.argb(51, 255, 255, 255);
                break;
            case "xlight":
                color = Color.argb(191, 255, 255, 255 );
                break;
            case "dark":
                color = Color.argb(163, 16, 12, 12);
                break;
        }
        view.setOverlayColor(color);
        view.invalidate();
    }
}
