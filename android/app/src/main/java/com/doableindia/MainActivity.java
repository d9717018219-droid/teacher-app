package com.doableindia;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ✅ Subscribe to FCM Topic for Global Broadcasts
        FirebaseMessaging.getInstance().subscribeToTopic("all_users")
            .addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    Log.d("FCM_Topic", "✅ Successfully subscribed to all_users");
                } else {
                    Log.e("FCM_Topic", "❌ Failed to subscribe to topic");
                }
            });
    }
}
