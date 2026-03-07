package com.example.chat

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import com.example.chat.network.WebSocketManager
import com.example.chat.ui.ChatScreen
import com.example.chat.ui.ChatViewModel
import com.google.gson.Gson
import okhttp3.OkHttpClient

/**
 * Main Activity for the Android Chat Application.
 */
class MainActivity : ComponentActivity() {
    private lateinit var viewModel: ChatViewModel
    private lateinit var webSocketManager: WebSocketManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Manual DI for demonstration
        val client = OkHttpClient.Builder()
            .readTimeout(0, java.util.concurrent.TimeUnit.MILLISECONDS)
            .build()
        val gson = Gson()
        webSocketManager = WebSocketManager(client, gson)
        viewModel = ChatViewModel(webSocketManager)

        setContent {
            MaterialTheme {
                Surface(color = MaterialTheme.colorScheme.background) {
                    ChatScreen(viewModel)
                }
            }
        }
    }

    override fun onStart() {
        super.onStart()
        // Lifecycle: Restore connection on start
        webSocketManager.connect("wss://echo.websocket.org")
    }

    override fun onStop() {
        super.onStop()
        // Lifecycle: Close connection on stop to save battery
        webSocketManager.disconnect()
    }
}
