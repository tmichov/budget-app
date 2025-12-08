package com.kadekolku.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent != null && "com.kadekolku.app.ADD_TRANSACTION".equals(intent.getAction())) {
            // Navigate to transaction form by calling JavaScript
            bridge.eval(
                "window.location.href = '" + bridge.getServerUrl() + "/transactions/new'",
                null
            );
        }
    }
}
