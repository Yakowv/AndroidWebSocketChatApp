package com.example.chat.data

import com.google.gson.annotations.SerializedName

/**
 * Data model for chat messages.
 * Strictly follows the JSON protocol defined in the spec.
 */
data class Message(
    @SerializedName("type") val type: String,
    @SerializedName("text") val text: String,
    @SerializedName("timestamp") val timestamp: Long,
    @SerializedName("author") val author: String,
    @SerializedName("avatar") val avatar: String? = null,
    val id: String = java.util.UUID.randomUUID().toString()
)

enum class MessageType(val value: String) {
    MSG("msg"),
    PING("ping"),
    PONG("pong")
}

enum class ConnectionStatus {
    CONNECTED,
    CONNECTING,
    OFFLINE
}
