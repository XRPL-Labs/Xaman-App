package libs.notification;

import com.xrpllabs.xumm.R;

import android.content.Context;
import android.os.Bundle;
import android.os.SystemClock;

import android.app.Notification;
import android.content.Intent;
import android.content.SharedPreferences;

import android.app.PendingIntent;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.service.notification.StatusBarNotification;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import com.google.firebase.messaging.RemoteMessage;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

public class LocalNotificationModule extends ReactContextBaseJavaModule {
    private static final String BADGE_FILE = "BadgeCountFile";
    private static final String BADGE_KEY = "BadgeCount";

    private final ReactApplicationContext context;
    private final SharedPreferences sharedPreferences;

    public LocalNotificationModule(ReactApplicationContext context) {
        super(context);
        this.context = context;

        sharedPreferences = context.getSharedPreferences(BADGE_FILE, Context.MODE_PRIVATE);
    }


    public static final String NAME = "LocalNotificationModule";

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }


    @ReactMethod
    public void complete(String handlerKey, Boolean show) {
        RemoteMessage remoteMessage = NotificationMessageReceiver.notifications.get(handlerKey);

        if (remoteMessage != null) {

            RemoteMessage.Notification notification = remoteMessage.getNotification();

            if (show && notification != null) {
                int notificationId = (int) SystemClock.uptimeMillis();

                Intent intent = new Intent(this.context, NotificationActionReceiver.class);
                intent.setAction(this.context.getPackageName() + ".ACTION_NOTIFICATION_OPENED");
                intent.setPackage(this.context.getPackageName());
                intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);


                intent.putExtras(remoteMessage.toIntent());
                intent.putExtra("notificationId", notificationId);


                PendingIntent pendingActionIntent = PendingIntent.getBroadcast(this.context, notificationId, intent,
                        PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);


                NotificationCompat.Builder builder = new NotificationCompat.Builder(
                        this.context,
                        this.context.getString(R.string.default_notification_channel_id)
                )
                        .setSmallIcon(R.drawable.ic_stat_icon_xaman_android_notification)
                        .setContentTitle(notification.getTitle())
                        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setContentText(notification.getBody())
                        .setContentIntent(pendingActionIntent);

                NotificationManager manager = (NotificationManager) this.context.getSystemService(Context.NOTIFICATION_SERVICE);

                builder.setCategory(NotificationCompat.CATEGORY_CALL);
                builder.setColor(ContextCompat.getColor(this.context, R.color.push_notification));

                NotificationChannel channel = new NotificationChannel(
                        this.context.getString(R.string.default_notification_channel_id),
                        "All Notifications",
                        NotificationManager.IMPORTANCE_DEFAULT
                );
                manager.createNotificationChannel(channel);

                manager.notify(
                        "FCM-Notification:" + notificationId,
                        0,
                        builder.build()
                );
            }

            // remove the notification
            NotificationMessageReceiver.notifications.remove(handlerKey);
        }
    }

    @ReactMethod
    public void getDeliveredNotifications(final Promise promise) {
        NotificationManager notificationManager = (NotificationManager) this.context.getSystemService(Context.NOTIFICATION_SERVICE);

        StatusBarNotification[] statusBarNotifications = notificationManager.getActiveNotifications();
        WritableArray result = Arguments.createArray();
        for (StatusBarNotification sbn:statusBarNotifications) {
            WritableMap map = Arguments.createMap();
            Notification notification = sbn.getNotification();

            map.putInt("identifier", sbn.getId());
            map.putString("channel_id", notification.getChannelId());
            map.putString("shortcut_id", notification.getShortcutId());
            map.putString("group", notification.getGroup());
            map.putString("key", sbn.getKey());
            map.putString("tag", sbn.getTag());
            result.pushMap(map);
        }
        promise.resolve(result);
    }



    @ReactMethod
    public void getBadge(Promise promise) {
        // get current badge count from shared preferences
        int badge = sharedPreferences.getInt(BADGE_KEY, 0);
        promise.resolve(badge);
    }

    @ReactMethod
    public void setBadge(int badgeCount, Promise promise) {
        // persist the badge count in shared preferences
        sharedPreferences
                .edit()
                .putInt(BADGE_KEY, badgeCount)
                .apply();

        // set the badge count
        try {
            NotificationBadge.applyCount(badgeCount);
            promise.resolve(badgeCount);
        } catch (Exception e) {
            e.printStackTrace();
            promise.reject(e);
        }
    }

}
