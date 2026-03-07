package com.example.chat.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.chat.data.ConnectionStatus
import com.example.chat.data.Message
import com.example.chat.network.WebSocketManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

/**
 * ViewModel for the Chat Screen.
 * Manages business logic, state, and message flow.
 */
class ChatViewModel(private val webSocketManager: WebSocketManager) : ViewModel() {
    private val _searchQuery = MutableStateFlow("")
    val searchQuery = _searchQuery.asStateFlow()

    private val _isFloodTesting = MutableStateFlow(false)
    val isFloodTesting = _isFloodTesting.asStateFlow()

    val status = webSocketManager.status
    
    // Filtered messages for search functionality
    val messages: StateFlow<List<Message>> = combine(
        webSocketManager.messages.scan(emptyList<Message>()) { acc, value -> acc + value },
        _searchQuery
    ) { allMessages, query ->
        if (query.isBlank()) allMessages
        else allMessages.filter { it.text.contains(query, ignoreCase = true) || it.author.contains(query, ignoreCase = true) }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun sendMessage(text: String, author: String, avatar: String?) {
        webSocketManager.sendMessage(text, author, avatar)
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun connect(url: String) {
        webSocketManager.connect(url)
    }

    fun disconnect() {
        webSocketManager.disconnect()
    }

    /**
     * Flood Test: 20 messages, 200ms interval
     */
    fun startFloodTest(author: String, avatar: String?) {
        if (_isFloodTesting.value || status.value != ConnectionStatus.CONNECTED) return
        
        viewModelScope.launch {
            _isFloodTesting.value = true
            for (i in 1..20) {
                webSocketManager.sendMessage("Flood Test Message #$i", author, avatar)
                delay(200)
            }
            _isFloodTesting.value = false
        }
    }
}
