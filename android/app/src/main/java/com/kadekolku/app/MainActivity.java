package com.kadekolku.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        extractAndStoreAuthToken();
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

    private void extractAndStoreAuthToken() {
        // Extract auth token from web app's localStorage and store in SharedPreferences
        bridge.getWebView().postDelayed(() -> {
            bridge.getWebView().evaluateJavascript(
                "(function() {" +
                "  let token = localStorage.getItem('token');" +
                "  if (!token) {" +
                "    token = localStorage.getItem('next-auth.session-token');" +
                "  }" +
                "  return token || '';" +
                "})()",
                result -> {
                    if (result != null && !result.isEmpty()) {
                        String token = result.replace("\"", "");
                        SharedPreferences prefs = getSharedPreferences("kadekolku_prefs", MODE_PRIVATE);
                        prefs.edit().putString("auth_token", token).apply();
                    }
                }
            );
        }, 1000);
    }
}
