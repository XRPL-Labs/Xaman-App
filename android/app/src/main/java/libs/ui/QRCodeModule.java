package libs.ui;

import android.graphics.Bitmap;
import android.graphics.Color;
import android.util.Log;

import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.image.ReactImageView;

import net.glxn.qrgen.android.QRCode;

import javax.annotation.Nullable;

/**
 * Created by zapperdev on 2018/05/30.
 */

public class QRCodeModule extends SimpleViewManager<ReactImageView> {
    public static final String REACT_CLASS = "QRCode";
    public final @Nullable
    Object mCallerContext;

    private String qrCodeValue = "";
    private int size = 400;
    private int onColor = 0xFF000000;
    private int offColor = 0xFFFFFFFF;

    private @Nullable
    ReactImageView mImageView = null;

    @ReactProp(name = "value")
    public void setValue(ReactImageView view, @Nullable String value) {
        qrCodeValue = value;

        this.generateImage();
    }

    @ReactProp(name = "size")
    public void setSize(ReactImageView view, @Nullable int value) {
        this.size = value;

        this.generateImage();
    }

    @ReactProp(name = "fgColor")
    public void setForegroundColor(ReactImageView view, @Nullable String value) {
        if (value != null) {
            this.onColor = this.hexToInt(value, this.onColor);
        }
        this.generateImage();
    }

    @ReactProp(name = "bgColor")
    public void setBackgroundColor(ReactImageView view, @Nullable String value) {
        if (value != null) {
            this.offColor = this.hexToInt(value, this.offColor);
        }
        this.generateImage();
    }

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    public QRCodeModule(Object callerContext) {
        mCallerContext = callerContext;
    }

    public QRCodeModule() {
        mCallerContext = null;
    }

    @Override
    public ReactImageView createViewInstance(ThemedReactContext context) {
        mImageView = new ReactImageView(context, Fresco.newDraweeControllerBuilder(), null, mCallerContext);

        return mImageView;
    }

    private void generateImage() {
        if (!this.qrCodeValue.equals("")) {
            Bitmap myBitmap = QRCode.from(this.qrCodeValue).withSize(this.size, this.size)
                    .withColor(this.onColor, this.offColor).bitmap();

            if (mImageView != null) {
                mImageView.setImageBitmap(myBitmap);
            }
        }
    }

    private int hexToInt(String value, int defaultValue) {
        try {
            return Color.parseColor(value);
        } catch (Exception e) {
            Log.d("ERR", e.getMessage());
        }

        return defaultValue;
    }
}
