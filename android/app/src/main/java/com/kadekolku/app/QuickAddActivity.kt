package com.kadekolku.app

import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.Spinner
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.*
import okhttp3.*
import org.json.JSONObject
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

class QuickAddActivity : AppCompatActivity() {
    private lateinit var amountInput: EditText
    private lateinit var categorySpinner: Spinner
    private lateinit var saveButton: Button
    private val scope = CoroutineScope(Dispatchers.Main + Job())
    private val client = OkHttpClient()
    private var categoryIds = listOf<String>()
    private var authToken = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_quick_add)

        // Make it look like a dialog
        setFinishOnTouchOutside(true)

        amountInput = findViewById(R.id.amount_input)
        categorySpinner = findViewById(R.id.category_spinner)
        saveButton = findViewById(R.id.save_button)

        // Get token from SharedPreferences (populated by MainActivity)
        getTokenFromPreferences()

        saveButton.setOnClickListener { saveExpense() }
        amountInput.requestFocus()
    }

    private fun getTokenFromPreferences() {
        try {
            val sharedPref = getSharedPreferences("kadekolku_prefs", MODE_PRIVATE)
            authToken = sharedPref.getString("auth_token", "") ?: ""

            if (authToken.isNotEmpty()) {
                loadCategories()
            } else {
                Toast.makeText(this, "Please log in first", Toast.LENGTH_SHORT).show()
                finish()
            }
        } catch (e: Exception) {
            Toast.makeText(this, "Error getting auth token: ${e.message}", Toast.LENGTH_SHORT).show()
            finish()
        }
    }

    private fun loadCategories() {
        scope.launch {
            try {
                val request = Request.Builder()
                    .url("https://budget-app-kappa-black.vercel.app/api/categories")
                    .addHeader("Authorization", "Bearer $authToken")
                    .build()

                client.newCall(request).enqueue(object : Callback {
                    override fun onFailure(call: Call, e: IOException) {
                        runOnUiThread {
                            Toast.makeText(this@QuickAddActivity, "Failed to load categories", Toast.LENGTH_SHORT).show()
                        }
                    }

                    override fun onResponse(call: Call, response: Response) {
                        try {
                            if (response.isSuccessful) {
                                val body = response.body?.string() ?: return
                                val categories = org.json.JSONArray(body)
                                val names = mutableListOf<String>()
                                val ids = mutableListOf<String>()

                                for (i in 0 until categories.length()) {
                                    val cat = categories.getJSONObject(i)
                                    names.add(cat.getString("name"))
                                    ids.add(cat.getString("id"))
                                }

                                categoryIds = ids
                                runOnUiThread {
                                    val adapter = ArrayAdapter(
                                        this@QuickAddActivity,
                                        android.R.layout.simple_spinner_item,
                                        names
                                    )
                                    adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                                    categorySpinner.adapter = adapter
                                }
                            }
                        } catch (e: Exception) {
                            runOnUiThread {
                                Toast.makeText(this@QuickAddActivity, "Error loading categories", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }
                })
            } catch (e: Exception) {
                Toast.makeText(this@QuickAddActivity, "Error loading categories", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun saveExpense() {
        val amount = amountInput.text.toString().trim()

        if (amount.isEmpty()) {
            Toast.makeText(this, "Please enter an amount", Toast.LENGTH_SHORT).show()
            return
        }

        val selectedIndex = categorySpinner.selectedItemPosition
        if (selectedIndex < 0 || selectedIndex >= categoryIds.size) {
            Toast.makeText(this, "Please select a category", Toast.LENGTH_SHORT).show()
            return
        }

        val categoryId = categoryIds[selectedIndex]

        try {
            if (authToken.isEmpty()) {
                Toast.makeText(this, "Please log in first", Toast.LENGTH_SHORT).show()
                return
            }

            scope.launch {
                submitToApi(amount, categoryId, authToken)
            }
        } catch (e: Exception) {
            Toast.makeText(this, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun submitToApi(amount: String, categoryId: String, token: String) {
        // TODO: Implement API call to save transaction
        Toast.makeText(this, "TODO: Save $amount to category $categoryId", Toast.LENGTH_SHORT).show()
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }
}
