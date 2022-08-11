package libs.webview.events;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import org.jetbrains.annotations.NotNull;

/**
 * Event emitted when a http error is received from the server.
 */
public class TopHttpErrorEvent extends Event<TopHttpErrorEvent> {
    public static final String EVENT_NAME = "topHttpError";
    final WritableMap mEventData;

    public TopHttpErrorEvent(int viewId, WritableMap eventData) {
        super(viewId);
        mEventData = eventData;
    }

    @NotNull
    public String getEventName() {
        return TopHttpErrorEvent.EVENT_NAME;
    }

    public boolean canCoalesce() {
        return false;
    }

    public short getCoalescingKey() {
        return 0;
    }

    @Override
    public void dispatch(@NotNull RCTEventEmitter rctEventEmitter) {
        rctEventEmitter.receiveEvent(this.getViewTag(), this.getEventName(), this.mEventData);
    }
}
