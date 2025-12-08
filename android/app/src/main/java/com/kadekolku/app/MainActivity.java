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
        if (intent == null) return;

        String action = intent.getStringExtra("shortcut_action");
        String transactionType = intent.getStringExtra("transaction_type");

        // Handle app shortcuts
        if ("add_transaction".equals(action)) {
            navigateToTransactionForm(transactionType);
        }
        // Handle widget button
        else if ("com.kadekolku.app.ADD_TRANSACTION".equals(intent.getAction())) {
            navigateToTransactionForm("expense");
        }
    }

    private void navigateToTransactionForm(String type) {
        String path = "/transactions/new";
        if ("income".equals(type)) {
            path = "/transactions/new?type=income";
        }
        final String finalPath = path;

        // Wait a moment for the bridge to be ready
        bridge.getWebView().postDelayed(() -> {
            bridge.eval(
                "window.location.href = '" + bridge.getServerUrl() + finalPath + "'",
                null
            );
        }, 500);
    }
}
