package com.doableindia.teacher;

import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ✅ Prevent Screenshots for security
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);

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
