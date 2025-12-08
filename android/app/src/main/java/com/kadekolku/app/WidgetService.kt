package com.kadekolku.app

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.widget.Toast
import kotlinx.coroutines.*
import okhttp3.*
import org.json.JSONObject
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

class WidgetService : Service() {
    private val client = OkHttpClient()
    private val scope = CoroutineScope(Dispatchers.Main + Job())

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        intent?.let { handleWidgetSubmit(it) }
        return START_STICKY
    }

    private fun handleWidgetSubmit(intent: Intent) {
        val amount = intent.getStringExtra("amount") ?: return
        val categoryId = intent.getStringExtra("categoryId") ?: return
        val token = intent.getStringExtra("token") ?: return

        scope.launch {
            try {
                addTransaction(amount, categoryId, token)
            } catch (e: Exception) {
                showToast("Error: ${e.message}")
            }
        }
    }

    private fun addTransaction(amount: String, categoryId: String, token: String) {
        val body = JSONObject().apply {
            put("amount", amount.toDouble())
            put("categoryId", categoryId)
            put("type", "expense")
            put("description", "Quick add from widget")
            put("date", SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()))
        }

        val request = Request.Builder()
            .url("https://budget-app-kappa-black.vercel.app/api/transactions")
            .post(RequestBody.create(MediaType.parse("application/json"), body.toString()))
            .addHeader("Authorization", "Bearer $token")
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                showToast("Failed to add transaction")
            }

            override fun onResponse(call: Call, response: Response) {
                if (response.isSuccessful) {
                    showToast("Transaction added!")
                } else {
                    showToast("Error: ${response.code()}")
                }
            }
        })
    }

    private fun showToast(message: String) {
        scope.launch {
            Toast.makeText(this@WidgetService, message, Toast.LENGTH_SHORT).show()
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
