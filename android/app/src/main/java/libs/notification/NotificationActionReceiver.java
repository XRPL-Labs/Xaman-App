package libs.notification;

import android.util.Log;
import android.app.NotificationManager;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import java.util.Map;
import java.util.Set;

import com.google.firebase.messaging.RemoteMessage;

import io.invertase.firebase.common.ReactNativeFirebaseEvent;
import io.invertase.firebase.common.ReactNativeFirebaseEventEmitter;

public class NotificationActionReceiver extends BroadcastReceiver {
    private static final String EVENT_NOTIFICATION_OPENED = "messaging_notification_opened";

    private static final String KEY_COLLAPSE_KEY = "collapseKey";
    private static final String KEY_DATA = "data";
    private static final String KEY_FROM = "from";
    private static final String KEY_MESSAGE_ID = "messageId";
    private static final String KEY_MESSAGE_TYPE = "messageType";
    private static final String KEY_SENT_TIME = "sentTime";
    private static final String KEY_TO = "to";
    private static final String KEY_TTL = "ttl";

    static WritableMap remoteMessageToWritableMap(RemoteMessage remoteMessage) {
        WritableMap messageMap = Arguments.createMap();
        WritableMap dataMap = Arguments.createMap();

        if (remoteMessage.getCollapseKey() != null) {
            messageMap.putString(KEY_COLLAPSE_KEY, remoteMessage.getCollapseKey());
        }

        if (remoteMessage.getFrom() != null) {
            messageMap.putString(KEY_FROM, remoteMessage.getFrom());
        }

        if (remoteMessage.getTo() != null) {
            messageMap.putString(KEY_TO, remoteMessage.getTo());
        }

        if (remoteMessage.getMessageId() != null) {
            messageMap.putString(KEY_MESSAGE_ID, remoteMessage.getMessageId());
        }

        if (remoteMessage.getMessageType() != null) {
            messageMap.putString(KEY_MESSAGE_TYPE, remoteMessage.getMessageType());
        }

        if (remoteMessage.getData().size() > 0) {
            Set<Map.Entry<String, String>> entries = remoteMessage.getData().entrySet();
            for (Map.Entry<String, String> entry : entries) {
                dataMap.putString(entry.getKey(), entry.getValue());
            }
        }

        messageMap.putMap(KEY_DATA, dataMap);
        messageMap.putDouble(KEY_TTL, remoteMessage.getTtl());
        messageMap.putDouble(KEY_SENT_TIME, remoteMessage.getSentTime());

        if (remoteMessage.getNotification() != null) {
            messageMap.putMap("notification", remoteMessageNotificationToWritableMap(remoteMessage.getNotification()));
        }

        return messageMap;
    }


    static WritableMap remoteMessageNotificationToWritableMap(RemoteMessage.Notification notification) {
        WritableMap notificationMap = Arguments.createMap();
        WritableMap androidNotificationMap = Arguments.createMap();

        if (notification.getTitle() != null) {
            notificationMap.putString("title", notification.getTitle());
        }

        if (notification.getTitleLocalizationKey() != null) {
            notificationMap.putString("titleLocKey", notification.getTitleLocalizationKey());
        }

        if (notification.getTitleLocalizationArgs() != null) {
            notificationMap.putArray("titleLocArgs", Arguments.fromJavaArgs(notification.getTitleLocalizationArgs()));
        }

        if (notification.getBody() != null) {
            notificationMap.putString("body", notification.getBody());
        }

        if (notification.getBodyLocalizationKey() != null) {
            notificationMap.putString("bodyLocKey", notification.getBodyLocalizationKey());
        }

        if (notification.getBodyLocalizationArgs() != null) {
            notificationMap.putArray("bodyLocArgs", Arguments.fromJavaArgs(notification.getBodyLocalizationArgs()));
        }

        if (notification.getChannelId() != null) {
            androidNotificationMap.putString("channelId", notification.getChannelId());
        }

        if (notification.getClickAction() != null) {
            androidNotificationMap.putString("clickAction", notification.getClickAction());
        }

        if (notification.getColor() != null) {
            androidNotificationMap.putString("color", notification.getColor());
        }

        if (notification.getIcon() != null) {
            androidNotificationMap.putString("smallIcon", notification.getIcon());
        }

        if (notification.getImageUrl() != null) {
            androidNotificationMap.putString("imageUrl", notification.getImageUrl().toString());
        }

        if (notification.getLink() != null) {
            androidNotificationMap.putString("link", notification.getLink().toString());
        }

        if (notification.getNotificationCount() != null) {
            androidNotificationMap.putInt("count", notification.getNotificationCount());
        }

        if (notification.getNotificationPriority() != null) {
            androidNotificationMap.putInt("priority", notification.getNotificationPriority());
        }

        if (notification.getSound() != null) {
            androidNotificationMap.putString("sound", notification.getSound());
        }

        if (notification.getTicker() != null) {
            androidNotificationMap.putString("ticker", notification.getTicker());
        }

        if (notification.getVisibility() != null) {
            androidNotificationMap.putInt("visibility", notification.getVisibility());
        }

        notificationMap.putMap("android", androidNotificationMap);
        return notificationMap;
    }


    @Override
    public void onReceive(Context context, Intent intent) {
        RemoteMessage remoteMessage = new RemoteMessage(intent.getExtras());


        int notificationId = intent.getIntExtra("notificationId", 0);


        Log.d("messageId", remoteMessage.getMessageId());
        Log.d("messageId", "notificationId: " + notificationId);


        // Dismiss the notification popup.
        NotificationManager manager = (NotificationManager) context.getSystemService(context.NOTIFICATION_SERVICE);
        manager.cancel(remoteMessage.getCollapseKey(), notificationId);


        // send onOpen event
        ReactNativeFirebaseEventEmitter emitter = ReactNativeFirebaseEventEmitter.getSharedInstance();
        emitter.sendEvent(new ReactNativeFirebaseEvent(EVENT_NOTIFICATION_OPENED, remoteMessageToWritableMap(remoteMessage)));

    }
}