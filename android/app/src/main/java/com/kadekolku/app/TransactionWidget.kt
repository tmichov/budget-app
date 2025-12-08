package com.kadekolku.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.widget.Toast

class TransactionWidget : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        super.onReceive(context, intent)
        if (intent?.action == "com.kadekolku.app.SUBMIT_TRANSACTION" && context != null) {
            val amount = intent.getStringExtra("amount") ?: return
            val categoryId = intent.getStringExtra("categoryId") ?: return
            val token = intent.getStringExtra("token") ?: return

            if (amount.isEmpty()) {
                Toast.makeText(context, "Please enter amount", Toast.LENGTH_SHORT).show()
                return
            }

            // Start service to handle submission
            val serviceIntent = Intent(context, WidgetService::class.java)
            serviceIntent.putExtra("amount", amount)
            serviceIntent.putExtra("categoryId", categoryId)
            serviceIntent.putExtra("token", token)
            context.startService(serviceIntent)
        }
    }

    companion object {
        private fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_transaction)

            // Get stored token from SharedPreferences
            val sharedPref = context.getSharedPreferences("kadekolku_prefs", Context.MODE_PRIVATE)
            val token = sharedPref.getString("auth_token", "") ?: ""
            val categoryId = sharedPref.getString("last_category", "") ?: ""

            // Submit button intent
            val submitIntent = Intent(context, TransactionWidget::class.java)
            submitIntent.action = "com.kadekolku.app.SUBMIT_TRANSACTION"
            submitIntent.putExtra("categoryId", categoryId)
            submitIntent.putExtra("token", token)

            val submitPendingIntent = PendingIntent.getBroadcast(
                context,
                appWidgetId,
                submitIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            )

            views.setOnClickPendingIntent(R.id.widget_submit, submitPendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
