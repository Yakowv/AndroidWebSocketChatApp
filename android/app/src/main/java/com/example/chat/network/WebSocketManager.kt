package com.example.chat.network

import android.util.Log
import com.example.chat.data.ConnectionStatus
import com.example.chat.data.Message
import com.example.chat.data.MessageType
import com.google.gson.Gson
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.*
import java.util.concurrent.TimeUnit

/**
 * Manages WebSocket connection lifecycle,
 * reconnection logic, and message streaming.
 */
class WebSocketManager(private val client: OkHttpClient, private val gson: Gson) {
    private var webSocket: WebSocket? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    private val _messages = MutableSharedFlow<Message>(replay = 50, extraBufferCapacity = 64)
    val messages = _messages.asSharedFlow()

    private val _status = MutableStateFlow(ConnectionStatus.OFFLINE)
    val status = _status.asStateFlow()

    private var reconnectAttempts = 0
    private val maxReconnectAttempts = 5
    private var heartbeatJob: Job? = null
    private var reconnectJob: Job? = null
    private var isManualDisconnect = false

    private val socketListener = object : WebSocketListener() {
        override fun onOpen(webSocket: WebSocket, response: Response) {
            Log.d("WS", "Connected")
            reconnectAttempts = 0
            _status.value = ConnectionStatus.CONNECTED
            startHeartbeat()
        }

        override fun onMessage(webSocket: WebSocket, text: String) {
            try {
                val message = gson.fromJson(text, Message::class.java)
                if (message.type == MessageType.MSG.value) {
                    scope.launch { _messages.emit(message) }
                }
            } catch (e: Exception) {
                Log.e("WS", "Parse error", e)
            }
        }

        override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
            _status.value = ConnectionStatus.OFFLINE
            stopHeartbeat()
            if (!isManualDisconnect) handleReconnect()
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            _status.value = ConnectionStatus.OFFLINE
            stopHeartbeat()
            if (!isManualDisconnect) handleReconnect()
        }
    }

    fun connect(url: String) {
        isManualDisconnect = false
        _status.value = ConnectionStatus.CONNECTING
        val request = Request.Builder().url(url).build()
        webSocket = client.newWebSocket(request, socketListener)
    }

    fun disconnect() {
        isManualDisconnect = true
        stopHeartbeat()
        reconnectJob?.cancel()
        webSocket?.close(1000, "Manual disconnect")
        webSocket = null
    }

    fun sendMessage(text: String, author: String, avatar: String?) {
        val msg = Message(MessageType.MSG.value, text, System.currentTimeMillis(), author, avatar)
        webSocket?.send(gson.toJson(msg))
    }

    /**
     * Exponential Backoff Reconnect Strategy
     */
    private fun handleReconnect() {
        if (reconnectAttempts >= maxReconnectAttempts || reconnectJob?.isActive == true) return
        
        reconnectAttempts++
        val delays = listOf(5000L, 10000L, 20000L, 60000L)
        val delay = delays.getOrElse(reconnectAttempts - 1) { 60000L }

        reconnectJob = scope.launch {
            delay(delay)
            // Re-fetch URL from config in real app
            connect("wss://echo.websocket.org") 
        }
    }

    /**
     * JSON Heartbeat every 25 seconds
     */
    private fun startHeartbeat() {
        heartbeatJob?.cancel()
        heartbeatJob = scope.launch {
            while (isActive) {
                delay(25000)
                val ping = Message(MessageType.PING.value, "", System.currentTimeMillis(), "client")
                webSocket?.send(gson.toJson(ping))
            }
        }
    }

    private fun stopHeartbeat() {
        heartbeatJob?.cancel()
        heartbeatJob = null
    }
}
